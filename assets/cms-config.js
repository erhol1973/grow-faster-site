/* Public project configuration only. Never place a secret/service-role key here. */
(function(){
 const projects=Object.freeze({
  prod:Object.freeze({url:'https://dbooobckaqbkrmkpcuem.supabase.co',key:'sb_publishable_HXfGzzlpKOo8oh7Fjo4N-Q_lI418Hat'}),
  test:Object.freeze({url:'https://gqsvoioccvklzfmdmexy.supabase.co',key:'sb_publishable_PrzDBgnoLtpUjOLnAM0lfw_up3URiTf'})
 });
 /* Shared with the booking administration page, which picks prod only on the live domain. */
 window.GF_SUPABASE_PROJECTS=projects;
 /* Every Cloudflare Pages preview (branch alias or deployment hash) uses the isolated test project; only the live domain reaches production data (25 Nov 2026). */
 const isolated=/^([a-z0-9-]+\.)?grow-faster-site\.pages\.dev$/.test(window.location?.hostname||'');
 window.GF_CMS_CONFIG=Object.freeze(isolated
  ?{...projects.test,recoveryEnabled:false}
  :{...projects.prod,recoveryEnabled:true});
 if(isolated&&typeof document!=='undefined'){
  const label=document.querySelector('.studio');
  if(label){label.textContent='Contentstudio · TEST';document.title='Grow Faster · Contentstudio TEST';}
 }
})();
