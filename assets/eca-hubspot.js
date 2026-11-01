'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ECAHubSpot=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const FORM_ID='97bca96a-12a6-4542-a5a1-e915d4371a2b';
  const fields={strategic:'strategic_coherence_score',operating:'operating_model_coherence_score',governance:'decision_governance_coherence_score',ai:'ai_enablement_coherence_score',capability:'capability_value_coherence_score'};
  function attribution(search){
    const params=new URLSearchParams(search),out={};
    // Campaign identifiers only. Never forward the full URL, referrer or arbitrary parameters.
    for(const key of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']){
      const v=params.get(key);
      if(v&&/^[a-zA-Z0-9_.~-]{1,100}$/.test(v))out[key]=v;
    }
    return out;
  }
  const risks={strategic:'strategic_coherence',operating:'operating_model_value_streams',governance:'decision_rights_governance',ai:'data_technology_ai_enablement',capability:'capabilities_incentives_value'};
  function properties(result,utm={},completedAt=new Date()){
    if(!result?.sufficient||!Number.isFinite(result.overall))throw Error('Incomplete assessment');
    const out={enterprise_coherence_score:String(result.displayScore)};
    for(const [dimension,name] of Object.entries(fields)){
      const score=result.dimensionScores[dimension];
      if(!Number.isFinite(score)||score<0||score>100)throw Error('Invalid dimension');
      out[name]=String(Math.round(score*100)/100);
    }
    // The existing CRM property is single-select. Clear it for a tie rather than inventing a winner.
    out.primary_coherence_risk=result.primaryConstraints.length===1?risks[result.primaryConstraints[0]]:'';
    out.coherence_maturity_band=result.band;
    out.assessment_source=utm.utm_source||'eca';
    if(utm.utm_campaign)out.assessment_campaign=utm.utm_campaign;
    out.assessment_completed=completedAt.toISOString().slice(0,10);
    out.diagnostic_interest='interested';
    return out;
  }
  async function populate(form,data,utm){
    const available=await form.getFormFieldValues();
    for(const key of Object.keys(data)){
      if(!available.some(f=>f.name==='0-1/'+key))throw Error('Missing assessment field: '+key);
    }
    for(const [key,value] of Object.entries(data)){
      // Hidden presentation preserves the property's native type. Native updates settle asynchronously.
      await form.setFieldValue('0-1/'+key,value);
      let matches=false;
      for(let attempt=0;attempt<10;attempt++){
        if(String(await form.getFieldValue('0-1/'+key))===value){matches=true;break}
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      if(!matches)throw Error('Assessment field rejected: '+key);
    }
    form.setExtraSubmissionMetadata(utm);
  }
  function mount(win,doc,result){
    const button=doc.querySelector('#openDiagnostic'),host=doc.querySelector('#diagnosticForm'),status=doc.querySelector('#diagnosticStatus');
    let opened=false;
    button.onclick=()=>{
      if(opened)return;
      let data,utm;
      try{utm=attribution(win.location.search);data=properties(result(),utm)}catch{status.textContent='Complete your assessment before opening the form.';return}
      opened=true;button.disabled=true;
      // Reserve a rendering surface for HubSpot's lazy embed without exposing an unpopulated form.
      host.hidden=false;host.style.visibility='hidden';host.inert=true;
      // Freeze the displayed profile while its voluntary form is open; no stale score can be submitted.
      doc.querySelectorAll('#ecaForm input, #ecaForm button, #retake').forEach(el=>el.disabled=true);
      status.textContent='Loading your optional form…';
      let timer,failed=false;
      const fail=()=>{failed=true;win.clearTimeout(timer);host.hidden=true;host.replaceChildren();status.textContent='The diagnostic form is unavailable. Your anonymous profile remains available. Reload this page to try again.'};
      win.addEventListener('hs-form-event:on-ready',async event=>{
        if(failed||event.detail?.formId!==FORM_ID)return;
        try{await populate(win.HubSpotFormsV4.getFormFromEvent(event),data,utm);if(failed)return;win.clearTimeout(timer);host.hidden=false;host.style.visibility='';host.inert=false;status.textContent='Only submitting this form links this profile to your contact. Marketing subscription is optional. Reload the page to start a new assessment.'}catch(error){if(/^(Missing assessment field|Assessment field rejected): /.test(error.message))status.dataset.integrationError=error.message;fail()}
      });
      win.addEventListener('hs-form-event:on-submission:failed',event=>{if(event.detail?.formId===FORM_ID)status.textContent='Submission failed. Your profile remains available. Please retry in the form.'});
      win.addEventListener('hs-form-event:on-submission:success',event=>{if(event.detail?.formId===FORM_ID)status.textContent='Your diagnostic request was submitted successfully.'});
      const frame=doc.createElement('div');frame.className='hs-form-frame';frame.dataset.region='eu1';frame.dataset.formId=FORM_ID;frame.dataset.portalId='149675328';host.appendChild(frame);
      const script=doc.createElement('script');script.src='https://js-eu1.hsforms.net/forms/embed/149675328.js';script.onerror=fail;
      timer=win.setTimeout(fail,20000);doc.head.appendChild(script);
    };
  }
  return {FORM_ID,attribution,properties,populate,mount};
});
