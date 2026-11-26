const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dom=require('./support/mini-dom.cjs');
const {i18nFor}=require('./support/i18n.cjs');

const dist=path.resolve(__dirname,'../dist');
const pages=['index.html','orion.html','automatisering.html','insights.html'];

test('four customer pages show three sector examples within the photo range',()=>{
  for(const page of pages){
    const doc=dom.parse(fs.readFileSync(path.join(dist,page),'utf8'));
    const main=dom.all(doc,el=>el.tag==='main')[0];
    const photos=dom.all(main,el=>el.tag==='img'&&/\.(webp|png|jpe?g)(?:$|\?)/i.test(el.attrs.src||''));
    assert.ok(photos.length>=3&&photos.length<=4,page);
    const examples=dom.all(main,el=>el.tag==='figure'&&el.attrs['data-sector']);
    assert.equal(examples.length,3,page);
    const sectors=new Set(examples.map(el=>el.attrs['data-sector']));
    assert.ok(sectors.has('voeding')&&sectors.has('onderhoud'),page);
    assert.ok(sectors.has('logistiek')||sectors.has('administratie'),page);
    const translations=i18nFor(page).I18N;
    for(const example of examples){
      const images=dom.all(example,el=>el.tag==='img');
      assert.equal(images.length,1,page);
      assert.equal(images[0].attrs.loading,'lazy',page);
      const caption=dom.all(example,el=>el.tag==='figcaption')[0];
      for(const el of dom.all(caption,el=>el.tag==='strong'||el.tag==='span')){
        const label=el.children.map(node=>node.text||'').join('').trim();
        assert.ok(translations[label]?.[1],page+': '+label);
      }
      for(const candidate of images[0].attrs.srcset.split(',')){
        const [file]=candidate.trim().split(' ');
        assert.ok(fs.statSync(path.join(dist,file)).isFile(),page+': '+file);
      }
    }
  }
});
