/* Public project configuration only. Never place a secret/service-role key here. */
(function(){
 const hostname=window.location?.hostname;
 const isolated=[
  'feature-secure-supabase-cms.grow-faster-site.pages.dev',
  'dev-member-access.grow-faster-site.pages.dev',
  'localhost','127.0.0.1','[::1]'
 ].includes(hostname);
 // The read-only command-line CMS verifier evaluates this file without a browser location.
 const production=!window.location || ['grow-faster.be','www.grow-faster.be'].includes(hostname);
 const testUrl='https://gqsvoioccvklzfmdmexy.supabase.co';
 const configuration={url:testUrl,key:'',recoveryEnabled:false};
 if(isolated) configuration.key='sb_publishable_PrzDBgnoLtpUjOLnAM0lfw_up3URiTf';
 if(production) Object.assign(configuration,{url:'https://dbooobckaqbkrmkpcuem.supabase.co',key:'sb_publishable_HXfGzzlpKOo8oh7Fjo4N-Q_lI418Hat',recoveryEnabled:true});
 window.GF_CMS_CONFIG=Object.freeze(configuration);
 if(isolated&&typeof document!=='undefined'){
  const label=document.querySelector('.studio');
  if(label){label.textContent='Contentstudio · TEST';document.title='Grow Faster · Contentstudio TEST';}
 }
})();
