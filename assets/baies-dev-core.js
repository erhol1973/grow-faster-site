/* Pure, testable rules for BAEIS dev. No browser or network dependencies. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BAEIS_DEV_CORE=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const weights=Object.freeze({belgium:30,value:25,urgency:20,evidence:15,cross:10});
  const sourceHosts=new Set(['statbel.fgov.be','www.nbb.be','www.vlaio.be']);
  const transitions=Object.freeze({intake:'source-checked','source-checked':'challenge-checked','challenge-checked':'preview-approved'});
  function scoreSignal(scores){
    if(!scores||typeof scores!=='object')throw new TypeError('Missing score data');
    const result=Object.entries(weights).reduce((sum,[key,weight])=>{
      const value=scores[key];
      if(!Number.isInteger(value)||value<0||value>5)throw new RangeError(`Invalid ${key} score`);
      return sum+weight*value/5;
    },0);
    return Math.round(result);
  }
  function sourceIsApproved(url){
    try{const parsed=new URL(url);return parsed.protocol==='https:'&&sourceHosts.has(parsed.hostname)&&!parsed.username&&!parsed.password;}catch{return false;}
  }
  function checkRecord(r){
    const errors=[];
    if(!r||typeof r!=='object')return ['Record missing'];
    if(!/^BE-[A-Z]+-\d{3}$/.test(r.id||''))errors.push('Invalid stable claim ID');
    if(!sourceIsApproved(r.url))errors.push('Primary source URL is absent or outside the demo allowlist');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(r.published||'')||Number.isNaN(Date.parse(r.published)))errors.push('Invalid publication date');
    if(!r.claim?.nl||!r.claim?.fr)errors.push('Missing claim text');
    if(!r.limit?.nl||!r.limit?.fr)errors.push('Missing methodological limitation');
    if(!r.decision?.nl||!r.decision?.fr)errors.push('Missing management implication');
    if(!r.type||!r.source)errors.push('Missing evidence type / publisher');
    if(!Array.isArray(r.roles)||r.roles.length<1)errors.push('Missing audience');
    try{scoreSignal(r.score)}catch(errorscore){errors.push(errorscore.message)}
    return errors;
  }
  function nextStage(stage,record){
    if(checkRecord(record).length)throw new Error('Missing valid evidence metadata');
    const next=transitions[stage];
    if(!next)throw new Error('Transition blocked');
    return next;
  }
  function canPublishExternally(){return false;} // DEV POLICY: no external write integration.
  function searchTokens(value){
    return (String(value).normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('nl-BE').match(/[\p{L}\p{N}]+/gu)||[]).map(t=>t==='ia'?'ai':t);
  }
  const sectorTerms=Object.freeze({'Cross-sector':'sectoroverschrijdend intersectoriel cross sector',SME:'kmo pme sme',Manufacturing:'industrie industrieel industriel manufacturing'});
  function matchesQuery(record,query){
    if(!String(query||'').trim())return true;
    const terms=searchTokens(query);if(!terms.length)return false;
    const words=searchTokens([record.id,record.title.nl,record.title.fr,record.claim.nl,record.claim.fr,record.source,sectorTerms[record.sector]||record.sector].join(' '));
    return terms.every(term=>words.some(word=>word===term||(term.length>=3&&word.startsWith(term))));
  }
  function filterRecords(records,role,sector,query){
    return records.filter(r=>(role==='ALL'||r.roles.includes(role))&&(sector==='All'||r.sector===sector)&&matchesQuery(r,query));
  }
  // Editorial research proposals, kept separate from the fixed factual claims.
  function decisionPlan(record,role,size){
    if(!['CEO','CFO','CIO','COO'].includes(role))throw new RangeError('Unknown executive role');
    if(!['small','medium','large'].includes(size))throw new RangeError('Unknown company context');
    const steps={
      'BE-AI-001':{nl:'Kies één bestaand AI-gebruik in een proces en vergelijk tijd, fouten en kosten met een nulmeting.',fr:'Choisir un usage IA existant dans un processus et comparer temps, erreurs et coûts à une mesure initiale.'},
      'BE-AI-002':{nl:'Inventariseer AI-gebruik per functie en noteer ontbrekende vaardigheden, controles en uitvoeringskosten. Gebruik de Vlaamse studie als context.',fr:'Recenser les usages IA par fonction et les compétences, contrôles et coûts manquants. Utiliser l’étude flamande comme contexte.'},
      'BE-EC-003':{nl:'Werk voor één AI-project een basis-, gunstig en ongunstig scenario uit. Noteer aannames en ontbrekende kosten zonder de macroprognose als projectopbrengst te gebruiken.',fr:'Décrire les scénarios central, favorable et défavorable d’un projet IA. Noter hypothèses et coûts manquants sans utiliser la prévision macro comme rendement du projet.'},
      'BE-EC-004':{nl:'Kies één industrieel proces en registreer wachttijd, doorlooptijd en foutkosten vóór een eventuele AI-pilot.',fr:'Choisir un processus industriel et relever attente, temps de cycle et coûts d’erreur avant un éventuel pilote IA.'},
      'BE-SME-005':{nl:'Controleer welke capaciteit en vaardigheden beschikbaar zijn voor één AI-onderzoek. Leid geen eigen AI-opbrengst af uit het aandeel microbedrijven.',fr:'Vérifier les capacités et compétences disponibles pour une étude IA. Ne pas déduire un bénéfice IA propre de la proportion de microentreprises.'}
    };
    const contexts={
      small:{measure:{nl:'Eén proces: minuten per handeling, fouten per week en huidige kosten; waarden nog vast te leggen.',fr:'Un processus : minutes par opération, erreurs par semaine et coûts actuels ; valeurs à établir.'},horizon:{nl:'Eerst de nulmeting; een vervolgmoment afspreken vóór een pilotbesluit.',fr:'D’abord la mesure initiale ; fixer une revue avant toute décision de pilote.'}},
      medium:{measure:{nl:'Afgebakende pilot: volume, doorlooptijd, foutkosten en uitvoeringskosten per betrokken team; nulmeting ontbreekt nog.',fr:'Pilote délimité : volume, temps de cycle, coûts d’erreur et de mise en œuvre par équipe ; référence initiale à établir.'},horizon:{nl:'Nulmeting en proceseigenaar bevestigen vóór pilotstart; evaluatiemoment nog te plannen.',fr:'Confirmer référence et responsable avant le pilote ; planifier ensuite l’évaluation.'}},
      large:{measure:{nl:'Beoordelingsdossier per eenheid: baseline, aannames, datadekking, kosten en bewijsgrenzen; onafhankelijk te beoordelen.',fr:'Dossier par entité : référence, hypothèses, couverture des données, coûts et limites des preuves ; revue indépendante requise.'},horizon:{nl:'Eerst bron- en aannamereview; een besluitmoment pas na onafhankelijke beoordeling plannen.',fr:'D’abord revoir sources et hypothèses ; fixer une décision après examen indépendant.'}}
    };
    const owners={
      CEO:{nl:'Voorstel: proceseigenaar met directiesponsor; personen nog te bevestigen.',fr:'Proposition : responsable de processus et sponsor de direction ; personnes à confirmer.'},
      CFO:{nl:'Voorstel: financiële verantwoordelijke met proceseigenaar; personen nog te bevestigen.',fr:'Proposition : responsable financier et responsable de processus ; personnes à confirmer.'},
      CIO:{nl:'Voorstel: IT-/dataverantwoordelijke met proceseigenaar; personen nog te bevestigen.',fr:'Proposition : responsable IT/données et responsable de processus ; personnes à confirmer.'},
      COO:{nl:'Voorstel: operationele proceseigenaar; persoon nog te bevestigen.',fr:'Proposition : responsable du processus opérationnel ; personne à confirmer.'}
    };
    if(!record||!steps[record.id])throw new RangeError('Unknown decision record');
    return Object.freeze({recordId:record.id,role,size,step:Object.freeze({...steps[record.id]}),measure:Object.freeze({...contexts[size].measure}),owner:Object.freeze({...owners[role]}),horizon:Object.freeze({...contexts[size].horizon})});
  }
  function sortRecords(records,mode='priority'){
    if(!['priority','date','source'].includes(mode))throw new RangeError('Invalid sort mode');
    return [...records].sort((a,b)=>{
      const order=mode==='date'?b.published.localeCompare(a.published):mode==='source'?a.source.localeCompare(b.source,'en'):scoreSignal(b.score)-scoreSignal(a.score);
      return order||a.id.localeCompare(b.id,'en');
    });
  }
  return Object.freeze({weights,scoreSignal,sourceIsApproved,checkRecord,nextStage,canPublishExternally,filterRecords,sortRecords,decisionPlan});
});
