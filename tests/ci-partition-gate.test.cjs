'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('.github/workflows/release.yml','utf8').replaceAll('\r\n','\n');

// Bounded parser for this workflow's job/step indentation and literal shell
// predicates. No YAML execution, shell execution or permissive fallback.
function job(text,name){
 const headers=[...text.matchAll(/^  ([\w-]+):$/gm)],index=headers.findIndex(m=>m[1]===name);
 assert(index>=0,'missing job '+name);return text.slice(headers[index].index,headers[index+1]?.index??text.length);
}
function steps(block){const starts=[...block.matchAll(/^      - /gm)];return starts.map((m,i)=>'        '+block.slice(m.index+8,starts[i+1]?.index??block.length));}
function field(step,key){return step.match(new RegExp('^        '+key+': (.+)$','m'))?.[1];}
function variables(step){
 const expression=field(step,'run');assert(expression,'missing literal gate command');
 const result=expression.split(/\s*&&\s*/).map(term=>{const m=term.match(/^test "\$([A-Z_]+)" = success$/);assert(m,'unsupported gate predicate: '+term);return m[1];});
 assert.equal(new Set(result).size,result.length,'duplicate gate predicate');return result;
}
function bindings(step){return Object.fromEntries([...step.matchAll(/^          ([A-Z_]+): \$\{\{ needs\.([\w-]+)\.result \}\}$/gm)].map(m=>[m[1],m[2]]));}
function verify(text){
 assert.doesNotMatch(text,/^\s*continue-on-error:/m,'failures must remain failures');
 const checks=job(text,'checks'),list=steps(checks);
 assert.match(checks,/^    needs: \[buildprep, typography, journey\]$/m);
 assert.match(checks,/^    if: always\(\)$/m);
 assert.match(checks,/^    timeout-minutes: 45$/m);
 const first=list[0];assert.equal(field(first,'if'),undefined,'initial build assertion cannot be conditional');assert.deepEqual(variables(first),['BUILD_RESULT']);assert.deepEqual(bindings(first),{BUILD_RESULT:'buildprep'});
 const finalIndex=list.findIndex(step=>field(step,'name')==='Require every build, typography and journey partition to succeed');assert(finalIndex>0,'missing final joint gate');
 const final=list[finalIndex];assert.equal(field(final,'if'),'always()');
 assert.deepEqual(variables(final),['BUILD_RESULT','TYPOGRAPHY_RESULT','JOURNEY_RESULT']);
 assert.deepEqual(bindings(final),{BUILD_RESULT:'buildprep',TYPOGRAPHY_RESULT:'typography',JOURNEY_RESULT:'journey'});
 for(const command of ['npm test','npm run security','npm run test:e2e','npm run test:load','npm run test:performance']){
  const index=list.findIndex(step=>field(step,'run')===command);assert(index>0&&index<finalIndex,command+' must collect evidence before the final joint gate');
 }
 const integrity=list.findIndex(step=>field(step,'name')==='Verify tests preserved every public artifact byte');assert(integrity>0&&integrity<finalIndex);
 assert.match(list[integrity],/sha256sum --check tested-website\.files\.sha256/);assert.match(list[integrity],/find dist -type f/);assert.match(list[integrity],/find dist ! -type f ! -type d/);
 const reports=list.findIndex(step=>field(step,'name')==='Save reports');assert(reports>integrity&&reports<finalIndex);assert.equal(field(list[reports],'if'),'always()');
 const packageIndex=list.findIndex(step=>field(step,'name')==='Package tested website');assert.equal(packageIndex,finalIndex+1,'nothing may bypass the last joint gate before packaging');
 const packageStep=list[packageIndex];assert.equal(field(packageStep,'if'),"github.ref == 'refs/heads/main' && github.event_name != 'pull_request'",'implicit success() and main/non-PR restrictions must remain');assert.match(packageStep,/uses: actions\/upload-pages-artifact@[a-f0-9]{40}/);assert.match(packageStep,/^          path: dist$/m);
 const deploy=job(text,'deploy');assert.match(deploy,/^    needs: \[checks, codeql, secrets\]$/m);assert.match(deploy,/^    if: github\.ref == 'refs\/heads\/main' && github\.event_name != 'pull_request' && \(vars\.PAGES_RELEASE_ENABLED == 'true' \|\| github\.event\.head_commit\.message == 'Release approved Grow Faster logo'\)$/m);
 return {first,final,packageStep};
}
function evaluate(step,statuses){const map=bindings(step);return variables(step).every(name=>statuses[map[name]]==='success');}

test('actual CI workflow collects base evidence but retains the final mandatory partition and release gates',()=>{verify(source);});
test('actual literal CI predicates reject every failed cancelled or skipped partition and preserve earlier base failures',()=>{
 const {first,final}=verify(source),statuses=['success','failure','cancelled','skipped'];let checked=0;
 for(const buildprep of statuses)for(const typography of statuses)for(const journey of statuses){
  const state={buildprep,typography,journey},allSuccess=[buildprep,typography,journey].every(s=>s==='success');
  assert.equal(evaluate(first,state),buildprep==='success','the initial gate depends only on the artifact build');
  assert.equal(evaluate(final,state),allSuccess,'all three independent partitions remain mandatory');
  for(const priorBaseSuccess of [false,true])for(const main of [false,true])for(const pullRequest of [false,true]){
   // GitHub implicitly applies success() when a step's if has no status function.
   // A passing always() gate cannot erase an earlier failed base/test step.
   const qualitySuccess=priorBaseSuccess&&evaluate(final,state),packages=qualitySuccess&&main&&!pullRequest;
   assert.equal(packages,priorBaseSuccess&&allSuccess&&main&&!pullRequest);checked++;
  }
 }
 assert.equal(checked,512);
});
test('CI contract fails closed when sequencing status checks or packaging safeguards are weakened',()=>{
 const {final}=verify(source);
 const rawFinal='      - '+final.slice(8);
 assert(source.includes(rawFinal),'negative fixture uses the actual YAML step');
 const mutations=[
  source.replace(rawFinal,'').replace('      - run: npm test',rawFinal+'      - run: npm test'),
  source.replace(rawFinal,rawFinal.replace('        if: always()\n','')),
  source.replace(' && test "$JOURNEY_RESULT" = success',''),
  source.replace('run: test "$BUILD_RESULT" = success\n','run: test "$BUILD_RESULT" = success && test "$TYPOGRAPHY_RESULT" = success\n'),
  source.replace("if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'\n","if: always() && github.ref == 'refs/heads/main' && github.event_name != 'pull_request'\n"),
  source.replace('needs: [checks, codeql, secrets]','needs: [codeql, secrets]'),
  source.replace('      - run: npm test','      - run: npm test\n        continue-on-error: true')
 ];
 for(const [index,mutation]of mutations.entries()){assert.notEqual(mutation,source,'negative fixture must change actual workflow');assert.throws(()=>verify(mutation),undefined,'negative workflow fixture '+index);}
});
