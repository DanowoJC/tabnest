// Service worker: automatic backups, grouping, duplicates, archive, hibernation,
// statistics and keyboard shortcuts.

import { getSettings, putSession, listSessions, deleteSession, updateStats } from './lib/storage.js';
import { captureAllWindows, saveSession } from './lib/tabs.js';
import { autoGroupTab } from './lib/grouping.js';
import { archiveIdleTabs, hibernateTabs, switchToExisting, closeDuplicates } from './lib/cleanup.js';
import { setLang, t } from './lib/i18n.js';

const A_AUTOSAVE = 'autosave';
const A_MAINTENANCE = 'maintenance';
const A_STATS = 'stats';

// ---------------------------------------------------------------- setup

async function setupAlarms() {
  const s = await getSettings();
  await chrome.alarms.clear(A_AUTOSAVE);
  chrome.alarms.create(A_AUTOSAVE, { delayInMinutes: 1, periodInMinutes: Math.max(1, Number(s.autosaveMinutes) || 5) });
  const existing = await chrome.alarms.getAll();
  if (!existing.some((a) => a.name === A_MAINTENANCE)) chrome.alarms.create(A_MAINTENANCE, { delayInMinutes: 2, periodInMinutes: 15 });
  if (!existing.some((a) => a.name === A_STATS)) chrome.alarms.create(A_STATS, { delayInMinutes: 1, periodInMinutes: 60 });
}

async function setupSidePanel() {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  } catch { /* side panel API not available in this browser */ }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  await setupAlarms();
  await setupSidePanel();
  if (details.reason === 'install') chrome.runtime.openOptionsPage();
});

chrome.runtime.onStartup.addListener(async () => {
  await setupAlarms();
  await promoteLastAutosave();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.settings) return;
  const a = changes.settings.oldValue?.autosaveMinutes;
  const b = changes.settings.newValue?.autosaveMinutes;
  if (a !== b) setupAlarms();
});

// ---------------------------------------------------------------- automatic backups

async function autosave() {
  const s = await getSettings();
  const windows = await captureAllWindows();
  if (!windows.length) return;
  const signature = JSON.stringify(windows.map((w) => w.tabs.map((x) => x.url)));
  const { lastSignature } = await chrome.storage.session.get('lastSignature');
  if (signature === lastSignature) return; // nothing changed since last backup
  await chrome.storage.session.set({ lastSignature: signature });

  await putSession({ type: 'autosave', name: '', windows });
  const backups = await listSessions('autosave');
  const keep = Math.max(1, Number(s.autosaveKeep) || 12);
  for (const old of backups.slice(keep)) await deleteSession(old.id);
}

/** On browser start, the newest backup becomes "Previous browser session" (crash recovery). */
async function promoteLastAutosave() {
  const [latest] = await listSessions('autosave');
  if (!latest) return;
  for (const p of await listSessions('previous')) await deleteSession(p.id);
  await putSession({ ...latest, id: 'previous', type: 'previous', name: '' });
}

// ---------------------------------------------------------------- maintenance

async function maintenance() {
  const s = await getSettings();
  if (s.archiveEnabled) await archiveIdleTabs(s);
  if (s.hibernateEnabled) await hibernateTabs({ minutes: Math.max(5, Number(s.hibernateMinutes) || 60) });
}

async function sampleStats() {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  await updateStats((st) => {
    st.samples.push({ at: Date.now(), tabs: tabs.length });
    const weekAgo = Date.now() - 7 * 86400000;
    st.samples = st.samples.filter((x) => x.at >= weekAgo).slice(-24 * 7);
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === A_AUTOSAVE) await autosave();
  else if (alarm.name === A_MAINTENANCE) await maintenance();
  else if (alarm.name === A_STATS) await sampleStats();
});

// ---------------------------------------------------------------- tab events

const createdAt = new Map(); // tabId -> time, to know which tabs were just opened

chrome.tabs.onCreated.addListener((tab) => {
  createdAt.set(tab.id, Date.now());
});

chrome.tabs.onRemoved.addListener((tabId) => createdAt.delete(tabId));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!info.url && info.status !== 'complete') return;
  if (!tab.url || tab.incognito) return;
  const s = await getSettings();

  // Duplicate check only for tabs opened in the last few seconds.
  const born = createdAt.get(tabId);
  if (s.dupAutoSwitch && info.url && born && Date.now() - born < 8000) {
    createdAt.delete(tabId);
    if (await switchToExisting(tab, s)) return;
  }

  if (info.url || info.status === 'complete') await autoGroupTab(tab, s);
});

// ---------------------------------------------------------------- shortcuts

async function openManager(windowId) {
  try {
    await chrome.sidePanel.open({ windowId });
  } catch {
    await chrome.tabs.create({ url: chrome.runtime.getURL('src/manager/manager.html') });
  }
}

chrome.commands.onCommand.addListener(async (command, tab) => {
  const s = await getSettings();
  setLang(s.lang);
  if (command === 'save-window') {
    const n = (await listSessions('manual')).length + 1;
    const saved = await saveSession({ scope: 'window', windowId: tab?.windowId, name: t('defaultSessionName', n) });
    await flashBadge(saved ? '✓' : '–');
  } else if (command === 'open-manager') {
    const wid = tab?.windowId ?? (await chrome.windows.getLastFocused()).id;
    await openManager(wid);
  } else if (command === 'close-duplicates') {
    const n = await closeDuplicates(s);
    await flashBadge(String(n));
  }
});

async function flashBadge(text) {
  await chrome.action.setBadgeBackgroundColor({ color: '#4f7cff' });
  await chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2500);
}

// The popup asks the worker to open the side panel (it needs a user gesture in the popup itself
// in some versions, so the popup tries first and falls back to this message).
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'openManager') {
    openManager(msg.windowId).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.type === 'autosaveNow') {
    autosave().then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
