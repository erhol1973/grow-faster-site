/* Accessible names and metadata follow the existing four-language selector. */
(function () {
  'use strict';
  const languages = {en: 'en_GB', nl: 'nl_BE', fr: 'fr_BE', de: 'de_DE'};
  const names = {
    'Sections': ['Hoofdnavigatie', 'Navigation principale', 'Hauptnavigation'],
    'Menu': ['Menu', 'Menu', 'Menü'],
    'Close menu': ['Menu sluiten', 'Fermer le menu', 'Menü schließen'],
    'Skip to main content': ['Naar de hoofdinhoud', 'Aller au contenu principal', 'Zum Hauptinhalt springen'],
    'The Coherent Enterprise – home': ['The Coherent Enterprise – startpagina', 'The Coherent Enterprise – accueil', 'The Coherent Enterprise – Startseite'],
    'Next': ['Volgende', 'Suivant', 'Weiter'],
    'Back to the start': ['Terug naar het begin', 'Retour au début', 'Zurück zum Anfang'],
    'More information': ['Meer informatie', 'Plus d’informations', 'Weitere Informationen'],
    'The value progression': ['Van taak naar bedrijfswaarde', 'De la tâche à la valeur pour l’entreprise', 'Von der Aufgabe zum Unternehmenswert'],
    'Example processes': ['Voorbeeldprocessen', 'Exemples de processus', 'Beispielprozesse'],
    'Opportunity matrix': ['Kansenmatrix', 'Matrice des opportunités', 'Chancenmatrix'],
    'Cost per approach': ['Kosten per aanpak', 'Coût par approche', 'Kosten je Ansatz'],
    'AI pilot and enterprise coherence': ['AI-pilot en enterprise coherence', 'Pilote IA et cohérence de l’entreprise', 'KI-Pilot und Enterprise Coherence'],
    'Coherence flow simulation': ['Simulatie van coherente werkstromen', 'Simulation des flux et de la cohérence', 'Simulation kohärenter Arbeitsabläufe'],
    'Portrait of Erlend Hollebosch': ['Portret van Erlend Hollebosch', 'Portrait d’Erlend Hollebosch', 'Porträt von Erlend Hollebosch'],
    'Cover of the book The Coherent Enterprise by Erlend Hollebosch': ['Omslag van The Coherent Enterprise van Erlend Hollebosch', 'Couverture de The Coherent Enterprise d’Erlend Hollebosch', 'Buchcover von The Coherent Enterprise von Erlend Hollebosch']
  };
  const localeIndex = {nl: 0, fr: 1, de: 2};
  const descriptions = {
    'transformation.html': ["Erlend Hollebosch onderzoekt hoe strategie, mensen, processen, structuur, infrastructuur en data op elkaar inwerken bij bedrijfstransformatie.","Erlend Hollebosch examine les interactions entre stratégie, personnes, processus, structure, infrastructure et données dans la transformation des entreprises.","Erlend Hollebosch untersucht das Zusammenspiel von Strategie, Menschen, Prozessen, Struktur, Infrastruktur und Daten bei Unternehmenstransformationen."],
    'index.html': ['Erlend Hollebosch over fragmentatie, enterprise coherence en de voorwaarden voor duurzame AI-waarde.', 'Erlend Hollebosch sur la fragmentation, la cohérence de l’entreprise et les conditions d’une valeur durable de l’IA.', 'Erlend Hollebosch über Fragmentierung, Enterprise Coherence und die Voraussetzungen für nachhaltigen KI-Nutzen.'],
    'coherence.html': ['Enterprise coherence en AI-waarde: onderzoeksbronnen, duiding en een illustratieve processimulatie.', 'Cohérence de l’entreprise et valeur de l’IA : sources de recherche, analyse et simulation illustrative des processus.', 'Enterprise Coherence und KI-Nutzen: Forschungsquellen, Einordnung und eine illustrative Prozesssimulation.'],
    'value.html': ['Waar AI waarde kan creëren: taken, werkstromen en processen, met een kader voor kansen.', 'Où l’IA peut créer de la valeur : tâches, flux de travail et processus, avec un cadre pour identifier les opportunités.', 'Wo KI Wert schaffen kann: Aufgaben, Arbeitsabläufe und Prozesse mit einem Rahmen zur Bewertung von Chancen.'],
    'process.html': ['Procesherontwerp met AI-agents: vergelijking van een traditioneel en een agentondersteund proces.', 'Repenser les processus avec des agents IA : comparaison entre un processus traditionnel et un processus assisté par des agents.', 'Prozessneugestaltung mit KI-Agenten: Vergleich eines traditionellen und eines agentengestützten Prozesses.'],
    'operating-model.html': ['Mensen en AI-agents: autonomieniveaus, beslisrechten, governance en organisatorische voorwaarden.', 'Humains et agents IA : niveaux d’autonomie, droits de décision, gouvernance et conditions organisationnelles.', 'Menschen und KI-Agenten: Autonomiestufen, Entscheidungsrechte, Governance und organisatorische Voraussetzungen.'],
    'approach.html': ['Een roadmap, besliskader, samenhangsdiagnose en illustratieve simulator voor AI-transformatie.', 'Une feuille de route, un cadre de décision, un diagnostic de cohérence et un simulateur illustratif pour la transformation par l’IA.', 'Roadmap, Entscheidungsrahmen, Kohärenzdiagnose und illustrativer Simulator für KI-Transformation.'],
    'insights.html': ['Artikelen van Erlend Hollebosch over fragmentatie, enterprise coherence, procesherontwerp en AI.', 'Articles d’Erlend Hollebosch sur la fragmentation, la cohérence de l’entreprise, la refonte des processus et l’IA.', 'Beiträge von Erlend Hollebosch über Fragmentierung, Enterprise Coherence, Prozessneugestaltung und KI.'],
    'about.html': ['Over Erlend Hollebosch, zijn ervaring met transformatie, het boek The Coherent Enterprise en contact.', 'À propos d’Erlend Hollebosch, de son expérience en transformation, du livre The Coherent Enterprise et des moyens de le contacter.', 'Über Erlend Hollebosch, seine Transformationserfahrung, das Buch The Coherent Enterprise und Kontaktmöglichkeiten.'],
    'accessibility.html': ['Toegankelijkheidsverklaring van grow-faster.be: voorzieningen, bekende beperkingen en feedback.', 'Déclaration d’accessibilité de grow-faster.be : dispositifs, limites connues et retour d’information.', 'Erklärung zur Barrierefreiheit von grow-faster.be: Maßnahmen, bekannte Einschränkungen und Rückmeldungen.'],
    'privacy.html': ['Privacy- en cookiebeleid van grow-faster.be: gegevensgebruik en instellingen.', 'Politique de confidentialité et de cookies de grow-faster.be : utilisation des données et paramètres.', 'Datenschutz- und Cookie-Richtlinie von grow-faster.be: Datennutzung und Einstellungen.'],
    'terms.html': ['Gebruiksvoorwaarden voor de inhoud en hulpmiddelen van grow-faster.be.', 'Conditions d’utilisation des contenus et des outils de grow-faster.be.', 'Nutzungsbedingungen für die Inhalte und Werkzeuge von grow-faster.be.'],
    '404.html': ['Pagina niet gevonden.', 'Page introuvable.', 'Seite nicht gefunden.']
  };
  const originals = [];
  document.querySelectorAll('[aria-label],img[alt],iframe[title]').forEach(function (element) {
    ['aria-label', 'alt', 'title'].forEach(function (attribute) {
      const value = element.getAttribute(attribute);
      if (value && (names[value] || (window.I18N || {})[value])) originals.push({element, attribute, value});
    });
  });
  const originalDescription = document.querySelector('meta[name="description"]')?.content || '';
  const originalOgDescription = document.querySelector('meta[property="og:description"]')?.content || originalDescription;
  const pageName = location.pathname.split('/').pop() || 'index.html';
  function translated(value, language) {
    if (language === 'en') return value;
    const variants = names[value] || (window.I18N || {})[value];
    return variants?.[localeIndex[language]] || value;
  }
  function sync() {
    const language = document.documentElement.lang.slice(0, 2);
    if (!languages[language]) return;
    originals.forEach(function (record) {
      record.element.setAttribute(record.attribute, translated(record.value, language));
    });
    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = translated('Skip to main content', language);
    const burger = document.getElementById('burger');
    if (burger) burger.setAttribute('aria-label', translated(burger.getAttribute('aria-expanded') === 'true' ? 'Close menu' : 'Menu', language));
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = document.title;
    const description = document.querySelector('meta[name="description"]');
    const localizedDescription = descriptions[pageName]?.[localeIndex[language]];
    if (description) description.content = language === 'en' ? originalDescription : (localizedDescription || translated(originalDescription, language));
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = language === 'en' ? originalOgDescription : (localizedDescription || translated(originalOgDescription, language));
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.content = languages[language];
    const alternateLocales = Object.keys(languages).filter(function (code) { return code !== language; });
    document.querySelectorAll('meta[property="og:locale:alternate"]').forEach(function (meta, index) {
      if (alternateLocales[index]) meta.content = languages[alternateLocales[index]];
    });
  }
  sync();
  new MutationObserver(sync).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  const burger = document.getElementById('burger');
  if (burger) new MutationObserver(function () {
    const language = document.documentElement.lang.slice(0, 2);
    burger.setAttribute('aria-label', translated(burger.getAttribute('aria-expanded') === 'true' ? 'Close menu' : 'Menu', language));
  }).observe(burger, {attributes: true, attributeFilter: ['aria-expanded']});
})();

(function(){
  const frame=document.getElementById('ec-sim');if(!frame||!frame.dataset.src)return;
  const load=()=>{frame.src=frame.dataset.src;delete frame.dataset.src};
  // WebKit can lose a footer click when scrolling starts the iframe and its
  // height changes between pointer down and up. Load it with the document.
  if(!('IntersectionObserver'in window)||CSS.supports('-webkit-hyphens','none')){load();return}
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){load();observer.disconnect()}},{rootMargin:'400px'});observer.observe(frame);
})();
