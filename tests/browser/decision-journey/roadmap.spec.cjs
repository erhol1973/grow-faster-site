'use strict';
const {test,expect}=require('playwright/test');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs/promises');
const step=(page,n)=>page.locator('#journey button').nth(n);
async function plan(page,lang='nl'){
 await page.goto('/decision-journey/');if(lang==='fr')await page.locator('[data-language="fr"]').click();
 await step(page,1).click();await page.locator('#dimension-process').check();await step(page,3).click();
 await expect(page.locator('.plan-action')).toHaveCount(6);
}
async function expand(page,id='a-1'){const card=page.locator('#roadmap-action-'+id);if(!(await card.getAttribute('open')!==null))await card.locator('summary').click();return card;}
test('plan edits preserve focus, refresh dependency labels, compute calendar windows and export a single combined dossier',async({page},info)=>{
 await plan(page);await page.locator('#roadmap-startDate').fill('2026-11-27');
 await expect(page.locator('#roadmap-review-0')).toContainText('2026-12-26');await expect(page.locator('#roadmap-review-1')).toContainText('2027-01-25');await expect(page.locator('#roadmap-review-2')).toContainText('2027-02-24');await expect(page.locator('#roadmap-end')).toContainText('2027-02-24');
 await page.locator('#roadmap-objective').fill('Fictief uitvoeringsdoel');await page.locator('#roadmap-owner').fill('Camille — planverantwoordelijke');await expand(page);
 await page.locator('#action-a-1-title').fill('Bewuste gewijzigde actie');await expect(page.locator('#action-a-1-title')).toBeFocused();await expect(page.locator('#dependency-label-a-2-a-1')).toHaveText('Bewuste gewijzigde actie · a-1');
 await page.locator('#action-a-1-resources').fill('Nog af te spreken: 2 uur sponsor');await page.locator('#action-a-1-baseline').fill('Onbekend — nog te meten');
 await step(page,5).click();await expect(page.locator('#roadmap-report-output')).toContainText('Bewuste gewijzigde actie');await expect(page.locator('#roadmap-report-output')).toContainText('2027-02-24');
 const event=page.waitForEvent('download');await page.locator('.report-tools button').first().click();const download=await event,dest=info.outputPath('combined-roadmap.md');await download.saveAs(dest);const text=await fs.readFile(dest,'utf8');expect(text).toContain('Camille — planverantwoordelijke');expect(text).toContain('Onbekend — nog te meten');expect(text).toContain('Nog af te spreken: 2 uur sponsor');expect(text.match(/90-DAGENPLAN — FICTIEF VOORSTEL/g)).toHaveLength(1);expect(text).toContain('11.');
 await page.emulateMedia({media:'print'});await expect(page.locator('#roadmap-report-output')).toBeVisible();await expect(page.locator('#report-output')).toBeVisible();
});
test('Canvas changes block export until explicit review; review preserves edits and regeneration requires confirmation',async({page})=>{
 await plan(page);await page.locator('#roadmap-objective').fill('Behoud mijn plan');await expand(page);await page.locator('#action-a-1-title').fill('Behoud mijn actie');
 await step(page,2).click();await page.locator('#field-question').fill('Nieuwe fictieve bronvraag');await step(page,5).click();await expect(page.locator('#error-summary')).toBeFocused();await expect(page.locator('#roadmap-source')).toHaveClass(/is-stale/);await expect(page.locator('#report-output')).toHaveCount(0);
 await page.getByRole('button',{name:'Herbeoordelen en bron opnieuw koppelen',exact:true}).click();await expect(page.locator('#roadmap-source')).not.toHaveClass(/is-stale/);await expect(page.locator('#roadmap-objective')).toHaveValue('Behoud mijn plan');await expand(page);await expect(page.locator('#action-a-1-title')).toHaveValue('Behoud mijn actie');
 await step(page,5).click();await expect(page.locator('#report-output')).toContainText('Nieuwe fictieve bronvraag');await step(page,3).click();
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Nieuw actievoorstel maken',exact:true}).click();await expect(page.locator('#roadmap-objective')).toHaveValue('Behoud mijn plan');
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Nieuw actievoorstel maken',exact:true}).click();await expect(page.locator('#roadmap-objective')).toHaveValue('Nieuwe fictieve bronvraag');await expand(page);await expect(page.locator('#action-a-1-title')).not.toHaveValue('Behoud mijn actie');
});
test('schedule and dependency errors focus editable controls; completion requires an unverified user note',async({page})=>{
 await plan(page);await expand(page);await page.locator('#action-a-1-startDay').fill('0');await step(page,5).click();await expect(page.locator('#error-summary')).toBeFocused();await page.locator('#error-summary a').first().click();await expect(page.locator('#action-a-1-startDay')).toBeFocused();await page.locator('#action-a-1-startDay').fill('1');
 await page.locator('#action-a-1-depends-a-2').check();await step(page,5).click();await expect(page.locator('#error-summary')).toContainText('voorgangers');await expect(page.locator('#report-output')).toHaveCount(0);await page.locator('#action-a-1-depends-a-2').uncheck();
 await page.locator('#action-a-1-status').selectOption('done');await step(page,5).click();await expect(page.locator('#error-summary')).toContainText('bewijsaanduiding');await page.locator('#error-summary a').first().click();await expect(page.locator('#action-a-1-evidence')).toBeFocused();await page.locator('#action-a-1-evidence').fill('Fictieve gebruikersnotitie — niet gecontroleerd');
 await step(page,5).click();await expect(page.locator('#roadmap-report-output')).toContainText('Fictieve gebruikersnotitie');await expect(page.locator('#roadmap-report-output')).toContainText(/niet (onafhankelijk )?gecontroleerd|niet geverifieerd/);
});
test('CRUD refuses referenced deletion, adds an editable action and resets the plan only on confirmed case change',async({page})=>{
 await plan(page);await expand(page);page.once('dialog',d=>d.accept());await page.locator('#roadmap-action-a-1 .remove-action').click();await expect(page.getByRole('status')).toContainText('afhankelijke');await expect(page.locator('.plan-action')).toHaveCount(6);
 await page.locator('#roadmap-add-action').click();await expect(page.locator('.plan-action')).toHaveCount(7);await expect(page.locator('#action-a-7-title')).toBeFocused();await page.locator('#action-a-7-title').fill('Mijn nieuwe actie');await step(page,5).click();await expect(page.locator('#error-summary')).toBeFocused();
 page.once('dialog',d=>d.accept());await page.locator('#roadmap-action-a-7 .remove-action').click();await expect(page.locator('.plan-action')).toHaveCount(6);await page.locator('#roadmap-objective').fill('Plan van eerste casus');await step(page,0).click();page.once('dialog',d=>d.dismiss());await page.locator('.case-card').nth(1).click();await step(page,3).click();await expect(page.locator('#roadmap-objective')).toHaveValue('Plan van eerste casus');
 await step(page,0).click();page.once('dialog',d=>d.accept());await page.locator('.case-card').nth(1).click();await step(page,1).click();await page.locator('#dimension-process').check();await step(page,3).click();await expect(page.locator('#roadmap-objective')).not.toHaveValue('Plan van eerste casus');await expect(page.locator('.plan-action')).toHaveCount(6);
});
test.describe('expanded narrow plan editor',()=>{
 test.use({viewport:{width:320,height:850}});
 test('NL/FR language preserves plan input and expanded editor plus validation errors meet axe checks',async({page},info)=>{
  await plan(page);await page.locator('#roadmap-owner').fill('Alex — bewaar dit');await expand(page);await page.locator('#action-a-1-title').fill('<img src=x onerror="window.injected=1">');await page.locator('[data-language="fr"]').click();await expect(page.locator('#roadmap-owner')).toHaveValue('Alex — bewaar dit');await expect(page.locator('#roadmap-source')).not.toHaveClass(/is-stale/);await expand(page);await expect(page.locator('#action-a-1-title')).toHaveValue('<img src=x onerror="window.injected=1">');await page.locator('#action-a-1-owner').fill('');await step(page,5).click();await expect(page.locator('#error-summary')).toBeFocused();
  for(const lang of ['fr','nl']){
   if(lang==='nl'){await page.locator('[data-language="nl"]').click();await step(page,5).click();}
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();await fs.writeFile(info.outputPath('axe-expanded-'+lang+'.json'),JSON.stringify(result,null,2));expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  expect(await page.evaluate(()=>window.injected)).toBeUndefined();await expect(page.locator('.plan-action img')).toHaveCount(0);
 });
});
