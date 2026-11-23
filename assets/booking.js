/* Appointment planner for afspraak.html. Talks only to the Grow Faster booking function (no third-party content). */
(function () {
  'use strict';
  var host = location.hostname;
  var PROD = 'https://dbooobckaqbkrmkpcuem.supabase.co/functions/v1/booking';
  var TEST = 'https://gqsvoioccvklzfmdmexy.supabase.co/functions/v1/booking';
  var ENDPOINT = window.GF_BOOKING_ENDPOINT || (host === 'grow-faster.be' || host === 'www.grow-faster.be' ? PROD : TEST);
  var TZ = 'Europe/Brussels', FIRST_DAYS = 10;
  var T = {
    nl: {
      loading: 'De vrije momenten worden geladen.', none: 'Er zijn de komende weken geen vrije momenten. Mail ons gerust op info@grow-faster.be.',
      failed: 'De agenda kan nu niet geladen worden. Probeer het later opnieuw of mail ons op info@grow-faster.be.',
      pickDay: 'Kies een dag, daarna een uur.', at: 'om', pickFirst: 'Kies eerst een dag en een uur.',
      fields: 'Vul de gemarkeerde velden in.', taken: 'Dat uur is intussen geboekt. Kies een ander uur.',
      rate: 'Er zijn te veel aanvragen verstuurd. Probeer het binnen een uur opnieuw of mail ons.',
      error: 'Het boeken is niet gelukt. Probeer het opnieuw of mail ons op info@grow-faster.be.', sending: 'Bezig met boeken…',
      done: 'U hebt een gesprek op {d} om {t}. Onderwerp: {o}.',
    },
    fr: {
      loading: 'Chargement des créneaux disponibles.', none: 'Aucun créneau n’est disponible dans les prochaines semaines. Écrivez-nous à info@grow-faster.be.',
      failed: 'L’agenda ne peut pas être chargé pour le moment. Réessayez plus tard ou écrivez-nous à info@grow-faster.be.',
      pickDay: 'Choisissez un jour, puis une heure.', at: 'à', pickFirst: 'Choisissez d’abord un jour et une heure.',
      fields: 'Complétez les champs signalés.', taken: 'Cette heure vient d’être réservée. Choisissez une autre heure.',
      rate: 'Trop de demandes ont été envoyées. Réessayez dans une heure ou écrivez-nous.',
      error: 'La réservation n’a pas abouti. Réessayez ou écrivez-nous à info@grow-faster.be.', sending: 'Réservation en cours…',
      done: 'Votre entretien est prévu le {d} à {t}. Sujet : {o}.',
    },
  };
  var $ = function (id) { return document.getElementById(id); };
  var lang = function () { return document.documentElement.lang === 'fr' ? 'fr' : 'nl'; };
  var t = function (k) { return T[lang()][k]; };
  var slots = [], day = null, chosen = null, shownDays = FIRST_DAYS, opened = Date.now(), state = 'loading';

  // Step 1: topic, preselected from ?onderwerp=
  var radios = document.querySelectorAll('input[data-topic]'), echo = $('gekozen-onderwerp');
  var q = new URLSearchParams(location.search).get('onderwerp');
  radios.forEach(function (r) { if (q && r.value === q) r.checked = true; r.addEventListener('change', showTopic); });
  function topic() { var c = document.querySelector('input[data-topic]:checked'); return c ? c : radios[0]; }
  function topicLabel() { return topic().nextElementSibling.textContent.trim(); }
  function showTopic() { if (echo) echo.textContent = topicLabel(); showMoment(); }

  function dayLabel(date, style) {
    return new Intl.DateTimeFormat(lang() === 'fr' ? 'fr-BE' : 'nl-BE', Object.assign({ timeZone: 'UTC' }, style)).format(new Date(date + 'T12:00:00Z'));
  }
  function longDay(date) { return dayLabel(date, { weekday: 'long', day: 'numeric', month: 'long' }); }

  function status(text) { var s = $('planner-status'); s.textContent = text || ''; s.hidden = !text; }
  function render() {
    status(state === 'loading' ? t('loading') : state === 'failed' ? t('failed') : !slots.length ? t('none') : day ? '' : t('pickDay'));
    var days = [], seen = {};
    slots.forEach(function (s) { if (!seen[s.date]) { seen[s.date] = 1; days.push(s.date); } });
    $('dagen').hidden = !days.length;
    var box = $('dag-knoppen'); box.replaceChildren();
    days.slice(0, shownDays).forEach(function (d) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'dag-knop'; b.dataset.date = d;
      b.setAttribute('aria-pressed', String(d === day));
      b.append(dayLabel(d, { weekday: 'long' }));
      var sm = document.createElement('small'); sm.textContent = dayLabel(d, { day: 'numeric', month: 'long' }); b.append(sm);
      b.addEventListener('click', function () { day = d; chosen = null; render(); var f = $('uur-knoppen').querySelector('button'); if (f) f.focus(); });
      box.append(b);
    });
    $('meer-dagen').hidden = days.length <= shownDays;
    var hours = slots.filter(function (s) { return s.date === day; });
    $('uren').hidden = !hours.length;
    var ub = $('uur-knoppen'); ub.replaceChildren();
    hours.forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = s.time; b.dataset.start = s.start;
      b.setAttribute('aria-pressed', String(chosen && chosen.start === s.start));
      b.addEventListener('click', function () { chosen = s; render(); $('f-naam').focus({ preventScroll: true }); $('gegevens').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      ub.append(b);
    });
    showMoment();
  }
  function showMoment() {
    var box = $('gekozen-moment'); if (!box) return;
    box.hidden = !chosen;
    if (chosen) $('moment-tekst').textContent = longDay(chosen.date) + ' ' + t('at') + ' ' + chosen.time + ' · ' + topicLabel();
  }
  $('meer-dagen').addEventListener('click', function () { shownDays += 10; render(); });

  function load() {
    state = 'loading'; render();
    return fetch(ENDPOINT, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
      .then(function (r) { if (!r.ok) throw Error(r.status); return r.json(); })
      .then(function (data) {
        slots = Array.isArray(data.slots) ? data.slots : []; state = 'ready';
        if (day && !slots.some(function (s) { return s.date === day; })) day = null;
        if (chosen && !slots.some(function (s) { return s.start === chosen.start; })) chosen = null;
        render();
      })
      .catch(function () { state = 'failed'; render(); });
  }

  function message(text) { var m = $('boek-melding'); m.textContent = text || ''; m.hidden = !text; }
  var form = $('boek-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault(); message('');
    var bad = [];
    ['f-naam', 'f-mail', 'f-tel', 'f-org', 'f-functie'].forEach(function (id) {
      var el = $(id), ok = el.checkValidity() && el.value.trim().length > 0;
      if (id === 'f-tel') ok = ok && (el.value.match(/\d/g) || []).length >= 6;
      el.setAttribute('aria-invalid', String(!ok)); if (!ok) bad.push(el);
    });
    if (!chosen) { message(t('pickFirst')); var d = $('dag-knoppen').querySelector('button'); if (d) d.focus(); return; }
    if (bad.length) { message(t('fields')); bad[0].focus(); return; }
    var data = new FormData(form), btn = $('boek'), label = btn.innerHTML;
    btn.disabled = true; btn.textContent = t('sending');
    var body = { topic: topic().value, start: chosen.start, lang: lang(), elapsed: Date.now() - opened };
    ['name', 'email', 'phone', 'organisation', 'job_title', 'note', 'website'].forEach(function (k) { body[k] = String(data.get(k) || ''); });
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        if (res.status === 200 && res.body.ok) {
          var done = chosen;
          form.hidden = true; $('gekozen-moment').hidden = true; $('tijdstip').hidden = true; $('onderwerp').hidden = true;
          $('bevestigd-tekst').textContent = t('done').replace('{d}', longDay(done.date)).replace('{t}', done.time).replace('{o}', topicLabel());
          $('bevestigd').hidden = false; $('bevestigd').focus();
          return;
        }
        if (res.status === 409) { message(t('taken')); chosen = null; load(); return; }
        if (res.status === 429) { message(t('rate')); return; }
        if (res.status === 400 && res.body.field) {
          var map = { name: 'f-naam', email: 'f-mail', phone: 'f-tel', organisation: 'f-org', job_title: 'f-functie', note: 'f-vraag' };
          var el = $(map[res.body.field]); if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); message(t('fields')); return; }
        }
        message(t('error'));
      })
      .catch(function () { message(t('error')); })
      .finally(function () { btn.disabled = false; btn.innerHTML = label; });
  });

  // Language switch: rebuild dynamic text in the new language.
  document.addEventListener('gf:language', function () { setTimeout(function () { showTopic(); render(); }, 0); });
  showTopic(); load();
})();
