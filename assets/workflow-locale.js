/* Keep the chosen language when a visitor opens a shared workflow link. */
document.addEventListener('gf:language', ({detail: {language}}) => {
  const french = language === 'fr';
  document.querySelector('nav.nav').setAttribute('aria-label', french ? 'Navigation principale' : 'Hoofdnavigatie');
  for (const link of document.querySelectorAll('.brand, .footer-brand')) {
    link.setAttribute('aria-label', french ? 'Grow Faster – Accueil' : 'Grow Faster – startpagina');
  }
  for (const link of document.querySelectorAll('main a[href^="afspraak.html"], main a[href^="orion.html"]')) {
    const url = new URL(link.href);
    if (french) url.searchParams.set('lang', language);
    else url.searchParams.delete('lang');
    link.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
  }
});
