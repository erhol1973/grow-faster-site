'use strict';
// Testplan index (25 Nov 2026). Each test-plan item is its own file in docs/testplan/ (YYYY-MM-DD-<slug>.md), so parallel
// pull requests add files instead of editing the same lines. The folder is the index; this script reads and validates it
// and prints a readable list, newest first: node scripts/testplan-index.cjs
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const NAME=/^(\d{4})-(\d{2})-(\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
// The only sections docs/TESTPLAN.md may hold: the convention and the standing policy. Items never go back into it.
const POLICY=['Testplan-items: één bestand per wijziging','Browsermatrix en rapportage','Uitvoering','Grenzen en onderhoud','Permanente grens voor interne Radar-sprintinhoud'];
function validDate(y,m,d){const t=new Date(Date.UTC(+y,+m-1,+d));return t.getUTCFullYear()===+y&&t.getUTCMonth()===+m-1&&t.getUTCDate()===+d}
function entries(root=ROOT){
  const dir=path.join(root,'docs','testplan'),errors=[],items=[];
  for(const f of fs.readdirSync(dir,{withFileTypes:true})){
    if(!f.isFile()){errors.push(`${f.name}: only item files belong in docs/testplan/`);continue}
    const m=f.name.match(NAME);if(!m){errors.push(`${f.name}: name must be YYYY-MM-DD-<slug>.md (lowercase letters, digits, hyphens)`);continue}
    if(!validDate(m[1],m[2],m[3])){errors.push(`${f.name}: invalid date`);continue}
    const text=fs.readFileSync(path.join(dir,f.name),'utf8'),first=text.split('\n',1)[0];
    if(!/^## \S/.test(first)){errors.push(`${f.name}: first line must be a "## <title>" heading`);continue}
    if((text.match(/^## /gm)||[]).length!==1)errors.push(`${f.name}: exactly one "## " heading per item`);
    if(!text.endsWith('\n')||!text.trim().includes('\n'))errors.push(`${f.name}: item needs a body and a final newline`);
    items.push({file:'docs/testplan/'+f.name,date:`${m[1]}-${m[2]}-${m[3]}`,title:first.slice(3).trim()});
  }
  items.sort((a,b)=>b.file.localeCompare(a.file));
  return {items,errors};
}
function policySections(root=ROOT){return [...fs.readFileSync(path.join(root,'docs','TESTPLAN.md'),'utf8').matchAll(/^## (.+)$/gm)].map(m=>m[1].trim())}
function index(root=ROOT){return entries(root).items.map(i=>`- ${i.date} [${i.title}](${path.posix.relative('docs',i.file)})`).join('\n')}
if(require.main===module){const {errors}=entries();if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log(index())}
module.exports={entries,index,policySections,POLICY,NAME};
