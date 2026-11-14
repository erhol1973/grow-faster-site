(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./cases.js'));
  else root.GFDemoModel = factory(root.GFDemoCases);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (cases) {
  'use strict';
  const TEXT_FIELDS = ['question', 'situation', 'value', 'resources', 'risks', 'unknowns', 'recommendation', 'owner', 'success'];
  const FIELDS = [...TEXT_FIELDS, 'decisionDate'];
  const DIMENSIONS = ['strategy', 'people', 'process', 'governance', 'data', 'technology'];
  const languages = ['nl', 'fr'];
  function language(lang) { if (!languages.includes(lang)) throw new TypeError('Unsupported language'); return lang; }
  function getCase(id) { const item = cases.find(c => c.id === id); if (!item) throw new RangeError('Unknown case'); return item; }
  function createState(caseId = 'external', lang = 'nl') {
    language(lang);
    const item = getCase(caseId), fields = {};
    for (const key of TEXT_FIELDS) fields[key] = item.canvas[key][lang];
    fields.decisionDate = item.canvas.decisionDate;
    return { caseId, lang, step: 0, selectedDimensions: [], fields, chosenOption: 'pilot', draftSaved: false, roadmap: null, valueReview: null };
  }
  function setLanguage(state, lang) {
    language(lang); getCase(state.caseId);
    if (!state.fields || typeof state.fields !== 'object' || !Array.isArray(state.selectedDimensions)) throw new TypeError('Malformed state');
    return { ...state, lang, fields: { ...state.fields }, selectedDimensions: [...state.selectedDimensions], roadmap: state.roadmap == null ? null : JSON.parse(JSON.stringify(state.roadmap)), valueReview: state.valueReview == null ? null : JSON.parse(JSON.stringify(state.valueReview)) };
  }
  function selectCase(state, caseId) { return createState(caseId, language(state.lang)); }
  function calendarDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1 || month < 1 || month > 12 || day < 1) return false;
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  }
  function validate(state) {
    const errors = [], add = (field, code) => errors.push({ field, code });
    if (!state || typeof state !== 'object' || Array.isArray(state)) return { valid: false, errors: [{ field: 'state', code: 'type' }] };
    let item; try { item = getCase(state.caseId); } catch { add('caseId', 'unknown'); }
    if (!languages.includes(state.lang)) add('lang', 'unsupported');
    if (!Number.isInteger(state.step) || state.step < 0 || state.step > 5) add('step', 'range');
    if (typeof state.draftSaved !== 'boolean') add('draftSaved', 'type');
    if (!Array.isArray(state.selectedDimensions)) add('selectedDimensions', 'type');
    else {
      if (state.selectedDimensions.length < 1 || state.selectedDimensions.length > 6) add('selectedDimensions', 'count');
      if (state.selectedDimensions.some(id => typeof id !== 'string' || !DIMENSIONS.includes(id))) add('selectedDimensions', 'unknown');
      if (new Set(state.selectedDimensions).size !== state.selectedDimensions.length) add('selectedDimensions', 'duplicate');
    }
    if (typeof state.chosenOption !== 'string' || (item && !item.canvas.options.some(o => o.id === state.chosenOption))) add('chosenOption', 'unknown');
    const fields = state.fields;
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) add('fields', 'type');
    else for (const field of FIELDS) {
      const value = fields[field];
      if (typeof value !== 'string') { add(field, 'type'); continue; }
      if (!value.trim()) add(field, 'required');
      if (value.length > 12000) add(field, 'too_long');
      if (field === 'decisionDate' && !calendarDate(value)) add(field, 'calendar');
    }
    return { valid: errors.length === 0, errors };
  }
  function safe(value) { return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/</g, '‹').replace(/>/g, '›'); }
  function makeReport(state) {
    const checked = validate(state);
    if (!checked.valid) { const error = new TypeError('Complete the decision canvas before exporting'); error.code = 'INVALID_REPORT'; error.errors = checked.errors; throw error; }
    const item = getCase(state.caseId), lang = state.lang, fr = lang === 'fr', f = state.fields;
    const names = fr
      ? ['Question stratégique', 'Signal interne ou externe', 'Situation organisationnelle', 'Options et option retenue pour examen', 'Valeur attendue — hypothèse', 'Coûts et moyens', 'Risques et dépendances', 'Incertitudes et preuves manquantes', 'Recommandation proposée', 'Responsable et date de décision', 'Critères de réussite']
      : ['Strategisch vraagstuk', 'Intern of extern signaal', 'Organisatorische situatie', 'Opties en gekozen optie ter beoordeling', 'Verwachte waarde — hypothese', 'Kosten en middelen', 'Risico’s en afhankelijkheden', 'Onzekerheden en ontbrekend bewijs', 'Voorgestelde aanbeveling', 'Eigenaar en beslismoment', 'Succescriteria'];
    const heading = fr ? 'GROW FASTER — EXECUTIVE DECISION CANVAS\nDÉMONSTRATION FICTIVE — NON APPROUVÉE — RÉSULTATS NON VALIDÉS' : 'GROW FASTER — EXECUTIVE DECISION CANVAS\nFICTIEVE DEMO — NIET GOEDGEKEURD — RESULTATEN NIET GEVALIDEERD';
    const lines = [heading, '', safe(item.title[lang]), `${fr ? 'Cas' : 'Casus'}: ${item.id} · ${item.kind} · ${lang.toUpperCase()}`, ''];
    const section = (n, value) => lines.push(`${n}. ${names[n - 1]}`, safe(value), '');
    section(1, f.question);
    section(2, `${item.summary[lang]}\n${fr ? 'Source fictive' : 'Fictieve bron'}: ${item.source[lang]}\n${fr ? 'Date du signal' : 'Signaaldatum'}: ${item.date}\n${fr ? 'Implication / interprétation' : 'Implicatie / interpretatie'}: ${item.implication[lang]}\n${fr ? 'Preuve disponible dans cet exemple' : 'Beschikbaar bewijs in dit voorbeeld'}: ${item.evidence[lang]}\n${fr ? 'Incertitude' : 'Onzekerheid'}: ${item.uncertainty[lang]}`);
    section(3, f.situation);
    const options = item.canvas.options.map(o => `${o.id === state.chosenOption ? '[X]' : '[ ]'} ${o.label[lang]} — ${o.description[lang]}`).join('\n');
    section(4, options);
    section(5, f.value); section(6, f.resources); section(7, f.risks); section(8, f.unknowns); section(9, f.recommendation);
    section(10, `${f.owner}\n${fr ? 'Date prévue' : 'Gepland beslismoment'}: ${f.decisionDate}`); section(11, f.success);
    lines.push(fr ? 'OBSERVATIONS CONTEXTUELLES SÉLECTIONNÉES — AUCUN SCORE ECA' : 'GESELECTEERDE CONTEXTUELE OBSERVATIES — GEEN ECA-SCORE');
    for (const id of state.selectedDimensions) { const dimension = item.dimensions.find(d => d.id === id); lines.push(safe(`${dimension.name[lang]}: ${dimension.observation[lang]}`)); }
    lines.push('', fr ? 'LIMITES' : 'BEPERKINGEN', fr
      ? 'Cas, sources et chiffres fictifs. Aucune IA exécutée, aucun fait externe vérifié, aucune décision approuvée ni aucun résultat financier réalisé. Les observations ne constituent ni un score ECA, ni un benchmark validé. Le choix marqué reste une proposition humaine à examiner. Le texte libre conserve sa langue de saisie; changer la langue ne le traduit pas. Brouillon en mémoire uniquement: le rechargement l’efface. N’introduisez aucune donnée confidentielle.'
      : 'Casus, bronnen en cijfers zijn fictief. Geen AI uitgevoerd, geen extern feit geverifieerd, geen besluit goedgekeurd en geen financieel resultaat gerealiseerd. De observaties zijn geen ECA-score of gevalideerde benchmark. De gemarkeerde keuze blijft een menselijk voorstel ter beoordeling. Vrije tekst behoudt de ingevoerde taal; taalwissel vertaalt deze niet. Concept uitsluitend in geheugen: herladen wist het. Voer geen vertrouwelijke gegevens in.');
    return lines.join('\n');
  }
  return Object.freeze({ createState, setLanguage, selectCase, getCase, validate, makeReport });
});
