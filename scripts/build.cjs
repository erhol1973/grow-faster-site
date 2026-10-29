'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {readRegularFile}=require('./file-reader.cjs');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const files = ['.nojekyll', 'CNAME', '404.html', 'about.html', 'accessibility.html', 'approach.html', 'coherence-sim.html', 'coherence.html', 'favicon.ico', 'index.html', 'insights-ai-pilot.html', 'insights.html', 'operating-model.html', 'privacy.html', 'process.html', 'robots.txt', 'sitemap.xml', 'terms.html', 'value.html'];
const extensions = { assets: new Set(['.js', '.css']), img: new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.ico']), books: new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']) };
if (out !== path.join(root, 'dist')) throw new Error('Unsafe output directory');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
let count = 0;
function copy(source, relative) {
  const data=readRegularFile(source);
  const target = path.join(out, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if(relative.replaceAll('\\','/')==='assets/i18n.js'){
    const match=data.toString('utf8').match(/^window\.I18N\s*=\s*(\{[\s\S]*\});\s*window\.I18N_HTML\s*=\s*(\{[\s\S]*\});?\s*$/);
    if(!match)throw Error('Unexpected translation data format');
    const dictionary=JSON.parse(match[1]),html=JSON.parse(match[2]);
    const active=data=>Object.fromEntries(Object.entries(data||{}).map(([key,value])=>[key,Array.isArray(value)?value.slice(0,3):value]));
    fs.writeFileSync(target,'window.I18N='+JSON.stringify(active(dictionary))+';\nwindow.I18N_HTML='+JSON.stringify(active(html))+';\n');
  }else fs.writeFileSync(target,data);count++;
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
