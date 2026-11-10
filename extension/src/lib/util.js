export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const GROUP_COLORS = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];

export const COLOR_HEX = {
  grey: '#8a8f98', blue: '#5b8def', red: '#e8615a', yellow: '#f2c14e', green: '#48b97a',
  pink: '#ef6fb3', purple: '#a774e8', cyan: '#3fc1c9', orange: '#f29545',
};

/** Pages the extension can save and restore (skips browser-internal pages). */
export function isSavableUrl(url) {
  if (!url) return false;
  return /^(https?|ftp|file):/i.test(url) || url.startsWith(chrome.runtime.getURL('src/lazy/'));
}

export function domainOf(url) {
  try {
    const h = new URL(url).hostname;
    return h.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Readable site name for an automatic group, e.g. "docs.github.com" -> "github". */
export function siteName(domain) {
  const parts = domain.split('.');
  if (parts.length <= 1) return domain;
  const sld = parts.length >= 3 && parts[parts.length - 2].length <= 3 ? parts[parts.length - 3] : parts[parts.length - 2];
  return sld;
}

export function normalizeUrl(url, ignoreHash = true) {
  try {
    const u = new URL(url);
    if (ignoreHash) u.hash = '';
    let s = u.toString();
    if (s.endsWith('/') && u.pathname === '/' && !u.search) s = s.slice(0, -1);
    return s;
  } catch {
    return url;
  }
}

/**
 * Matches a URL against a simple pattern:
 *   "github.com"            -> host is github.com or any subdomain
 *   "*.google.com"          -> any subdomain of google.com (and google.com)
 *   "example.edu/courses/*" -> host + path prefix
 */
export function matchPattern(url, pattern) {
  let u;
  try { u = new URL(url); } catch { return false; }
  const p = pattern.trim().toLowerCase().replace(/^[a-z]+:\/\//, '');
  if (!p) return false;
  const slash = p.indexOf('/');
  const hostPat = (slash === -1 ? p : p.slice(0, slash)).replace(/^\*\./, '');
  const pathPat = slash === -1 ? '' : p.slice(slash);
  const host = u.hostname.toLowerCase();
  if (host !== hostPat && !host.endsWith('.' + hostPat)) return false;
  if (!pathPat || pathPat === '/*' || pathPat === '/') return true;
  const re = new RegExp('^' + pathPat.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*'));
  return re.test((u.pathname + u.search).toLowerCase());
}

export function faviconUrl(pageUrl, size = 16) {
  if (!pageUrl || !/^https?:/i.test(pageUrl)) return chrome.runtime.getURL('icons/icon16.png');
  return chrome.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=${size}`);
}

/** Splits a search query into lowercase words; every word must appear in title or URL. */
export function makeMatcher(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return (title, url) => {
    if (!words.length) return true;
    const hay = `${title || ''} ${url || ''}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function countTabs(session) {
  return (session.windows || []).reduce((n, w) => n + (w.tabs?.length || 0), 0);
}
