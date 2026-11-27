/* Share metadata and accessible names follow the selected Orion edition. */
const orionAttributes = Array.from(document.querySelectorAll('main img[alt], #orion-film video[aria-label], nav.nav[aria-label], .brand[aria-label], .footer-brand[aria-label]'), element => {
  const attribute = element.matches('img') ? 'alt' : 'aria-label';
  return { element, attribute, initial: element.getAttribute(attribute) };
});
document.addEventListener('gf:language', ({detail: {language}}) => {
  if (document.documentElement.dataset.pageLanguage === 'fr' && language === 'nl') {
    location.replace(new URL('orion.html?lang=nl' + location.hash, document.baseURI));
    return;
  }
  for (const node of document.head.querySelectorAll('[data-nl][data-fr]')) {
    node.setAttribute(node.matches('link') ? 'href' : 'content', node.dataset[language]);
  }
  for (const link of document.querySelectorAll('main a[href^="afspraak.html?onderwerp=vragenlijsten"]')) {
    link.href = 'afspraak.html?onderwerp=vragenlijsten' + (language === 'fr' ? '&lang=fr' : '');
  }
  for (const {element, attribute, initial} of orionAttributes) {
    element.setAttribute(attribute, window.I18N[initial]?.[language === 'fr' ? 1 : 0] || initial);
  }
});
