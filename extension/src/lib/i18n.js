// UI translations. The language is chosen in Settings (auto / en / es),
// independently of the browser language.

const MESSAGES = {
  en: {
    appName: 'TabNest',
    // generic
    save: 'Save', cancel: 'Cancel', delete: 'Delete', rename: 'Rename', open: 'Open', close: 'Close',
    restore: 'Restore', edit: 'Edit', done: 'Done', add: 'Add', remove: 'Remove', search: 'Search',
    confirmDelete: 'Delete "{0}"? This cannot be undone.',
    tabsCount: '{0} tabs', tabCount1: '1 tab', windowsCount: '{0} windows', groupsCount: '{0} groups', groupCount1: '1 group',
    statsNoData: 'Not enough data yet: a sample is taken every hour.',
    justNow: 'just now', minutesAgo: '{0} min ago', hoursAgo: '{0} h ago', daysAgo: '{0} d ago',
    untitled: 'Untitled', saved: 'Saved',

    // popup
    searchPlaceholder: 'Search open tabs and saved sessions…',
    saveWindow: 'Save window', saveAll: 'Save all windows', saveSelected: 'Save selected tabs',
    openManager: 'Open manager', recentSessions: 'Recent sessions', noSessions: 'No saved sessions yet.',
    quickActions: 'Quick actions', groupNow: 'Auto-group now', closeDuplicates: 'Close duplicates ({0})',
    hibernateNow: 'Hibernate inactive tabs', resultsOpen: 'Open tabs', resultsSaved: 'In saved sessions',
    noResults: 'No results.', sessionNamePrompt: 'Session name', defaultSessionName: 'Session {0}',
    savedToast: 'Saved "{0}"', closedDuplicates: 'Closed {0} duplicate tabs', hibernated: 'Hibernated {0} tabs',
    grouped: 'Grouped {0} tabs',

    // manager
    navOpen: 'Open tabs', navSessions: 'Sessions', navArchive: 'Archive', navAutosaves: 'Backups', navStats: 'Statistics',
    windowN: 'Window {0}', currentWindow: 'Current window', ungrouped: 'Ungrouped',
    hibernatedTag: 'hibernated', pinnedTag: 'pinned', audibleTag: 'playing', duplicateTag: 'duplicate',
    restoreNewWindow: 'Open in new window', restoreHere: 'Open in this window', updateFromWindow: 'Replace with current window',
    addCurrentTab: 'Add current tab', mergeInto: 'Merge into…', exportSession: 'Export',
    sessionsEmpty: 'Save a window to create your first session.',
    archiveEmpty: 'Archived tabs appear here. Enable auto-archive in Settings or archive tabs manually.',
    autosavesEmpty: 'Automatic backups appear here every few minutes.',
    archiveTab: 'Archive', archiveGroup: 'Archive group', hibernateGroup: 'Hibernate group', closeGroup: 'Close group',
    restoreAll: 'Restore all', clearArchive: 'Clear archive', confirmClearArchive: 'Delete all archived tabs?',
    previousSession: 'Previous browser session', autosaveAt: 'Backup {0}',
    archivedOn: 'Archived {0}', filterSessions: 'Filter sessions…', sortNewest: 'Newest first', sortName: 'By name',
    pinSession: 'Pin', unpinSession: 'Unpin', selectMergeTarget: 'Merge into which session?',
    statsOpenTabs: 'Open tabs', statsWindows: 'Windows', statsHibernated: 'Hibernated tabs', statsDuplicates: 'Duplicate tabs',
    statsAvgTabs: 'Average open tabs (7 days)', statsSessions: 'Saved sessions', statsArchived: 'Archived tabs',
    statsTopDomains: 'Most open domains', statsFreed: 'Tabs hibernated by TabNest', statsAutoArchived: 'Tabs auto-archived',
    statsHistory: 'Open tabs over the last 7 days',

    // lazy page
    lazyClick: 'Click or select this tab to load it',

    // options
    optTitle: 'Settings', optGeneral: 'General', optLanguage: 'Language', langAuto: 'Automatic (browser)',
    optRestore: 'Restoring sessions', optLazy: 'Load restored tabs only when you open them (saves memory)',
    optRestoreTarget: 'Restore sessions in', targetNewWindow: 'a new window', targetCurrent: 'the current window',
    optRestoreGroups: 'Recreate tab groups when restoring',
    optAutosave: 'Automatic backups', optAutosaveEvery: 'Back up all windows every', minutes: 'minutes', days: 'days',
    optAutosaveKeep: 'Backups to keep',
    optGrouping: 'Automatic grouping', optGroupingMode: 'Mode', gmOff: 'Off', gmRules: 'Only my rules',
    gmSmart: 'My rules + group same-site tabs',
    optGroupingMin: 'Group a site automatically when it has at least', optGroupingTabs: 'tabs in a window',
    optRules: 'Grouping rules', optRulesHint: 'Tabs whose address matches a pattern are moved to the group. Patterns: "github.com", "*.google.com", "campus.example.edu/courses/*".',
    ruleName: 'Group name', rulePatterns: 'Patterns (comma separated)', ruleColor: 'Color', addRule: 'Add rule',
    optArchive: 'Auto-archive', optArchiveOn: 'Archive tabs not used for', optArchiveHint: 'Archived tabs are closed and saved in the Archive, where you can restore them anytime.',
    optArchiveExcludePinned: 'Never archive pinned tabs', optArchiveExcludeGrouped: 'Never archive tabs in a group',
    optArchiveWhitelist: 'Never archive these sites (comma separated)',
    optDuplicates: 'Duplicate tabs', optDupAuto: 'When a tab that is already open is opened again, switch to the existing one',
    optDupIgnoreHash: 'Ignore the part after "#" when comparing addresses',
    optHibernate: 'Hibernation', optHibernateOn: 'Hibernate tabs not used for', optHibernateHint: 'Hibernated tabs stay open but release their memory; they reload when you open them.',
    optShortcuts: 'Keyboard shortcuts', optShortcutsHint: 'Search: Ctrl+Shift+K · Save window: Alt+Shift+S · Manager: Alt+Shift+M. Change them in the browser\'s shortcuts page.',
    optShortcutsBtn: 'Edit shortcuts',
    optData: 'Data', optExport: 'Export everything (JSON)', optExportHtml: 'Export as HTML links',
    optImport: 'Import…', optImportHint: 'Supports TabNest JSON, OneTab exports, Session Buddy / Tab Session Manager JSON and plain lists of URLs.',
    optImportOk: 'Imported {0} sessions ({1} tabs).', optImportFail: 'Nothing could be imported from this file.',
    optClear: 'Delete all data', optClearConfirm: 'Delete all sessions, archive, backups and statistics?',
    optAbout: 'All data is stored only in this browser. Nothing is sent anywhere.',
  },

  es: {
    appName: 'TabNest',
    save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', rename: 'Renombrar', open: 'Abrir', close: 'Cerrar',
    restore: 'Restaurar', edit: 'Editar', done: 'Hecho', add: 'Añadir', remove: 'Quitar', search: 'Buscar',
    confirmDelete: '¿Eliminar "{0}"? No se puede deshacer.',
    tabsCount: '{0} pestañas', tabCount1: '1 pestaña', windowsCount: '{0} ventanas', groupsCount: '{0} grupos', groupCount1: '1 grupo',
    statsNoData: 'Aún no hay datos suficientes: se toma una muestra cada hora.',
    justNow: 'ahora mismo', minutesAgo: 'hace {0} min', hoursAgo: 'hace {0} h', daysAgo: 'hace {0} d',
    untitled: 'Sin título', saved: 'Guardado',

    searchPlaceholder: 'Buscar en pestañas abiertas y sesiones guardadas…',
    saveWindow: 'Guardar ventana', saveAll: 'Guardar todas las ventanas', saveSelected: 'Guardar pestañas seleccionadas',
    openManager: 'Abrir gestor', recentSessions: 'Sesiones recientes', noSessions: 'Aún no hay sesiones guardadas.',
    quickActions: 'Acciones rápidas', groupNow: 'Agrupar ahora', closeDuplicates: 'Cerrar duplicadas ({0})',
    hibernateNow: 'Hibernar pestañas inactivas', resultsOpen: 'Pestañas abiertas', resultsSaved: 'En sesiones guardadas',
    noResults: 'Sin resultados.', sessionNamePrompt: 'Nombre de la sesión', defaultSessionName: 'Sesión {0}',
    savedToast: 'Guardada "{0}"', closedDuplicates: '{0} pestañas duplicadas cerradas', hibernated: '{0} pestañas hibernadas',
    grouped: '{0} pestañas agrupadas',

    navOpen: 'Pestañas abiertas', navSessions: 'Sesiones', navArchive: 'Archivo', navAutosaves: 'Copias', navStats: 'Estadísticas',
    windowN: 'Ventana {0}', currentWindow: 'Ventana actual', ungrouped: 'Sin grupo',
    hibernatedTag: 'hibernada', pinnedTag: 'fijada', audibleTag: 'con sonido', duplicateTag: 'duplicada',
    restoreNewWindow: 'Abrir en ventana nueva', restoreHere: 'Abrir en esta ventana', updateFromWindow: 'Sustituir por la ventana actual',
    addCurrentTab: 'Añadir pestaña actual', mergeInto: 'Fusionar con…', exportSession: 'Exportar',
    sessionsEmpty: 'Guarda una ventana para crear tu primera sesión.',
    archiveEmpty: 'Aquí aparecen las pestañas archivadas. Activa el archivo automático en Ajustes o archiva pestañas a mano.',
    autosavesEmpty: 'Aquí aparecen las copias automáticas cada pocos minutos.',
    archiveTab: 'Archivar', archiveGroup: 'Archivar grupo', hibernateGroup: 'Hibernar grupo', closeGroup: 'Cerrar grupo',
    restoreAll: 'Restaurar todo', clearArchive: 'Vaciar archivo', confirmClearArchive: '¿Eliminar todas las pestañas archivadas?',
    previousSession: 'Sesión anterior del navegador', autosaveAt: 'Copia {0}',
    archivedOn: 'Archivada {0}', filterSessions: 'Filtrar sesiones…', sortNewest: 'Más recientes', sortName: 'Por nombre',
    pinSession: 'Fijar', unpinSession: 'Desfijar', selectMergeTarget: '¿Con qué sesión fusionar?',
    statsOpenTabs: 'Pestañas abiertas', statsWindows: 'Ventanas', statsHibernated: 'Pestañas hibernadas', statsDuplicates: 'Pestañas duplicadas',
    statsAvgTabs: 'Media de pestañas abiertas (7 días)', statsSessions: 'Sesiones guardadas', statsArchived: 'Pestañas archivadas',
    statsTopDomains: 'Webs con más pestañas', statsFreed: 'Pestañas hibernadas por TabNest', statsAutoArchived: 'Pestañas archivadas automáticamente',
    statsHistory: 'Pestañas abiertas en los últimos 7 días',

    lazyClick: 'Haz clic o selecciona esta pestaña para cargarla',

    optTitle: 'Ajustes', optGeneral: 'General', optLanguage: 'Idioma', langAuto: 'Automático (navegador)',
    optRestore: 'Restaurar sesiones', optLazy: 'Cargar las pestañas restauradas solo al abrirlas (ahorra memoria)',
    optRestoreTarget: 'Restaurar sesiones en', targetNewWindow: 'una ventana nueva', targetCurrent: 'la ventana actual',
    optRestoreGroups: 'Volver a crear los grupos de pestañas al restaurar',
    optAutosave: 'Copias automáticas', optAutosaveEvery: 'Copiar todas las ventanas cada', minutes: 'minutos', days: 'días',
    optAutosaveKeep: 'Copias que conservar',
    optGrouping: 'Agrupación automática', optGroupingMode: 'Modo', gmOff: 'Desactivada', gmRules: 'Solo mis reglas',
    gmSmart: 'Mis reglas + agrupar pestañas de la misma web',
    optGroupingMin: 'Agrupar una web automáticamente cuando tenga al menos', optGroupingTabs: 'pestañas en una ventana',
    optRules: 'Reglas de agrupación', optRulesHint: 'Las pestañas cuya dirección coincide con un patrón se mueven al grupo. Patrones: "github.com", "*.google.com", "campus.ejemplo.es/cursos/*".',
    ruleName: 'Nombre del grupo', rulePatterns: 'Patrones (separados por comas)', ruleColor: 'Color', addRule: 'Añadir regla',
    optArchive: 'Archivo automático', optArchiveOn: 'Archivar pestañas sin usar durante', optArchiveHint: 'Las pestañas archivadas se cierran y se guardan en el Archivo, desde donde puedes restaurarlas cuando quieras.',
    optArchiveExcludePinned: 'No archivar nunca las pestañas fijadas', optArchiveExcludeGrouped: 'No archivar nunca las pestañas que estén en un grupo',
    optArchiveWhitelist: 'No archivar nunca estas webs (separadas por comas)',
    optDuplicates: 'Pestañas duplicadas', optDupAuto: 'Al abrir una pestaña que ya está abierta, ir a la existente',
    optDupIgnoreHash: 'Ignorar lo que va después de "#" al comparar direcciones',
    optHibernate: 'Hibernación', optHibernateOn: 'Hibernar pestañas sin usar durante', optHibernateHint: 'Las pestañas hibernadas siguen abiertas pero liberan su memoria; se recargan al abrirlas.',
    optShortcuts: 'Atajos de teclado', optShortcutsHint: 'Buscar: Ctrl+Shift+K · Guardar ventana: Alt+Shift+S · Gestor: Alt+Shift+M. Cámbialos en la página de atajos del navegador.',
    optShortcutsBtn: 'Editar atajos',
    optData: 'Datos', optExport: 'Exportar todo (JSON)', optExportHtml: 'Exportar como enlaces HTML',
    optImport: 'Importar…', optImportHint: 'Admite JSON de TabNest, exportaciones de OneTab, JSON de Session Buddy / Tab Session Manager y listas de direcciones.',
    optImportOk: 'Importadas {0} sesiones ({1} pestañas).', optImportFail: 'No se ha podido importar nada de este archivo.',
    optClear: 'Borrar todos los datos', optClearConfirm: '¿Borrar todas las sesiones, el archivo, las copias y las estadísticas?',
    optAbout: 'Todos los datos se guardan solo en este navegador. No se envía nada a ningún sitio.',
  },
};

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

let current = 'en';

export function resolveLang(setting) {
  if (setting && setting !== 'auto' && MESSAGES[setting]) return setting;
  const ui = (chrome.i18n?.getUILanguage?.() || navigator.language || 'en').slice(0, 2).toLowerCase();
  return MESSAGES[ui] ? ui : 'en';
}

export function setLang(setting) {
  current = resolveLang(setting);
  if (typeof document !== 'undefined') document.documentElement.lang = current;
}
export function getLang() { return current; }

export function t(key, ...args) {
  const s = MESSAGES[current]?.[key] ?? MESSAGES.en[key] ?? key;
  return args.length ? s.replace(/\{(\d+)\}/g, (_, i) => String(args[i] ?? '')) : s;
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
    el.setAttribute('aria-label', el.title);
  });
}

export function ago(ts) {
  if (!ts) return '';
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return t('justNow');
  if (min < 60) return t('minutesAgo', min);
  if (min < 1440) return t('hoursAgo', Math.floor(min / 60));
  return t('daysAgo', Math.floor(min / 1440));
}

export function tabsLabel(n) { return n === 1 ? t('tabCount1') : t('tabsCount', n); }

export function formatDate(ts) {
  return new Date(ts).toLocaleString(current, { dateStyle: 'medium', timeStyle: 'short' });
}
