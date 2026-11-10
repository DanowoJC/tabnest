// Lightweight placeholder for restored tabs: shows the title and favicon and only
// navigates to the real page when the tab becomes visible (or is clicked).
(() => {
  const p = new URLSearchParams(location.search);
  const url = p.get('u') || '';
  const title = p.get('t') || url;
  const safe = /^(https?|ftp|file):/i.test(url);

  document.title = title;
  const fav = /^https?:/i.test(url)
    ? chrome.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`)
    : chrome.runtime.getURL('icons/icon32.png');
  document.getElementById('icon').href = fav;
  document.getElementById('fav').src = fav;
  document.getElementById('title').textContent = title;
  document.getElementById('url').textContent = url;
  chrome.storage.local.get('settings').then(({ settings }) => {
    const lang = settings?.lang && settings.lang !== 'auto' ? settings.lang : (chrome.i18n.getUILanguage() || 'en').slice(0, 2);
    document.getElementById('hint').textContent = lang === 'es'
      ? 'Haz clic o selecciona esta pestaña para cargarla'
      : 'Click or select this tab to load it';
  });

  let gone = false;
  const go = () => {
    if (gone || !safe) return;
    gone = true;
    location.replace(url);
  };
  if (document.visibilityState === 'visible') go();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') go(); });
  document.addEventListener('click', go);
})();
