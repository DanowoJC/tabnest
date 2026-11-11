import { getSettings, saveSettings, listSessions, clearAll } from '../lib/storage.js';
import { setLang, t, applyI18n, LANGUAGES } from '../lib/i18n.js';
import { GROUP_COLORS, COLOR_HEX, uid } from '../lib/util.js';
import { exportJson, importText, sessionsToHtml, download } from '../lib/importexport.js';
import { $, $$, el, iconBtn, toast, sessionName, confirmBox } from '../ui/dom.js';

let settings;
let savedTimer;

function flash() {
  $('#saved').hidden = false;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { $('#saved').hidden = true; }, 1400);
}

async function save(patch) {
  settings = await saveSettings(patch);
  flash();
}

function fillLang() {
  const sel = $('#lang');
  sel.replaceChildren(
    el('option', { value: 'auto', text: t('langAuto') }),
    ...LANGUAGES.map((l) => el('option', { value: l.code, text: l.name })));
  sel.value = settings.lang;
}

function bindFields() {
  $$('[data-k]').forEach((input) => {
    const k = input.dataset.k;
    if (input.type === 'checkbox') input.checked = !!settings[k];
    else input.value = settings[k] ?? '';
    input.onchange = async () => {
      let v;
      if (input.type === 'checkbox') v = input.checked;
      else if (input.type === 'number') {
        v = Math.round(Number(input.value));
        const min = Number(input.min || 0);
        const max = Number(input.max || Infinity);
        if (!Number.isFinite(v)) v = settings[k];
        v = Math.min(max, Math.max(min, v));
        input.value = v;
      } else v = input.value;
      await save({ [k]: v });
      if (k === 'lang') {
        setLang(v);
        applyI18n();
        fillLang();
        renderRules();
      }
    };
  });
}

// ---------------------------------------------------------------- rules editor

function renderRules() {
  const box = $('#rules');
  box.replaceChildren();
  const rules = settings.rules || [];
  const update = (i, patch) => save({ rules: (settings.rules || []).map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  rules.forEach((r, i) => {
    const dot = el('span', { class: 'dot', style: `background:${COLOR_HEX[r.color] || '#888'}` });
    const color = el('select', { onchange: async (e) => { dot.style.background = COLOR_HEX[e.target.value]; await update(i, { color: e.target.value }); } },
      GROUP_COLORS.map((c) => el('option', { value: c, text: c, selected: c === r.color })));
    box.append(el('div', { class: 'rule' },
      dot,
      el('input', { class: 'input', placeholder: t('ruleName'), value: r.name || '', onchange: (e) => update(i, { name: e.target.value.trim() }) }),
      el('input', { class: 'input pat', placeholder: t('rulePatterns'), value: (r.patterns || []).join(', '),
        onchange: (e) => update(i, { patterns: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }) }),
      color,
      iconBtn('trash', t('delete'), async () => { await save({ rules: (settings.rules || []).filter((_, j) => j !== i) }); renderRules(); })));
  });
}

// ---------------------------------------------------------------- init

settings = await getSettings();
setLang(settings.lang);
applyI18n();
fillLang();
bindFields();
renderRules();
$('#version').textContent = `TabNest v${chrome.runtime.getManifest().version}`;

$('#add-rule').onclick = async () => {
  const color = GROUP_COLORS[1 + ((settings.rules || []).length % (GROUP_COLORS.length - 1))];
  await save({ rules: [...(settings.rules || []), { id: uid(), name: '', color, patterns: [], enabled: true }] });
  renderRules();
  $$('#rules .rule input')[($$('#rules .rule').length - 1) * 2]?.focus();
};

$('#shortcuts').onclick = () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });

const stamp = () => new Date().toISOString().slice(0, 10);
$('#export').onclick = async () => download(`tabnest-${stamp()}.json`, await exportJson());
$('#export-html').onclick = async () => {
  const sessions = await listSessions(['manual', 'archive']);
  download(`tabnest-${stamp()}.html`, sessionsToHtml(sessions, sessionName), 'text/html');
};
$('#import').onclick = () => $('#import-file').click();
$('#import-file').onchange = async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const text = await file.text();
  const res = await importText(text, file.name);
  toast(res.sessions ? t('optImportOk', res.sessions, res.tabs) : t('optImportFail'));
};
$('#clear').onclick = async () => {
  if (!(await confirmBox(t('optClearConfirm')))) return;
  await clearAll();
  toast(t('done'));
};

// Safety net: any unexpected error in an action is shown instead of failing silently.
window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); toast(t('errorGeneric', e.reason?.message || String(e.reason))); });
