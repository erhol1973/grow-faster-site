'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {domBlocks}=require('../scripts/nl-audit.cjs');
test('DOM extraction retains sentence context, hidden NL, metadata and dictionary; excludes French',async()=>{
  const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined});
  try{
    const page=await browser.newPage();
    await page.setContent('<html lang="nl"><head><title>Nederlandse titel</title><meta name="description" content="Volledige beschrijving."></head><body><p>Dit is <strong>een volledige</strong> zin. Ook deze zin hoort erbij.</p><section lang="fr"><p>Texte français.</p></section><p hidden>Verborgen Nederlandse tekst.</p><img alt="Een afbeelding"><script>window.I18N={key:["Nederlandse woorden.","Français"]}</script></body></html>');
    const rows=await page.evaluate(domBlocks);
    assert.equal(rows.filter(r=>r.text==='Dit is een volledige zin. Ook deze zin hoort erbij.').length,1);
    assert.ok(rows.some(r=>r.text==='Verborgen Nederlandse tekst.'));
    assert.ok(rows.some(r=>r.kind==='content'&&r.text==='Volledige beschrijving.'));
    assert.ok(rows.some(r=>r.kind.startsWith('dictionary:')&&r.text==='Nederlandse woorden.'));
    assert.ok(!rows.some(r=>r.text.includes('Texte français')));
    await page.setContent('<html lang="nl"><body><div>Eigen tekst <strong>met nadruk</strong>.<p>Een aparte alinea met <a href="#">een link</a>.</p></div></body></html>');
    const mixed=await page.evaluate(domBlocks);
    assert.ok(mixed.some(r=>r.text==='Eigen tekst met nadruk.'));
    assert.ok(mixed.some(r=>r.text==='Een aparte alinea met een link.'));
    await page.setContent('<html lang="nl"><body><p><span>Een</span> <span>volledige zin.</span><br>Een tweede zin.</p><script>window.I18N_HTML={key:["<p>Eerste zin.</p><p>Tweede zin.</p>","FR"]}</script></body></html>');
    const boundaries=await page.evaluate(domBlocks);
    assert.ok(boundaries.some(r=>r.text==='Een volledige zin. Een tweede zin.'));
    assert.ok(boundaries.some(r=>r.text==='Eerste zin. Tweede zin.'));
  }finally{await browser.close();}
});
