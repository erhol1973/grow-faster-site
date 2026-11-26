'use strict';

const { test, expect } = require('playwright/test');
const { default: AxeBuilder } = require('@axe-core/playwright');

const copy = {
  nl: {
    action: 'Bekijk trainingen per team',
    teams: ['Kwaliteitsdienst', 'Teamleiders en medewerkers', 'Zaakvoerders en directie'],
    links: ['Bespreek de opleiding over Orion', 'Bespreek de opleiding over automatisering', 'Bespreek bedrijfsontwikkeling']
  },
  fr: {
    action: 'Voir les formations par équipe',
    teams: ['Service qualité', 'Responsables d’équipe et collaborateurs', 'Dirigeants et équipes de direction'],
    links: ['Parler de la formation Orion', 'Parler de la formation aux workflows', 'Parler du développement d’entreprise']
  }
};

for (const [lang, text] of Object.entries(copy)) {
  test('Training helps visitors choose a programme by team in ' + lang, async ({ page }, info) => {
    await page.addInitScript(() => {
      localStorage.setItem('avs-consent', JSON.stringify({ v: 4, ext: false, ana: false, ts: Date.now() }));
    });
    await page.route('**/functions/v1/booking', route => {
      if (route.request().method() !== 'GET') throw Error('The Training journey must not submit a booking');
      return route.fulfill({ status: 200, json: { slots: [] } });
    });

    const narrowFrench = lang === 'fr' && info.project.use.isMobile;
    if (narrowFrench) await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/training.html?lang=' + lang);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    if (narrowFrench) {
      const finalWordLines = await page.locator('h1').evaluate(heading => {
        const text = heading.firstChild;
        const word = document.createRange();
        word.setStart(text, text.textContent.lastIndexOf(' ') + 1);
        word.setEnd(text, text.length);
        return word.getClientRects().length;
      });
      expect(finalWordLines).toBe(1);
    }
    const choose = page.getByRole('link', { name: text.action });
    if (info.project.use.isMobile) {
      await choose.tap();
    } else {
      await choose.focus();
      await choose.press('Enter');
    }
    await expect(page).toHaveURL(/#trainingen$/);
    await expect(page.locator('#trainingen-h')).toBeInViewport();
    const programmes = page.locator('.ac-program');
    await expect(programmes.locator('.ac-team')).toHaveText(text.teams);
    for (const [index, name] of text.links.entries()) {
      const programme = programmes.nth(index);
      const photo = programme.locator('img');
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      const link = programme.getByRole('link', { name });
      await expect(link).toHaveAttribute('href', 'afspraak.html?onderwerp=training&lang=' + lang);
      await expect(link).toHaveCSS('min-height', '44px');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).include('#trainingen').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(accessibility.violations).toEqual([]);

    const appointment = programmes.nth(1).getByRole('link', { name: text.links[1] });
    if (info.project.use.isMobile) await appointment.tap();
    else await appointment.click();
    await expect(page).toHaveURL(/\/afspraak\.html\?onderwerp=training/);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('input[value="training"]')).toBeChecked();
  });
}
