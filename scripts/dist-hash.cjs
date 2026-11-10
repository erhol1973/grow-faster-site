'use strict';
// Prints one SHA-256 over every file path and its bytes in dist/, in sorted order.
// CI uses it to prove that each parallel job tested the same release package.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function hashDist(root=path.resolve(__dirname,'../dist')){
  const files=[];
  const walk=dir=>{for(const item of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,item.name);
    if(item.isSymbolicLink())throw new Error('Symbolic link rejected: '+full);
    if(item.isDirectory())walk(full);else if(item.isFile())files.push(full)}};
  walk(root);
  const hash=crypto.createHash('sha256');
  for(const file of files.map(f=>path.relative(root,f).split(path.sep).join('/')).sort()){
    hash.update(file+'\0');hash.update(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest());hash.update('\0');
  }
  return hash.digest('hex');
}
module.exports={hashDist};
if(require.main===module)console.log(hashDist());
