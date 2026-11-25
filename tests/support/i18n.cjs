'use strict';
// Runtime translations for tests, loaded the way the browser loads them (25 Nov 2026).
// i18nFor(page): exactly the dictionaries the built page references, in document order, in one context.
//   A page dictionary only exists for its own page, so a key that is only present in another page's dictionary
//   is a real runtime gap; per-page loading catches it, a global union would hide it.
// i18nAll(): assets/i18n.js followed by every assets/i18n-*.js in sorted order, for checks over the whole site
//   (for example forbidden claims), where more keys only make the check stricter.
// New page dictionaries need no test edit: they are discovered from the built HTML or the assets folder.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const DIST=path.resolve(__dirname,'..','..','dist');
const SRC=/<script\b[^>]*\bsrc="(assets\/i18n(?:-[a-z0-9-]+)?\.js)(?:\?[^"]*)?"/g;
function run(files,root){const c={window:{}};for(const f of files)vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),c,{filename:f});return c.window}
function scriptsOf(page,root=DIST){return [...fs.readFileSync(path.join(root,page),'utf8').matchAll(SRC)].map(m=>m[1])}
function i18nFor(page,root=DIST){const files=scriptsOf(page,root);if(files[0]!=='assets/i18n.js')throw Error(`${page}: assets/i18n.js must be the first translation script, found ${JSON.stringify(files)}`);return run(files,root)}
function allFiles(root=DIST){return ['assets/i18n.js',...fs.readdirSync(path.join(root,'assets')).filter(f=>/^i18n-[a-z0-9-]+\.js$/.test(f)).sort().map(f=>'assets/'+f)]}
function i18nAll(root=DIST){return run(allFiles(root),root)}
module.exports={i18nFor,i18nAll,scriptsOf,allFiles};
