const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {readRegularFile}=require('../scripts/file-reader.cjs');
const file=__filename;
test('build reader returns the checked open file bytes',()=>assert.deepEqual(readRegularFile(file),fs.readFileSync(file)));
test('build reader rejects non-files',()=>assert.throws(()=>readRegularFile(__dirname)));
test('a replaced path cannot supply unchecked bytes and its descriptor closes',()=>{
  let descriptor,closed=false;const io={...fs,openSync(...args){descriptor=fs.openSync(...args);return descriptor},lstatSync(p,options){const s=fs.lstatSync(p,options);return{...s,ino:s.ino+1n,isSymbolicLink:()=>false}},closeSync(fd){closed=true;fs.closeSync(fd)}};
  assert.throws(()=>readRegularFile(file,io),/Unsafe or replaced/);assert.equal(closed,true);assert.throws(()=>fs.fstatSync(descriptor),{code:'EBADF'});
});
test('symbolic sources are rejected even on platforms without O_NOFOLLOW',()=>{
  const io={...fs,lstatSync(p,options){const s=fs.lstatSync(p,options);return{...s,isSymbolicLink:()=>true}}};assert.throws(()=>readRegularFile(file,io),/Unsafe or replaced/);
});
