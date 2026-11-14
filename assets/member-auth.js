/* In-tab membership with server-side verification of identity and CMS privileges. */
(() => {
  'use strict';
  const config = window.GF_CMS_CONFIG || {};
  const production = 'https://dbooobckaqbkrmkpcuem.supabase.co';
  const isolated = 'https://gqsvoioccvklzfmdmexy.supabase.co';
  const available = (config.url === isolated || (config.url === production && ['https://grow-faster.be','https://www.grow-faster.be'].includes(location.origin))) &&
    typeof config.key === 'string' && config.key.startsWith('sb_publishable_');
  const key = 'gf.member.v1.' + config.url;
  const flowKey = key + '.email-flow';
  let identity;
  let timer;
  function clear() {
    clearTimeout(timer);
    identity = null;
    sessionStorage.removeItem(key);
    window.dispatchEvent(new Event('gf-member-change'));
  }
  function read() {
    if (!available) return null;
    let session;
    try { session = JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
    if (!session) return null;
    if (!Number.isFinite(session.end) || session.end <= Date.now() || typeof session.token !== 'string') { clear(); return null; }
    return session;
  }
  function watch(session) {
    clearTimeout(timer);
    timer = setTimeout(clear, Math.max(0, session.end - Date.now()));
  }
  async function api(path, options = {}, token) {
    if (!available) throw Error('environment');
    const headers = new Headers(options.headers);
    headers.set('apikey', config.key);
    if (token) headers.set('Authorization', 'Bearer ' + token);
    return fetch(config.url + path, { ...options, headers, cache:'no-store', credentials:'omit', redirect:'error', signal:AbortSignal.timeout(15000) });
  }
  function json(method, body) {
    return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  }
  function cleanReturn(raw) {
    if (!raw || !raw.startsWith('/') || raw.startsWith('//') || /[\\\x00-\x20]/.test(raw)) return '/';
    const target = new URL(raw, location.origin);
    if (target.origin !== location.origin || target.pathname.startsWith('//') || /^\/(?:account|admin)(?:\.html)?(?:\/|$)/i.test(target.pathname)) return '/';
    return target.pathname + target.search + target.hash;
  }
  function accountUrl(returnTo = location.pathname + location.search + location.hash) {
    const url = new URL('/account', location.origin);
    url.searchParams.set('return', cleanReturn(returnTo));
    url.searchParams.set('lang', document.documentElement.lang.startsWith('fr') ? 'fr' : 'nl');
    return url.pathname + url.search;
  }
  async function verify(session) {
    const response = await api('/auth/v1/user', {}, session.token);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) clear();
      throw Error('session');
    }
    const user = await response.json();
    if (!user.id || user.is_anonymous === true || !user.email_confirmed_at) { clear(); throw Error('session'); }
    const access = await api('/rest/v1/rpc/member_has_access', json('POST',{}), session.token);
    if (!access.ok || await access.json() !== true) { throw Error('access'); }
    return { id:user.id, email:user.email };
  }
  async function ready() {
    const session = read();
    if (!session) return null;
    watch(session);
    if (!identity) identity = verify(session).catch(() => { identity = null; return null; });
    return identity;
  }
  async function adopt(data) {
    if (!data.access_token || !Number.isFinite(Number(data.expires_in)) || Number(data.expires_in) <= 0) throw Error('session');
    const session = { token:data.access_token, end:Date.now() + Math.min(Number(data.expires_in), 3600)*1000 };
    const user = await verify(session);
    sessionStorage.setItem(key, JSON.stringify(session));
    identity = Promise.resolve(user);
    watch(session);
    window.dispatchEvent(new Event('gf-member-change'));
  }
  async function login(email, password) {
    const response = await api('/auth/v1/token?grant_type=password', json('POST',{email,password}));
    if (!response.ok) throw Error('login');
    await adopt(await response.json());
  }
  async function emailFlow(mode, email, password, returnTo, language) {
    if (!['signup','recover'].includes(mode)) throw Error('form');
    const nonce = crypto.randomUUID();
    const callback = new URL('/account', location.origin);
    callback.searchParams.set('state',nonce);
    callback.searchParams.set('lang',language === 'fr' ? 'fr' : 'nl');
    localStorage.setItem(flowKey, JSON.stringify({nonce,mode,returnTo:cleanReturn(returnTo),end:Date.now()+3600000}));
    const response = await api('/auth/v1/' + mode + '?redirect_to=' + encodeURIComponent(callback.href),
      json('POST', mode === 'signup' ? {email,password} : {email}));
    if (!response.ok) throw Error('email');
    if (mode === 'signup') {
      const data = await response.json();
      if (data.access_token) { await adopt(data); localStorage.removeItem(flowKey); return true; }
    }
    return false;
  }
  async function callback() {
    const params = new URLSearchParams(location.search);
    const fragment = new URLSearchParams(location.hash.slice(1));
    if (!fragment.has('access_token') && !fragment.has('error') && !fragment.has('error_description')) return null;
    const state = params.get('state');
    params.delete('state');
    history.replaceState(null, '', location.pathname + '?' + params);
    const flow = JSON.parse(localStorage.getItem(flowKey) || 'null');
    if (!flow || !state || flow.nonce !== state || flow.end < Date.now()) throw Error('link');
    localStorage.removeItem(flowKey);
    const type = fragment.get('type');
    if (!fragment.has('access_token') || type !== (flow.mode === 'recover' ? 'recovery' : 'signup')) throw Error('link');
    await adopt({ access_token:fragment.get('access_token'), expires_in:fragment.get('expires_in') });
    return {mode:flow.mode,returnTo:cleanReturn(flow.returnTo)};
  }
  async function request(path, options) {
    if (typeof path !== 'string' || !/^\/(?:storage\/v1\/|rest\/v1\/)/.test(path)) throw Error('route');
    const session = read();
    if (!session) throw Error('session');
    const response = await api(path, options, session.token);
    if (response.status === 401) clear();
    return response;
  }
  async function getAdminSession() {
    if (!await ready()) return null;
    const response = await request('/rest/v1/rpc/cms_is_admin', json('POST',{}));
    if (!response.ok || await response.json() !== true) return null;
    const session = read();
    return session ? {token:session.token,expiresIn:Math.floor((session.end-Date.now())/1000)} : null;
  }
  async function logout() {
    const session = read();
    clear();
    if (session) await api('/auth/v1/logout?scope=local', {method:'POST'}, session.token);
  }
  async function resetPassword(password) {
    const session=read();
    if (!session || password.length < 12) throw Error('password');
    const response=await api('/auth/v1/user',json('PUT',{password}),session.token);
    if (!response.ok) throw Error('password');
    await logout();
  }
  window.GFMember=Object.freeze({available,ready,login,emailFlow,callback,resetPassword,logout,request,getAdminSession,accountUrl,cleanReturn});
})();
