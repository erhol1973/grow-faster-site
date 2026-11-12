'use strict';

// Use the CLI's existing login. Every remote invocation pins growfaster-test.
// Usage: node scripts/provision-member-test.cjs JOURNAL_DIRECTORY RADAR_JSON
// Apply the test migration first (see docs/MEMBER-TEST-DATABASE.md).
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {tmpdir} = require('node:os');

const project = 'gqsvoioccvklzfmdmexy';
const bucket = 'member-content';

function filesFor(journalDirectory, radarFile) {
  return [
    ['journal/2026-11/nl.json', path.join(journalDirectory, 'nl.json'), 'application/json'],
    ['journal/2026-11/fr.json', path.join(journalDirectory, 'fr.json'), 'application/json'],
    ['journal/2026-11/cartoon.webp', path.join(journalDirectory, 'cartoon.webp'), 'image/webp'],
    ['radar/current.json', radarFile, 'application/json']
  ].map(([object, filename, mime]) => {
    const file = path.resolve(filename);
    const data = fs.readFileSync(file);
    if (!data.length || data.length > 26214400) throw Error('Invalid asset size: ' + file);
    if (mime === 'application/json') JSON.parse(data.toString('utf8'));
    else if (data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') {
      throw Error('Expected a WebP file: ' + file);
    }
    return {object, file, mime, digest: createHash('sha256').update(data).digest('hex')};
  });
}

function provision(journalDirectory, radarFile) {
  const files = filesFor(journalDirectory, radarFile);
  const cli = args => execFileSync('supabase', [...args, '--remote=' + project], {encoding:'utf8'});
  const check = cli(['db', 'query', '--read-only', '--output', 'json', `
    select exists(select 1 from storage.buckets where id='member-content' and public=false)
       and to_regprocedure('public.member_has_access()') is not null
       and exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
                  and policyname='member_content_read_guard' and permissive='RESTRICTIVE'
                  and position('object.get_authenticated' in qual) > 0) as ready
  `]);
  // CLI releases can return either an array or an object with a rows property.
  const result = JSON.parse(check);
  const rows = Array.isArray(result) ? result : result.rows;
  if (rows?.length !== 1 || rows[0].ready !== true) throw Error('Private bucket or access policy missing in growfaster-test.');
  const scratch = fs.mkdtempSync(path.join(tmpdir(),'growfaster-member-test-'));
  try {
    for (const {object, file, mime, digest} of files) {
      const destination = 'ss:///' + bucket + '/' + object;
      cli(['storage','cp', file, destination, '--experimental','--content-type',mime,'--cache-control','private, no-store']);
      const download = path.join(scratch, 'verification.bin');
      cli(['storage','cp', destination, download, '--experimental']);
      const downloaded = createHash('sha256').update(fs.readFileSync(download)).digest('hex');
      if (downloaded !== digest) throw Error('Downloaded bytes differ: ' + object);
      fs.unlinkSync(download);
      console.log('Verified ' + project + '/' + bucket + '/' + object + ' SHA256 ' + digest);
    }
  } finally {
    // Only our private verification file can exist inside this process-created directory.
    fs.rmSync(path.join(scratch,'verification.bin'), {force:true});
    fs.rmdirSync(scratch);
  }
}

if (require.main === module) {
  try {
    if (process.argv.length !== 4) throw Error('Usage: node scripts/provision-member-test.cjs JOURNAL_DIRECTORY RADAR_JSON');
    provision(process.argv[2], process.argv[3]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
