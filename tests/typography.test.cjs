const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('../scripts/server.cjs');

test('article cards and ordinary pages share one loaded typeface and heading scale', async () => {
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
          const rows = [...document.querySelectorAll('body,p,h1,h2,h3,h4')].map(el => {
            const style = getComputedStyle(el);
            return [el.tagName, style.fontFamily, style.fontSize];
          });
          return {loaded, rows};
        });
        assert.ok(result.loaded, route);
        for (const [tag,family,size] of result.rows) {
          assert.equal(family.split(',')[0], '"Hanken Grotesk"', route);
          if (!sizes.has(tag)) sizes.set(tag,size);
          assert.equal(size, sizes.get(tag), route + ' ' + tag);
        }
      }
      assert.equal(sizes.get('P'), '17px');
      assert.ok(['H1','H2','H3','H4'].every(tag => sizes.has(tag)));
    }
  } finally {
    await browser.close();
    server.close();
  }
});
