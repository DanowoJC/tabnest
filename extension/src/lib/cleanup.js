// Duplicates, auto-archive and hibernation.

import { normalizeUrl, domainOf, matchPattern } from './util.js';
import { realTab } from './tabs.js';
import { addToArchive, bumpStat } from './storage.js';

/** Returns the duplicate tabs that can be closed (keeps the active / most recently used copy). */
export function findDuplicates(tabs, ignoreHash = true) {
  const groups = new Map();
  for (const t of tabs) {
    const { url } = realTab(t);
    if (!/^(https?|ftp|file):/i.test(url)) continue;
    const key = normalizeUrl(url, ignoreHash);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  const extra = [];
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    list.sort((a, b) => (b.active - a.active) || (b.pinned - a.pinned) || ((b.lastAccessed || 0) - (a.lastAccessed || 0)));
    extra.push(...list.slice(1).filter((t) => !t.pinned));
  }
  return extra;
}

export async function countDuplicates(settings) {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  return findDuplicates(tabs, settings.dupIgnoreHash).length;
}

export async function closeDuplicates(settings) {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const extra = findDuplicates(tabs, settings.dupIgnoreHash);
  if (extra.length) await chrome.tabs.remove(extra.map((t) => t.id));
  return extra.length;
}

/** If `tab` (just opened) duplicates another open tab, focus the other one and close this. */
export async function switchToExisting(tab, settings) {
  const { url } = realTab(tab);
  if (!/^(https?|ftp|file):/i.test(url)) return false;
  const key = normalizeUrl(url, settings.dupIgnoreHash);
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const other = tabs.find((t) => t.id !== tab.id && normalizeUrl(realTab(t).url, settings.dupIgnoreHash) === key);
  if (!other) return false;
  await chrome.tabs.update(other.id, { active: true });
  await chrome.windows.update(other.windowId, { focused: true });
  await chrome.tabs.remove(tab.id);
  return true;
}

function whitelisted(url, settings) {
  const list = (settings.archiveWhitelist || '').split(',').map((s) => s.trim()).filter(Boolean);
  return list.some((p) => matchPattern(url, p));
}

/** Closes tabs idle for archiveDays and stores them in the Archive. Returns count. */
export async function archiveIdleTabs(settings, { force = false } = {}) {
  if (!settings.archiveEnabled && !force) return 0;
  const limit = Date.now() - settings.archiveDays * 86400000;
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const victims = tabs.filter((t) => {
    const { url } = realTab(t);
    if (t.active || t.audible) return false;
    if (settings.archiveExcludePinned && t.pinned) return false;
    if (settings.archiveExcludeGrouped && t.groupId > -1) return false;
    if (!/^(https?|ftp|file):/i.test(url) || whitelisted(url, settings)) return false;
    return (t.lastAccessed || Date.now()) < limit;
  });
  return archiveTabs(victims, 'auto');
}

/** Archives specific tabs (closes them). */
export async function archiveTabs(tabs, reason = 'manual') {
  if (!tabs.length) return 0;
  await addToArchive(tabs.map((t) => realTab(t)), reason);
  await chrome.tabs.remove(tabs.map((t) => t.id));
  return tabs.length;
}

/** Discards tabs to free memory. minutes = null -> every inactive tab. Returns count. */
export async function hibernateTabs({ minutes = null, tabs = null } = {}) {
  const limit = minutes === null ? Infinity : Date.now() - minutes * 60000;
  const list = tabs || (await chrome.tabs.query({ windowType: 'normal' }));
  let n = 0;
  for (const t of list) {
    if (t.active || t.discarded || t.audible) continue;
    if (!/^(https?|file):/i.test(t.url || '')) continue; // lazy placeholders and internal pages are already light
    if (minutes !== null && (t.lastAccessed || Date.now()) > limit) continue;
    try {
      await chrome.tabs.discard(t.id);
      n++;
    } catch { /* tab can't be discarded right now */ }
  }
  if (n) await bumpStat('hibernated', n);
  return n;
}

export function topDomains(tabs, n = 6) {
  const m = new Map();
  for (const t of tabs) {
    const d = domainOf(realTab(t).url);
    if (d) m.set(d, (m.get(d) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}
