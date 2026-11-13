'use strict';

const {createHash} = require('node:crypto');
const {passwordPrompt, testProject:base, testPublishableKey:key} = require('./accept-cms-storage.cjs');
const assets = [
  ['journal/2026-11/nl.json','5a35b34a81051fcd869da297074b8fcced7e9299358fc068d081e191c716dad5'],
  ['journal/2026-11/fr.json','067e0e8436837517d0b6992a06c05c9f6baedd70883f695d21064765e42ec547'],
  ['journal/2026-11/cartoon.webp','4c8623eb81a4edbed7aa6102ba17681ad6c346ee89e31035e80531df50c7150d'],
  ['radar/current.json','57109501dc37889daa7c143289a39f8b839efb51c03bb2e2e5dd9c4531d1600b']
];

function check(label, passed, info) {
  if (!passed) throw Error(label + ' failed (' + info + ')');
  console.log('PASS ' + label + ' (' + info + ')');
}
function request(path, token, body) {
  const headers = {apikey:key};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(base + path, {
    method:body === undefined ? 'GET' : 'POST', headers,
    body:body === undefined ? undefined : JSON.stringify(body),
    redirect:'error',cache:'no-store',signal:AbortSignal.timeout(30000)
  });
}
function storageFailure(data) {
  let body;
  try { body = JSON.parse(data.toString('utf8')); } catch { return 'non-JSON error'; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'non-object JSON error';
  // Only known Storage error fields, bounded and stripped of control characters.
  return ['statusCode','code','error','message'].filter(k => typeof body[k] === 'string' || typeof body[k] === 'number')
    .map(k => k + '=' + String(body[k]).replace(/[\r\n\x00-\x1f]/g,' ').slice(0,200)).join(', ');
}
async function assertDenied(label, response) {
  const data = Buffer.from(await response.arrayBuffer());
  const reason = storageFailure(data);
  check(label, [400,401,403,404].includes(response.status) &&
    /not[ _-]?found|no.?such.?key|unauthori[sz]ed|permission|not allowed|forbidden|denied|missing authorization/i.test(reason),
    'HTTP ' + response.status + ', ' + reason +
    (/not[ _-]?found|no.?such.?key/i.test(reason) ? '; missing object or RLS masking, not independent access proof' : ''));
}
async function assertNoListing(label, response) {
  // Storage SELECT policies often filter the list to [] rather than return 403.
  if (response.status !== 200) return assertDenied(label, response);
  const body = await response.json().catch(() => null);
  check(label, Array.isArray(body) && body.length === 0, 'HTTP 200, expected empty list');
}
async function noListing(role, token) {
  for (const prefix of ['', 'journal/2026-11', 'radar']) {
    await assertNoListing(role + ' cannot enumerate ' + (prefix || 'bucket root'),
      await request('/storage/v1/object/list/member-content',token,{prefix,limit:100,offset:0}));
  }
}
async function cmsReadRights(role, token, admin) {
  // Read IDs only: no draft content, writes, publication or synthetic CMS changes.
  const response = await request('/rest/v1/cms_versions?select=id&limit=1',token);
  const rows = await response.json().catch(() => null);
  check(role + (admin ? ' can read existing private CMS history' : ' cannot read private CMS history'),
    response.status === 200 && Array.isArray(rows) && (admin ? rows.length === 1 : rows.length === 0),
    'HTTP ' + response.status + ', ' + (Array.isArray(rows) ? rows.length + ' visible history rows' : 'invalid response') +
    (admin && Array.isArray(rows) && rows.length === 0 ? '; existing test CMS history required for positive proof' : ''));
}
async function anonymousStorage() {
  await noListing('Guest',null);
  for (const [name] of assets) {
    for (const mode of ['public','authenticated']) {
      const response = await request('/storage/v1/object/' + mode + '/member-content/' + name);
      await assertDenied(mode + ' guest read ' + name, response);
    }
    await assertDenied('guest signing ' + name, await request('/storage/v1/object/sign/member-content/' + name, null,{expiresIn:60}));
  }
}
async function memberOrAdmin(email,admin) {
  const role = admin ? 'Administrator' : 'Member';
  console.log(role + ' on growfaster-test');
  const login = await request('/auth/v1/token?grant_type=password', null,{email,password:await passwordPrompt()});
  const auth = await login.json();
  check(role + ' authenticated',login.ok && Boolean(auth.access_token),'HTTP ' + login.status);
  const token = auth.access_token;
  delete auth.access_token;
  delete auth.refresh_token;
  try {
    for (const [rpc,expected] of [['member_has_access', true],['cms_is_admin',admin]]) {
      const response = await request('/rest/v1/rpc/' + rpc,token,{});
      check(role + ' ' + rpc,response.ok && (await response.json()) === expected,'expected ' + expected + ', HTTP ' + response.status);
    }
    await cmsReadRights(role,token,admin);
    await noListing(role,token);
    for (const [name,hash] of assets) {
      const response = await request('/storage/v1/object/authenticated/member-content/' + name,token);
      const data = Buffer.from(await response.arrayBuffer());
      const digest = createHash('sha256').update(data).digest('hex');
      check(role + ' downloads exact ' + name,response.status === 200 && digest === hash,
        'HTTP ' + response.status + ', ' + data.length + ' bytes' +
        (response.status === 200 ? ', SHA256 ' + digest : ', ' + storageFailure(data)));
      await assertDenied(role + ' signing ' + name,await request('/storage/v1/object/sign/member-content/' + name,token,{expiresIn:60}));
    }
  } finally {
    const logout = await request('/auth/v1/logout?scope=local',token,{});
    check(role + ' test session closed',logout.ok,'HTTP ' + logout.status);
  }
}
async function main() {
  const args = process.argv.slice(2);
  const guestOnly = args.length === 1 && args[0] === '--guest-only';
  if (!guestOnly && (args.length !== 2 || !args.every(value => value.includes('@')) ||
      args[0].toLowerCase() === args[1].toLowerCase())) {
    throw Error('Usage: node scripts/accept-member-test.cjs --guest-only OR regular-test-email admin-test-email');
  }
  console.log('Isolated test project: gqsvoioccvklzfmdmexy');
  await anonymousStorage();
  const rpc = await request('/rest/v1/rpc/member_has_access',null,{});
  const error = await rpc.json().catch(() => ({}));
  // Depending on role visibility, PostgREST may hide the function from guests.
  // Only successful authenticated RPC calls below establish that it was deployed.
  check('guest cannot execute membership RPC',([401,403].includes(rpc.status) && error.code === '42501') ||
        (rpc.status === 404 && error.code === 'PGRST202'),
        'HTTP ' + rpc.status + ', ' + (error.code || 'unknown code'));
  if (!guestOnly) {
    await memberOrAdmin(args[0],false);
    await memberOrAdmin(args[1],true);
  }
  console.log(guestOnly ? 'Guest requests returned no content; object existence and member/administrator checks outstanding.' : 'Isolated real access tests passed.');
}
module.exports = {storageFailure, assertDenied, assertNoListing, cmsReadRights};
if (require.main === module) main().catch(error => {
  console.error(error.message, error.cause?.code || '');
  process.exitCode = 1;
});
