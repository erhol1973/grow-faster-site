/* BAEIS DEV front-end. No network requests, remote writes, or CMS/HubSpot connection. */
(function(){
  'use strict';
  const dataset=window.BAEIS_DEV_DATA;
  const core=window.BAEIS_DEV_CORE;
  if(!dataset||!core){document.body.prepend(document.createTextNode('Prototype dependencies unavailable.'));return;}
  const $=id=>document.getElementById(id);
  const dict=window.BAEIS_MEMBER_COPY;
  const state={lang:'nl',view:'overview',role:'CEO',size:'small',stage:'intake',audit:[]};
  const records=dataset.records;
  const editorRecord=records.find(r=>r.id==='BE-EC-003');
  const text=(key)=>dict[state.lang][key]||dict.nl[key]||key;
  const localized=(obj)=>obj[state.lang]||obj.nl;
  function element(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;}
  function clear(el){el.replaceChildren();}
  const views=['overview','dashboard','radar','evidence','editorial','about'];
  const viewLabels={overview:'navOverview',dashboard:'navDashboard',radar:'navRadar',evidence:'navEvidence',editorial:'navEditorial',about:'navModel'};
  const navigation=document.querySelector('.main-nav');
  const toggle=$('navigation-toggle');
  const mobileNavigation=window.matchMedia('(max-width:760px)');
  const evidenceReady=!records.some(r=>core.checkRecord(r).length);
  let lastRoute='';
  let navigationFocus=null;
  let evidenceTrigger=null;
  function navigationLabels(){
    $('current-view-label').textContent=text(viewLabels[state.view]);
    navigation.setAttribute('aria-label',text('navLabel'));
    document.querySelector('.identity').setAttribute('aria-label',text('brandHome'));
    $('language-switch').setAttribute('aria-label',text('langLabel'));
    toggle.setAttribute('aria-label',text(toggle.getAttribute('aria-expanded')==='true'?'navClose':'navOpen'));
    document.title=text(viewLabels[state.view])+' | BAEIS · Grow Faster';
  }
  function setNavigationOpen(open,restoreFocus=false){
    const expanded=Boolean(open&&mobileNavigation.matches);
    navigation.classList.toggle('is-open',expanded);
    toggle.setAttribute('aria-expanded',String(expanded));
    navigationLabels();
    if(restoreFocus)toggle.focus({preventScroll:true});
  }
  function goTo(view,focus=true){
    if(!views.includes(view)||(!evidenceReady&&['dashboard','radar','evidence'].includes(view)))return;
    const dialog=$('evidence-dialog');if(dialog.hasAttribute('open')){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');}
    document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!==view);
    document.querySelectorAll('[data-view]').forEach(link=>{const active=link.dataset.view===view;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    state.view=view;renderView(view);setNavigationOpen(false);
    window.scrollTo({top:0,behavior:'instant'});
    if(focus){const heading=$(view).querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});}
  }
  function navigate(view){
    if(!views.includes(view)||(!evidenceReady&&['dashboard','radar','evidence'].includes(view)))return;
    const url=new URL(window.location.href);url.hash=view;
    if(url.href!==window.location.href)window.history.pushState(null,'',url);
    lastRoute=url.href;goTo(view);
  }
  function syncRoute(focus=true){
    if(lastRoute===window.location.href)return;
    const url=new URL(window.location.href);
    const lang=url.searchParams.get('lang')==='fr'?'fr':'nl';
    let view=views.includes(url.hash.slice(1))?url.hash.slice(1):'overview';
    if(!evidenceReady&&['dashboard','radar','evidence'].includes(view))view='overview';
    if(url.hash&&url.hash!=='#'+view)url.hash=view;
    if(url.searchParams.has('lang')&&url.searchParams.get('lang')!==lang)url.searchParams.set('lang',lang);
    if(url.href!==window.location.href)window.history.replaceState(null,'',url);
    if(state.lang!==lang||!lastRoute)setLang(lang,false);
    lastRoute=url.href;goTo(view,focus);
  }
  function chooseLanguage(lang){
    if(!['nl','fr'].includes(lang))return;
    const url=new URL(window.location.href);url.searchParams.set('lang',lang);
    window.history.replaceState(null,'',url);lastRoute=url.href;setLang(lang);
  }
  function setLang(lang,render=true){
    if(!['nl','fr'].includes(lang))return;state.lang=lang;document.documentElement.lang=lang==='nl'?'nl-BE':'fr-BE';
    document.querySelectorAll('[data-i18n]').forEach(n=>{const v=dict[lang][n.dataset.i18n];if(typeof v==='string')n.textContent=v;});
    $('heading-overview').replaceChildren(document.createTextNode(lang==='nl'?'Van AI-signalen naar ':'Des signaux IA vers '),element('em','',lang==='nl'?'betere bedrijfsbeslissingen.':'de meilleures décisions.'));
    document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===lang)));
    $('overview-roles').setAttribute('aria-label',text('audience'));
    $('hero-signal-list').closest('.hero-preview').setAttribute('aria-label',text('previewTitle'));
    $('evidence-rows').setAttribute('aria-label',text('evidenceTitle'));
    for(const option of $('sector-filter').options)if(text('sectorLabels')[option.value])option.textContent=text('sectorLabels')[option.value];
    const type=$('evidence-type'),selected=type.value;clear(type);const all=element('option','',text('allTypes'));all.value='ALL';type.append(all);for(const value of [...new Set(records.map(r=>r.type))]){const option=element('option','',typeLabel(value));option.value=value;type.append(option);}type.value=selected||'ALL';
    if(render)renderView(state.view);navigationLabels();
  }
  const typeLabel=value=>text('typeLabels')[value]||value;
  const dateFormatters=Object.fromEntries(['nl','fr'].map(lang=>[lang,new Intl.DateTimeFormat(lang+'-BE',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})]));
  const dateLabel=value=>dateFormatters[state.lang].format(new Date(value+'T00:00:00Z'));
  function detailsButton(record){const b=element('button','text-btn',text('viewEvidence')+' ↗');b.type='button';b.setAttribute('aria-label',text('viewEvidence')+': '+localized(record.title));b.addEventListener('click',()=>showDetails(record,b));return b;}
  function limitation(record){const details=element('details','record-limitation');details.append(element('summary','',text('limit')),element('p','',localized(record.limit)));return details;}
  function renderHero(){const target=$('hero-signal-list');clear(target);for(const [i,r] of core.sortRecords(records).slice(0,3).entries()){const row=element('div','preview-signal');row.append(element('span','rank',String(i+1).padStart(2,'0')));const copy=element('div');copy.append(element('b','',localized(r.title)),element('small','',r.source+' · '+dateLabel(r.published)));row.append(copy);target.append(row);}$('hero-count').textContent=String(records.length).padStart(2,'0');$('home-record-count').textContent=records.length;$('home-publisher-count').textContent=new Set(records.map(r=>r.source)).size;}
  function planRows(plan){return [['planTitle',plan.step],['planMeasure',plan.measure],['planOwner',plan.owner],['planHorizon',plan.horizon]];}
  function planElement(record){
    const plan=core.decisionPlan(record,state.role,state.size);const section=element('div','decision-plan');section.dataset.context=state.size;
    section.append(element('strong','plan-heading',text('planTitle')),element('p','',localized(plan.step)));
    const details=element('details');details.append(element('summary','',text('planDetails')));const list=element('dl');
    for(const [label,value] of planRows(plan).slice(1)){const pair=element('div');pair.append(element('dt','',text(label)),element('dd','',localized(value)));list.append(pair);}
    details.append(list);section.append(details);return section;
  }
  function renderBrief(){const target=$('brief-items');clear(target);const all=records.filter(r=>r.roles.includes(state.role));for(const r of core.sortRecords(all).slice(0,3)){const li=element('li');li.dataset.record=r.id;li.append(element('small','record-id',r.id),element('h4','',localized(r.title)),element('span','agenda-metric',r.metric),element('p','',localized(r.decision)),element('small','',r.source+' · '+dateLabel(r.published)+' · '+typeLabel(r.type)),planElement(r),detailsButton(r));target.append(li);}$('dashboard-records').textContent=all.length;$('dashboard-publishers').textContent=new Set(all.map(r=>r.source)).size;$('dashboard-types').textContent=new Set(all.map(r=>r.type)).size;$('role-explainer').textContent=text('roles')[state.role];$('cfo-context').hidden=state.role!=='CFO';document.querySelectorAll('[data-role]').forEach(b=>{const active=b.dataset.role===state.role;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});}
  function showDetails(record,trigger){
    evidenceTrigger=trigger;
    $('dialog-title').textContent=localized(record.title);const body=$('dialog-body');clear(body);body.append(element('p','record-id',record.id));
    for(const [label,value] of [[text('method'),typeLabel(record.type)],[text('confidence'),(text('confidenceLabels')[record.confidence]||record.confidence)+' · '+text('confidenceNote')],[text('date'),dateLabel(record.published)],[text('claim'),localized(record.claim)],[text('limit'),localized(record.limit)],[text('decision'),localized(record.decision)],[text('priority'),core.scoreSignal(record.score)+'/100 · '+text('editorialHypothesis')]]){const section=element('div','detail');section.append(element('strong','detail-label',label),element('p','',value));body.append(section);}
    const linkWrap=element('div','detail');linkWrap.append(element('strong','detail-label',record.source));const link=element('a','',text('openSource'));link.href=record.url;link.rel='noopener noreferrer';link.target='_blank';linkWrap.append(link);body.append(linkWrap);const dialog=$('evidence-dialog');if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  }
  function renderRadar(){const target=$('signal-grid');clear(target);const filtered=core.filterRecords(records,$('role-filter').value,$('sector-filter').value,$('signal-search').value);$('visible-count').textContent=String(filtered.length);
    const role=$('role-filter').value;const outside=core.filterRecords(records,'ALL',$('sector-filter').value,$('signal-search').value).length-filtered.length;
    $('role-coverage').textContent=role==='ALL'?text('coverageAll'):text('coverageRole').replace('{role}',role).replace('{outside}',outside);
    $('expand-role-filter').hidden=role==='ALL'||outside===0;
    if(!filtered.length){target.append(element('p','empty',text('noSignals')));return;}
    for(const r of core.sortRecords(filtered,$('signal-sort').value)){const card=element('article','signal-card');card.dataset.record=r.id;const head=element('div','signal-top');head.append(element('span','signal-cat',text('sectorLabels')[r.sector]||r.sector),element('span','signal-score',core.scoreSignal(r.score)+'/100'));card.append(head,element('h2','',localized(r.title)),element('div','signal-metric',r.metric),element('p','',localized(r.claim)));const question=element('div','decision-question');question.append(element('strong','',text('decision')),element('p','',localized(r.decision)));card.append(question,limitation(r));const bottom=element('div','signal-bottom');bottom.append(element('small','',r.source+' · '+dateLabel(r.published)+' · '+typeLabel(r.type)),detailsButton(r));card.append(bottom);target.append(card);}
  }
  function renderEvidence(){const target=$('evidence-rows');clear(target);const filtered=core.filterRecords(records,'ALL','All',$('evidence-search').value).filter(r=>($('evidence-source').value==='ALL'||r.source===$('evidence-source').value)&&($('evidence-type').value==='ALL'||r.type===$('evidence-type').value));$('evidence-count').textContent=filtered.length+' / '+records.length+' '+text('referenceClaims');if(!filtered.length){target.append(element('li','empty',text('noSignals')));return;}for(const r of core.sortRecords(filtered,'date')){const card=element('li','evidence-record');card.dataset.record=r.id;card.append(element('span','record-id',r.id),element('h2','',localized(r.title)));const metadata=element('dl','record-metadata');for(const [key,value] of [[text('thPublisher'),r.source],[text('date'),dateLabel(r.published)],[text('thType'),typeLabel(r.type)]]){const pair=element('div');pair.append(element('dt','',key),element('dd','',value));metadata.append(pair);}card.append(metadata,element('p','',localized(r.claim)),limitation(r),detailsButton(r));target.append(card);}}
  function logEvent(message){state.audit.unshift({message,time:new Date().toLocaleTimeString(state.lang==='nl'?'nl-BE':'fr-BE',{hour:'2-digit',minute:'2-digit',second:'2-digit'})});renderAudit();}
  function renderAudit(){const target=$('audit-events');clear(target);for(const entry of state.audit.slice(0,10)){target.append(element('li','',`${entry.time} · ${entry.message}`));}}
  function renderReview(){
    const title=$('queue-title');title.textContent=localized(editorRecord.title);$('queue-source').textContent=`${editorRecord.id} · ${editorRecord.source} · ${editorRecord.published}`;
    const stages=['intake','source-checked','challenge-checked','preview-approved'];const current=stages.indexOf(state.stage);const list=$('queue-steps');clear(list);text('steps').forEach((s,i)=>{const div=element('div',i<=current?'step done':'step');div.append(element('i','',i<=current?'✓':'·'));div.append(element('span','',s));list.append(div)});
    const btn=$('advance-review');btn.textContent=text('actions')[current]||text('actions')[3];btn.disabled=current===3;btn.classList.toggle('locked',current===3);
    $('external-publish').disabled=true;$('external-publish').setAttribute('aria-disabled','true');
  }
  function advanceReview(){try{const next=core.nextStage(state.stage,editorRecord);state.stage=next;const i=['intake','source-checked','challenge-checked','preview-approved'].indexOf(next);const msg=text('feedback')[i];$('workflow-feedback').textContent=msg;logEvent(msg);renderReview();}catch(err){$('workflow-feedback').textContent=err.message;}}
  function resetReview(){state.stage='intake';$('workflow-feedback').textContent=text('resetMessage');state.audit=[];logEvent(text('resetMessage'));renderReview();}
  // Populate only the active workspace; each navigation refreshes its localized data.
  function renderView(view){
    if(view==='overview')renderHero();
    else if(view==='dashboard')renderBrief();
    else if(view==='radar')renderRadar();
    else if(view==='evidence')renderEvidence();
    else if(view==='editorial'){renderReview();renderAudit();}
  }
  function downloadBrief(){
    const selected=core.sortRecords(records.filter(r=>r.roles.includes(state.role))).slice(0,3);
    const sizeLabel=text({small:'sizeSmall',medium:'sizeMedium',large:'sizeLarge'}[state.size]);
    const lines=['GROW FASTER · BAEIS DEMO · '+dataset.snapshotDate,text('audienceExport')+': '+state.role,text('companySize')+': '+sizeLabel,text('briefDisclaimer'),text('planNotice'),''];
    selected.forEach((r,i)=>{lines.push((i+1)+'. '+r.id+' · '+localized(r.title),localized(r.claim),text('limit')+': '+localized(r.limit),text('decision')+': '+localized(r.decision));for(const [label,value] of planRows(core.decisionPlan(r,state.role,state.size)))lines.push(text(label)+': '+localized(value));lines.push(text('sourceExport')+': '+r.source+' · '+r.published+' · '+r.url,'');});
    lines.push(text('downloadEnd'));const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='BAEIS_DEV_Executive_Brief_'+state.role+'.txt';document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
  }
  document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();setNavigationOpen(false);const main=$('main');main.focus({preventScroll:true});const top=main.getBoundingClientRect().top+window.scrollY-navigation.getBoundingClientRect().height;window.scrollTo({top:Math.max(0,top),behavior:'instant'});});
  document.querySelector('.identity').addEventListener('click',e=>{if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigate('overview');});
  document.querySelectorAll('[data-view]').forEach(link=>link.addEventListener('click',event=>{if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(link.dataset.view);}));
  document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.goto)));
  document.querySelectorAll('[data-role]').forEach(b=>b.addEventListener('click',()=>{state.role=b.dataset.role;renderBrief();}));
  for(const id of ['role-filter','sector-filter','signal-search','signal-sort'])$(id).addEventListener(id==='signal-search'?'input':'change',renderRadar);
  function resetRadar(){ $('role-filter').value='ALL';$('sector-filter').value='All';$('signal-search').value='';$('signal-sort').value='priority';renderRadar();}
  $('reset-radar').addEventListener('click',resetRadar);
  $('dashboard-radar').addEventListener('click',()=>{resetRadar();$('role-filter').value=state.role;renderRadar();navigate('radar');});
  for(const id of ['evidence-search','evidence-source','evidence-type'])$(id).addEventListener(id==='evidence-search'?'input':'change',renderEvidence);
  $('reset-evidence').addEventListener('click',()=>{$('evidence-search').value='';$('evidence-source').value='ALL';$('evidence-type').value='ALL';renderEvidence();});
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>chooseLanguage(button.dataset.language)));
  toggle.addEventListener('click',()=>setNavigationOpen(toggle.getAttribute('aria-expanded')!=='true'));
  navigation.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){event.preventDefault();setNavigationOpen(false,true);}});
  navigation.addEventListener('focusin',event=>{navigationFocus=event.target;});
  document.addEventListener('pointerdown',event=>{if(!navigation.contains(event.target)){navigationFocus=null;setNavigationOpen(false);}});
  document.addEventListener('focusin',event=>{if(!navigation.contains(event.target)){if(event.target!==document.body)navigationFocus=null;if(toggle.getAttribute('aria-expanded')==='true')setNavigationOpen(false);}});
  mobileNavigation.addEventListener('change',()=>{const active=document.activeElement;const previous=active===document.body?navigationFocus:active;setNavigationOpen(false);if(mobileNavigation.matches&&$('product-links').contains(previous))toggle.focus({preventScroll:true});else if(!mobileNavigation.matches&&previous===toggle)document.querySelector('.nav-link[aria-current="page"]').focus({preventScroll:true});});
  $('company-size').addEventListener('change',()=>{const size=$('company-size').value;if(!['small','medium','large'].includes(size))return;state.size=size;renderBrief();});
  $('expand-role-filter').addEventListener('click',()=>{$('role-filter').value='ALL';renderRadar();$('role-filter').focus({preventScroll:true});});
  $('download-brief').addEventListener('click',downloadBrief);
  $('advance-review').addEventListener('click',advanceReview);
  $('reset-review').addEventListener('click',resetReview);
  function restoreEvidenceFocus(){const trigger=evidenceTrigger;evidenceTrigger=null;if(trigger?.isConnected&&!trigger.closest('.view').hidden)trigger.focus({preventScroll:true});}
  $('evidence-dialog').addEventListener('close',restoreEvidenceFocus);
  const closeDialog=()=>{const d=$('evidence-dialog');if(typeof d.close==='function')d.close();else{d.removeAttribute('open');restoreEvidenceFocus();}};
  $('dialog-close').addEventListener('click',closeDialog);$('dialog-done').addEventListener('click',closeDialog);
  $('signup-form').addEventListener('submit',event=>{event.preventDefault();$('signup-feedback').textContent=text('signupMessage');$('signup-form').reset();});
  if(!evidenceReady){
    document.querySelectorAll('[data-goto="dashboard"],[data-view="dashboard"],[data-goto="radar"],[data-view="radar"],[data-goto="evidence"],[data-view="evidence"]').forEach(b=>{b.disabled=true;b.setAttribute('aria-disabled','true');});
    $('workflow-feedback').textContent='Evidence validation failed; blocked.';
    return;
  }
  window.history.scrollRestoration='manual';
  window.addEventListener('popstate',()=>syncRoute());
  window.addEventListener('hashchange',()=>syncRoute());
  syncRoute(false);logEvent(text('auditInit'));
})();
