/* Share metadata and accessible image names follow the selected Orion edition. */
const orionAttributes = Array.from(document.querySelectorAll('main img[alt], #orion-film video[aria-label]'), element => {
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
    element.setAttribute(attribute, language === 'fr' ? window.I18N[initial]?.[1] || initial : initial);
  }
});
