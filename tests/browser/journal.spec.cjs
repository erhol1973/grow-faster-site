const {test,expect}=require('playwright/test');
// Release 2 (23 Nov 2026, owner decision): the Maandelijks Magazine for kmo's replaces the Executive Journal reader (Monthly Issue 01,
// page navigation and HubSpot subscription). Coverage moves to the new page, its menu item, language switch and old French address.
test.beforeEach(async({page})=>{await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))})});
test('Maandelijks Magazine opens from the menu and switches language without losing the page',async({page},info)=>{
 await page.goto('/index.html');if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
 await page.locator('#navlist a.l[href="journal.html"]').click();await expect(page).toHaveURL(/\/journal\.html$/);
 await expect(page.locator('h1')).toHaveText('Grow Faster Magazine');await expect(page.locator('#navlist a.l[href="journal.html"]')).toHaveAttribute('aria-current','page');
 await expect(page.locator('#editie-1 h2')).toHaveText('Overtypen, de verspilling die niemand ziet');
 await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();
 await expect(page.locator('html')).toHaveAttribute('lang','fr');await expect(page).toHaveURL(/\/journal\.html$/);
 await expect(page.locator('#editie-1 h2')).toHaveText('La ressaisie, le gaspillage que personne ne voit');
 await expect(page.locator('#hero-abo')).toHaveAttribute('href','mailto:info@grow-faster.be?subject=Magazine');
 await expect(page.locator('main form')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('the old French Executive Journal address lands on the Maandelijks Magazine in French',async({page})=>{
 await page.goto('/journal-fr.html');await expect(page).toHaveURL(/\/journal\.html\?lang=fr$/);await expect(page.locator('html')).toHaveAttribute('lang','fr');
 await expect(page.locator('h1')).toHaveText('Grow Faster Magazine');
});

// Edition 1 (24 Nov 2026): the full article renders in both languages, including the keys loaded from i18n-journal.js.
test('edition 1 reads in Dutch and French, table and sources included, without horizontal overflow',async({page})=>{
 await page.goto('/journal.html');
 await expect(page.locator('#editie-1 .editie h3')).toHaveText(['Overtypen, de verspilling die niemand ziet','Inhoud','Van de redactie','De verspilling','Waar overtypen zit: zes plekken in de kmo','Eén voorbeeld','Waarom niemand het ziet','De aanpak','Welke taak eerst?','Twee weken tellen: het formulier','Wat het oplevert','Wat Orion doet, en wat niet','Veelgestelde vragen','Checklist: is deze taak klaar om te automatiseren?','Bronnen','Colofon','Herkent u deze verspilling?','December 2026']);
 await expect(page.locator('#editie-1 .editie-stappen:not(.fb-plekken) li')).toHaveCount(4);await expect(page.locator('#editie-1 .fb-plekken li')).toHaveCount(6);
 await expect(page.locator('#editie-1 .editie-tabel:not(.fb-formulier) tbody tr')).toHaveCount(3);await expect(page.locator('#editie-1 .fb-formulier tbody tr')).toHaveCount(5);
 await expect(page.locator('#editie-1 .editie-bronnen a').first()).toHaveAttribute('href','https://doi.org/10.1136/bmjopen-2012-002406');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();
 await expect(page.locator('#editie-1 .editie h3')).toHaveText(['La ressaisie, le gaspillage que personne ne voit','Sommaire','Le mot de la rédaction','Le gaspillage','Où se cache la ressaisie : six endroits dans la PME','Un exemple','Pourquoi personne ne la voit','L’approche','Quelle tâche en premier ?','Compter pendant deux semaines : le formulaire','Ce que cela rapporte','Ce qu’Orion fait, et ce qu’il ne fait pas','Questions fréquentes','Check-list : cette tâche est-elle prête à être automatisée ?','Sources','Colophon','Reconnaissez-vous ce gaspillage ?','Décembre 2026']);
 await expect(page.locator('#editie-1 .editie-stappen strong').first()).toHaveText('Comptez d’abord.');
 await expect(page.locator('#editie-1 .editie-tabel th').first()).toHaveText('Ce que vous mesurez');
 await expect(page.locator('#editie-1 .eyebrow')).toHaveText('Première édition, novembre 2026');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

// Flipboek (24 Nov 2026, owner request): the edition reads as a magazine with pages that turn, two pages side by side on a wide
// screen and one page on a phone. Pages that are not shown are inert, so links on them cannot take keyboard focus.
test('edition 1 turns its pages with the buttons and the arrow keys, and every page fits its sheet',async({page},info)=>{
 await page.goto('/journal.html');
 const nr=page.locator('#fb-nr'),mobile=info.project.name.startsWith('mobile');
 await expect(nr).toHaveText('1 / 22');
 await expect(page.locator('#fb-vorige')).toBeDisabled();
 await expect(page.locator('[data-pagina="1"] .fb-titel')).toBeVisible();
 await page.locator('#fb-volgende').click();
 await expect(nr).toHaveText(mobile?'2 / 22':'2 - 3 / 22');
 await expect(page.locator('[data-pagina="2"] h3')).toBeVisible();
 await expect(page.locator('[data-pagina="21"]')).toHaveAttribute('inert','');
 await page.locator('#fb-volgende').focus();await page.keyboard.press('ArrowRight');
 await expect(nr).toHaveText(mobile?'3 / 22':'4 - 5 / 22');
 await page.keyboard.press('ArrowLeft');
 await expect(nr).toHaveText(mobile?'2 / 22':'2 - 3 / 22');
 for(let i=0;i<24;i++)await page.locator('#fb-volgende').click({force:true}).catch(()=>{});
 await expect(nr).toHaveText('22 / 22');
 await expect(page.locator('#fb-volgende')).toBeDisabled();
 await expect(page.locator('[data-pagina="22"] .fb-titel')).toHaveText('December 2026');
 await expect.poll(()=>page.locator('[data-pagina="1"] img').evaluate(i=>i.complete&&i.naturalWidth>0&&/magazine-editie-1-omslag-(700|1400)\.webp$/.test(i.currentSrc))).toBe(true);
 // No page may need to scroll: text that falls off a sheet is unreadable.
 const overflow=await page.evaluate(()=>[...document.querySelectorAll('.fb-pagina')].map(p=>{const r=p.getBoundingClientRect();let max=0;for(const e of p.querySelectorAll('h3,p,li,td,th,a'))max=Math.max(max,e.getBoundingClientRect().bottom-r.bottom);return p.dataset.pagina+':'+Math.round(max)}).filter(s=>+s.split(':')[1]>0));
 expect(overflow).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
