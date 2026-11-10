// Automatic grouping with native tab groups.
//  - Rules: user patterns -> named group.
//  - Smart: same-site tabs are grouped once a window has N of them.
// Tabs opened from a grouped tab already join that group natively in Chromium.
// Only ungrouped, unpinned tabs are ever moved, so groups made by hand are never touched.

import { GROUP_COLORS, domainOf, siteName, matchPattern } from './util.js';
import { realTab } from './tabs.js';

function colorFor(text) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GROUP_COLORS[1 + (h % (GROUP_COLORS.length - 1))];
}

async function findGroup(windowId, title) {
  try {
    const groups = await chrome.tabGroups.query({ windowId });
    return groups.find((g) => (g.title || '').toLowerCase() === title.toLowerCase()) || null;
  } catch {
    return null;
  }
}

async function addToGroup(tabIds, windowId, title, color) {
  if (!tabIds.length) return 0;
  const existing = await findGroup(windowId, title);
  try {
    if (existing) {
      await chrome.tabs.group({ groupId: existing.id, tabIds });
    } else {
      const gid = await chrome.tabs.group({ tabIds, createProperties: { windowId } });
      await chrome.tabGroups.update(gid, { title, color });
    }
    return tabIds.length;
  } catch {
    return 0; // tab closed meanwhile, window not normal, etc.
  }
}

const groupable = (tab) => tab.groupId === -1 && !tab.pinned && /^https?:/i.test(realTab(tab).url);

export function ruleFor(url, rules) {
  return rules.find((r) => r.enabled !== false && r.name && (r.patterns || []).some((p) => matchPattern(url, p))) || null;
}

/** Called when a tab navigates. Applies rules, then smart same-site grouping. */
export async function autoGroupTab(tab, settings) {
  if (settings.groupingMode === 'off' || !groupable(tab)) return;
  const url = realTab(tab).url;

  const rule = ruleFor(url, settings.rules || []);
  if (rule) {
    await addToGroup([tab.id], tab.windowId, rule.name, rule.color || colorFor(rule.name));
    return;
  }
  if (settings.groupingMode !== 'smart') return;

  const domain = domainOf(url);
  if (!domain) return;
  const title = siteName(domain);
  const existing = await findGroup(tab.windowId, title);
  if (existing) {
    await addToGroup([tab.id], tab.windowId, title, existing.color);
    return;
  }
  const same = (await chrome.tabs.query({ windowId: tab.windowId }))
    .filter((t) => groupable(t) && domainOf(realTab(t).url) === domain && !ruleFor(realTab(t).url, settings.rules || []));
  if (same.length >= Math.max(2, settings.groupingMinTabs)) {
    await addToGroup(same.map((t) => t.id), tab.windowId, title, colorFor(title));
  }
}

/** "Group now": rules + same-site grouping (2+ tabs) for a whole window. Returns tabs moved. */
export async function groupWindowNow(windowId, settings) {
  const tabs = (await chrome.tabs.query({ windowId })).filter(groupable);
  let moved = 0;
  const byRule = new Map();
  const byDomain = new Map();
  for (const t of tabs) {
    const url = realTab(t).url;
    const rule = ruleFor(url, settings.rules || []);
    if (rule) {
      if (!byRule.has(rule.id)) byRule.set(rule.id, { rule, ids: [] });
      byRule.get(rule.id).ids.push(t.id);
      continue;
    }
    const d = domainOf(url);
    if (!d) continue;
    if (!byDomain.has(d)) byDomain.set(d, []);
    byDomain.get(d).push(t.id);
  }
  for (const { rule, ids } of byRule.values()) moved += await addToGroup(ids, windowId, rule.name, rule.color || colorFor(rule.name));
  for (const [d, ids] of byDomain) {
    const title = siteName(d);
    const existing = await findGroup(windowId, title);
    if (ids.length >= 2 || existing) moved += await addToGroup(ids, windowId, title, existing?.color || colorFor(title));
  }
  return moved;
}
