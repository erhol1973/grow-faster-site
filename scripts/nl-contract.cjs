'use strict';
// Recompute the committed Dutch extraction contract (language/nl-extraction.json) after `npm run build` (25 Nov 2026).
// The committed hashes stay the guarantee: scripts/nl-audit.cjs compares them with the build, so every contract change is
// a visible, reviewed diff. Only the reason moved: it is written to its own file per change in
// language/nl-extraction-reviews/YYYY-MM-DD-<slug>.md, so parallel pull requests no longer collide on one text field.
// Usage: TEST_BROWSER_EXECUTABLE=<chromium> node scripts/nl-contract.cjs <slug> "<reason>"
const fs=require('node:fs'),path=require('node:path');
const a=require('./nl-audit.cjs');
const ROOT=path.resolve(__dirname,'..'),CONTRACT=path.join(ROOT,'language','nl-extraction.json'),REVIEWS=path.join(ROOT,'language','nl-extraction-reviews');
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
async function recompute(){
  const raw=fs.readFileSync(CONTRACT,'utf8'),c=JSON.parse(raw),changed=[];
  const old=new Map(c.javascript.map(x=>[x.file,x.sha256])),current=a.sources();
  for(const x of current)if(old.get(x.file)!==x.sha256)changed.push(x.file);
  for(const x of c.javascript)if(!current.some(y=>y.file===x.file))changed.push('removed '+x.file);
  c.javascript=current.map(x=>({file:x.file,sha256:x.sha256}));
  const {chromium}=require('playwright');const browser=await chromium.launch(process.env.TEST_BROWSER_EXECUTABLE?{executablePath:process.env.TEST_BROWSER_EXECUTABLE}:{});
  try{const page=await browser.newPage();await page.route('**/*',r=>r.abort());
    for(const x of c.inline){const file=path.join(ROOT,'dist',x.file);if(!fs.existsSync(file))continue;
      const h=a.hash(await page.evaluate(a.inlineScripts,fs.readFileSync(file,'utf8')));if(h!==x.sha256){x.sha256=h;changed.push('inline '+x.file)}}
  }finally{await browser.close()}
  a.validateContract(c.javascript,a.sources(),'JavaScript');
  return {c,raw,changed};
}
async function main(){
  const [slug,reason]=process.argv.slice(2);
  if(!slug||!SLUG.test(slug)||!reason?.trim())throw Error('usage: node scripts/nl-contract.cjs <slug> "<reason>"');
  const {c,raw,changed}=await recompute();
  if(!changed.length){console.log('contract unchanged; no review file written');return}
  fs.mkdirSync(REVIEWS,{recursive:true});const name=`${today()}-${slug}.md`,file=path.join(REVIEWS,name);
  // Exclusive create (no check-then-write race): an existing review is never overwritten, and the contract is only
  // rewritten once its review file exists.
  try{fs.writeFileSync(file,`# ${reason.trim()}\n\nGewijzigde contractregels: ${changed.join(', ')}.\n`,{flag:'wx'})}
  catch(e){if(e.code==='EEXIST')throw Error(`${name} already exists: choose another slug`);throw e}
  fs.writeFileSync(CONTRACT,JSON.stringify(c,null,2)+(raw.endsWith('\n')?'\n':''));
  console.log('contract changed:',changed,'review:',path.relative(ROOT,file));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exit(1)});
module.exports={SLUG,recompute};
