const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('operating-model reading text stays at least forty percent below the reviewed 789-word baseline',()=>{
 const html=fs.readFileSync('dist/operating-model.html','utf8'),main=html.slice(html.indexOf('<main'),html.indexOf('<footer'));
 const count=main.replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
 assert.ok(count<=473,`${count} words exceeds the requested 40% reduction`);
 for(const id of ['om-h','spec','spec-desc','gv-h','ft-h','fd-h'])assert.ok(main.includes(`id="${id}"`),id);
});
