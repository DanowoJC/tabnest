import { t, formatDate } from '../lib/i18n.js';
import { faviconUrl } from '../lib/util.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style') e.style.cssText = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) e.append(c);
  return e;
}

export function favicon(url, size = 16) {
  const img = el('img', { class: 'fav', src: faviconUrl(url, size * 2), width: size, height: size, alt: '' });
  img.onerror = () => { img.src = '../../icons/icon16.png'; };
  return img;
}

const ICONS = {
  restore: 'M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z',
  trash: 'M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z',
  close: 'M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z',
  edit: 'M3 17.25V21h3.75L17.8 9.94l-3.75-3.75zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z',
  save: 'M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10z',
  archive: 'M20.54 5.23 19.15 3.55A1.45 1.45 0 0 0 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23A2 2 0 0 0 3 6.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5 6.5 12H10v-2h4v2h3.5zM5.12 5l.81-1h12l.94 1z',
  moon: 'M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36A5.39 5.39 0 0 1 12.1 3.1C12.07 3.04 12.04 3 12 3z',
  group: 'M3 5h8v6H3zm10 0h8v6h-8zM3 13h8v6H3zm10 0h8v6h-8z',
  dup: 'M16 1H4a2 2 0 0 0-2 2v14h2V3h12zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11z',
  gear: 'M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7 7 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54a7 7 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.66 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.6.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.84c.24 0 .45-.18.49-.42l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96c.22.08.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
  pin: 'M16 9V4h1V2H7v2h1v5l-2 2v2h5.2v7h1.6v-7H18v-2z',
  more: 'M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  chevron: 'M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z',
  panel: 'M3 4h18v16H3zm2 2v12h9V6z',
  window: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 4v10h16V8z',
};

export function icon(name, size = 16) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('fill', 'currentColor');
  p.setAttribute('d', ICONS[name] || '');
  svg.append(p);
  return svg;
}

export function iconBtn(name, title, onclick, extraClass = '') {
  return el('button', { class: `icon-btn ${extraClass}`, title, 'aria-label': title, onclick: (e) => { e.stopPropagation(); onclick(e); } }, icon(name));
}

let toastTimer;
export function toast(text) {
  let box = $('#toast');
  if (!box) {
    box = el('div', { id: 'toast', class: 'toast' });
    document.body.append(box);
  }
  box.textContent = text;
  box.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove('show'), 2200);
}

/** Display name of a session depending on its type. */
export function sessionName(s) {
  if (s.type === 'previous') return t('previousSession');
  if (s.type === 'autosave') return t('autosaveAt', formatDate(s.createdAt));
  if (s.type === 'archive') return t('navArchive');
  return s.name || t('untitled');
}

/** Simple modal prompt / choice that works inside extension pages. */
export function promptText(label, value = '') {
  return new Promise((resolve) => {
    const input = el('input', { type: 'text', value, class: 'input' });
    const close = (v) => { overlay.remove(); resolve(v); };
    const overlay = el('div', { class: 'modal-bg', onclick: (e) => { if (e.target === overlay) close(null); } },
      el('form', { class: 'modal', onsubmit: (e) => { e.preventDefault(); close(input.value.trim()); } },
        el('label', { class: 'modal-label', text: label }), input,
        el('div', { class: 'modal-actions' },
          el('button', { type: 'button', class: 'btn ghost', text: t('cancel'), onclick: () => close(null) }),
          el('button', { type: 'submit', class: 'btn', text: t('save') }))));
    document.body.append(overlay);
    input.focus();
    input.select();
  });
}

export function choose(label, options) {
  return new Promise((resolve) => {
    const close = (v) => { overlay.remove(); resolve(v); };
    const overlay = el('div', { class: 'modal-bg', onclick: (e) => { if (e.target === overlay) close(null); } },
      el('div', { class: 'modal' },
        el('div', { class: 'modal-label', text: label }),
        el('div', { class: 'choice-list' }, options.map((o) => el('button', { class: 'choice', text: o.label, onclick: () => close(o.value) }))),
        el('div', { class: 'modal-actions' }, el('button', { class: 'btn ghost', text: t('cancel'), onclick: () => close(null) }))));
    document.body.append(overlay);
  });
}

export function confirmBox(text) {
  return choose(text, [{ label: t('delete'), value: true }]).then((v) => v === true);
}

/** Small dropdown menu anchored to a button. items: [{ label, onclick, danger }] */
export function menu(anchor, items) {
  $$('.menu').forEach((m) => m.remove());
  const m = el('div', { class: 'menu' }, items.filter(Boolean).map((it) =>
    el('button', { class: `menu-item ${it.danger ? 'danger' : ''}`, text: it.label, onclick: () => { m.remove(); it.onclick(); } })));
  document.body.append(m);
  const r = anchor.getBoundingClientRect();
  const w = m.offsetWidth;
  m.style.top = `${Math.min(r.bottom + 4, window.innerHeight - m.offsetHeight - 8)}px`;
  m.style.left = `${Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8))}px`;
  setTimeout(() => document.addEventListener('click', () => m.remove(), { once: true }), 0);
}
