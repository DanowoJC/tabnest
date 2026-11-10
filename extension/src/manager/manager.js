import { getSettings, listSessions, getSession, putSession, deleteSession, getArchive, updateArchive, getStats } from '../lib/storage.js';
import { saveSession, restoreSession, realTab, focusTab, openUrl, captureWindow } from '../lib/tabs.js';
import { groupWindowNow } from '../lib/grouping.js';
import { findDuplicates, closeDuplicates, hibernateTabs, archiveTabs, topDomains } from '../lib/cleanup.js';
import { setLang, t, applyI18n, ago, tabsLabel, formatDate } from '../lib/i18n.js';
import { COLOR_HEX, countTabs, domainOf, makeMatcher } from '../lib/util.js';
import { sessionsToHtml, download } from '../lib/importexport.js';
import { $, $$, el, icon, iconBtn, favicon, toast, sessionName, promptText, choose, confirmBox, menu } from '../ui/dom.js';
import { searchAll, renderResults } from '../ui/search.js';

let settings;
let view = localStorage.getItem('tabnest.view') || 'open';
const expanded = new Set();        // expanded session cards
const hiddenGroups = new Set();    // collapsed group sections in "Open tabs"
let sessionFilter = '';
let sessionSort = 'newest';
let myWindowId = null;

// ---------------------------------------------------------------- helpers

function tabRow({ url, title, sub, tags = [], cls = '', onclick, actions = [] }) {
  return el('div', { class: `tab-row ${cls}`, onclick, title: url },
    favicon(url),
    el('div', { class: 'titles' }, el('div', { class: 't1', text: title || url }), el('div', { class: 't2', text: sub ?? domainOf(url) })),
    tags.map((x) => el('span', { class: `tag ${x.cls || ''}`, text: x.text })),
    el('div', { class: 'acts' }, actions));
}

async function newSessionName() {
  const n = (await listSessions('manual')).length + 1;
  return promptText(t('sessionNamePrompt'), t('defaultSessionName', n)).then((v) => (v === null ? null : v || t('defaultSessionName', n)));
}

async function refreshCounts() {
  const [tabs, sessions, archive] = await Promise.all([chrome.tabs.query({ windowType: 'normal' }), listSessions('manual'), getArchive()]);
  $('#c-open').textContent = tabs.length || '';
  $('#c-sessions').textContent = sessions.length || '';
  $('#c-archive').textContent = archive.windows[0].tabs.length || '';
}

// ---------------------------------------------------------------- open tabs

async function renderOpen(root) {
  const windows = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] });
  const allTabs = windows.flatMap((w) => w.tabs);
  const dupIds = new Set(findDuplicates(allTabs, settings.dupIgnoreHash).map((x) => x.id));

  root.append(el('div', { class: 'toolbar' },
    el('button', { class: 'btn sm', onclick: async () => { const name = await newSessionName(); if (name === null) return; const s = await saveSession({ scope: 'all', name }); if (s) toast(t('savedToast', s.name)); } }, icon('save', 14), t('saveAll')),
    dupIds.size ? el('button', { class: 'btn ghost sm', onclick: async () => toast(t('closedDuplicates', await closeDuplicates(settings))) }, icon('dup', 14), t('closeDuplicates', dupIds.size)) : null,
    el('button', { class: 'btn ghost sm', onclick: async () => toast(t('hibernated', await hibernateTabs({ minutes: null }))) }, icon('moon', 14), t('hibernateNow'))));

  windows.sort((a, b) => (b.id === myWindowId) - (a.id === myWindowId));
  for (let wi = 0; wi < windows.length; wi++) {
    const w = windows[wi];
    let groups = [];
    try { groups = await chrome.tabGroups.query({ windowId: w.id }); } catch { /* no groups api */ }
    const gById = new Map(groups.map((g) => [g.id, g]));

    const card = el('section', { class: 'card' });
    card.append(el('div', { class: 'card-head' },
      icon('window', 16),
      el('div', { class: 'grow' },
        el('div', { class: 'title', text: `${t('windowN', wi + 1)}${w.id === myWindowId ? ` · ${t('currentWindow')}` : ''}` }),
        el('div', { class: 'meta', text: `${tabsLabel(w.tabs.length)}${groups.length ? ` · ${groups.length === 1 ? t('groupCount1') : t('groupsCount', groups.length)}` : ''}` })),
      iconBtn('save', t('saveWindow'), async () => {
        const name = await newSessionName();
        if (name === null) return;
        const s = await saveSession({ scope: 'window', windowId: w.id, name });
        if (s) toast(t('savedToast', s.name));
      }),
      iconBtn('group', t('groupNow'), async () => toast(t('grouped', await groupWindowNow(w.id, settings))))));

    const body = el('div', { class: 'card-body' });
    let i = 0;
    const tabs = [...w.tabs].sort((a, b) => a.index - b.index);
    while (i < tabs.length) {
      const gid = tabs[i].groupId;
      const segment = [];
      while (i < tabs.length && tabs[i].groupId === gid) segment.push(tabs[i++]);
      const rows = segment.map((tab) => {
        const { url, title } = realTab(tab);
        const tags = [];
        if (tab.pinned) tags.push({ text: t('pinnedTag') });
        if (tab.audible) tags.push({ text: t('audibleTag') });
        if (tab.discarded || url !== tab.url) tags.push({ text: t('hibernatedTag') });
        if (dupIds.has(tab.id)) tags.push({ text: t('duplicateTag'), cls: 'warn' });
        return tabRow({
          url, title, tags,
          cls: `${tab.active ? 'active' : ''} ${tab.discarded ? 'discarded' : ''}`,
          onclick: () => focusTab(tab.id, tab.windowId),
          actions: [
            iconBtn('archive', t('archiveTab'), async () => { await archiveTabs([tab]); }),
            tab.active || tab.discarded ? null : iconBtn('moon', t('hibernateNow'), async () => { await hibernateTabs({ tabs: [tab] }); render(); }),
            iconBtn('close', t('close'), () => chrome.tabs.remove(tab.id)),
          ],
        });
      });
      if (gid === -1 || !gById.has(gid)) {
        body.append(...rows);
        continue;
      }
      const g = gById.get(gid);
      const key = `${w.id}:${gid}`;
      const wrap = el('div', { class: `group-tabs ${hiddenGroups.has(key) ? 'hide' : ''}`, style: `--gc:${COLOR_HEX[g.color] || 'var(--border)'}` }, rows);
      body.append(el('div', { class: 'group-head', onclick: () => { hiddenGroups.has(key) ? hiddenGroups.delete(key) : hiddenGroups.add(key); wrap.classList.toggle('hide'); } },
        el('span', { class: 'dot', style: `background:${COLOR_HEX[g.color] || '#888'}` }),
        el('span', { class: 'gname', text: g.title || t('untitled') }),
        el('span', { class: 'muted small', text: tabsLabel(segment.length) }),
        el('div', { class: 'acts' },
          iconBtn('moon', t('hibernateGroup'), async () => { toast(t('hibernated', await hibernateTabs({ tabs: segment }))); render(); }),
          iconBtn('archive', t('archiveGroup'), async () => { await archiveTabs(segment); }),
          iconBtn('close', t('closeGroup'), () => chrome.tabs.remove(segment.map((x) => x.id))))), wrap);
    }
    card.append(body);
    root.append(card);
  }
}

// ---------------------------------------------------------------- sessions

function sessionTabsBody(s, { editable }) {
  const body = el('div', { class: 'card-body' });
  s.windows.forEach((w, wi) => {
    if (s.windows.length > 1) body.append(el('div', { class: 'section-title', text: t('windowN', wi + 1) }));
    const gmap = new Map((w.groups || []).map((g) => [g.key, g]));
    w.tabs.forEach((tb, ti) => {
      const g = tb.group ? gmap.get(tb.group) : null;
      const tags = [];
      if (g) tags.push({ text: g.title || '●', cls: '' });
      if (tb.pinned) tags.push({ text: t('pinnedTag') });
      if (tb.archivedAt) tags.push({ text: t('archivedOn', ago(tb.archivedAt)) });
      body.append(tabRow({
        url: tb.url, title: tb.title, tags,
        onclick: () => openUrl(tb.url),
        actions: editable ? [iconBtn('close', t('remove'), async () => {
          const fresh = await getSession(s.id);
          fresh.windows[wi].tabs.splice(ti, 1);
          fresh.windows = fresh.windows.filter((x) => x.tabs.length);
          if (!fresh.windows.length) await deleteSession(s.id);
          else await putSession(fresh);
        })] : [],
      }));
    });
  });
  return body;
}

function sessionCard(s, { editable = true, extraActions = [] } = {}) {
  const card = el('section', { class: `card ${expanded.has(s.id) ? '' : 'collapsed'}` });
  const nTabs = countTabs(s);
  const meta = [tabsLabel(nTabs)];
  if (s.windows.length > 1) meta.push(t('windowsCount', s.windows.length));
  meta.push(s.type === 'manual' ? formatDate(s.updatedAt) : ago(s.createdAt));

  const more = (e) => menu(e.currentTarget, [
    { label: t('restoreNewWindow'), onclick: () => restoreSession(s, { target: 'newWindow' }) },
    { label: t('restoreHere'), onclick: () => restoreSession(s, { target: 'current', windowId: myWindowId }) },
    editable && { label: t('rename'), onclick: async () => { const v = await promptText(t('rename'), s.name); if (v) await putSession({ ...s, name: v }); } },
    editable && { label: t('updateFromWindow'), onclick: async () => { const w = await captureWindow(myWindowId); if (w.tabs.length) await putSession({ ...s, windows: [w] }); toast(t('saved')); } },
    editable && { label: t('addCurrentTab'), onclick: async () => {
      const [tab] = await chrome.tabs.query({ active: true, windowId: myWindowId });
      if (!tab) return;
      const fresh = await getSession(s.id);
      fresh.windows[0].tabs.push(realTab(tab));
      await putSession(fresh);
    } },
    editable && { label: t('mergeInto'), onclick: async () => {
      const others = (await listSessions('manual')).filter((x) => x.id !== s.id);
      const target = await choose(t('selectMergeTarget'), others.map((x) => ({ label: sessionName(x), value: x.id })));
      if (!target) return;
      const dst = await getSession(target);
      dst.windows.push(...s.windows);
      await putSession(dst);
      await deleteSession(s.id);
    } },
    editable && { label: s.pinned ? t('unpinSession') : t('pinSession'), onclick: () => putSession({ ...s, pinned: !s.pinned }) },
    { label: t('exportSession'), onclick: () => download(`${sessionName(s).replace(/[\\/:*?"<>|]/g, '_')}.html`, sessionsToHtml([s], sessionName), 'text/html') },
    ...extraActions,
    { label: t('delete'), danger: true, onclick: async () => { if (await confirmBox(t('confirmDelete', sessionName(s)))) await deleteSession(s.id); } },
  ]);

  card.append(el('div', { class: 'card-head clickable', onclick: () => { expanded.has(s.id) ? expanded.delete(s.id) : expanded.add(s.id); card.classList.toggle('collapsed'); } },
    el('span', { class: 'chev' }, icon('chevron', 16)),
    s.pinned ? el('span', { class: 'muted' }, icon('pin', 14)) : null,
    el('div', { class: 'grow' }, el('div', { class: 'title ellipsis', text: sessionName(s) }), el('div', { class: 'meta', text: meta.join(' · ') })),
    el('button', { class: 'btn sm', onclick: (e) => { e.stopPropagation(); restoreSession(s, { windowId: myWindowId }); } }, icon('restore', 14), t('restore')),
    iconBtn('more', t('edit'), more)));
  card.append(sessionTabsBody(s, { editable }));
  return card;
}

async function renderSessions(root) {
  const all = await listSessions('manual');
  root.append(el('div', { class: 'toolbar' },
    el('input', { class: 'input', placeholder: t('filterSessions'), value: sessionFilter, oninput: (e) => { sessionFilter = e.target.value; renderList(); } }),
    el('select', { onchange: (e) => { sessionSort = e.target.value; renderList(); } },
      el('option', { value: 'newest', text: t('sortNewest'), selected: sessionSort === 'newest' }),
      el('option', { value: 'name', text: t('sortName'), selected: sessionSort === 'name' })),
    el('button', { class: 'btn sm', onclick: async () => { const name = await newSessionName(); if (name === null) return; const s = await saveSession({ scope: 'window', windowId: myWindowId, name }); if (s) toast(t('savedToast', s.name)); } }, icon('save', 14), t('saveWindow'))));
  const list = el('div');
  root.append(list);

  function renderList() {
    list.replaceChildren();
    const match = makeMatcher(sessionFilter);
    let items = all.filter((s) => !sessionFilter || match(s.name, '') || s.windows.some((w) => w.tabs.some((x) => match(x.title, x.url))));
    if (sessionSort === 'name') items = [...items].sort((a, b) => (b.pinned - a.pinned) || sessionName(a).localeCompare(sessionName(b)));
    if (!items.length) list.append(el('div', { class: 'empty', text: all.length ? t('noResults') : t('sessionsEmpty') }));
    items.forEach((s) => list.append(sessionCard(s)));
  }
  renderList();
}

// ---------------------------------------------------------------- archive

async function renderArchive(root) {
  const a = await getArchive();
  const tabs = a.windows[0].tabs;
  root.append(el('div', { class: 'toolbar' },
    el('div', { class: 'grow muted', text: tabsLabel(tabs.length) }),
    tabs.length ? el('button', { class: 'btn sm', onclick: async () => {
      await restoreSession({ windows: [{ tabs: tabs.map((x) => ({ url: x.url, title: x.title })), groups: [] }] });
      await updateArchive((ar) => { ar.windows[0].tabs = []; });
    } }, icon('restore', 14), t('restoreAll')) : null,
    tabs.length ? el('button', { class: 'btn ghost sm', onclick: async () => {
      if (await confirmBox(t('confirmClearArchive'))) await updateArchive((ar) => { ar.windows[0].tabs = []; });
    } }, icon('trash', 14), t('clearArchive')) : null));
  if (!tabs.length) {
    root.append(el('div', { class: 'empty', text: t('archiveEmpty') }));
    return;
  }
  const card = el('section', { class: 'card' }, el('div', { class: 'card-body', style: 'padding-top:6px' },
    tabs.map((x, i) => tabRow({
      url: x.url, title: x.title, sub: `${domainOf(x.url)} · ${t('archivedOn', ago(x.archivedAt))}`,
      onclick: async () => { await openUrl(x.url); await updateArchive((ar) => { ar.windows[0].tabs.splice(i, 1); }); },
      actions: [
        iconBtn('restore', t('restore'), async () => { await openUrl(x.url); await updateArchive((ar) => { ar.windows[0].tabs.splice(i, 1); }); }),
        iconBtn('close', t('remove'), () => updateArchive((ar) => { ar.windows[0].tabs.splice(i, 1); })),
      ],
    }))));
  root.append(card);
}

// ---------------------------------------------------------------- backups

async function renderBackups(root) {
  const [prev, autos] = await Promise.all([listSessions('previous'), listSessions('autosave')]);
  const items = [...prev, ...autos];
  if (!items.length) {
    root.append(el('div', { class: 'empty', text: t('autosavesEmpty') }));
    return;
  }
  const saveAs = (s) => ({ label: t('saveWindow'), onclick: async () => {
    const name = await newSessionName();
    if (name === null) return;
    await putSession({ name, type: 'manual', windows: s.windows });
    toast(t('savedToast', name));
  } });
  items.forEach((s) => root.append(sessionCard(s, { editable: false, extraActions: [saveAs(s)] })));
}

// ---------------------------------------------------------------- stats

function sparkline(samples) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'spark');
  svg.setAttribute('viewBox', '0 0 300 90');
  svg.setAttribute('preserveAspectRatio', 'none');
  if (samples.length < 2) return svg;
  const max = Math.max(...samples.map((s) => s.tabs), 1);
  const t0 = samples[0].at;
  const span = Math.max(1, samples[samples.length - 1].at - t0);
  const pts = samples.map((s) => `${((s.at - t0) / span) * 300},${86 - (s.tabs / max) * 80}`);
  const area = document.createElementNS(ns, 'path');
  area.setAttribute('d', `M0,90 L${pts.join(' L')} L300,90 Z`);
  area.setAttribute('fill', 'color-mix(in srgb, var(--accent) 18%, transparent)');
  const line = document.createElementNS(ns, 'polyline');
  line.setAttribute('points', pts.join(' '));
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', 'var(--accent)');
  line.setAttribute('stroke-width', '2');
  line.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.append(area, line);
  return svg;
}

async function renderStats(root) {
  const [tabs, wins, stats, sessions, archive] = await Promise.all([
    chrome.tabs.query({ windowType: 'normal' }),
    chrome.windows.getAll({ windowTypes: ['normal'] }),
    getStats(), listSessions('manual'), getArchive(),
  ]);
  const avg = stats.samples.length ? Math.round(stats.samples.reduce((n, s) => n + s.tabs, 0) / stats.samples.length) : tabs.length;
  const stat = (n, l) => el('div', { class: 'stat' }, el('div', { class: 'n', text: String(n) }), el('div', { class: 'l', text: l }));
  root.append(el('div', { class: 'stats-grid' },
    stat(tabs.length, t('statsOpenTabs')),
    stat(wins.length, t('statsWindows')),
    stat(tabs.filter((x) => x.discarded).length, t('statsHibernated')),
    stat(findDuplicates(tabs, settings.dupIgnoreHash).length, t('statsDuplicates')),
    stat(avg, t('statsAvgTabs')),
    stat(sessions.length, t('statsSessions')),
    stat(archive.windows[0].tabs.length, t('statsArchived')),
    stat(stats.hibernated || 0, t('statsFreed')),
    stat(stats.autoArchived || 0, t('statsAutoArchived'))));

  root.append(el('div', { class: 'panel-box' }, el('h3', { text: t('statsHistory') }),
    stats.samples.length >= 2 ? sparkline(stats.samples) : el('div', { class: 'muted small', text: t('statsNoData') })));

  const top = topDomains(tabs, 8);
  const max = top[0]?.[1] || 1;
  root.append(el('div', { class: 'panel-box' }, el('h3', { text: t('statsTopDomains') }),
    el('div', { class: 'bars' }, top.map(([d, n]) => el('div', { class: 'bar-row' },
      el('span', { class: 'ellipsis', text: d }),
      el('div', { class: 'bar' }, el('span', { style: `width:${(n / max) * 100}%` })),
      el('span', { class: 'muted', text: String(n) }))))));
}

// ---------------------------------------------------------------- render loop

let renderToken = 0;
async function render() {
  const token = ++renderToken;
  const root = el('div');
  const q = $('#q').value.trim();
  $$('#nav button').forEach((b) => b.classList.toggle('active', !q && b.dataset.view === view));
  if (q) {
    renderResults(root, await searchAll(q));
  } else if (view === 'open') await renderOpen(root);
  else if (view === 'sessions') await renderSessions(root);
  else if (view === 'archive') await renderArchive(root);
  else if (view === 'backups') await renderBackups(root);
  else if (view === 'stats') await renderStats(root);
  if (token !== renderToken) return; // a newer render started
  const scroll = document.scrollingElement.scrollTop;
  $('#view').replaceChildren(...root.childNodes);
  document.scrollingElement.scrollTop = scroll;
  refreshCounts();
}

let timer;
const scheduleRender = () => {
  if (document.querySelector('.modal-bg, .menu')) return; // don't disturb an open dialog
  if (document.activeElement?.matches?.('input.input')) return; // typing in a filter
  clearTimeout(timer);
  timer = setTimeout(render, 250);
};

// ---------------------------------------------------------------- init

settings = await getSettings();
setLang(settings.lang);
applyI18n();
myWindowId = (await chrome.windows.getCurrent()).id;

$('#btn-settings').append(icon('gear'));
$('#btn-settings').onclick = () => chrome.runtime.openOptionsPage();
$$('#nav button').forEach((b) => b.addEventListener('click', () => {
  view = b.dataset.view;
  localStorage.setItem('tabnest.view', view);
  $('#q').value = '';
  render();
}));
let qTimer;
$('#q').addEventListener('input', () => { clearTimeout(qTimer); qTimer = setTimeout(render, 150); });

for (const ev of ['onCreated', 'onRemoved', 'onUpdated', 'onMoved', 'onAttached', 'onDetached', 'onActivated']) {
  chrome.tabs[ev].addListener(() => { if (view === 'open' || view === 'stats') scheduleRender(); });
}
try { chrome.tabGroups.onUpdated.addListener(() => { if (view === 'open') scheduleRender(); }); } catch { /* no groups */ }
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.settings) {
    settings = { ...settings, ...changes.settings.newValue };
    setLang(settings.lang);
    applyI18n();
  }
  scheduleRender();
});

render();
