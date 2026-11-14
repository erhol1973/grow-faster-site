'use strict';
// One-time migration source: this edition was publicly released before membership.
// Future editions must be authored in private storage and never committed here.
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const revision = '9f3a0ddbd7fa0d3dc548a2ba17b66a816f946d10';
const read = file => execFileSync('git', ['-c', 'safe.directory=' + root.replaceAll('\\','/'), 'show', revision + ':' + file], {cwd:root});
function edition(lang) {
  if (!['nl','fr'].includes(lang)) throw new Error('Unsupported edition language');
  const source = read(lang === 'nl' ? 'journal.html' : 'journal-fr.html').toString('utf8').replace(/\r\n/g, '\n');
  const pages = source.match(/<article class="sheet\b[\s\S]*?<\/article>/g);
  if (pages?.length !== 15) throw new Error('Unexpected edition page count');
  // Do not allow a detached DOMParser document to fetch the old public picture.
  const sheets = pages.slice(3).map(html => html.replace('src="img/journal-01-cartoon.webp"', 'data-journal-cartoon=""'));
  const payload = Buffer.from(JSON.stringify({sheets}));
  return {source, pages, payload, digest:createHash('sha256').update(payload).digest('hex')};
}
function cartoon() { return read('img/journal-01-cartoon.webp'); }
if (require.main === module) {
  if (process.argv.length !== 3) throw new Error('Provide a new export directory outside the repository');
  const destination = path.resolve(process.argv[2]);
  const relative = path.relative(root, destination);
  if (!relative || (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative))) throw new Error('Export outside the repository');
  fs.mkdirSync(destination, {recursive:false,mode:0o700});
  for (const language of ['nl','fr']) fs.writeFileSync(path.join(destination,language+'.json'), edition(language).payload,{mode:0o600});
  fs.writeFileSync(path.join(destination,'cartoon.webp'), cartoon(),{mode:0o600});
}
module.exports = {edition,cartoon};