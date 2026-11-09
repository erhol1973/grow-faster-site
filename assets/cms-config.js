/* Public project configuration only. Never place a secret/service-role key here. */
(function(){
 const isolated=window.location?.hostname==='feature-secure-supabase-cms.grow-faster-site.pages.dev';
 window.GF_CMS_CONFIG=Object.freeze(isolated
  ?{url:'https://gqsvoioccvklzfmdmexy.supabase.co',key:'sb_publishable_PrzDBgnoLtpUjOLnAM0lfw_up3URiTf',recoveryEnabled:false}
  :{url:'https://dbooobckaqbkrmkpcuem.supabase.co',key:'sb_publishable_HXfGzzlpKOo8oh7Fjo4N-Q_lI418Hat',recoveryEnabled:true});
 if(isolated&&typeof document!=='undefined'){
  const label=document.querySelector('.studio');
  if(label){label.textContent='Contentstudio · TEST';document.title='Grow Faster · Contentstudio TEST';}
 }
})();
