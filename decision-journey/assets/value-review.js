(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'),require('./roadmap.js'));
  else root.GFValueReview=factory(root.GFDemoModel,root.GF90Roadmap);
})(typeof globalThis!=='undefined'?globalThis:this,function(M,R){
  'use strict';
  const days=[30,60,90],categories=['process','financial','strategic'],directions=['unspecified','higher','lower'],decisions=['undecided','investigate','adapt','continue','stop'],comparabilities=['not-assessed','comparable','not-comparable'];
  const planFields=['caseId','sourceFingerprint','startDate','objective','owner'],actionFields=['id','title','result','owner','startDay','endDay','metric','baseline','target','resources','risk','status','evidence'];
  const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const SCALE=1000000n,MAX=1000000000000n*SCALE;
  function fail(code,message){const error=new TypeError(message||code);error.code=code;throw error;}
  function canonical(value){const negative=value<0n,raw=(negative?-value:value).toString().padStart(7,'0'),fraction=raw.slice(-6).replace(/0+$/,'');return(negative?'-':'')+raw.slice(0,-6)+(fraction?'.'+fraction:'');}
  function parseValue(text){
    if(typeof text!=='string')fail('number');
    const value=text.trim();if(!value)return null;
    if(!/^[+-]?(?:\d+(?:[.,]\d{1,6})?|[.,]\d{1,6})$/.test(value))fail('number');
    const unsigned=value.replace(/^[+-]/,'').replace(',','.').split('.'),integer=(unsigned[0]||'0').replace(/^0+(?=\d)/,'');
    if(integer.length>13)fail('number');
    let number=BigInt(integer)*SCALE+BigInt((unsigned[1]||'').padEnd(6,'0'));if(number>MAX)fail('number');if(value.startsWith('-'))number=-number;return canonical(number);
  }
  function scaled(text){const value=parseValue(text);if(value===null)return null;const negative=value.startsWith('-'),parts=value.replace(/^-/,'').split('.');const result=BigInt(parts[0])*SCALE+BigInt((parts[1]||'').padEnd(6,'0'));return negative?-result:result;}
  function fingerprint(state){
    const plan=state?.roadmap;
    return JSON.stringify({canvas:R.fingerprint(state),plan:plan?{fields:planFields.map(key=>[key,plan[key]]),actions:Array.isArray(plan.actions)?plan.actions.map(action=>({fields:actionFields.map(key=>[key,action?.[key]]),dependencies:Array.isArray(action?.dependencies)?[...action.dependencies].sort():null})):null}:null});
  }
  function currentPlan(state){try{return R.validate(state?.roadmap,state).valid;}catch{return false;}}
  function requirePlan(state){if(!currentPlan(state))fail('invalid_plan');}
  function copy(review){if(!obj(review)||!Array.isArray(review.measures))fail('invalid_review');return {...review,measures:review.measures.map(measure=>obj(measure)?{...measure,baseline:obj(measure.baseline)?{...measure.baseline}:measure.baseline,reviews:Array.isArray(measure.reviews)?measure.reviews.map(observation=>obj(observation)?{...observation}:observation):measure.reviews}:measure)};}
  function newMeasure(id,action,prefill){return{id,actionId:action.id,title:prefill?action.metric:'',category:'process',owner:prefill?action.owner:'',unit:'',direction:'unspecified',baseline:{value:'',date:'',evidence:'',context:''},target:'',reviews:days.map(day=>({day,value:'',date:'',evidence:'',context:'',comparability:'not-assessed'}))};}
  function create(state){requirePlan(state);return{caseId:state.caseId,sourceFingerprint:fingerprint(state),reviewOwner:state.roadmap.owner,measures:[newMeasure('m-1',state.roadmap.actions[0],true)],conclusion:'',nextDecision:'undecided'};}
  function isStale(review,state){try{return !obj(review)||review.caseId!==state?.caseId||review.sourceFingerprint!==fingerprint(state);}catch{return true;}}
  function validDate(value){try{R.dates({startDate:value},1,1);return true;}catch{return false;}}
  function reviewDates(state){return Object.fromEntries(days.map(day=>[day,R.dates(state?.roadmap,day,day).start]));}
  function validate(review,state){
    const errors=[],warnings=[],add=(field,code,measureId,day)=>errors.push({field,code,...(measureId===undefined?{}:{measureId}),...(day===undefined?{}:{day})});
    const planValid=currentPlan(state);if(!planValid)add('plan','invalid');
    if(!obj(review))return{valid:false,errors:[...errors,{field:'review',code:'type'}],warnings};
    if(review.caseId!==state?.caseId)add('caseId','mismatch');
    if(isStale(review,state))add('sourceFingerprint','stale');
    function text(value,field,id,day,required=false){if(typeof value!=='string'){add(field,'type',id,day);return;}if(required&&!value.trim())add(field,'required',id,day);if(value.length>12000)add(field,'too_long',id,day);}
    function number(value,field,id,day){text(value,field,id,day);try{return parseValue(value);}catch{add(field,'number',id,day);return null;}}
    text(review.reviewOwner,'reviewOwner',undefined,undefined,true);text(review.conclusion,'conclusion');
    if(!decisions.includes(review.nextDecision))add('nextDecision','unknown');
    if(review.nextDecision!=='undecided'&&typeof review.conclusion==='string'&&!review.conclusion.trim())add('conclusion','required');
    if(!Array.isArray(review.measures))return{valid:false,errors:[...errors,{field:'measures',code:'type'}],warnings};
    if(review.measures.length<1||review.measures.length>6)add('measures','count');
    const ids=new Set(),actionIds=new Set(Array.isArray(state?.roadmap?.actions)?state.roadmap.actions.map(a=>a?.id):[]);
    let end90;try{end90=R.dates(state.roadmap,90,90).end;}catch{}
    for(const measure of review.measures){
      if(!obj(measure)){add('measure','type');continue;}
      const id=typeof measure.id==='string'?measure.id:undefined;
      if(typeof measure.id!=='string'||!/^m-[a-z0-9][a-z0-9-]{0,40}$/.test(measure.id))add('id','unsafe',id);
      if(ids.has(measure.id))add('id','duplicate',id);ids.add(measure.id);
      if(typeof measure.actionId!=='string'||!actionIds.has(measure.actionId))add('actionId','missing',id);
      text(measure.title,'title',id,undefined,true);text(measure.owner,'owner',id,undefined,true);text(measure.unit,'unit',id);
      if(!categories.includes(measure.category))add('category','unknown',id);
      if(!directions.includes(measure.direction))add('direction','unknown',id);
      const target=number(measure.target,'target',id);let baseline=null,numeric=target!==null;
      const b=measure.baseline;
      if(!obj(b))add('baseline','type',id);
      else{
        baseline=number(b.value,'baseline.value',id);numeric=numeric||baseline!==null;
        for(const key of ['date','evidence','context'])text(b[key],'baseline.'+key,id,undefined,baseline!==null);
        if(typeof b.date==='string'&&b.date.trim()&&!validDate(b.date))add('baseline.date','calendar',id);
      }
      if(!Array.isArray(measure.reviews)){add('reviews','type',id);continue;}
      if(measure.reviews.length!==3)add('reviews','count',id);
      const observedDays=new Set();
      for(const observation of measure.reviews){
        if(!obj(observation)){add('observation','type',id);continue;}
        const day=observation.day;
        if(!days.includes(day))add('day','unknown',id,day);
        if(observedDays.has(day))add('day','duplicate',id,day);observedDays.add(day);
        if(!comparabilities.includes(observation.comparability))add('comparability','unknown',id,day);
        const value=number(observation.value,'value',id,day);numeric=numeric||value!==null;
        for(const key of ['date','evidence','context'])text(observation[key],key,id,day,value!==null);
        const dateValid=typeof observation.date==='string'&&validDate(observation.date);
        if(typeof observation.date==='string'&&observation.date.trim()&&!dateValid)add('date','calendar',id,day);
        if(value!==null&&dateValid){
          if(typeof state?.roadmap?.startDate==='string'&&observation.date<state.roadmap.startDate)add('date','before_plan',id,day);
          if(obj(b)&&typeof b.date==='string'&&validDate(b.date)&&observation.date<b.date)add('date','before_baseline',id,day);
          if(end90&&observation.date>end90)warnings.push({field:'date',code:'after_day90',measureId:id,day});
          warnings.push({field:'evidence',code:'user_reported_unverified',measureId:id,day});
        }
      }
      for(const day of days)if(!observedDays.has(day))add('day','missing',id,day);
      if(numeric&&(typeof measure.unit!=='string'||!measure.unit.trim()))add('unit','required',id);
      if(baseline!==null)warnings.push({field:'baseline.evidence',code:'user_reported_unverified',measureId:id});
    }
    return{valid:errors.length===0,errors,warnings};
  }
  function allowed(patch,keys){if(!obj(patch))fail('invalid_patch');for(const key of Object.keys(patch))if(!keys.includes(key))fail('forbidden_field');}
  function find(review,id){if(!obj(review)||!Array.isArray(review.measures))fail('invalid_review');const index=review.measures.findIndex(m=>m?.id===id);if(index<0)fail('unknown_measure');return index;}
  function updateReview(review,patch){allowed(patch,['reviewOwner','conclusion','nextDecision']);return{...copy(review),...patch};}
  function updateMeasure(review,id,patch){allowed(patch,['actionId','title','category','owner','unit','direction','target']);const index=find(review,id),next=copy(review);next.measures[index]={...next.measures[index],...patch};return next;}
  function updateBaseline(review,id,patch){allowed(patch,['value','date','evidence','context']);const index=find(review,id),next=copy(review);next.measures[index].baseline={...next.measures[index].baseline,...patch};return next;}
  function updateObservation(review,id,day,patch){allowed(patch,['value','date','evidence','context','comparability']);if(!days.includes(day))fail('unknown_day');const index=find(review,id),next=copy(review);if(!Array.isArray(next.measures[index].reviews))fail('invalid_review');const oi=next.measures[index].reviews.findIndex(o=>o?.day===day);if(oi<0)fail('unknown_day');next.measures[index].reviews[oi]={...next.measures[index].reviews[oi],...patch};return next;}
  function addMeasure(review,state){requirePlan(state);if(review?.caseId!==state.caseId)fail('case_mismatch');const next=copy(review);if(next.measures.length>=6)fail('max_measures');let n=1;while(next.measures.some(m=>m?.id==='m-'+n))n++;next.measures.push(newMeasure('m-'+n,state.roadmap.actions[0],false));return next;}
  function removeMeasure(review,id){const index=find(review,id),next=copy(review);if(next.measures.length<=1)fail('min_measures');next.measures.splice(index,1);return next;}
  function rebase(review,state){requirePlan(state);if(review?.caseId!==state.caseId)fail('case_mismatch');const next=copy(review);next.sourceFingerprint=fingerprint(state);return next;}
  function evaluateMeasure(review,id,day,state){
    const index=find(review,id);if(!days.includes(day))fail('unknown_day');const measure=review.measures[index],observation=Array.isArray(measure.reviews)?measure.reviews.find(o=>o?.day===day):null;if(!observation)fail('unknown_day');
    const result=(status,reasonCodes,delta=null,relativeChange=null,targetMet=null)=>({status,delta,relativeChange,targetMet,reasonCodes});
    const checked=validate(review,state);if(!checked.valid)return result('needs-review',[...new Set(checked.errors.map(e=>e.code))]);
    const value=scaled(observation.value),baseline=scaled(measure.baseline.value),target=scaled(measure.target);
    if(value===null)return result('unmeasured',['observation_missing']);
    if(observation.comparability==='not-comparable')return result('not-comparable',['user_not_comparable']);
    if(baseline===null||observation.comparability==='not-assessed')return result('insufficient',[...(baseline===null?['baseline_missing']:[]),...(observation.comparability==='not-assessed'?['comparability_not_assessed']:[])]);
    const difference=value-baseline,absoluteBaseline=baseline<0n?-baseline:baseline;
    const roundedPercentage=baseline===0n?null:((difference<0n?-difference:difference)*100n*SCALE+absoluteBaseline/2n)/absoluteBaseline*(difference<0n?-1n:1n);
    const delta=canonical(difference),relativeChange=roundedPercentage===null?null:canonical(roundedPercentage);
    const targetMet=target===null||measure.direction==='unspecified'?null:measure.direction==='higher'?value>=target:value<=target;
    return result('user-comparable',['user_reported_not_verified'],delta,relativeChange,targetMet);
  }
  function safe(value){return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').replace(/</g,'‹').replace(/>/g,'›');}
  function makeReport(review,state){
    const checked=validate(review,state);if(!checked.valid){const error=new TypeError('Review current inputs before exporting');error.code='INVALID_VALUE_REVIEW';error.errors=checked.errors;throw error;}
    const fr=state.lang==='fr',t=(nl,french)=>fr?french:nl;
    const unknown=t('Onbekend / geen waarde ingevoerd','Inconnu / aucune valeur saisie'),notGiven=t('Niet opgegeven','Non renseigné'),insufficientInfo=t('Niet berekend: onvoldoende vergelijkingsinformatie.','Non calculée : informations de comparaison insuffisantes.'),number=value=>parseValue(value)===null?unknown:safe(value);
    const schedule=reviewDates(state),statusLabels={ 'needs-review':t('Herbeoordeling nodig','Réexamen nécessaire'),unmeasured:t('Geen waarde ingevoerd; meting niet bevestigd','Aucune valeur saisie; mesure non confirmée'),insufficient:t('Onvoldoende vergelijkingsinformatie','Informations de comparaison insuffisantes'),'not-comparable':t('Door gebruiker niet vergelijkbaar verklaard','Déclaré non comparable par l’utilisateur'),'user-comparable':t('Door gebruiker vergelijkbaar verklaard — niet onafhankelijk geverifieerd','Déclaré comparable par l’utilisateur — non vérifié indépendamment') };
    const comparisonLabels={'not-assessed':t('Niet beoordeeld','Non évaluée'),comparable:t('Door gebruiker vergelijkbaar verklaard','Déclarée comparable par l’utilisateur'),'not-comparable':t('Door gebruiker niet vergelijkbaar verklaard','Déclarée non comparable par l’utilisateur')};
    const categoryLabels={process:t('Proces','Processus'),financial:t('Financieel','Financier'),strategic:t('Strategisch','Stratégique')},directionLabels={unspecified:t('Niet bepaald','Non précisé'),higher:t('Hoger gewenst','Hausse souhaitée'),lower:t('Lager gewenst','Baisse souhaitée')},decisionLabels={undecided:t('Nog niet besloten','Pas encore décidé'),investigate:t('Verder onderzoeken','Approfondir'),adapt:t('Aanpassen','Adapter'),continue:t('Voortzetten','Poursuivre'),stop:t('Stoppen','Arrêter')};
    const lines=[t('RESULTAATBEOORDELING — FICTIEVE DEMO, GEBRUIKERSMELDINGEN','EXAMEN DES RÉSULTATS — DÉMONSTRATION FICTIVE, DÉCLARATIONS UTILISATEUR'),`${t('Bronvraagstuk','Question source')}: ${safe(state.fields.question)}`,`${t('Casus / planstart','Cas / début du plan')}: ${safe(review.caseId)} / ${state.roadmap.startDate}`,`${t('Planvoorstel','Proposition du plan')}: ${safe(state.roadmap.objective)}`,`${t('Beoordelingsverantwoordelijke','Responsable de l’examen')}: ${safe(review.reviewOwner)}`];
    for(const day of days)lines.push(`${t('Gepland beoordelingsmoment','Examen prévu')} ${day}: ${schedule[day]}`);
    lines.push(t('Percentage = (ingevoerde waarde − nulmeting) / absolute waarde van de nulmeting × 100. Afgerond op maximaal 6 decimalen; geen causaliteits- of ROI-maat.','Pourcentage = (valeur saisie − valeur de référence) / valeur absolue de la référence × 100. Arrondi à 6 décimales maximum; aucune mesure de causalité ou de ROI.'));
    for(const measure of review.measures){
      const action=state.roadmap.actions.find(a=>a.id===measure.actionId);
      lines.push('',`${safe(measure.id)} — ${safe(measure.title)}`,`${t('Gekoppelde actie','Action liée')}: ${safe(action.id)} — ${safe(action.title)}`,`${t('Categorie','Catégorie')}: ${categoryLabels[measure.category]}`,`${t('Eigenaar','Responsable')}: ${safe(measure.owner)}`,`${t('Eenheid','Unité')}: ${safe(measure.unit)||notGiven}`,`${t('Gewenste richting','Direction souhaitée')}: ${directionLabels[measure.direction]}`,`${t('Nulmeting','Référence')}: ${number(measure.baseline.value)}`,`${t('Datum / gemelde bewijsref / context','Date / référence de preuve déclarée / contexte')}: ${safe(measure.baseline.date)||notGiven} / ${safe(measure.baseline.evidence)||notGiven} / ${safe(measure.baseline.context)||notGiven}`,`${t('Voorgestelde streefwaarde','Cible proposée')}: ${number(measure.target)}`);
      for(const observation of measure.reviews){
        const evaluated=evaluateMeasure(review,measure.id,observation.day,state),calc=value=>value===null?insufficientInfo:String(value);
        const relativeDisplay=evaluated.relativeChange!==null?'≈ '+evaluated.relativeChange:evaluated.delta!==null&&parseValue(measure.baseline.value)==='0'?t('Niet berekenbaar: de ingevoerde nulmeting is 0.','Non calculable : la valeur de référence saisie est 0.'):insufficientInfo;
        lines.push(`${t('Gebruikersmelding dag','Déclaration utilisateur jour')} ${observation.day}: ${number(observation.value)}`,`${t('Datum','Date')}: ${safe(observation.date)||notGiven}`,`${t('Gemelde bewijsref','Référence de preuve déclarée')}: ${safe(observation.evidence)||notGiven}`,`${t('Meetcontext','Contexte de mesure')}: ${safe(observation.context)||notGiven}`,`${t('Vergelijkbaarheid','Comparabilité')}: ${comparisonLabels[observation.comparability]}`,`${t('Beoordelingsstatus','Statut d’examen')}: ${statusLabels[evaluated.status]}`,`${t('Rekenkundig verschil op ingevoerde waarden','Différence arithmétique sur les valeurs saisies')}: ${calc(evaluated.delta)}`,`${t('Relatieve verandering (%, afgerond op maximaal 6 decimalen)','Variation relative (%, arrondie à 6 décimales maximum)')}: ${relativeDisplay}`,`${t('Streefwaarde rekenkundig bereikt, geen validatie','Cible atteinte arithmétiquement, sans validation')}: ${evaluated.targetMet===null?t('Niet beoordeelbaar: de streefwaarde, gewenste richting of vergelijkingsbasis ontbreekt of is onvoldoende.','Non évaluable : la cible, la direction souhaitée ou la base de comparaison manque ou est insuffisante.'):evaluated.targetMet?t('Ja, op gebruikersinvoer','Oui, selon la saisie utilisateur'):t('Nee, op gebruikersinvoer','Non, selon la saisie utilisateur')}`);
        if(checked.warnings.some(w=>w.code==='after_day90'&&w.measureId===measure.id&&w.day===observation.day))lines.push(t('De ingevoerde meetdatum ligt na dag 90 van het plan. Dit is een late gebruikersmelding; beoordeel periode en meetcontext voordat je vergelijkt.','La date de mesure saisie est postérieure au jour 90 du plan. Il s’agit d’une déclaration tardive de l’utilisateur; examinez la période et le contexte avant de comparer.'));
      }
    }
    lines.push('',`${t('Conclusie door gebruiker','Conclusion de l’utilisateur')}: ${safe(review.conclusion)||t('Nog niet ingevuld','Non renseignée')}`,`${t('Voorgestelde vervolgkeuze','Choix de suivi proposé')}: ${decisionLabels[review.nextDecision]}`,t('Geen onafhankelijke verificatie, causale conclusie, ROI of optelling van verschillende meeteenheden. Alle bewijsreferenties en vergelijkbaarheidsverklaringen zijn gebruikersmeldingen. Een rekenkundig verschil bewijst geen gerealiseerde bedrijfswaarde. Geen AI uitgevoerd of besluit goedgekeurd. Lege meetwaarden blijven onbekend; activiteitstatus staat afzonderlijk in het plan.','Aucune vérification indépendante, conclusion causale, aucun ROI ni addition d’unités différentes. Toutes les références et déclarations de comparabilité proviennent de l’utilisateur. Une différence arithmétique ne prouve pas une valeur d’entreprise réalisée. Aucune IA exécutée ni décision approuvée. Les valeurs vides restent inconnues; les statuts d’activité sont distincts dans le plan.'));
    return lines.join('\n');
  }
  return Object.freeze({fingerprint,create,parseValue,validate,updateReview,updateMeasure,updateBaseline,updateObservation,addMeasure,removeMeasure,isStale,rebase,reviewDates,evaluateMeasure,makeReport});
});
