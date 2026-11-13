/* Current curated edition rules. Independent of reference-demo scoring and browser state. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GF_RADAR_EDITION_TOOLS=api;})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const hosts=Object.freeze(['joint-research-centre.ec.europa.eu','www.nbb.be','nbb.be','press.pwc.be','www.deloitte.com']);
  const sizes=Object.freeze(['small','medium','large']);
  const criteria=Object.freeze(['relevance','belgium','decision','evidence','brevity']);
  const copy={nl:{pilot:'Redactionele piloteditie',notLive:'Geen realtimefeed',asOf:'Editiedatum',reviewDue:'Beoordelen vanaf',current:'Binnen de beoordelingsperiode',overdue:'Beoordelingstermijn verstreken — actualiteit opnieuw controleren',scheduled:'Toekomstig gedateerde editie — nog niet actueel',unavailable:'Geen gecontroleerde editie beschikbaar',audience:'Doelgroep',context:'Redactioneel bedrijfsscenario',fact:'Bronfeit',impact:'Mogelijke bedrijfsimpact — redactionele interpretatie',decision:'Beslisvraag',nextStep:'Voorgestelde vervolgstap',uncertainty:'Onzekerheid en beperking',sources:'Primaire bronnen',published:'Gepubliceerd',checked:'Bron gecontroleerd',scope:'Populatie / bereik',locator:'Vindplaats',supports:'Ondersteunt',act:'Beslis',investigate:'Onderzoek',watch:'Volg op',currentSignal:'Nieuw signaal binnen de editieperiode',background:'Oudere achtergrond — geen nieuw feit',score:'Redactionele beoordeling (1–5); geen gemeten effect',relevance:'CEO-relevantie',belgium:'Belgische toepasbaarheid',evidence:'Bronkwaliteit',brevity:'Bondigheid',download:'Download deze editie (.txt)',medium:'Middelgroot bedrijf — doelgroep',small:'Klein bedrijf — scenario',large:'Grote organisatie — scenario',research:'Context bij de CEO-prioriteiten',researchLimit:'Onderzoeksbeperking',owner:'Grow Faster redactie'},fr:{pilot:'Édition pilote éditoriale',notLive:'Aucun flux en temps réel',asOf:'Date de l’édition',reviewDue:'Revue à partir du',current:'Dans la période de revue',overdue:'Délai de revue dépassé — actualité à revérifier',scheduled:'Édition datée dans le futur — pas encore actuelle',unavailable:'Aucune édition contrôlée disponible',audience:'Public visé',context:'Scénario éditorial d’entreprise',fact:'Fait sourcé',impact:'Impact possible — interprétation éditoriale',decision:'Question de décision',nextStep:'Prochaine étape proposée',uncertainty:'Incertitude et limite',sources:'Sources primaires',published:'Publié',checked:'Source contrôlée',scope:'Population / portée',locator:'Localisation',supports:'Étaye',act:'Décider',investigate:'Examiner',watch:'Surveiller',currentSignal:'Nouveau signal dans la période de l’édition',background:'Contexte antérieur — aucun fait nouveau',score:'Évaluation éditoriale (1–5) ; aucun effet mesuré',relevance:'Pertinence CEO',belgium:'Application en Belgique',evidence:'Qualité des sources',brevity:'Concision',download:'Télécharger cette édition (.txt)',medium:'Entreprise moyenne — public visé',small:'Petite entreprise — scénario',large:'Grande organisation — scénario',research:'Contexte des priorités des CEO',researchLimit:'Limite de recherche',owner:'Rédaction Grow Faster'}};
  const bilingual=x=>x&&typeof x==='object'&&['nl','fr'].every(lang=>typeof x[lang]==='string'&&x[lang].trim().length>0);
  function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T00:00:00.000Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;}
  function safeSource(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&hosts.includes(u.hostname);}catch{return false;}}
  function validateEdition(data){
    const errors=[];if(!data||typeof data!=='object')return ['edition missing'];
    if(typeof data.id!=='string'||!data.id.trim())errors.push('edition id');
    for(const key of ['asOf','reviewDue','periodStart'])if(!validDate(data[key]))errors.push('invalid '+key);
    if(validDate(data.asOf)&&validDate(data.reviewDue)&&data.reviewDue<data.asOf)errors.push('reviewDue before asOf');
    if(validDate(data.asOf)&&validDate(data.periodStart)&&data.periodStart>data.asOf)errors.push('periodStart after asOf');
    if(data.editorialMode!=='curated-pilot')errors.push('editorial mode');
    if(!bilingual(data.audience))errors.push('bilingual audience');
    if(typeof data.owner!=='string'||!data.owner.trim())errors.push('owner');
    if(!Array.isArray(data.sources))errors.push('sources array');
    if(!Array.isArray(data.signals)||data.signals.length>3)errors.push('at most three signals');
    if(!Array.isArray(data.priorityResearch))errors.push('priority research array');
    const sources=Array.isArray(data.sources)?data.sources:[],signals=Array.isArray(data.signals)?data.signals:[],ids=new Set();
    for(const source of sources){if(!source||typeof source!=='object'){errors.push('invalid source');continue;}if(typeof source.id!=='string'||!source.id||ids.has(source.id))errors.push('unique source id');ids.add(source.id);
      if(!safeSource(source.url))errors.push('unapproved source URL: '+source.id);
      if(typeof source.publisher!=='string'||!source.publisher.trim())errors.push('publisher: '+source.id);
      for(const key of ['title','scope','locator','supports'])if(!bilingual(source[key]))errors.push('bilingual '+key+': '+source.id);
      for(const key of ['publishedOn','checkedOn'])if(!validDate(source[key]))errors.push('invalid '+key+': '+source.id);
      if(validDate(source.publishedOn)&&validDate(data.asOf)&&source.publishedOn>data.asOf)errors.push('future source: '+source.id);
      if(validDate(source.checkedOn)&&validDate(data.asOf)&&source.checkedOn>data.asOf)errors.push('future check: '+source.id);
      if(validDate(source.checkedOn)&&validDate(source.publishedOn)&&source.checkedOn<source.publishedOn)errors.push('check before publication: '+source.id);
    }
    const signalIds=new Set();for(const signal of signals){if(!signal||typeof signal!=='object'){errors.push('invalid signal');continue;}if(typeof signal.id!=='string'||!signal.id||signalIds.has(signal.id))errors.push('unique signal id');signalIds.add(signal.id);
      for(const key of ['title','changed','impact','decision','nextStep','uncertainty'])if(!bilingual(signal[key]))errors.push('bilingual '+key+': '+signal.id);
      if(!['act','investigate','watch'].includes(signal.action))errors.push('action: '+signal.id);
      if(!['current','background'].includes(signal.freshness))errors.push('freshness: '+signal.id);
      if(!Array.isArray(signal.sourceIds)||!signal.sourceIds.length||signal.sourceIds.some(id=>!ids.has(id)))errors.push('signal sources: '+signal.id);
      if(signal.freshness==='current'&&Array.isArray(signal.sourceIds)&&!sources.some(s=>s&&signal.sourceIds.includes(s.id)&&validDate(s.publishedOn)&&s.publishedOn>=data.periodStart&&s.publishedOn<=data.asOf))errors.push('current signal needs a dated current source: '+signal.id);
      if(!signal.contexts||sizes.some(size=>!bilingual(signal.contexts[size])))errors.push('size contexts: '+signal.id);
      if(!signal.scorecard||criteria.some(key=>!Number.isInteger(signal.scorecard[key])||signal.scorecard[key]<1||signal.scorecard[key]>5))errors.push('scorecard: '+signal.id);
    }
    for(const research of Array.isArray(data.priorityResearch)?data.priorityResearch:[]){if(!research||!['title','finding','limit'].every(key=>bilingual(research[key]))||!Array.isArray(research.sourceIds)||!research.sourceIds.length||research.sourceIds.some(id=>!ids.has(id)))errors.push('priority research evidence');}
    return errors;
  }
  function dayInBrussels(now){const date=now instanceof Date?now:new Date(now);if(!Number.isFinite(date.getTime()))return null;const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return ['year','month','day'].map(key=>parts.find(p=>p.type===key).value).join('-');}
  function editionStatus(data,now=new Date()){const errors=validateEdition(data);if(errors.length)return {code:'invalid',errors};const day=dayInBrussels(now);if(!day)return {code:'invalid',errors:['invalid current date']};if(!data.signals.length)return {code:'empty',errors:[]};return {code:day<data.asOf?'scheduled':day>=data.reviewDue?'overdue':'current',errors:[]};}
  function brief(data,lang='nl',size='medium',now=new Date()){
    if(!copy[lang]||!sizes.includes(size))throw new RangeError('Unsupported locale or company context');const status=editionStatus(data,now);if(['invalid','empty','scheduled'].includes(status.code))throw new Error('No validated edition');const t=copy[lang],statusLabel=t[status.code];
    const lines=['GROW FASTER · EXECUTIVE RADAR',t.pilot+' · '+t.notLive,t.asOf+': '+data.asOf,t.reviewDue+': '+data.reviewDue,statusLabel,t.owner,t.audience+': '+data.audience[lang],t.context+': '+t[size],''];
    for(const signal of data.signals){lines.push(signal.id+' · '+signal.title[lang],t[signal.action]+' · '+t[signal.freshness==='current'?'currentSignal':'background'],t.fact+': '+signal.changed[lang],t.impact+': '+signal.impact[lang],t.decision+': '+signal.decision[lang],t.nextStep+': '+signal.nextStep[lang],t.uncertainty+': '+signal.uncertainty[lang],t.context+': '+signal.contexts[size][lang],t.score+': '+criteria.map(key=>t[key]+' '+signal.scorecard[key]+'/5').join(' · '),t.sources+': '+signal.sourceIds.join(', '),'');}
    for(const source of data.sources)lines.push(source.id+' · '+source.publisher+' · '+source.title[lang],t.published+': '+source.publishedOn+' · '+t.checked+': '+source.checkedOn,source.url,t.scope+': '+source.scope[lang],t.locator+': '+source.locator[lang],t.supports+': '+source.supports[lang],'');
    for(const research of data.priorityResearch)lines.push(t.research+': '+research.title[lang],research.finding[lang],t.researchLimit+': '+research.limit[lang],t.sources+': '+research.sourceIds.join(', '),'');
    return lines.join('\n');
  }
  return Object.freeze({hosts,sizes,criteria,copy,validDate,safeSource,validateEdition,dayInBrussels,editionStatus,brief});
});
