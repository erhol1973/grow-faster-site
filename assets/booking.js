/* Appointment planner for afspraak.html. Talks only to the Grow Faster booking function (no third-party content). */
(function () {
  'use strict';
  var host = location.hostname;
  var PROD = 'https://dbooobckaqbkrmkpcuem.supabase.co/functions/v1/booking';
  var TEST = 'https://gqsvoioccvklzfmdmexy.supabase.co/functions/v1/booking';
  var ENDPOINT = window.GF_BOOKING_ENDPOINT || (host === 'grow-faster.be' || host === 'www.grow-faster.be' ? PROD : TEST);
  
  var T = {
    nl: {
      loading: 'De vrije momenten worden geladen.', none: 'Er zijn de komende weken geen vrije momenten. Mail ons gerust op info@grow-faster.be.',
      failed: 'De agenda kan nu niet geladen worden. Probeer het later opnieuw of mail ons op info@grow-faster.be.',
      pickDay: 'Kies een dag, daarna een uur.', at: 'om', pickFirst: 'Kies eerst een dag en een uur.',
      fields: 'Vul de gemarkeerde velden in.', taken: 'Dat uur is intussen geboekt. Kies een ander uur.',
      rate: 'Er zijn te veel aanvragen verstuurd. Probeer het binnen een uur opnieuw of mail ons.',
      error: 'Het boeken is niet gelukt. Probeer het opnieuw of mail ons op info@grow-faster.be.', sending: 'Bezig met boeken…',
      done: 'U hebt een gesprek op {d} om {t}. Onderwerp: {o}.',
      free1: '1 uur vrij', freeN: '{n} uren vrij', back: 'Vorige dagen', next: 'Volgende dagen', noAm: 'Geen vrij uur in de voormiddag.', noPm: 'Geen vrij uur in de namiddag.',
    },
    fr: {
      loading: 'Chargement des créneaux disponibles.', none: 'Aucun créneau n’est disponible dans les prochaines semaines. Écrivez-nous à info@grow-faster.be.',
      failed: 'L’agenda ne peut pas être chargé pour le moment. Réessayez plus tard ou écrivez-nous à info@grow-faster.be.',
      pickDay: 'Choisissez un jour, puis une heure.', at: 'à', pickFirst: 'Choisissez d’abord un jour et une heure.',
      fields: 'Complétez les champs signalés.', taken: 'Cette heure vient d’être réservée. Choisissez une autre heure.',
      rate: 'Trop de demandes ont été envoyées. Réessayez dans une heure ou écrivez-nous.',
      error: 'La réservation n’a pas abouti. Réessayez ou écrivez-nous à info@grow-faster.be.', sending: 'Réservation en cours…',
      done: 'Votre entretien est prévu le {d} à {t}. Sujet : {o}.',
      free1: '1 heure libre', freeN: '{n} heures libres', back: 'Jours précédents', next: 'Jours suivants', noAm: 'Pas de créneau libre le matin.', noPm: 'Pas de créneau libre l’après-midi.',
    },
  };
  var $ = function (id) { return document.getElementById(id); };
  var lang = function () { return document.documentElement.lang === 'fr' ? 'fr' : 'nl'; };
  var t = function (k) { return T[lang()][k]; };
  var slots = [], day = null, chosen = null, opened = Date.now(), state = 'loading';

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
  function endTime(time) { return String(Number(time.slice(0, 2)) + 1).padStart(2, '0') + ':00'; }
  function render() {
    status(state === 'loading' ? t('loading') : state === 'failed' ? t('failed') : !slots.length ? t('none') : day ? '' : t('pickDay'));
    var days = [], count = {};
    slots.forEach(function (s) { if (!count[s.date]) { count[s.date] = 0; days.push(s.date); } count[s.date]++; });
    $('dagen').hidden = !days.length;
    var box = $('dag-knoppen'), keep = box.scrollLeft; box.replaceChildren();
    days.forEach(function (d) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'dag-kaart'; b.dataset.date = d;
      b.setAttribute('aria-pressed', String(d === day));
      var top = document.createElement('span'); top.className = 'dk-boven';
      top.textContent = dayLabel(d, { weekday: 'long' });
      var nr = document.createElement('span'); nr.className = 'dk-nr'; nr.textContent = dayLabel(d, { day: 'numeric' });
      var mon = document.createElement('small'); mon.textContent = dayLabel(d, { month: 'short' }).replace('.', ''); nr.append(mon);
      var free = document.createElement('span'); free.className = 'dk-vrij'; free.textContent = count[d] === 1 ? t('free1') : t('freeN').replace('{n}', count[d]);
      b.setAttribute('aria-label', longDay(d) + ', ' + free.textContent);
      b.append(top, nr, free);
      b.addEventListener('click', function () { day = d; chosen = null; render(); var f = document.querySelector('#uren .uurknop'); if (f) f.focus({ preventScroll: true }); });
      box.append(b);
    });
    box.scrollLeft = keep; arrows();
    var hours = slots.filter(function (s) { return s.date === day; });
    $('uren').hidden = !day || !hours.length;
    var am = $('uren-vm'), pm = $('uren-nm'); am.replaceChildren(); pm.replaceChildren();
    hours.forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'uurknop'; b.textContent = s.time; b.dataset.start = s.start;
      b.setAttribute('aria-pressed', String(!!chosen && chosen.start === s.start));
      b.addEventListener('click', function () { chosen = s; render(); });
      (Number(s.time.slice(0, 2)) < 12 ? am : pm).append(b);
    });
    [[am, 'noAm'], [pm, 'noPm']].forEach(function (x) { if (!x[0].children.length) { var p = document.createElement('p'); p.className = 'leeg'; p.textContent = t(x[1]); x[0].append(p); } });
    var bar = $('keuze-balk'); bar.hidden = !chosen;
    if (chosen) $('keuze-tekst').textContent = dayLabel(chosen.date, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '') + ' · ' + chosen.time + ' - ' + endTime(chosen.time);
    $('dagen-terug').setAttribute('aria-label', t('back')); $('dagen-verder').setAttribute('aria-label', t('next'));
    showMoment();
  }
  function arrows() {
    var box = $('dag-knoppen');
    $('dagen-terug').disabled = box.scrollLeft <= 2;
    $('dagen-verder').disabled = box.scrollLeft + box.clientWidth >= box.scrollWidth - 2;
  }
  function step(dir) { var box = $('dag-knoppen'); box.scrollBy({ left: dir * Math.max(240, box.clientWidth * 0.8), behavior: 'smooth' }); }
  $('dagen-terug').addEventListener('click', function () { step(-1); });
  $('dagen-verder').addEventListener('click', function () { step(1); });
  $('dag-knoppen').addEventListener('scroll', arrows, { passive: true });
  $('keuze-verder').addEventListener('click', function () { $('gegevens').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('f-naam').focus({ preventScroll: true }); });
  function showMoment() {
    var box = $('gekozen-moment'); if (!box) return;
    box.hidden = !chosen;
    if (chosen) $('moment-tekst').textContent = longDay(chosen.date) + ' ' + t('at') + ' ' + chosen.time + ' · ' + topicLabel();
  }

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
    if (!chosen) { message(t('pickFirst')); var d = $('dag-knoppen').querySelector('button'); if (d) d.focus({ preventScroll: true }); $('tijdstip').scrollIntoView({ behavior: 'smooth' }); return; }
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
          form.hidden = true; $('gekozen-moment').hidden = true; $('keuze-balk').hidden = true; $('tijdstip').hidden = true; $('onderwerp').hidden = true;
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
