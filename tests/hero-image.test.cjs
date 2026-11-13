'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const originals=[[640,"ddefd490a73aed97134f25fa9fbd837ed53443483fdc69b26b5716904d00a208"],[1280,"841e8f47ac57b7c518f5dd10b1f943a7bffd1f8ddd13b0b22b0a6f0b55347123"],[1774,"51607b7438fac9c7ee278c51fe35803f18d859cefe4910861b9471c87dd19b34"]];
test('AVIF hero preserves approved geometry and the exact original fallback photographs',()=>{
 for(const [width,hash] of originals){
  const original=fs.readFileSync(path.join(root,'img/hero-executive-meeting-'+width+'.webp'));
  assert.equal(createHash('sha256').update(original).digest('hex'),hash);
  const avif=fs.readFileSync(path.join(root,'dist/img/hero-executive-meeting-'+width+'.avif'));
  assert.equal(avif.toString('ascii',4,8),'ftyp');assert.ok(avif.subarray(8,32).includes(Buffer.from('avif')));
  const ispe=avif.indexOf(Buffer.from('ispe'));assert.ok(ispe>0);
  assert.equal(avif.readUInt32BE(ispe+8),width);assert.equal(avif.readUInt32BE(ispe+12),width===1774?887:width/2);
  assert.ok(avif.length<original.length,width+' uses fewer transferred bytes');
 }
});
