const {test, expect} = require('playwright/test');

async function checkNavigationNames(page, language) {
  const french = language === 'fr';
  await expect(page.locator('nav.nav')).toHaveAccessibleName(french ? 'Navigation principale' : 'Hoofdnavigatie');
  for (const selector of ['.brand', '.footer-brand']) {
    await expect(page.locator(selector)).toHaveAccessibleName(french ? 'Grow Faster – Accueil' : 'Grow Faster – startpagina');
  }
}

test.describe('French Orion before scripts run', () => {
  test.use({javaScriptEnabled: false});
  test('the navigation, displayed language and selected option are already French', async ({page}) => {
    await page.goto('/fr/orion/');
    await checkNavigationNames(page, 'fr');
    await expect(page.locator('#lang-btn-top .lang-cur')).toHaveText('FR-BE');
    await expect(page.locator('#lang-btn-modal .lang-cur')).toHaveText('Français (BE)');
    await expect(page.locator('.lang-menu [aria-checked="true"][data-lang="fr"]')).toHaveCount(2);
    await expect(page.locator('.lang-menu [data-lang="nl"] .ln')).toHaveText(['Nederlands (BE)', 'Nederlands (BE)']);
  });
});

test('the Orion navigation names follow both language switches', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('avs-consent', JSON.stringify({v:4, ext:false, ana:false, ts:Date.now()})));
  await page.goto('/orion.html?lang=nl');
  await checkNavigationNames(page, 'nl');
  for (const language of ['fr', 'nl']) {
    await page.locator('#lang-btn-top').click();
    await page.locator(`.lang-top [data-lang="${language}"]`).click();
    await checkNavigationNames(page, language);
  }
});
