(() => {
  'use strict';
  const member = window.GFMember;
  const list = document.querySelector('#navlist');
  if (!member || !list || list.querySelector('.member-nav')) return;
  const item = document.createElement('li');
  item.className = 'member-nav';
  item.setAttribute('data-notr','');
  const action = list.querySelector(':scope > .nav-action');
  if (action && action === list.lastElementChild) action.before(item);
  else list.append(item);
  let generation = 0;
  function link(label, href) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    return a;
  }
  async function render() {
    const generationAtStart = ++generation;
    const fr = document.documentElement.lang.startsWith('fr');
    item.replaceChildren();
    const href = member.accountUrl();
    const signIn = link(fr ? 'Se connecter' : 'Aanmelden',href);
    signIn.className = 'member-login-link';
    item.append(signIn);
    const user = await member.ready();
    if (!user || generationAtStart !== generation) return;
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = fr ? 'Mon compte' : 'Mijn account';
    const panel = document.createElement('div');
    panel.className = 'member-nav-panel';
    const account = new URL(href,location.origin);
    account.searchParams.delete('return');
    panel.append(link(fr ? 'Gérer mon compte' : 'Account beheren',account.pathname + account.search));
    details.append(summary,panel);
    item.replaceChildren(details);
    let admin;
    try { admin = await member.getAdminSession(); } catch { return; }
    if (admin && generationAtStart === generation) panel.append(link(fr ? 'Ouvrir le Contentstudio' : 'Contentstudio openen','/admin'));
  }
  function close() {
    const details=item.querySelector('details[open]');
    if (details) details.open=false;
  }
  document.addEventListener('click',event=>{ if (!item.contains(event.target)) close(); });
  item.addEventListener('keydown',event=>{ if(event.key==='Escape'){ close(); item.querySelector('summary')?.focus(); } });
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('gf-member-change',render);
  window.addEventListener('pageshow',event=>{ if(event.persisted) render(); });
  render();
})();
