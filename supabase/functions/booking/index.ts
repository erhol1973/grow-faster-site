// Public booking endpoint for afspraak.html.
// GET  -> free one-hour slots (no personal data).
// POST -> stores the appointment and mails client and owner, with a calendar invitation.
// Secret, set by the owner in the Supabase dashboard and never in the repository: SMTP_PASS (mailbox info@).
// Optional overrides: SMTP_HOST (v031.belgianhosting.be), SMTP_PORT (465), SMTP_USER and MAIL_FROM (info@grow-faster.be),
// OWNER_EMAIL (erlend@grow-faster.be), IP_SALT (random text).
import nodemailer from 'npm:nodemailer@6.9.16';
import { freeSlots, isBookable, validate, invitation, when, LABELS } from './rules.js';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const env = (k: string, d = '') => Deno.env.get(k) ?? d;
const ALLOWED = [/^https:\/\/(www\.)?grow-faster\.be$/, /^https:\/\/[a-z0-9-]+\.grow-faster-site\.pages\.dev$/, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/];

function cors(origin: string | null) {
  const ok = origin && ALLOWED.some(r => r.test(origin));
  return { 'Access-Control-Allow-Origin': ok ? origin! : 'https://grow-faster.be', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Max-Age': '600', Vary: 'Origin' };
}
const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

async function rpc(name: string, args: Record<string, unknown>) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`${name} ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}
async function busy(now: Date) {
  return rpc('booking_busy', { range_start: now.toISOString(), range_end: new Date(now.getTime() + 60 * 86400000).toISOString() });
}
async function hash(text: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
}

const TEXT = {
  nl: (v: any, w: any, label: string) => ({
    subject: `Bevestiging: gesprek op ${w.date} om ${w.time.slice(0, 5)}`,
    body: `Beste ${v.full_name}\n\nBedankt voor uw aanvraag. Uw gesprek met Grow Faster staat vast.\n\nDatum: ${w.date}\nUur: ${w.time}\nOnderwerp: ${label}\n\nIn de bijlage vindt u een agenda-uitnodiging. Open ze om de afspraak in uw agenda te zetten.\n\nErlend neemt vooraf contact met u op om af te spreken hoe het gesprek doorgaat. Past het moment toch niet, antwoord dan gewoon op deze mail.\n\nMet vriendelijke groet\nErlend Hollebosch\nGrow Faster\nhttps://grow-faster.be\n`,
  }),
  fr: (v: any, w: any, label: string) => ({
    subject: `Confirmation : entretien le ${w.date} à ${w.time.slice(0, 5)}`,
    body: `Bonjour ${v.full_name},\n\nMerci pour votre demande. Votre entretien avec Grow Faster est confirmé.\n\nDate : ${w.date}\nHeure : ${w.time}\nSujet : ${label}\n\nVous trouverez en pièce jointe une invitation de calendrier. Ouvrez-la pour ajouter le rendez-vous à votre agenda.\n\nErlend vous contactera au préalable pour convenir de la forme de l’entretien. Si le moment ne vous convient plus, répondez simplement à ce message.\n\nCordialement,\nErlend Hollebosch\nGrow Faster\nhttps://grow-faster.be\n`,
  }),
};

async function sendMails(v: any, id: string) {
  const from = env('MAIL_FROM', 'info@grow-faster.be'), owner = env('OWNER_EMAIL', 'erlend@grow-faster.be');
  // Belgian Hosting mail server for grow-faster.be (owner, 23 Nov 2026). Only the password is a secret.
  const host = env('SMTP_HOST', 'v031.belgianhosting.be'), user = env('SMTP_USER', from), pass = env('SMTP_PASS');
  if (!pass) return false;
  const port = Number(env('SMTP_PORT', '465'));
  const t = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass }, connectionTimeout: 10000 });
  const ics = invitation({ id, ...v }, from, owner);
  const attach = [{ filename: 'afspraak.ics', content: ics, contentType: 'text/calendar; charset=utf-8; method=REQUEST' }];
  const w = when(v.start_at, v.lang), label = LABELS[v.lang as 'nl' | 'fr'][v.topic];
  const mail = TEXT[v.lang as 'nl' | 'fr'](v, w, label);
  await t.sendMail({ from: `Grow Faster <${from}>`, to: v.email, replyTo: from, subject: mail.subject, text: mail.body, attachments: attach });
  const nl = when(v.start_at, 'nl');
  await t.sendMail({
    from: `Grow Faster afspraken <${from}>`, to: owner, replyTo: v.email,
    subject: `Nieuwe afspraak: ${nl.date} ${nl.time.slice(0, 5)}, ${v.organisation}`,
    text: `Nieuwe afspraak via grow-faster.be\n\nDatum: ${nl.date}\nUur: ${nl.time}\nOnderwerp: ${LABELS.nl[v.topic as 'algemeen']}\n\nNaam: ${v.full_name}\nOrganisatie: ${v.organisation}\nFunctie: ${v.job_title}\nE-mail: ${v.email}\nTelefoon: ${v.phone}\nTaal: ${v.lang.toUpperCase()}\n${v.note ? `\nVraag of toelichting:\n${v.note}\n` : ''}\nOpen de bijlage om de afspraak in je Outlook-agenda te zetten.\n`,
    attachments: attach,
  });
  return true;
}

Deno.serve(async req => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  try {
    const now = new Date();
    if (req.method === 'GET') return json({ slots: freeSlots(now, await busy(now)) }, 200, origin);
    if (req.method !== 'POST') return json({ error: 'method' }, 405, origin);
    if (Number(req.headers.get('content-length') ?? 0) > 8000) return json({ error: 'size' }, 413, origin);
    const input = await req.json().catch(() => null);
    if (!input || typeof input !== 'object') return json({ error: 'input' }, 400, origin);
    // Spam: a hidden field people never fill in, and a form completed in under 3 seconds.
    if (input.website || (typeof input.elapsed === 'number' && input.elapsed < 3000)) return json({ ok: true }, 200, origin);
    const check = validate(input);
    if (!check.ok) return json({ error: 'field', field: check.field }, 400, origin);
    const v = check.value;
    if (!isBookable(v.start_at, now, await busy(now))) return json({ error: 'taken' }, 409, origin);
    v.start_at = new Date(v.start_at).toISOString();
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
    const result = await rpc('booking_create', { details: v, ip_hash: await hash(env('IP_SALT', 'grow-faster') + ip) });
    if (!result.ok) return json({ error: result.error }, result.error === 'rate' ? 429 : 409, origin);
    let mailed = false;
    try { mailed = await sendMails(v, result.id); if (mailed) await rpc('booking_mark_mailed', { appointment_id: result.id }); }
    catch (e) { console.error('mail', (e as Error).message); }
    return json({ ok: true, mailed }, 200, origin);
  } catch (e) {
    console.error('booking', (e as Error).message);
    return json({ error: 'server' }, 500, origin);
  }
});
