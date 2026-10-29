'use strict';
const fs=require('node:fs');
// Read the same open file that was checked, even if its path is replaced.
function readRegularFile(file,io=fs){
  const descriptor=io.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
  try{
    const opened=io.fstatSync(descriptor,{bigint:true}),named=io.lstatSync(file,{bigint:true});
    if(!opened.isFile()||named.isSymbolicLink()||opened.dev!==named.dev||opened.ino!==named.ino)throw Error('Unsafe or replaced source file: '+file);
    return io.readFileSync(descriptor);
  }finally{io.closeSync(descriptor)}
}
module.exports={readRegularFile};
