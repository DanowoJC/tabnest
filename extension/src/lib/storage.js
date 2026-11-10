// Persistence in chrome.storage.local (with unlimitedStorage).
// Each session is stored under its own key ("session:<id>") so that concurrent
// writes from different pages never overwrite each other.

import { uid } from './util.js';

export const DEFAULT_SETTINGS = {
  lang: 'auto',
  lazyRestore: true,
  restoreTarget: 'newWindow',        // 'newWindow' | 'current'
  restoreGroups: true,
  autosaveMinutes: 5,
  autosaveKeep: 12,
  groupingMode: 'rules',             // 'off' | 'rules' | 'smart'
  groupingMinTabs: 4,
  rules: [],                         // { id, name, color, patterns: [], enabled }
  archiveEnabled: false,
  archiveDays: 7,
  archiveExcludePinned: true,
  archiveExcludeGrouped: false,
  archiveWhitelist: '',
  dupAutoSwitch: false,
  dupIgnoreHash: true,
  hibernateEnabled: false,
  hibernateMinutes: 60,
};

export async function getSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

export async function saveSettings(patch) {
  const s = { ...(await getSettings()), ...patch };
  await chrome.storage.local.set({ settings: s });
  return s;
}

// ---------------------------------------------------------------- sessions
// session = { id, name, type: 'manual'|'autosave'|'archive'|'previous', createdAt, updatedAt, pinned,
//             windows: [{ tabs: [{ url, title, pinned, group }], groups: [{ key, title, color, collapsed }] }] }
// tab.group references groups[].key inside the same window.

const KEY = (id) => `session:${id}`;

export async function listSessions(type = null) {
  const all = await chrome.storage.local.get(null);
  return Object.entries(all)
    .filter(([k]) => k.startsWith('session:'))
    .map(([, v]) => v)
    .filter((s) => !type || (Array.isArray(type) ? type.includes(s.type) : s.type === type))
    .sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt));
}

export async function getSession(id) {
  const r = await chrome.storage.local.get(KEY(id));
  return r[KEY(id)] || null;
}

export async function putSession(session) {
  const s = { ...session };
  s.id = s.id || uid();
  s.createdAt = s.createdAt || Date.now();
  s.updatedAt = Date.now();
  s.type = s.type || 'manual';
  await chrome.storage.local.set({ [KEY(s.id)]: s });
  return s;
}

export async function deleteSession(id) {
  await chrome.storage.local.remove(KEY(id));
}

// The archive is a single session of type "archive" whose tabs carry archivedAt.
export async function getArchive() {
  const r = await chrome.storage.local.get(KEY('archive'));
  return r[KEY('archive')] || { id: 'archive', type: 'archive', name: 'Archive', createdAt: Date.now(), updatedAt: Date.now(), windows: [{ tabs: [], groups: [] }] };
}

let archiveQueue = Promise.resolve();
export function addToArchive(tabs, reason = 'manual') {
  const run = archiveQueue.then(async () => {
    const a = await getArchive();
    const now = Date.now();
    a.windows[0].tabs.unshift(...tabs.map((t) => ({ url: t.url, title: t.title, archivedAt: now, reason })));
    a.windows[0].tabs = a.windows[0].tabs.slice(0, 5000);
    await putSession(a);
    if (reason === 'auto') await bumpStat('autoArchived', tabs.length);
  });
  archiveQueue = run.catch(() => {});
  return run;
}

export function updateArchive(mutator) {
  const run = archiveQueue.then(async () => {
    const a = await getArchive();
    await mutator(a);
    await putSession(a);
  });
  archiveQueue = run.catch(() => {});
  return run;
}

// ---------------------------------------------------------------- stats

export async function getStats() {
  const { stats } = await chrome.storage.local.get('stats');
  return { samples: [], hibernated: 0, autoArchived: 0, ...(stats || {}) };
}

let statsQueue = Promise.resolve();
export function updateStats(mutator) {
  const run = statsQueue.then(async () => {
    const s = await getStats();
    await mutator(s);
    await chrome.storage.local.set({ stats: s });
  });
  statsQueue = run.catch(() => {});
  return run;
}

export const bumpStat = (key, n = 1) => updateStats((s) => { s[key] = (s[key] || 0) + n; });

export async function clearAll() {
  const { settings } = await chrome.storage.local.get('settings');
  await chrome.storage.local.clear();
  if (settings) await chrome.storage.local.set({ settings });
}
