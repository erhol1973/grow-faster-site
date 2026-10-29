'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const files = ['.nojekyll', 'CNAME', '404.html', 'about.html', 'accessibility.html', 'approach.html', 'coherence-sim.html', 'coherence.html', 'favicon.ico', 'index.html', 'insights-ai-pilot.html', 'insights.html', 'operating-model.html', 'privacy.html', 'process.html', 'robots.txt', 'sitemap.xml', 'terms.html', 'value.html'];
const extensions = { assets: new Set(['.js', '.css']), img: new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.ico']), books: new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']) };
if (out !== path.join(root, 'dist')) throw new Error('Unsafe output directory');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
let count = 0;
function copy(source, relative) {
  if (fs.lstatSync(source).isSymbolicLink()) throw new Error(`Symbolic link rejected: ${relative}`);
  const target = path.join(out, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if(relative.replaceAll('\\','/')==='assets/i18n.js'){
    const context={window:{}};require('node:vm').runInNewContext(fs.readFileSync(source,'utf8'),context,{timeout:1000});
    const active=data=>Object.fromEntries(Object.entries(data||{}).map(([key,value])=>[key,Array.isArray(value)?value.slice(0,3):value]));
    fs.writeFileSync(target,'window.I18N='+JSON.stringify(active(context.window.I18N))+';\nwindow.I18N_HTML='+JSON.stringify(active(context.window.I18N_HTML))+';\n');
  }else fs.copyFileSync(source, target);count++;
}
for (const file of files) copy(path.join(root, file), file);
function walk(folder, relative, allowed) {
  for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
    const source = path.join(folder, item.name), rel = path.join(relative, item.name);
    if (item.isSymbolicLink()) throw new Error(`Symbolic link rejected: ${rel}`);
    if (item.isDirectory()) walk(source, rel, allowed);
    else if (allowed.has(path.extname(item.name).toLowerCase())) copy(source, rel);
  }
}
for (const [dir, allowed] of Object.entries(extensions)) walk(path.join(root, dir), dir, allowed);
console.log(`Built ${count} website files in dist/`);
