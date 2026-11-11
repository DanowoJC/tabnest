// Global search across open tabs and saved sessions (shared by popup and manager).

import { listSessions } from '../lib/storage.js';
import { realTab, focusTab, openUrl } from '../lib/tabs.js';
import { makeMatcher, domainOf } from '../lib/util.js';
import { t } from '../lib/i18n.js';
import { el, favicon, sessionName, toast } from './dom.js';

export async function searchAll(query, limit = 60) {
  const match = makeMatcher(query);
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const open = tabs
    .map((tab) => ({ tab, ...realTab(tab) }))
    .filter((x) => match(x.title, x.url))
    .slice(0, limit);

  const saved = [];
  const seen = new Set(open.map((x) => x.url));
  const sessions = await listSessions(['manual', 'archive', 'previous', 'autosave']);
  for (const s of sessions) {
    for (const w of s.windows || []) {
      for (const tb of w.tabs || []) {
        if (saved.length >= limit) break;
        if (seen.has(tb.url) || !match(tb.title, tb.url)) continue;
        seen.add(tb.url);
        saved.push({ session: s, ...tb });
      }
    }
  }
  return { open, saved };
}

/** Renders results; Enter on the input opens the first one. Returns the list of actions. */
export function renderResults(container, { open, saved }, { onAfterOpen } = {}) {
  container.replaceChildren();
  const actions = [];
  const row = (url, title, sub, action, extra) => {
    const r = el('div', { class: 'tab-row result', tabindex: 0, onclick: action, onkeydown: (e) => { if (e.key === 'Enter') action(); } },
      favicon(url),
      el('div', { class: 'titles' }, el('div', { class: 't1', text: title || url }), el('div', { class: 't2', text: sub })),
      extra || null);
    actions.push(action);
    return r;
  };

  if (open.length) {
    container.append(el('div', { class: 'section-title', text: t('resultsOpen') }));
    for (const x of open) {
      container.append(row(x.url, x.title, domainOf(x.url), async () => {
        await focusTab(x.tab.id, x.tab.windowId);
        onAfterOpen?.();
      }, x.tab.discarded ? el('span', { class: 'tag', text: t('hibernatedTag') }) : null));
    }
  }
  if (saved.length) {
    container.append(el('div', { class: 'section-title', text: t('resultsSaved') }));
    for (const x of saved) {
      container.append(row(x.url, x.title, `${sessionName(x.session)} · ${domainOf(x.url)}`, async () => {
        if (!(await openUrl(x.url))) { toast(t('cantOpen')); return; }
        onAfterOpen?.();
      }));
    }
  }
  if (!open.length && !saved.length) container.append(el('div', { class: 'empty', text: t('noResults') }));
  return actions;
}
