// Export (TabNest JSON, HTML) and import (TabNest JSON, OneTab text,
// Session Buddy / Tab Session Manager / generic JSON, plain URL lists).

import { listSessions, putSession } from './storage.js';
import { uid, countTabs } from './util.js';

const isUrl = (s) => typeof s === 'string' && /^(https?|ftp|file):\/\//i.test(s.trim());

export async function exportJson() {
  const sessions = await listSessions();
  return JSON.stringify({ format: 'tabnest', version: 1, exportedAt: new Date().toISOString(), sessions }, null, 2);
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function sessionsToHtml(sessions, nameOf) {
  const parts = sessions.map((s) => {
    const wins = s.windows.map((w, i) => `<h3>${s.windows.length > 1 ? `Window ${i + 1}` : ''}</h3><ul>${
      w.tabs.map((t) => `<li><a href="${esc(t.url)}">${esc(t.title || t.url)}</a></li>`).join('')}</ul>`).join('');
    return `<section><h2>${esc(nameOf(s))}</h2>${wins}</section>`;
  }).join('\n');
  return `<!doctype html><meta charset="utf-8"><title>TabNest export</title>
<style>body{font:14px system-ui;max-width:860px;margin:24px auto;padding:0 16px}h3:empty{display:none}a{color:#3d63e8}</style>
<h1>TabNest export</h1>${parts}`;
}

export function download(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// ---------------------------------------------------------------- import

/** OneTab: "url | title" per line, blank line between tab groups. */
function parseOneTab(text) {
  const blocks = text.split(/\r?\n\s*\r?\n/);
  const sessions = [];
  for (const b of blocks) {
    const tabs = b.split(/\r?\n/).map((line) => {
      const i = line.indexOf(' | ');
      const url = (i === -1 ? line : line.slice(0, i)).trim();
      const title = i === -1 ? url : line.slice(i + 3).trim();
      return isUrl(url) ? { url, title } : null;
    }).filter(Boolean);
    if (tabs.length) sessions.push({ name: 'OneTab', windows: [{ tabs, groups: [] }] });
  }
  return sessions;
}

/** Generic JSON: every array of objects with a URL field becomes a window. */
function parseGenericJson(data) {
  const windows = [];
  const urlOf = (o) => [o.url, o.URL, o.href, o.link, o.uri].find(isUrl);
  const titleOf = (o) => o.title || o.name || o.text || '';
  const walk = (node, depth) => {
    if (depth > 12 || !node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      const tabs = node.filter((o) => o && typeof o === 'object' && urlOf(o)).map((o) => ({ url: urlOf(o).trim(), title: titleOf(o) || urlOf(o) }));
      if (tabs.length) windows.push({ tabs, groups: [] });
      node.forEach((n) => { if (n && typeof n === 'object' && !urlOf(n)) walk(n, depth + 1); });
    } else {
      Object.values(node).forEach((v) => walk(v, depth + 1));
    }
  };
  walk(data, 0);
  return windows.length ? [{ name: 'Import', windows }] : [];
}

function parseTabNest(data) {
  return (data.sessions || [])
    .filter((s) => Array.isArray(s.windows))
    .map((s) => ({ ...s, windows: s.windows.map((w) => ({ tabs: (w.tabs || []).filter((t) => isUrl(t.url)), groups: w.groups || [] })) }));
}

/** Parses file text and stores the sessions. Returns { sessions, tabs }. */
export async function importText(text, fileName = '') {
  let parsed = [];
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed);
      parsed = data?.format === 'tabnest' ? parseTabNest(data) : parseGenericJson(data);
    } catch { parsed = []; }
  } else {
    parsed = parseOneTab(trimmed);
  }

  const base = fileName.replace(/\.[^.]+$/, '');
  let tabs = 0;
  let n = 0;
  for (const s of parsed) {
    const count = countTabs(s);
    if (!count) continue;
    // Everything imported becomes a normal session (never overwrites the archive or backups).
    const fallbackName = s.type === 'archive' ? 'Archive (import)' : (base || 'Import');
    await putSession({
      ...s,
      id: uid(),
      type: 'manual',
      name: (s.type === 'manual' && s.name) || (s.name && s.type !== 'archive' ? s.name : fallbackName),
      createdAt: s.createdAt || Date.now(),
    });
    tabs += count;
    n++;
  }
  return { sessions: n, tabs };
}
