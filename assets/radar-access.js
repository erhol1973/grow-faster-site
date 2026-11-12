'use strict';
(async function () {
  const fr = new URL(location.href).searchParams.get('lang') === 'fr';
  document.documentElement.lang = fr ? 'fr-BE' : 'nl-BE';
  document.querySelectorAll('article[data-language]').forEach(el => {
    el.hidden = el.dataset.language !== (fr ? 'fr' : 'nl');
  });
  const auth = window.GFMember;
  if (!auth) return;
  document.querySelectorAll('[data-member-link]').forEach(a => { a.href = auth.accountUrl(); });
  let showingEdition = false;
  let generation = 0;
  function clearEdition() {
    generation++;
    if (showingEdition) {
      document.body.replaceChildren();
      window.BAEIS_DEV_DATA = undefined;
      window.BAEIS_MEMBER_COPY = undefined;
      location.reload();
    }
  }
  window.addEventListener('pageshow', event => { if (event.persisted) clearEdition(); });
  window.addEventListener('gf-member-change', async () => {
    if (!(await auth.ready())) clearEdition();
  });
  try {
    if (!(await auth.ready())) return;
    const requestGeneration = generation;
    const response = await auth.request('/storage/v1/object/authenticated/member-content/radar/current.json');
    if (!response.ok) throw new Error('Access unavailable');
    const edition = await response.json();
    if (typeof edition.body !== 'string' || !Array.isArray(edition.data?.records) || !edition.copy?.nl || !edition.copy?.fr) throw new Error('Invalid edition');
    if (!edition.data.records.length || edition.data.records.some(record => !window.BAEIS_DEV_CORE.sourceIsApproved(record.url) || window.BAEIS_DEV_CORE.checkRecord(record).length)) throw new Error('Invalid records');
    // Only the audited release template may contribute markup. Records and translations
    // are rendered by the existing app using textContent.
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(edition.body)));
    const sha = Array.from(digest, byte => byte.toString(16).padStart(2,'0')).join('');
    if (sha !== document.querySelector('meta[name="radar-template"]').content) throw new Error('Template mismatch');
    if (!(await auth.ready()) || generation !== requestGeneration) return;
    const template = document.createElement('template');
    template.innerHTML = edition.body;
    window.BAEIS_DEV_DATA = edition.data;
    window.BAEIS_MEMBER_COPY = edition.copy;
    showingEdition = true;
    document.body.replaceChildren(template.content);
    const app = document.createElement('script');
    app.src = '/assets/baies-dev-app.js';
    document.body.append(app);
  } catch {
    const status = document.getElementById('radar-status');
    if (status) status.textContent = fr ? 'L’édition complète est momentanément indisponible.' : 'De volledige ledeneditie is momenteel niet beschikbaar.';
  }
})();