'use strict';

const {test,expect} = require('playwright/test');

const cases = [
  {route:'/journal.html#p3',language:'nl',signup:'Gratis lid worden',login:'Ik ben al lid'},
  {route:'/executive-radar/?lang=fr',language:'fr',signup:'Devenir membre gratuitement',login:'Je suis déjà membre'}
];

for (const viewport of [{width:1366,height:900}, {width:360,height:740}]) {
  for (const scenario of cases) {
    test(`membership invitation for ${scenario.route} at ${viewport.width}px`, async ({page}) => {
      await page.setViewportSize(viewport);
      await page.goto(scenario.route);
      const trigger = page.locator('[data-member-invitation]:visible').first();
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading')).toBeFocused();
      const join = dialog.getByRole('link',{name:scenario.signup});
      const login = dialog.getByRole('link',{name:scenario.login});
      for (const [link,mode] of [[join,'signup'],[login,null]]) {
        const url = new URL(await link.getAttribute('href'));
        expect(url.origin).toBe(new URL(page.url()).origin);
        expect(url.pathname).toBe('/account');
        expect(url.searchParams.get('return')).toBe(scenario.route);
        expect(url.searchParams.get('lang')).toBe(scenario.language);
        expect(url.searchParams.get('mode')).toBe(mode);
      }
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await expect.poll(() => dialog.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      await login.focus();
      await page.keyboard.press('Tab');
      await expect(dialog.getByRole('button')).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(page).toHaveURL(new RegExp(scenario.route.replace(/[?]/g,'\\?')+'$'));
      await trigger.click();
      await page.getByRole('dialog').getByRole('button').click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  }
}

test('French Journal TOC preserves the locked section and no private page is mounted',async ({page}) => {
  await page.goto('/journal-fr.html#p2');
  await page.locator('.routes a[data-member-target="#p9"]').click();
  const dialog = page.getByRole('dialog');
  const signup = dialog.getByRole('link',{name:'Devenir membre gratuitement'});
  const target = new URL(await signup.getAttribute('href'));
  expect(target.searchParams.get('return')).toBe('/journal-fr.html#p9');
  expect(target.searchParams.get('lang')).toBe('fr');
  await expect(page.locator('#p9')).toHaveCount(0);
  await signup.click();
  await expect(page).toHaveURL(target.href);
});

test('with JavaScript disabled, the free article and an ordinary sign-in link remain usable',async ({browser,baseURL}) => {
  const context = await browser.newContext({javaScriptEnabled:false,baseURL});
  try {
    const page = await context.newPage();
    await page.goto('/journal-fr.html');
    await expect(page.locator('#p3')).toBeVisible();
    await expect(page.locator('#p4')).toHaveCount(0);
    const fallback = page.locator('.routes a[data-member-target="#p9"]');
    await fallback.click();
    const url = new URL(page.url());
    expect(url.pathname).toBe('/account.html');
    expect(url.searchParams.get('return')).toBe('/journal-fr.html#p9');
    expect(url.searchParams.get('lang')).toBe('fr');
  } finally { await context.close(); }
});