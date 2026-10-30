const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('optimized translation payload retains every active language exactly',()=>{
  const root=path.resolve(__dirname,'..'),source={window:{}},built={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets/i18n.js'),'utf8'),source);
  vm.runInNewContext(fs.readFileSync(path.join(root,'dist/assets/i18n.js'),'utf8'),built);
  for(const name of ['I18N','I18N_HTML'])for(const [key,value]of Object.entries(source.window[name]||{})){
    assert.ok(Object.hasOwn(built.window[name],key),key);
    assert.equal(JSON.stringify(built.window[name][key]),JSON.stringify(Array.isArray(value)?value.slice(0,3):value),name+': '+key);
  }
});
