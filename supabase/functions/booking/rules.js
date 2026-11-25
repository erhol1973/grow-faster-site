// Booking rules shared by the Edge Function and the unit tests.
// Owner decisions (23 Nov 2026): Monday to Friday, first start 09:00, last start 16:00,
// one hour, at least 24 hours ahead, Belgian public holidays closed, times in Europe/Brussels.
export const TZ = 'Europe/Brussels';
export const TOPICS = ['algemeen', 'vragenlijsten', 'workflow', 'organisatie', 'training'];
export const START_HOURS = [9, 10, 11, 12, 13, 14, 15, 16];
export const DURATION_MS = 3600000;
export const NOTICE_MS = 24 * 3600000;
export const HORIZON_DAYS = 56;

const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
function parts(date) {
  const p = Object.fromEntries(fmt.formatToParts(date).map(x => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second };
}
// Local Brussels wall-clock time to a UTC Date (handles summer and winter time).
export function brussels(y, m, d, h, min = 0) {
  const wanted = Date.UTC(y, m - 1, d, h, min);
  let guess = wanted;
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(guess));
    guess += wanted - Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
  }
  return new Date(guess);
}
export function localDate(date) { const p = parts(date); return { y: p.y, m: p.m, d: p.d }; }
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(y, month - 1, day);
}
// The ten legal public holidays in Belgium.
export function holidays(y) {
  const e = easter(y), add = n => new Date(e + n * 86400000).toISOString().slice(0, 10);
  return new Set([iso(y, 1, 1), add(1), iso(y, 5, 1), add(39), add(50), iso(y, 7, 21), iso(y, 8, 15), iso(y, 11, 1), iso(y, 11, 11), iso(y, 12, 25)]);
}

// Free slots between now+24h and the horizon. busy: [{start_at, end_at}] (ISO strings or Dates).
export function freeSlots(now, busy = [], days = HORIZON_DAYS) {
  const taken = busy.map(b => [new Date(b.start_at).getTime(), new Date(b.end_at).getTime()]);
  const first = localDate(now), out = [], earliest = now.getTime() + NOTICE_MS;
  const hol = new Map();
  for (let i = 0; i <= days; i++) {
    const day = new Date(Date.UTC(first.y, first.m - 1, first.d + i));
    const y = day.getUTCFullYear(), m = day.getUTCMonth() + 1, d = day.getUTCDate(), dow = day.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    if (!hol.has(y)) hol.set(y, holidays(y));
    if (hol.get(y).has(iso(y, m, d))) continue;
    for (const h of START_HOURS) {
      const s = brussels(y, m, d, h).getTime(), e = s + DURATION_MS;
      if (s < earliest) continue;
      if (taken.some(([bs, be]) => bs < e && be > s)) continue;
      out.push({ start: new Date(s).toISOString(), date: iso(y, m, d), time: `${String(h).padStart(2, '0')}:00` });
    }
  }
  return out;
}

export function isBookable(startIso, now, busy = []) {
  return freeSlots(now, busy).some(s => s.start === new Date(startIso).toISOString());
}

// Input check for a booking request. Returns {ok, value} or {ok:false, field}.
export function validate(input) {
  const s = v => (typeof v === 'string' ? v.trim() : '');
  const v = {
    topic: s(input.topic), start_at: s(input.start), full_name: s(input.name), email: s(input.email).toLowerCase(),
    phone: s(input.phone), organisation: s(input.organisation), job_title: s(input.job_title), note: s(input.note), lang: input.lang === 'fr' ? 'fr' : 'nl',
  };
  const checks = {
    topic: TOPICS.includes(v.topic),
    start: !Number.isNaN(Date.parse(v.start_at)),
    name: v.full_name.length >= 2 && v.full_name.length <= 120,
    email: v.email.length <= 200 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email),
    phone: /^[+0-9 ()./-]{6,40}$/.test(v.phone) && (v.phone.match(/\d/g) || []).length >= 6,
    organisation: v.organisation.length >= 1 && v.organisation.length <= 160,
    job_title: v.job_title.length >= 1 && v.job_title.length <= 120,
    note: v.note.length <= 2000,
  };
  for (const [field, ok] of Object.entries(checks)) if (!ok) return { ok: false, field };
  return { ok: true, value: v };
}

export const LABELS = {
  nl: { algemeen: 'Algemene vraag', vragenlijsten: 'Vragenlijsten automatisch invullen met AI', workflow: 'Workflow-automatisering', organisatie: 'Organisatieontwikkeling', training: 'Training' },
  fr: { algemeen: 'Question générale', vragenlijsten: 'Remplir automatiquement des questionnaires avec l’IA', workflow: 'Automatisation des workflows', organisatie: 'Développement organisationnel', training: 'Formation' },
};

// Calendar invitation (RFC 5545) so the appointment lands in Outlook, Google, Apple or any other calendar.
export function invitation({ id, start_at, topic, lang, full_name, email }, organizer, owner) {
  const stamp = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = t => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const fold = line => { const out = []; let rest = line; while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); } out.push(rest); return out.join('\r\n'); };
  const label = LABELS[lang][topic];
  const summary = lang === 'fr' ? `Entretien Grow Faster : ${label}` : `Gesprek Grow Faster: ${label}`;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Grow Faster//Afspraken//NL', 'CALSCALE:GREGORIAN', 'METHOD:REQUEST',
    'BEGIN:VEVENT', `UID:${id}@grow-faster.be`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(start_at)}`, `DTEND:${stamp(new Date(start_at).getTime() + DURATION_MS)}`,
    `SUMMARY:${esc(summary)}`, `DESCRIPTION:${esc(label)}`, `ORGANIZER;CN=Grow Faster:mailto:${organizer}`,
    `ATTENDEE;CN=${esc(full_name)};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:${email}`,
    `ATTENDEE;CN=Erlend Hollebosch;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:${owner}`,
    'STATUS:CONFIRMED', 'SEQUENCE:0', 'TRANSP:OPAQUE', 'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function when(start_at, lang) {
  const d = new Date(start_at);
  const date = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-BE' : 'nl-BE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  const p = parts(d), end = parts(new Date(d.getTime() + DURATION_MS)), hh = x => `${String(x.h).padStart(2, '0')}:${String(x.min).padStart(2, '0')}`;
  return { date, time: `${hh(p)} - ${hh(end)}` };
}
