import { getSettings, listSessions } from '../lib/storage.js';
import { saveSession, restoreSession } from '../lib/tabs.js';
import { groupWindowNow } from '../lib/grouping.js';
import { closeDuplicates, countDuplicates, hibernateTabs } from '../lib/cleanup.js';
import { setLang, t, applyI18n, ago, tabsLabel } from '../lib/i18n.js';
import { countTabs } from '../lib/util.js';
import { $, el, icon, favicon, toast, sessionName, menu, promptText } from '../ui/dom.js';
import { searchAll, renderResults } from '../ui/search.js';

let settings;
let windowId;
let results = [];

async function openManager() {
  try {
    await chrome.sidePanel.open({ windowId });
  } catch {
    await chrome.tabs.create({ url: chrome.runtime.getURL('src/manager/manager.html') });
  }
  window.close();
}

async function doSave(scope) {
  const n = (await listSessions('manual')).length + 1;
  const name = await promptText(t('sessionNamePrompt'), t('defaultSessionName', n));
  if (name === null) return;
  const s = await saveSession({ scope, windowId, name: name || t('defaultSessionName', n) });
  if (!s) { toast(t('nothingToSave')); return; }
  toast(t('savedToast', s.name));
  renderRecent();
}

async function renderRecent() {
  const box = $('#recent');
  box.replaceChildren();
  const sessions = (await listSessions(['manual', 'previous'])).slice(0, 6);
  if (!sessions.length) {
    box.append(el('div', { class: 'empty', text: t('noSessions') }));
    return;
  }
  for (const s of sessions) {
    const firstTabs = s.windows.flatMap((w) => w.tabs).slice(0, 5);
    box.append(el('div', { class: 'session-row', title: t('restore'), onclick: async () => { await restoreSession(s); window.close(); } },
      el('div', { class: 'grow' },
        el('div', { class: 'name ellipsis', text: sessionName(s) }),
        el('div', { class: 'muted small', text: `${tabsLabel(countTabs(s))} · ${ago(s.updatedAt)}` })),
      el('div', { class: 'favs' }, firstTabs.map((x) => favicon(x.url, 14)))));
  }
}

async function renderQuick() {
  const dups = await countDuplicates(settings);
  const q = (id, ic, label, fn, disabled = false) => {
    const b = $(id);
    b.replaceChildren(icon(ic, 18), el('span', { text: label }));
    b.disabled = disabled;
    b.onclick = fn;
  };
  q('#act-group', 'group', t('groupNow'), async () => {
    const n = await groupWindowNow(windowId, settings);
    toast(t('grouped', n));
  });
  q('#act-dups', 'dup', t('closeDuplicates', dups), async () => {
    const n = await closeDuplicates(settings);
    toast(t('closedDuplicates', n));
    renderQuick();
  }, dups === 0);
  q('#act-hibernate', 'moon', t('hibernateNow'), async () => {
    const n = await hibernateTabs({ minutes: null });
    toast(t('hibernated', n));
  });

  const all = await chrome.tabs.query({ windowType: 'normal' });
  const wins = new Set(all.map((x) => x.windowId)).size;
  $('#stats').textContent = `${tabsLabel(all.length)} · ${t('windowsCount', wins)}`;
}

async function onSearch() {
  const q = $('#q').value.trim();
  $('#home').hidden = !!q;
  $('#results').hidden = !q;
  if (!q) return;
  const res = await searchAll(q, 30);
  if ($('#q').value.trim() !== q) return; // a newer query is running
  results = renderResults($('#results'), res, { onAfterOpen: () => window.close() });
}

// ---------------------------------------------------------------- init

settings = await getSettings();
setLang(settings.lang);
applyI18n();
windowId = (await chrome.windows.getCurrent()).id;

$('#btn-manager').append(icon('panel'));
$('#btn-settings').append(icon('gear'));
$('#btn-manager').onclick = openManager;
$('#btn-settings').onclick = () => { chrome.runtime.openOptionsPage(); window.close(); };
$('#save-window').onclick = () => doSave('window');
$('#save-more').onclick = (e) => menu(e.currentTarget, [
  { label: t('saveAll'), onclick: () => doSave('all') },
  { label: t('saveSelected'), onclick: () => doSave('selected') },
]);

let timer;
$('#q').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(onSearch, 120); });
$('#q').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && results[0]) results[0]();
  if (e.key === 'ArrowDown') { e.preventDefault(); document.querySelector('.result')?.focus(); }
});
document.addEventListener('keydown', (e) => {
  const r = document.activeElement;
  if (!r?.classList.contains('result') || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
  e.preventDefault();
  const list = [...document.querySelectorAll('.result')];
  const i = list.indexOf(r) + (e.key === 'ArrowDown' ? 1 : -1);
  (i < 0 ? $('#q') : list[Math.min(i, list.length - 1)]).focus();
});

$('#q').focus();
renderRecent();
renderQuick();

// Safety net: any unexpected error in an action is shown instead of failing silently.
window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); toast(t('errorGeneric', e.reason?.message || String(e.reason))); });
