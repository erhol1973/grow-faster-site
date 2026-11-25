'use strict';
// Canonical source format of assets/i18n.js (25 Nov 2026): one translation per line, so Git can merge pull requests
// that add or change different keys. Two keys on one 200 KB line used to conflict on every parallel PR.
// Key order is kept as written (not sorted): related page strings stay together, which keeps the published gzip size
// (budget 65000) unchanged; sorting cost about 1.9 KB. Add new keys next to related keys rather than at the very end,
// so two PRs rarely insert at the same spot. The build (scripts/build.cjs) still publishes the compact single-line form.
//   node scripts/i18n-format.cjs          rewrite assets/i18n.js in canonical form
//   node scripts/i18n-format.cjs --check  exit 1 if assets/i18n.js is not canonical
const fs=require('node:fs'),path=require('node:path');
const FILE=path.resolve(__dirname,'..','assets','i18n.js');
const SHAPE=/^window\.I18N\s*=\s*(\{[\s\S]*\});\s*window\.I18N_HTML\s*=\s*(\{[\s\S]*\});?\s*$/;
function parse(text){const m=text.match(SHAPE);if(!m)throw Error('assets/i18n.js: expected window.I18N={...}; window.I18N_HTML={...};');return [JSON.parse(m[1]),JSON.parse(m[2])]}
function block(name,data){const rows=Object.entries(data).map(([k,v])=>JSON.stringify(k)+':'+JSON.stringify(v));return `window.${name}={\n${rows.join(',\n')}\n};\n`}
function format(text){const [dictionary,html]=parse(text);return block('I18N',dictionary)+block('I18N_HTML',html)}
function check(text){return format(text)===text}
if(require.main===module){
  const text=fs.readFileSync(FILE,'utf8');
  if(process.argv.includes('--check')){if(!check(text)){console.error('assets/i18n.js is not canonical: run node scripts/i18n-format.cjs');process.exit(1)}console.log('assets/i18n.js canonical')}
  else{fs.writeFileSync(FILE,format(text));console.log('assets/i18n.js formatted')}
}
module.exports={parse,format,check};
