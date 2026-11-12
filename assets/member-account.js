(async () => {
  'use strict';
  const member = window.GFMember;
  const query = new URLSearchParams(location.search);
  const lang = query.get('lang') === 'fr' ? 'fr' : 'nl';
  document.documentElement.lang = lang;
  const texts = {
    nl:{account:'Mijn account',login:'Aanmelden',signup:'Gratis lid worden',recover:'Wachtwoord vergeten?',reset:'Nieuw wachtwoord instellen',email:'E-mailadres',password:'Wachtwoord',newPassword:'Nieuw wachtwoord (minstens 12 tekens)',loginIntro:'Meld je aan voor het volledige Executive Journal en de Executive Radar.',signupIntro:'Met een gratis ledenaccount lees je het volledige Journal en gebruik je de Executive Radar.',recoverIntro:'Ontvang een persoonlijke herstellink per e-mail.',resetIntro:'Stel een nieuw wachtwoord in voor je account.',send:'Herstellink aanvragen',signed:'Aangemeld als ',logout:'Afmelden',back:'Verder lezen',journal:'Executive Journal',confirm:'Controleer je mailbox. Open de link in dezelfde browser om je e-mailadres te bevestigen.',sent:'Als dit adres een account heeft, ontvang je een herstellink. Open de link in dezelfde browser.',changed:'Je wachtwoord is bijgewerkt. Meld je opnieuw aan.',error:'De aanvraag is mislukt. Probeer opnieuw.',invalid:'Aanmelden is mislukt. Controleer je gegevens en bevestig eerst je e-mailadres.',badLink:'De link is verlopen of kon niet worden bevestigd in deze browser. Vraag een nieuwe link aan.',unavailable:'Ledenaccounts zijn op deze omgeving momenteel niet beschikbaar.',studio:'Contentstudio openen'},
    fr:{account:'Mon compte',login:'Se connecter',signup:'Devenir membre gratuitement',recover:'Mot de passe oublié ?',reset:'Définir un nouveau mot de passe',email:'Adresse e-mail',password:'Mot de passe',newPassword:'Nouveau mot de passe (12 caractères minimum)',loginIntro:'Connectez-vous pour lire le Journal et consulter le Radar dans leur intégralité.',signupIntro:'Un compte membre gratuit donne accès à l’intégralité du Journal et de l’Executive Radar.',recoverIntro:'Recevez un lien personnel de réinitialisation par e-mail.',resetIntro:'Choisissez un nouveau mot de passe pour votre compte.',send:'Recevoir le lien',signed:'Connecté avec ',logout:'Se déconnecter',back:'Continuer la lecture',journal:'Executive Journal',confirm:'Consultez votre messagerie. Ouvrez le lien dans le même navigateur pour confirmer votre adresse e-mail.',sent:'Si cette adresse correspond à un compte, vous recevrez un lien. Ouvrez-le dans le même navigateur.',changed:'Votre mot de passe a été modifié. Connectez-vous à nouveau.',error:'La demande a échoué. Veuillez réessayer.',invalid:'La connexion a échoué. Vérifiez vos identifiants et confirmez d’abord votre adresse e-mail.',badLink:'Le lien a expiré ou ne peut pas être confirmé dans ce navigateur. Demandez un nouveau lien.',unavailable:'Les comptes membres sont actuellement indisponibles dans cet environnement.',studio:'Ouvrir le Contentstudio'}
  };
  const t = texts[lang];
  document.querySelector('.skip-link').textContent = lang === 'fr' ? 'Aller au contenu' : 'Naar de inhoud';
  const el = id => document.getElementById(id);
  const form = el('member-form'), email = el('member-email'), password = el('member-password');
  let returnTo = member.cleanReturn(query.get('return'));
  let mode = query.get('mode') === 'signup' ? 'signup' : 'login';
  let generation = 0;
  const message = value => { el('message').textContent=value; };
  function action(text, callback, href) {
    const item=document.createElement(href ? 'a' : 'button');
    item.textContent=text;
    if(href) item.href=href;
    else { item.type='button'; item.className='link-button'; item.addEventListener('click', callback); }
    el('account-actions').append(item);
  }
  function paint(nextMode) {
    mode=nextMode;
    generation++;
    form.hidden=false;
    el('account-actions').replaceChildren();
    message('');
    el('account-title').textContent=t[mode];
    el('intro').textContent=t[mode + 'Intro'];
    email.hidden=el('email-label').hidden=mode==='reset';
    email.disabled=email.hidden;
    el('email-label').textContent=t.email;
    password.hidden=el('password-label').hidden=mode==='recover';
    password.disabled=password.hidden;
    password.value='';
    const newPassword=mode==='signup' || mode==='reset';
    password.autocomplete=newPassword ? 'new-password' : 'current-password';
    password.minLength=newPassword ? 12 : 1;
    el('password-label').textContent=newPassword ? t.newPassword : t.password;
    el('submit').textContent=mode==='recover' ? t.send : t[mode];
    if(mode!=='login') action(t.login,()=>paint('login'));
    if(mode==='login') { action(t.signup,()=>paint('signup')); action(t.recover,()=>paint('recover')); }
  }
  async function showAccount(user) {
    const current=++generation;
    mode='account';
    el('account-title').textContent=t.account;
    el('intro').textContent=t.signed + user.email;
    form.hidden=true;
    el('account-actions').replaceChildren();
    action(returnTo==='/' ? t.journal : t.back,null,returnTo==='/' ? '/insights.html?lang='+lang : returnTo);
    action(t.logout, async () => { try { await member.logout(); } finally { paint('login'); } });
    try { if(await member.getAdminSession() && current===generation) action(t.studio,null,'/admin'); } catch { /* Membership works independently from administration. */ }
  }
  document.title=t.account+' · Grow Faster';
  for(const link of document.querySelectorAll('[data-lang]')) {
    const url=new URL(location.pathname,location.origin);
    url.searchParams.set('lang',link.dataset.lang);
    url.searchParams.set('return',returnTo);
    link.href=url.pathname+url.search;
    if(link.dataset.lang===lang) link.setAttribute('aria-current','true');
  }
  if(!member.available) { message(t.unavailable); return; }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const submit=el('submit');
    submit.disabled=true;
    message('');
    try {
      if(mode==='login') {
        await member.login(email.value.trim(),password.value);
        if(returnTo!=='/') location.replace(returnTo);
        else await showAccount(await member.ready());
      } else if(mode==='reset') {
        await member.resetPassword(password.value);
        paint('login'); message(t.changed);
      } else {
        const flow=mode;
        const signedIn=await member.emailFlow(flow,email.value.trim(),password.value,returnTo,lang);
        if(signedIn) { if(returnTo!=='/') location.replace(returnTo); else await showAccount(await member.ready()); }
        else { paint('login'); message(flow==='signup' ? t.confirm : t.sent); }
      }
    } catch { message(mode==='login' ? t.invalid : t.error); }
    finally { password.value=''; submit.disabled=false; }
  });
  try {
    const flow=await member.callback();
    if(flow) returnTo=flow.returnTo;
    if(flow?.mode==='recover') { paint('reset'); return; }
    const user=await member.ready();
    if(flow && user && returnTo!=='/') { location.replace(returnTo); return; }
    if(user) await showAccount(user); else paint(mode);
  } catch { paint('login'); message(t.badLink); }
  window.addEventListener('gf-member-change',async()=>{ if(mode==='account' && !await member.ready()) paint('login'); });
})();
