(() => {
  'use strict';

  if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
  const words = {
    nl: {
      journal: ['Lees de volledige editie', 'Als lid lees je alle vijftien pagina’s, met analyses, bestuursvragen en de bronnen bij elk cijfer.'],
      radar: ['Bekijk de volledige Executive Radar', 'Als lid krijg je alle signalen voor Belgische directies. Vergelijk de thema’s en bekijk de bronnen achter elk signaal.'],
      devices: 'Lees op je computer, tablet of smartphone.',
      join: 'Gratis lid worden', login: 'Ik ben al lid', close: 'Sluiten'
    },
    fr: {
      journal: ['Lire le numéro complet', 'En tant que membre, vous avez accès aux quinze pages, aux analyses, aux questions pour le conseil et aux sources de chaque chiffre.'],
      radar: ['Consulter le Radar exécutif complet', 'En tant que membre, vous accédez à tous les signaux destinés aux directions belges. Comparez les thèmes et consultez les sources de chaque signal.'],
      devices: 'À lire sur ordinateur, tablette ou smartphone.',
      join: 'Devenir membre gratuitement', login: 'Je suis déjà membre', close: 'Fermer'
    }
  };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('a[data-member-invitation]');
    if (!trigger || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const lang = document.documentElement.lang.startsWith('fr') ? 'fr' : 'nl';
    const t = words[lang];
    const message = t[trigger.dataset.memberInvitation];
    if (!message || document.querySelector('.member-invitation[open]')) return;
    const requested = trigger.dataset.memberTarget;
    const fragment = /^#p(?:[1-9]|1[0-5])$/.test(requested || '') ? requested : location.hash;
    if (requested && document.getElementById(fragment.slice(1))) {
      event.preventDefault();
      location.hash = fragment;
      return;
    }
    const returnTo = location.pathname + location.search + fragment;
    const account = new URL('/account', location.origin);
    account.searchParams.set('lang', lang);
    account.searchParams.set('return', returnTo);
    const dialog = element('dialog', 'member-invitation');
    dialog.setAttribute('aria-labelledby', 'member-invitation-title');
    dialog.setAttribute('aria-describedby', 'member-invitation-description');
    const close = element('button', 'invitation-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', t.close);
    const art = element('img', 'invitation-art');
    art.src = '/img/member-reading-devices.webp';
    art.width = 1200;
    art.height = 750;
    art.alt = '';
    const content = element('div', 'invitation-copy');
    const title = element('h2', '', message[0]);
    title.id = 'member-invitation-title';
    title.tabIndex = -1;
    const description = element('p', '', message[1]);
    description.id = 'member-invitation-description';
    const actions = element('div', 'invitation-actions');
    const join = element('a', 'invitation-primary', t.join);
    const login = element('a', 'invitation-secondary', t.login);
    login.href = account.href;
    account.searchParams.set('mode', 'signup');
    join.href = account.href;
    actions.append(join, login);
    const devices = element('p', 'invitation-devices', t.devices);
    content.append(title, description, devices, actions);
    dialog.append(close, art, content);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (trigger.isConnected) trigger.focus({preventScroll:true});
    }, {once:true});
    dialog.addEventListener('keydown', key => {
      // The underlying flipbook also handles directional keys.
      key.stopPropagation();
      if (key.key !== 'Tab') return;
      if (key.shiftKey && (document.activeElement === close || document.activeElement === title)) {
        key.preventDefault();
        login.focus();
      } else if (!key.shiftKey && document.activeElement === login) {
        key.preventDefault();
        close.focus();
      }
    });
    document.body.append(dialog);
    try { dialog.showModal(); }
    catch { dialog.remove(); return; }
    event.preventDefault();
    title.focus({preventScroll:true});
  });
})();