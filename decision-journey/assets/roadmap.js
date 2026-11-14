(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model.js'), require('./cases.js'));
  else root.GF90Roadmap = factory(root.GFDemoModel, root.GFDemoCases);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (model, cases) {
  'use strict';
  const canvasFields = ['question','situation','value','resources','risks','unknowns','recommendation','owner','decisionDate','success'];
  const textFields = ['title','result','owner','metric','baseline','target','resources','risk'];
  const actionFields = [...textFields,'startDay','endDay','dependencies','status','evidence'];
  const statuses = ['planned','in-progress','blocked','done'];
  const safeId = id => typeof id === 'string' && /^a-[a-z0-9][a-z0-9-]{0,40}$/.test(id);
  const obj = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function fail(code, message) { const error = new TypeError(message || code); error.code = code; throw error; }
  function clone(plan) {
    if (!obj(plan) || !Array.isArray(plan.actions)) fail('invalid_plan');
    return { ...plan, actions: plan.actions.map(a => obj(a) ? { ...a, dependencies: Array.isArray(a.dependencies) ? [...a.dependencies] : a.dependencies } : a) };
  }
  function checkCanvas(state) { const result = model.validate(state); if (!result.valid) { const error = new TypeError('Complete the Canvas first'); error.code = 'invalid_canvas'; error.errors = result.errors; throw error; } }
  function fingerprint(state) {
    return JSON.stringify({ caseId: state?.caseId, chosenOption: state?.chosenOption, selectedDimensions: Array.isArray(state?.selectedDimensions) ? [...state.selectedDimensions].sort() : null, fields: canvasFields.map(field => [field, state?.fields?.[field]]) });
  }
  function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('calendar');
    const [year, month, day] = value.split('-').map(Number), leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    if (year < 1 || month < 1 || month > 12 || day < 1 || day > [31,leap ? 29 : 28,31,30,31,30,31,31,30,31,30,31][month - 1]) fail('calendar');
    const date = new Date(0); date.setUTCHours(0,0,0,0); date.setUTCFullYear(year, month - 1, day); return date;
  }
  function iso(date) { const year = date.getUTCFullYear(); if (year < 1 || year > 9999) fail('calendar_range'); return `${String(year).padStart(4,'0')}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`; }
  function dates(plan, startDay, endDay) {
    if (!Number.isInteger(startDay) || !Number.isInteger(endDay) || startDay < 1 || endDay > 90 || endDay < startDay) fail('day_range');
    const start = parseDate(plan?.startDate), end = new Date(start.getTime());
    start.setUTCDate(start.getUTCDate() + startDay - 1); end.setUTCDate(end.getUTCDate() + endDay - 1);
    return { start: iso(start), end: iso(end) };
  }
  function create(state, startDate = state?.fields?.decisionDate) {
    checkCanvas(state); dates({ startDate }, 1, 90);
    const fr = state.lang === 'fr', external = state.caseId === 'external', option = state.chosenOption;
    const t = (nl, french) => fr ? french : nl;
    const focus = external ? t('leveringsbeloften','promesses de livraison') : t('orderuitzonderingen','exceptions de commande');
    const sequence = option === 'wait' ? [
      t('Verduidelijk de aanleiding zonder automatisering','Clarifier le besoin sans automatisation'),
      t('Leg de huidige handmatige werkwijze vast','Documenter le fonctionnement manuel actuel'),
      t('Verzamel een bruikbare nulmeting','Établir une mesure de référence exploitable'),
      t('Volg signalen en alternatieven','Suivre les signaux et les alternatives'),
      t('Beoordeel de kosten van uitstel','Évaluer les coûts du report'),
      t('Beslis opnieuw: wachten, proef of afzien','Réexaminer : attendre, essayer ou renoncer')
    ] : option === 'pilot' ? [
      t('Begrens de proef en benoem de eigenaar','Délimiter l’essai et nommer le responsable'),
      t('Onderzoek proces en nulmeting','Examiner le processus et la référence'),
      t('Ontwerp de gecontroleerde proef','Concevoir l’essai contrôlé'),
      t('Voer de beperkte proef uit, mits toegestaan','Mener l’essai limité, sous réserve d’autorisation'),
      t('Vergelijk observaties met de nulmeting','Comparer les observations à la référence'),
      t('Beoordeel: stoppen, aanpassen of opschalen','Examiner : arrêter, adapter ou élargir')
    ] : [
      t('Toets of brede uitrol verantwoord is','Examiner si un déploiement large est justifié'),
      t('Leg governance, capaciteit en stopcriteria vast','Définir gouvernance, capacité et critères d’arrêt'),
      t('Ontwerp gefaseerde invoering','Concevoir une mise en œuvre par étapes'),
      t('Start eerste uitrolgolf, mits toegestaan','Lancer une première vague, sous réserve d’autorisation'),
      t('Beoordeel kwaliteit en gevolgen vóór vervolg','Examiner qualité et conséquences avant de poursuivre'),
      t('Beslis over vervolg, beperking of terugdraaien','Décider de poursuivre, limiter ou revenir en arrière')
    ];
    const windows = [[1,10],[11,25],[31,40],[41,55],[61,75],[76,90]];
    const target = option === 'pilot' ? state.fields.success : t(
      `Voor de gekozen optie ${option === 'wait' ? 'wachten' : 'brede uitrol'} is nog geen aangepast streefcriterium vastgesteld. Menselijke afstemming van het Canvas-broncriterium is nodig; neem proefcriteria niet automatisch over. Canvas-broncriterium (ongewijzigd, ter beoordeling): ${state.fields.success}`,
      `Pour l’option ${option === 'wait' ? 'attendre' : 'déploiement large'}, aucun critère cible adapté n’est encore établi. Un réexamen humain du critère source du Canvas est nécessaire; ne pas reprendre automatiquement les critères d’essai. Critère source du Canvas (inchangé, à examiner) : ${state.fields.success}`
    );
    const actions = sequence.map((title, index) => ({
      id: 'a-' + (index + 1), title: title + ' — ' + focus,
      result: index === 5 ? t('Voorgesteld resultaat: een expliciete vervolgafweging met bewijs, beperkingen en eigenaar.','Résultat proposé : une décision de suivi explicite, avec preuves, limites et responsable.') : t('Voorgesteld resultaat: een gereviewde stap voor '+focus+'; nog niet uitgevoerd of goedgekeurd.','Résultat proposé : une étape examinée pour les '+focus+'; ni réalisée ni approuvée.'),
      owner: state.fields.owner, startDay: windows[index][0], endDay: windows[index][1], dependencies: index ? ['a-' + index] : [],
      metric: external ? t('Betrouwbaarheid en herleidbaarheid van leveringsbeloften; definitie nog afspreken.','Fiabilité et traçabilité des promesses de livraison; définition à convenir.') : t('Doorlooptijd en heropeningen bij vergelijkbare orderuitzonderingen; definitie nog afspreken.','Délai et réouvertures pour des exceptions comparables; définition à convenir.'),
      baseline: t('Nog te meten; geen fictieve nulwaarde als werkelijk resultaat.','À mesurer; aucune valeur zéro fictive présentée comme un résultat réel.'),
      target,
      resources: t(
        `Planbrede aanname uit het Canvas: ${state.fields.resources} Het aandeel voor deze actie is nog te bepalen; dit is geen aanvullend actiebudget.`,
        `Hypothèse à l’échelle du plan issue du Canvas : ${state.fields.resources} La part attribuée à cette action reste à définir; il ne s’agit pas d’un budget supplémentaire.`
      ),
      risk: state.fields.risks,
      status: 'planned', evidence: ''
    }));
    return { caseId: state.caseId, sourceFingerprint: fingerprint(state), startDate, objective: state.fields.question, owner: state.fields.owner, actions };
  }
  function isStale(plan, state) { return !obj(plan) || plan.caseId !== state?.caseId || plan.sourceFingerprint !== fingerprint(state); }
  function validate(plan, state) {
    const errors = [], warnings = [], add = (field, code, actionId) => errors.push(actionId === undefined ? { field, code } : { field, code, actionId });
    if (!model.validate(state).valid) add('canvas','invalid');
    if (!obj(plan)) return { valid: false, errors: [...errors,{ field:'plan',code:'type' }], warnings };
    if (!cases.some(c => c.id === plan.caseId) || plan.caseId !== state?.caseId) add('caseId','mismatch');
    if (isStale(plan,state)) add('sourceFingerprint','stale');
    function text(value, field, actionId, required = true) {
      if (typeof value !== 'string') { add(field,'type',actionId); return; }
      if (required && !value.trim()) add(field,'required',actionId);
      if (value.length > 12000) add(field,'too_long',actionId);
    }
    text(plan.objective,'objective'); text(plan.owner,'owner');
    try { dates(plan,1,90); } catch (error) { add('startDate',error.code || 'calendar'); }
    if (!Array.isArray(plan.actions)) { add('actions','type'); return { valid:false, errors,warnings }; }
    if (plan.actions.length < 1 || plan.actions.length > 12) add('actions','count');
    const byId = new Map(), duplicates = new Set();
    for (const action of plan.actions) {
      if (!obj(action)) { add('action','type'); continue; }
      const id = typeof action.id === 'string' ? action.id : undefined;
      if (!safeId(action.id)) add('id','unsafe',id);
      if (byId.has(action.id)) { duplicates.add(action.id); add('id','duplicate',id); } else byId.set(action.id,action);
      for (const field of textFields) text(action[field],field,id);
      text(action.evidence,'evidence',id,false);
      if (!statuses.includes(action.status)) add('status','unknown',id);
      if (action.status === 'done') {
        if (typeof action.evidence !== 'string' || !action.evidence.trim()) add('evidence','required',id);
        warnings.push({ field:'evidence',code:'reported_done_unverified',actionId:id });
      }
      if (!Number.isInteger(action.startDay) || action.startDay < 1 || action.startDay > 90) add('startDay','range',id);
      if (!Number.isInteger(action.endDay) || action.endDay < 1 || action.endDay > 90) add('endDay','range',id);
      if (Number.isInteger(action.startDay) && Number.isInteger(action.endDay) && action.startDay > action.endDay) add('endDay','before_start',id);
      if (!Array.isArray(action.dependencies)) add('dependencies','type',id);
      else if (new Set(action.dependencies).size !== action.dependencies.length) add('dependencies','duplicate',id);
    }
    for (const action of plan.actions) if (obj(action) && Array.isArray(action.dependencies)) for (const dep of action.dependencies) {
      if (dep === action.id) add('dependencies','self',action.id);
      else if (typeof dep !== 'string' || !byId.has(dep)) add('dependencies','missing',action.id);
      else if (Number.isInteger(action.startDay) && Number.isInteger(byId.get(dep).endDay) && action.startDay <= byId.get(dep).endDay) add('startDay','finish_start',action.id);
    }
    const visiting = new Set(), visited = new Set();
    function visit(id) {
      if (visiting.has(id)) return true;
      if (visited.has(id) || !byId.has(id) || duplicates.has(id)) return false;
      visiting.add(id);
      const action = byId.get(id);
      if (Array.isArray(action.dependencies)) for (const dep of action.dependencies) if (byId.has(dep) && visit(dep)) return true;
      visiting.delete(id); visited.add(id); return false;
    }
    for (const action of plan.actions) if (obj(action) && visit(action.id)) { add('dependencies','cycle',action.id); break; }
    return { valid: errors.length === 0, errors, warnings };
  }
  function allowed(patch, keys) {
    if (!obj(patch)) fail('invalid_patch');
    for (const key of Object.keys(patch)) if (!keys.includes(key)) fail('forbidden_field');
  }
  function rebase(plan,state) { checkCanvas(state); if (plan?.caseId !== state.caseId) fail('case_mismatch'); const next = clone(plan); next.caseId = state.caseId; next.sourceFingerprint = fingerprint(state); return next; }
  function updatePlan(plan,patch) { allowed(patch,['objective','owner','startDate']); return { ...clone(plan), ...patch }; }
  function updateAction(plan,id,patch) {
    allowed(patch,actionFields); const next = clone(plan), index = next.actions.findIndex(a => a?.id === id);
    if (index < 0) fail('unknown_action');
    next.actions[index] = { ...next.actions[index], ...patch, ...(Array.isArray(patch.dependencies) ? {dependencies:[...patch.dependencies]} : {}) }; return next;
  }
  function addAction(plan) {
    const next = clone(plan); if (next.actions.length >= 12) fail('max_actions');
    let counter = 1; while (next.actions.some(a => a?.id === 'a-' + counter)) counter++;
    const action = { id:'a-'+counter, title:'', result:'', owner:'', startDay:1, endDay:1, dependencies:[], metric:'', baseline:'', target:'', resources:'', risk:'', status:'planned', evidence:'' };
    next.actions.push(action); return next;
  }
  function removeAction(plan,id) {
    const next = clone(plan); if (!next.actions.some(a => a?.id === id)) fail('unknown_action');
    if (next.actions.some(a => Array.isArray(a?.dependencies) && a.dependencies.includes(id))) fail('in_use');
    next.actions = next.actions.filter(a => a?.id !== id); return next;
  }
  function summary(plan) {
    if (!obj(plan) || !Array.isArray(plan.actions)) fail('invalid_plan');
    return { total:plan.actions.length, planned:plan.actions.filter(a=>a?.status==='planned').length, inProgress:plan.actions.filter(a=>a?.status==='in-progress').length, blocked:plan.actions.filter(a=>a?.status==='blocked').length, reportedDone:plan.actions.filter(a=>a?.status==='done').length };
  }
  function safe(value) { return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').replace(/</g,'‹').replace(/>/g,'›'); }
  function makeReport(plan,state) {
    const checked = validate(plan,state); if (!checked.valid) { const error = new TypeError('Review and complete the current plan before exporting'); error.code = 'INVALID_ROADMAP'; error.errors = checked.errors; throw error; }
    const fr = state.lang === 'fr', t = (nl,french) => fr ? french : nl;
    const lines = [t('90-DAGENPLAN — FICTIEF VOORSTEL, NIET GOEDGEKEURD','PLAN À 90 JOURS — PROPOSITION FICTIVE, NON APPROUVÉE'),
      `${t('Bronvraagstuk','Question source')}: ${safe(state.fields.question)}`,`${t('Bronoptie','Option source')}: ${safe(model.getCase(state.caseId).canvas.options.find(o=>o.id===state.chosenOption).label[state.lang])}`,
      `${t('Doel','Objectif')}: ${safe(plan.objective)}`,`${t('Verantwoordelijke','Responsable')}: ${safe(plan.owner)}`,`${t('Start / dag 90','Début / jour 90')}: ${plan.startDate} / ${dates(plan,1,90).end}`,''];
    for (const [n,start,end] of [[1,1,30],[2,31,60],[3,61,90]]) { const window = dates(plan,start,end); lines.push(`${t('Fase','Phase')} ${n}: ${t('dag','jour')} ${start}–${end} · ${window.start} — ${window.end}`); }
    lines.push(t('Fasevensters zijn kalenderdagen, geen capaciteits- of werkdagenplanning. Taken kunnen fasegrenzen overschrijden.','Les fenêtres de phase sont exprimées en jours calendaires : il ne s’agit ni d’une planification en jours ouvrés ni d’une optimisation de capacité. Une tâche peut traverser une limite de phase.'),'');
    const labels = { planned:t('Voorgesteld / gepland','Proposé / planifié'),'in-progress':t('Door gebruiker als gestart gemeld','Déclaré en cours par l’utilisateur'),blocked:t('Door gebruiker als geblokkeerd gemeld','Déclaré bloqué par l’utilisateur'),done:t('Door gebruiker als afgerond gemeld — bewijs niet onafhankelijk gecontroleerd','Déclaré terminé par l’utilisateur — preuve non vérifiée indépendamment') };
    for (const action of plan.actions) {
      const window = dates(plan,action.startDay,action.endDay);
      lines.push(`${safe(action.id)} — ${safe(action.title)}`,`${t('Dagen / datums','Jours / dates')}: ${action.startDay}–${action.endDay} · ${window.start} — ${window.end}`,`${t('Afhankelijk van','Dépend de')}: ${action.dependencies.length ? action.dependencies.map(safe).join(', ') : t('Geen','Aucune')}`);
      for (const [key,label] of [['result',t('Voorgesteld resultaat','Résultat proposé')],['owner',t('Eigenaar','Responsable')],['metric',t('Meetpunt','Mesure')],['baseline',t('Nulmeting','Référence')],['target',t('Streefwaarde / criterium','Cible / critère')],['resources',t('Middelen','Moyens')],['risk',t('Risico','Risque')]]) lines.push(`${label}: ${safe(action[key])}`);
      lines.push(`${t('Gebruikersstatus','Statut déclaré')}: ${labels[action.status]}`,`${t('Gemelde bewijsverwijzing','Référence de preuve déclarée')}: ${safe(action.evidence) || t('Niet aangeleverd','Non fournie')}`,'');
    }
    const counts = summary(plan);
    lines.push(`${t('Activiteitstatus, geen bedrijfswaarde','Statuts d’activité, pas de valeur réalisée')}: ${t('totaal','total')} ${counts.total}; ${t('gepland','planifié')} ${counts.planned}; ${t('gestart','en cours')} ${counts.inProgress}; ${t('geblokkeerd','bloqué')} ${counts.blocked}; ${t('als afgerond gemeld','déclaré terminé')} ${counts.reportedDone}.`,
      t('Alle acties en cijfers zijn fictieve voorstellen. Een bewijsverwijzing is een gebruikersmelding, geen verificatie. Geen AI uitgevoerd, geen goedkeuring of gerealiseerde bedrijfswaarde vastgesteld. Bewuste herbeoordeling van de bron is geen besluitgoedkeuring. Geen vertrouwelijke gegevens invoeren.','Toutes les actions et tous les chiffres sont des propositions fictives. Une référence est une déclaration de l’utilisateur, pas une vérification. Aucune IA exécutée, aucune approbation ni valeur réalisée établie. Le réexamen explicite de la source ne constitue pas une approbation. Ne saisir aucune donnée confidentielle.'));
    return lines.join('\n');
  }
  return Object.freeze({ fingerprint,create,validate,isStale,rebase,updatePlan,updateAction,addAction,removeAction,dates,summary,makeReport });
});
