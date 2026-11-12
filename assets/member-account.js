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
  const registration = {
    nl: {title:'Maak je gratis account aan', next:'Volgende', passwordTitle:'Kies je wachtwoord',
      passwordIntro:'Gebruik minstens 12 tekens voor je Grow Faster-account.', register:'Account aanmaken',
      edit:'E-mailadres wijzigen', existing:'Heb je al een account?', create:'Nog geen account?',
      legal:'Lees de', terms:'gebruiksvoorwaarden', join:'en het', privacy:'privacybeleid'},
    fr: {title:'Créez votre compte gratuit', next:'Continuer', passwordTitle:'Choisissez votre mot de passe',
      passwordIntro:'Utilisez au moins 12 caractères pour votre compte Grow Faster.', register:'Créer mon compte',
      edit:'Modifier l’adresse e-mail', existing:'Vous avez déjà un compte ?', create:'Pas encore de compte ?',
      legal:'Consultez les', terms:'conditions d’utilisation', join:'et la', privacy:'politique de confidentialité'}
  }[lang];
  const t = texts[lang];
  document.querySelector('.skip-link').textContent = lang === 'fr' ? 'Aller au contenu' : 'Naar de inhoud';
  const el = id => document.getElementById(id);
  const form = el('member-form'), email = el('member-email'), password = el('member-password');
  let returnTo = member.cleanReturn(query.get('return'));
  let mode = query.get('mode') === 'signup' ? 'signup' : 'login';
  let generation = 0;
  let signupPassword = false;
  const message = value => { el('message').textContent=value; };
  function action(text, callback, href) {
    const item=document.createElement(href ? 'a' : 'button');
    item.textContent=text;
    if(href) item.href=href;
    else { item.type='button'; item.className='text-action'; item.addEventListener('click', callback); }
    el('account-actions').append(item);
  }
  function accountLocation(nextLang) {
    const url = new URL('/account', location.origin);
    url.searchParams.set('lang', nextLang);
    if (returnTo !== '/') url.searchParams.set('return', returnTo);
    if (mode === 'signup') url.searchParams.set('mode','signup');
    return url.pathname + url.search;
  }
  function updateLanguageLinks() {
    for (const link of document.querySelectorAll('[data-lang]')) {
      link.href = accountLocation(link.dataset.lang);
      if (link.dataset.lang === lang) link.setAttribute('aria-current','true');
    }
  }
  function switchMode(nextMode) {
    paint(nextMode);
    history.replaceState(null,'',accountLocation(lang));
    el('account-title').focus();
  }
  function paint(nextMode, passwordStep = false) {
    mode = nextMode;
    signupPassword = mode === 'signup' && passwordStep;
    generation++;
    form.hidden = false;
    el('account-actions').replaceChildren();
    message('');
    const signup = mode === 'signup';
    el('account-title').textContent = signup ? (signupPassword ? registration.passwordTitle : registration.title) : t[mode];
    document.title = el('account-title').textContent + ' · Grow Faster';
    el('intro').textContent = signupPassword ? registration.passwordIntro : t[mode + 'Intro'];
    email.disabled = el('email-field').hidden = mode === 'reset' || signupPassword;
    el('email-label').textContent = t.email;
    el('email-review').hidden = !signupPassword;
    el('chosen-email').textContent = signupPassword ? email.value.trim() : '';
    el('edit-email').textContent = registration.edit;
    password.disabled = el('password-field').hidden = mode === 'recover' || (signup && !signupPassword);
    password.value = '';
    const newPassword = signup || mode === 'reset';
    password.autocomplete = newPassword ? 'new-password' : 'current-password';
    password.minLength = newPassword ? 12 : 1;
    el('password-label').textContent = signup ? t.password : newPassword ? t.newPassword : t.password;
    el('submit').textContent = signup ? (signupPassword ? registration.register : registration.next) : mode === 'recover' ? t.send : t[mode];
    el('legal').hidden = !signup;
    if (signup || mode === 'login') {
      const prompt = document.createElement('span');
      prompt.textContent = signup ? registration.existing : registration.create;
      el('account-actions').append(prompt);
    }
    if (mode !== 'login') action(t.login,()=>switchMode('login'));
    if (mode === 'login') {
      action(t.signup,()=>switchMode('signup'));
      action(t.recover,()=>switchMode('recover'));
    }
    updateLanguageLinks();
  }
  el('edit-email').addEventListener('click',() => {
    paint('signup');
    email.focus();
  });
  el('legal-prefix').textContent = registration.legal;
  el('terms').textContent = registration.terms;
  el('privacy').textContent = registration.privacy;
  el('legal-join').textContent = registration.join;
  el('terms').href = '/terms.html?lang=' + lang;
  el('privacy').href = '/privacy.html?lang=' + lang;
  async function showAccount(user) {
    const current=++generation;
    mode='account';
    el('legal').hidden=true;
    updateLanguageLinks();
    el('account-title').textContent=t.account;
    el('intro').textContent=t.signed + user.email;
    form.hidden=true;
    el('account-actions').replaceChildren();
    action(returnTo==='/' ? t.journal : t.back,null,returnTo==='/' ? '/insights.html?lang='+lang : returnTo);
    action(t.logout, async () => { try { await member.logout(); } finally { paint('login'); } });
    try { if(await member.getAdminSession() && current===generation) action(t.studio,null,'/admin'); } catch { /* Membership works independently from administration. */ }
  }
  document.title=t.account+' · Grow Faster';
  updateLanguageLinks();
  if(!member.available) { message(t.unavailable); return; }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if (mode==='signup' && !signupPassword) {
      email.value = email.value.trim();
      if (!email.reportValidity()) return;
      paint('signup',true);
      password.focus();
      return;
    }
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
        else { switchMode('login'); message(flow==='signup' ? t.confirm : t.sent); }
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
