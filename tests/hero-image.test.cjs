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

const portraits=[[400,500,"f3b99a6cd08614f0499053c90b807809e927342e5de3d7d36fe0a2ca82884f95"],[720,900,"aa33ac607b68736f1d1dce9b0ee9876ec193a139b9a1e7c6f5b09271743f1c06"]];
test('author AVIF preserves portrait geometry and exact JPEG fallbacks',()=>{
 for(const [width,height,hash] of portraits){
  const original=fs.readFileSync(path.join(root,'img/author-retouched-'+width+'.jpg'));
  assert.equal(createHash('sha256').update(original).digest('hex'),hash);
  const avif=fs.readFileSync(path.join(root,'dist/img/author-retouched-'+width+'.avif'));
  assert.equal(avif.toString('ascii',4,8),'ftyp');assert.ok(avif.subarray(8,32).includes(Buffer.from('avif')));
  const ispe=avif.indexOf(Buffer.from('ispe'));assert.ok(ispe>0);
  assert.equal(avif.readUInt32BE(ispe+8),width);assert.equal(avif.readUInt32BE(ispe+12),height);
  assert.ok(avif.length<original.length);
 }
});
test('shared hero optimization retains the exact existing WebP photographs and movie layout hook',()=>{
 for(const [width,hash] of [[640,"15ef9c81a0beca13f88c1cc9678b503c4d4b25d7d384e47cb065d55d2d3fa749"],[1280,"b4ffbed794e6a35d4c7a8009d203c808ed3e878e68a692cd9c6cd5d2c4393157"],[1920,"494d660b6da0899db89c45af57d4dd6216d7a96ad01dcaaa004933eab4f4cf8b"],[2400,"3719baf655cb32d0fc94cdba1fa9a183d89bc1bebc074522a53d8be15b021abb"]]){
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'img/hero-'+width+'.webp'))).digest('hex'),hash);
 }
 for(const route of ['coherence.html','insights.html']){
  const html=fs.readFileSync(path.join(root,'dist',route),'utf8');
  assert.match(html,/<source media="\(max-width:600px\)" type="image\/webp" srcset="img\/hero-640\.webp">/);
  assert.match(html,/<img src="img\/hero\.jpg" alt="" fetchpriority="high"/);
 }
 assert.match(fs.readFileSync(path.join(root,'dist/coherence.html'),'utf8'),/<script defer src="assets\/coherence-layout\.js"><\/script>/);
});
