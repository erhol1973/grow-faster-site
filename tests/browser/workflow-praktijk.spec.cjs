'use strict';

const { test, expect } = require('playwright/test');

const topics = { nl: 'Workflow-automatisering', fr: 'Automatisation des workflows' };

for (const [language, topic] of Object.entries(topics)) {
  test(`a visitor can explore the workflow example and discuss it in ${language}`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('avs-consent', JSON.stringify({ v: 4, ext: false, ana: false, ts: Date.now() }));
    });
    await page.route('**/functions/v1/booking', route => {
      expect(route.request().method()).toBe('GET');
      return route.fulfill({ json: { slots: [] } });
    });

    await page.goto('/automatisering.html?lang=' + language);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    const hero = page.locator('#hero');
    const photo = await hero.locator('picture').boundingBox();
    const text = await hero.locator('.hero-inner').boundingBox();
    expect(photo.x >= text.x + text.width - 1 || photo.y >= text.y + text.height - 1).toBe(true);
    const appointments = page.locator('#hero-gesprek,#contact-gesprek');
    await expect(appointments).toHaveCount(2);
    for (const link of await appointments.all()) {
      const destination = new URL(await link.getAttribute('href'), page.url());
      expect(destination.pathname).toBe('/afspraak.html');
      expect(destination.searchParams.get('onderwerp')).toBe('workflow');
      if (language === 'fr') expect(destination.searchParams.get('lang')).toBe('fr');
    }
    await hero.locator('a[href="#voorbeelden"]').click();
    await expect(page).toHaveURL(/#voorbeelden$/);
    await expect(page.locator('#voorbeelden h2')).toBeInViewport();
    await expect(page.locator('#voorbeelden h3').nth(1)).toHaveText(
      language === 'nl' ? 'De conceptorder staat klaar' : 'La commande est prête à être vérifiée'
    );

    const outcome = page.locator('#voorbeelden details');
    await outcome.locator('summary').click();
    await expect(outcome.locator('p')).toContainText(language === 'nl' ? 'kaai 2' : /quai 2/i);

    const research = page.locator('#drempels details');
    await research.locator('summary').focus();
    await research.locator('summary').press('Enter');
    await expect(research.locator('a[href*="10.1007/s11301-024-00405-4"]')).toBeVisible();

    await page.locator('#contact-gesprek').click();
    await expect(page).toHaveURL(url => url.pathname === '/afspraak.html' && url.searchParams.get('onderwerp') === 'workflow');
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('#gekozen-onderwerp')).toHaveText(topic);
  });
}
