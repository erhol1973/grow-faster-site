(function(){
 'use strict';
 const $=id=>document.getElementById(id),client=window.GFCms.createClient(window.GF_CMS_CONFIG),catalog=window.GF_CMS_CATALOG;
 let usingMemberSession=false;
 let records=[],selected=null,definition=null,dirty=false,busy=false,returnFocus=null,previewedRevision=null,previewedSection=null;
 const notify=text=>$('notice').textContent=text;
 const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',()=>run(fn));return b;};
 function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
 async function run(fn){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();}catch(e){notify(e.message);}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}}
 function values(){const content={heading:selected.heading,body:selected.body,settings:{...selected.settings,fields:{...selected.settings?.fields}}};
  for(const field of definition.fields){const saved=selected.settings?.fields?.[field.key];if(field.type==='text'){content.settings.fields[field.key]={type:'text',nl:$(field.key+'-nl').value,fr:$(field.key+'-fr').value};if(field.source)content[field.source]={nl:content.settings.fields[field.key].nl,fr:content.settings.fields[field.key].fr};}else if(saved?.path){content.settings.fields[field.key]={...saved,alt:{nl:$(field.key+'-nl').value,fr:$(field.key+'-fr').value}};}}
  return content;
 }
 const homeGroups=[
  {id:'hero',label:'Hero & introductie',from:0,to:1,extra:[44]},
  {id:'experience',label:'Ervaring & trackrecord',from:2,to:9},
  {id:'coherence',label:'Enterprise Coherence',from:10,to:17,extra:[47]},
  {id:'explore',label:'Verdieping & perspectief',from:18,to:24},
  {id:'books',label:'Boeken & previews',from:25,to:35,extra:[45,46]},
  {id:'journal',label:'Executive Journal',from:36,to:38},
  {id:'workshop',label:'Workshop & aanbod',from:39,to:41},
  {id:'contact',label:'Contact',from:42,to:43},
  {id:'video',label:'Video',from:48,to:48}
 ];
 function fieldGroup(index,field){
  if(definition.page!=='home')return field.type==='media'?'media':'text';
  const group=homeGroups.find(item=>index>=item.from&&index<=item.to||item.extra?.includes(index));
  return group?.id||'other';
 }
 function sectionOptions(){
  const selector=$('field-group');selector.replaceChildren();
  const groups=definition.page==='home'
   ?[{id:'all',label:'Alle onderdelen'},...homeGroups]
   :[{id:'all',label:'Alle onderdelen'},{id:'text',label:'Teksten'},{id:'media',label:'Afbeeldingen en video'}];
  for(const group of groups){const option=node('option',group.label);option.value=group.id;selector.append(option);}
  selector.value=definition.page==='home'?'hero':'all';
 }
 $('field-group').addEventListener('change',filterFields);
 function paint(){
  $('field-search').value='';
  sectionOptions();
  $('page-name').textContent=definition.label;$('section-name').textContent='Teksten & media';$('state').textContent=dirty?'Niet opgeslagen':'Opgeslagen concept';$('fields').replaceChildren();
  for(const field of definition.fields){const saved=selected.settings?.fields?.[field.key]||(field.source?{...field,...Object.fromEntries(['nl','fr'].map(lang=>[lang,selected[field.source]?.[lang]?(field.source==='heading'?selected[field.source][lang].replace(/\. /,'.\n'):selected[field.source][lang]):field[lang]]))}:field),wrap=node('section');wrap.className='field';wrap.append(node('h3',field.label||'Afbeelding'));const langs=node('div');langs.className='languages';
   for(const lang of ['nl','fr']){const label=node('label',(lang==='nl'?'Nederlands':'Français')+(field.type==='media'?' · beeldbeschrijving':''));const input=node(field.type==='text'?'textarea':'input');input.id=field.key+'-'+lang;input.value=field.type==='text'?(saved[lang]??(field.source&&selected[field.source]?.[lang]?selected[field.source][lang].replace(/\. /,'.\n'):field[lang])):(saved.alt?.[lang]||'');input.maxLength=12000;input.addEventListener('input',()=>{dirty=true;$('state').textContent='Niet opgeslagen';});label.append(input);langs.append(label);}
   wrap.append(langs);
   if(field.type==='media'){const label=node('label','Nieuwe foto of video · maximaal 25 MB');const input=node('input');input.type='file';input.accept=field.kind==='video'?'video/mp4':'image/jpeg,image/png,image/webp,image/avif';input.addEventListener('change',()=>run(async()=>{const file=input.files[0];if(!file)return;if((field.kind==='video')!==(file.type==='video/mp4'))throw Error('Kies het juiste bestandstype voor dit veld.');const path=await client.upload(file);selected.settings={...selected.settings,fields:{...selected.settings?.fields,[field.key]:{type:'media',path,alt:{nl:$(field.key+'-nl').value,fr:$(field.key+'-fr').value}}}};dirty=true;$('state').textContent='Niet opgeslagen';notify('Upload klaar. Sla het concept op om de verwijzing te bewaren.');}));label.append(input);wrap.append(label,node('p',saved.path?'Een nieuwe upload is gekoppeld.':'De bestaande website-afbeelding blijft behouden.'));}
   $('fields').append(wrap);
  }
  filterFields();
 }
 function filterFields(){
  const term=$('field-search').value.trim().toLocaleLowerCase('nl');
  const activeGroup=$('field-group').value;
  let shown=0;
  for(const [index,field] of definition.fields.entries()){
   const section=$('fields').children[index];if(!section)continue;
   const textMatch=!term||[field.label,field.nl,field.fr,field.src,field.type==='media'?'afbeelding foto video media':'tekst'].filter(Boolean).some(value=>String(value).toLocaleLowerCase('nl').includes(term));
   const groupMatch=activeGroup==='all'||fieldGroup(index,field)===activeGroup;
   const match=textMatch&&(term?true:groupMatch);
   section.hidden=!match;if(match)shown++;
  }
  $('field-count').textContent=shown+' van '+definition.fields.length+' velden zichtbaar';
 }
 $('field-search').addEventListener('input',filterFields);
 function nav(){const query=$('search').value.toLocaleLowerCase('nl');$('sections').replaceChildren();for(const item of catalog){if(!(item.label+' '+item.page).toLowerCase().includes(query))continue;const b=button(item.label,async()=>{if(dirty){notify('Sla eerst je huidige concept op.');return;}definition=item;previewedRevision=null;previewedSection=null;selected=records.find(r=>r.page_slug===item.page&&r.section_key===item.section);if(!selected){const result=await client.request('/rest/v1/page_sections?select=*',{method:'POST',auth:true,body:{page_slug:item.page,section_key:item.section,heading:{nl:item.label,fr:item.label},body:{nl:'',fr:''},settings:{fields:{}}}}); // PostgREST default is minimal: reload after successful insert.
       void result;records=await client.list();selected=records.find(r=>r.page_slug===item.page&&r.section_key===item.section);}
      paint();nav();});b.setAttribute('aria-current',String(definition===item));$('sections').append(b);}}
 async function openWorkspace(){records=await client.list();$('login-panel').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;nav();notify('Aangemeld. Kies de pagina die je wilt bijwerken.');}
 $('login').addEventListener('submit',event=>{event.preventDefault();run(async()=>{const data=new FormData(event.target);try{await client.login(data.get('email'),data.get('password'));}finally{event.target.elements.password.value='';}await openWorkspace();});});
 $('logout').addEventListener('click',()=>run(async()=>{try{if(usingMemberSession)await window.GFMember.logout();else await client.logout();}finally{location.reload();}}));
 $('search').addEventListener('input',nav);
 $('recover').addEventListener('click',()=>{const email=$('login').elements.email;if(!email.reportValidity())return;run(async()=>{const redirect=location.hostname==='grow-faster.be'?'https://grow-faster.be/admin':'https://feature-secure-supabase-cms.grow-faster-site.pages.dev/admin';await client.recover(email.value,redirect);notify('Als dit adres een account heeft, ontvang je een persoonlijke herstellink. Controleer ook je spammap.');});});
 $('recovery-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{const form=event.target;if(form.elements.password.value!==form.elements.confirm.value)throw Error('De twee wachtwoorden zijn niet gelijk.');await client.updatePassword(form.elements.password.value);form.reset();$('recovery-panel').hidden=true;$('login-panel').hidden=false;notify('Wachtwoord ingesteld. Meld je nu aan met je nieuwe wachtwoord.');});});
 const recoveryHash=new URLSearchParams(location.hash.slice(1));
 if(recoveryHash.has('access_token')){history.replaceState(null,'',location.pathname+location.search);if(recoveryHash.get('type')==='recovery'){$('login-panel').hidden=true;run(async()=>{try{await client.acceptRecovery(recoveryHash.get('access_token'),recoveryHash.get('expires_in'));$('recovery-panel').hidden=false;notify('Kies je eigen CMS-wachtwoord.');}catch(e){$('login-panel').hidden=false;throw e;}});}else notify('Vraag een nieuwe herstellink aan via de knop onder het aanmeldformulier.');}
 else if(recoveryHash.has('error_description')){history.replaceState(null,'',location.pathname+location.search);notify('De herstellink is verlopen of al gebruikt. Vraag een nieuwe link aan.');}
 else if(window.GFMember){run(async()=>{
  const session=await window.GFMember.getAdminSession();
  if(!session)return;
  await client.acceptRecovery(session.token,session.expiresIn);
  usingMemberSession=true;
  await openWorkspace();
 });}
 $('edit').addEventListener('submit',event=>{event.preventDefault();run(async()=>{if(!selected)return;selected=await client.save(selected.id,selected.updated_at,values());records=records.map(r=>r.id===selected.id?selected:r);dirty=false;previewedRevision=null;previewedSection=null;$('state').textContent='Opgeslagen concept';notify('Concept opgeslagen. Controleer het voorbeeld voordat je publiceert. De livewebsite is ongewijzigd.');});});
 $('publish').addEventListener('click',()=>run(async()=>{if(!selected)return;if(dirty){notify('Sla het concept eerst op en bekijk je wijzigingen.');return;}if(previewedSection!==selected.id||previewedRevision!==selected.updated_at){notify('Bekijk eerst het opgeslagen concept voordat je publiceert.');return;}if(!window.confirm('Deze wijziging wordt zichtbaar voor alle bezoekers. Wil je de geselecteerde pagina nu publiceren?'))return;await client.publish(selected.id,selected.updated_at);records=await client.list();selected=records.find(record=>record.id===selected.id)||selected;previewedSection=null;previewedRevision=null;$('state').textContent='Gepubliceerd';notify('Gepubliceerd. Nieuwe paginabezoeken halen de nieuwe inhoud op.');}));
 let previewContent=null,previewUrls={},previewFrame=null;
 addEventListener('message',event=>{if(event.origin===location.origin&&event.source===previewFrame?.contentWindow&&event.data?.type==='gf:preview-ready')previewFrame.contentWindow.postMessage({type:'gf:preview',content:previewContent,urls:previewUrls},location.origin);});
 $('preview').addEventListener('click',()=>run(async()=>{if(!selected)return;returnFocus=document.activeElement;previewContent=values();previewUrls={};for(const field of Object.values(previewContent.settings.fields)){if(field.type==='media'&&field.path)previewUrls[field.path]=await client.media(field.path,true);}$('preview-content').replaceChildren();const picker=node('select');picker.setAttribute('aria-label','Voorbeeldtaal');for(const [value,text] of [['nl','Nederlands'],['fr','Français']]){const option=node('option',text);option.value=value;picker.append(option);}previewFrame=node('iframe');previewFrame.title='Websitevoorbeeld';previewFrame.src=definition.route+'?cms-preview=1&lang=nl';if(!dirty){previewedSection=selected.id;previewedRevision=selected.updated_at;}picker.addEventListener('change',()=>previewFrame.src=definition.route+(picker.value==='fr'?'?cms-preview=1&lang=fr':'?cms-preview=1&lang=nl'));$('preview-content').append(picker,previewFrame);$('preview-dialog').showModal();}));
 $('close-preview').addEventListener('click',()=>$('preview-dialog').close());$('preview-dialog').addEventListener('close',()=>returnFocus?.focus());
 addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 $('login-submit').disabled=false;$('recovery-submit').disabled=false;
 if(!window.GF_CMS_CONFIG.key)notify('De CMS-koppeling moet nog worden geactiveerd. Aanmelden is nog niet beschikbaar.');
})();

