// Capturing windows into sessions and restoring them.

import { isSavableUrl, uid } from './util.js';
import { getSettings, putSession } from './storage.js';

const LAZY_PAGE = () => chrome.runtime.getURL('src/lazy/lazy.html');

export function lazyUrl(url, title) {
  return `${LAZY_PAGE()}?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title || '')}`;
}

/** For tabs still showing the lazy placeholder, returns the real URL/title. */
export function realTab(tab) {
  const url = tab.url || tab.pendingUrl || '';
  if (url.startsWith(LAZY_PAGE())) {
    try {
      const p = new URL(url).searchParams;
      return { url: p.get('u') || '', title: p.get('t') || tab.title || '' };
    } catch { /* fall through */ }
  }
  return { url, title: tab.title || url };
}

async function groupsOfWindow(windowId) {
  try {
    return await chrome.tabGroups.query({ windowId });
  } catch {
    return [];
  }
}

/** Captures one window. tabIds (optional) limits it to those tabs. */
export async function captureWindow(windowId, tabIds = null) {
  const [tabs, groups] = await Promise.all([chrome.tabs.query({ windowId }), groupsOfWindow(windowId)]);
  const usedGroups = new Map();
  const out = [];
  for (const tab of tabs) {
    if (tabIds && !tabIds.includes(tab.id)) continue;
    const { url, title } = realTab(tab);
    if (!isSavableUrl(url) || url.startsWith(LAZY_PAGE())) continue;
    const entry = { url, title };
    if (tab.pinned) entry.pinned = true;
    if (tab.groupId > -1) {
      const g = groups.find((x) => x.id === tab.groupId);
      if (g) {
        if (!usedGroups.has(g.id)) usedGroups.set(g.id, { key: `g${usedGroups.size}`, title: g.title || '', color: g.color, collapsed: !!g.collapsed });
        entry.group = usedGroups.get(g.id).key;
      }
    }
    out.push(entry);
  }
  return { tabs: out, groups: [...usedGroups.values()] };
}

export async function captureAllWindows() {
  const wins = await chrome.windows.getAll({ windowTypes: ['normal'] });
  const res = [];
  for (const w of wins) {
    if (w.incognito) continue;
    const cw = await captureWindow(w.id);
    if (cw.tabs.length) res.push(cw);
  }
  return res;
}

/**
 * Saves a session. scope: 'window' | 'all' | 'selected'.
 */
export async function saveSession({ scope = 'window', windowId, name, type = 'manual' } = {}) {
  let windows;
  if (scope === 'all') {
    windows = await captureAllWindows();
  } else {
    const wid = windowId ?? (await chrome.windows.getLastFocused({ windowTypes: ['normal'] })).id;
    let ids = null;
    if (scope === 'selected') {
      const sel = await chrome.tabs.query({ windowId: wid, highlighted: true });
      ids = sel.map((t) => t.id);
    }
    windows = [await captureWindow(wid, ids)];
  }
  windows = windows.filter((w) => w.tabs.length);
  if (!windows.length) return null;
  return putSession({ id: uid(), name: name || '', type, windows });
}

// ---------------------------------------------------------------- restore

async function createTabs(windowId, win, { lazy, firstTabId = null, activateFirst }) {
  const created = [];
  for (let i = 0; i < win.tabs.length; i++) {
    const t = win.tabs[i];
    // The first tab of a new window already exists (created with the window).
    if (i === 0 && firstTabId !== null) {
      created.push(firstTabId);
      continue;
    }
    const isActive = activateFirst && i === 0;
    const url = lazy && !isActive ? lazyUrl(t.url, t.title) : t.url;
    try {
      const tab = await chrome.tabs.create({ windowId, url, pinned: !!t.pinned, active: isActive });
      created.push(tab.id);
    } catch {
      created.push(null);
    }
  }
  return created;
}

async function recreateGroups(windowId, win, tabIds) {
  for (const g of win.groups || []) {
    const ids = win.tabs.map((t, i) => (t.group === g.key && !t.pinned ? tabIds[i] : null)).filter((x) => x !== null);
    if (!ids.length) continue;
    try {
      const gid = await chrome.tabs.group({ tabIds: ids, createProperties: { windowId } });
      await chrome.tabGroups.update(gid, { title: g.title || '', color: g.color || 'grey', collapsed: !!g.collapsed });
    } catch { /* group API unavailable */ }
  }
}

/**
 * Restores a session (or a subset: { windows } object with the same shape).
 * target: 'newWindow' | 'current'; defaults to the user's setting.
 */
export async function restoreSession(session, { target, windowId } = {}) {
  const settings = await getSettings();
  target = target || settings.restoreTarget;
  const lazy = settings.lazyRestore;
  const windows = (session.windows || []).filter((w) => w.tabs?.length);

  for (let wi = 0; wi < windows.length; wi++) {
    const win = windows[wi];
    let wid;
    let firstTabId = null;
    // Multi-window sessions always open their extra windows as new windows.
    if (target === 'current' && wi === 0) {
      wid = windowId ?? (await chrome.windows.getLastFocused({ windowTypes: ['normal'] })).id;
    } else {
      const first = win.tabs[0];
      const w = await chrome.windows.create({ url: first.url, focused: wi === 0 });
      wid = w.id;
      firstTabId = w.tabs?.[0]?.id ?? null;
      if (first.pinned && firstTabId !== null) await chrome.tabs.update(firstTabId, { pinned: true });
    }
    const ids = await createTabs(wid, win, { lazy, firstTabId, activateFirst: target === 'current' && wi === 0 });
    if (settings.restoreGroups) await recreateGroups(wid, win, ids);
  }
}

/** Opens a single saved tab. */
export async function openUrl(url, { newWindow = false } = {}) {
  if (newWindow) return chrome.windows.create({ url });
  return chrome.tabs.create({ url });
}

/** Focuses an open tab and its window. */
export async function focusTab(tabId, windowId) {
  await chrome.tabs.update(tabId, { active: true });
  await chrome.windows.update(windowId, { focused: true });
}
