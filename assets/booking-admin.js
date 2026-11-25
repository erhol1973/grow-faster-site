/* Booking administration: list appointments, cancel, block and unblock periods. Same administrator allowlist as the CMS. */
(function () {
  'use strict';
  var live = location.hostname === 'grow-faster.be' || location.hostname === 'www.grow-faster.be';
  var config = window.GF_SUPABASE_PROJECTS[live ? 'prod' : 'test'];
  var client = window.GFCms.createClient(config);
  var $ = function (id) { return document.getElementById(id); };
  if (!live) $('omgeving').textContent = 'Afspraken · TEST';
  var TOPIC = { algemeen: 'Algemene vraag', vragenlijsten: 'Vragenlijsten met AI', workflow: 'Workflow-automatisering', organisatie: 'Organisatieontwikkeling', training: 'Training' };
  var fmt = new Intl.DateTimeFormat('nl-BE', { timeZone: 'Europe/Brussels', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  var show = function (d) { return fmt.format(new Date(d)); };
  function notify(text) { $('notice').textContent = text; }
  function run(task) { return task().catch(function (e) { notify(e.message || 'Er ging iets mis.'); }); }
  function rpc(name, body) { return client.request('/rest/v1/rpc/' + name, { method: 'POST', body: body || {}, auth: true }); }

  // Brussels wall-clock date and time to an ISO instant, independent of this device's time zone.
  function brussels(date, time) {
    var p = date.split('-').map(Number), h = time.split(':').map(Number);
    var wanted = Date.UTC(p[0], p[1] - 1, p[2], h[0], h[1]), guess = wanted;
    var f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    for (var i = 0; i < 2; i++) {
      var o = {}; f.formatToParts(new Date(guess)).forEach(function (x) { o[x.type] = x.value; });
      guess += wanted - Date.UTC(+o.year, o.month - 1, +o.day, +o.hour, +o.minute);
    }
    return new Date(guess).toISOString();
  }

  function item(main, sub, actionLabel, action, cls) {
    var li = document.createElement('li'); if (cls) li.className = cls;
    var div = document.createElement('div'), b = document.createElement('b'); b.textContent = main; div.append(b);
    sub.forEach(function (line) { if (!line) return; var s = document.createElement('small'); s.textContent = line; div.append(s); });
    li.append(div);
    if (action) { var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = actionLabel; btn.addEventListener('click', action); li.append(btn); }
    return li;
  }
  function empty(text) { var li = document.createElement('li'); li.className = 'leeg'; li.textContent = text; return li; }

  function refresh() {
    return rpc('booking_admin_overview').then(function (data) {
      var bl = $('blokken'); bl.replaceChildren();
      (data.blocks || []).forEach(function (b) {
        bl.append(item(show(b.start_at) + ' tot ' + show(b.end_at), [b.note], 'Vrijgeven', function () {
          run(function () { return rpc('booking_admin_unblock', { block_id: b.id }).then(refresh).then(function () { notify('Periode vrijgegeven.'); }); });
        }));
      });
      if (!bl.children.length) bl.append(empty('Geen geblokkeerde periodes.'));
      var al = $('afspraken'); al.replaceChildren();
      (data.appointments || []).forEach(function (a) {
        var cancelled = a.status === 'cancelled', past = new Date(a.start_at) < new Date();
        al.append(item(show(a.start_at) + ' · ' + (TOPIC[a.topic] || a.topic) + (cancelled ? ' · geannuleerd' : ''), [
          a.full_name + ', ' + a.job_title + ' bij ' + a.organisation,
          a.email + ' · ' + a.phone + ' · ' + String(a.lang).toUpperCase(),
          a.note ? 'Vraag: ' + a.note : '',
          a.mailed ? '' : 'Let op: de bevestigingsmail is niet verstuurd.',
        ], 'Annuleren', cancelled || past ? null : function () {
          if (!confirmCancel(a)) return;
          run(function () { return rpc('booking_admin_cancel', { appointment_id: a.id }).then(refresh).then(function () { notify('Afspraak geannuleerd. Het uur is weer vrij. Laat de klant het zelf weten.'); }); });
        }, cancelled ? 'geannuleerd' : ''));
      });
      if (!al.children.length) al.append(empty('Nog geen afspraken.'));
    });
  }
  // Confirmation inline (no browser dialogs): first click arms the button, second click cancels.
  var armed = null;
  function confirmCancel(a) { if (armed === a.id) { armed = null; return true; } armed = a.id; notify('Klik nog eens op Annuleren om de afspraak van ' + a.full_name + ' te annuleren.'); return false; }

  $('login').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    run(function () {
      return client.login(f.elements.email.value, f.elements.password.value)
        .finally(function () { f.elements.password.value = ''; })
        .then(function () { $('login-panel').hidden = true; $('workspace').hidden = false; $('logout').hidden = false; return refresh(); })
        .then(function () { notify('Aangemeld.'); });
    });
  });
  $('logout').addEventListener('click', function () { run(function () { return client.logout().then(function () { location.reload(); }); }); });
  $('blok-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, s = brussels(f.elements.van_datum.value, f.elements.van_uur.value), t = brussels(f.elements.tot_datum.value, f.elements.tot_uur.value);
    if (new Date(t) <= new Date(s)) { notify('Het einde moet na het begin liggen.'); return; }
    run(function () { return rpc('booking_admin_block', { range_start: s, range_end: t, note: f.elements.notitie.value }).then(function () { f.elements.notitie.value = ''; return refresh(); }).then(function () { notify('Periode geblokkeerd.'); }); });
  });
  var today = new Date().toISOString().slice(0, 10);
  $('blok-form').elements.van_datum.value = today; $('blok-form').elements.tot_datum.value = today;
})();
