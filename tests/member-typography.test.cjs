const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('../scripts/server.cjs');

test('member, admin and public routes retain canonical family roles and the available local fallback', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE || undefined});
  try {
    const page = await browser.newPage();
    for (const width of [390, 1440]) {
      await page.setViewportSize({width, height:900});
      const sizes = new Map();
      for (const route of ['/insights','/','/books.html','/approach','/account','/journal','/executive-radar/','/admin']) {
        await page.goto('http://127.0.0.1:' + server.address().port + route, {waitUntil:'domcontentloaded'});
        const result = await page.evaluate(async () => {
          await document.fonts.load('17px "Hanken Grotesk"');
          const loaded = [...document.fonts].some(face => face.family.includes('Hanken Grotesk') && face.status === 'loaded');
          // Gated Radar no longer exposes its private H4 content publicly.
          // Probe every semantic heading on each route without revealing it.
          const probe=document.createElement('section');
          probe.setAttribute('aria-label','Independent typography fixture');
          for(const tag of ['h1','h2','h3','h4']){
            const heading=document.createElement(tag);heading.textContent='Typography '+tag;probe.append(heading);
          }
          document.body.append(probe);
          const rows = [...document.querySelectorAll('body,p,h1,h2,h3,h4')].map(el => {
            const style = getComputedStyle(el);
            return [el.tagName, style.fontFamily, style.fontSize];
          });
          return {loaded, rows};
        });
        assert.ok(result.loaded, route);
        for (const [tag,family,size] of result.rows) {
          assert.equal(family.split(',')[0].replaceAll('\"',''), 'Aptos', route);
          if (tag === 'P') continue;
          if (!sizes.has(tag)) sizes.set(tag,size);
          assert.equal(size, sizes.get(tag), route + ' ' + tag);
        }
      }
      assert.equal(sizes.get('BODY'), '17px');
      assert.ok(['H1','H2','H3','H4'].every(tag => sizes.has(tag)));
      assert.equal(sizes.get('H1'),width===390?'40px':'86px');
      assert.equal(sizes.get('H2'),width===390?'32px':'54px');
      assert.equal(sizes.get('H3'),'24px');
      assert.equal(sizes.get('H4'),'20px');
    }
  } finally {
    await browser.close();
    server.close();
  }
});
