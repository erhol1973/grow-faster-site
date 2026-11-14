const {test,expect}=require('playwright/test');

for (const locale of [
  {lang:'nl',heading:'Maak je gratis account aan',next:'Volgende',edit:'E-mailadres wijzigen',create:'Account aanmaken',terms:'gebruiksvoorwaarden',privacy:'privacybeleid',sent:'Controleer je mailbox'},
  {lang:'fr',heading:'Créez votre compte gratuit',next:'Continuer',edit:'Modifier l’adresse e-mail',create:'Créer mon compte',terms:'conditions d’utilisation',privacy:'politique de confidentialité',sent:'Consultez votre messagerie'}
]) {
  test('email-first registration, correction and confirmation in '+locale.lang,async({page})=>{
    const project='https://gqsvoioccvklzfmdmexy.supabase.co';
    await page.route('**/assets/cms-config.js*',route=>route.fulfill({contentType:'text/javascript',
      body:'window.GF_CMS_CONFIG='+JSON.stringify({url:project,key:'sb_publishable_fixture'})}));
    const calls=[];
    await page.route(project+'/**',async route=>{
      const request=route.request();
      if(request.method()!=='OPTIONS') {
        expect(new URL(request.url()).pathname).toBe('/auth/v1/signup');
        calls.push(request.postDataJSON());
      }
      await route.fulfill({json:{},headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'}});
    });
    await page.goto('/account?mode=signup&lang='+locale.lang+'&return=%2Fjournal-fr.html');
    await expect(page.getByRole('heading',{name:locale.heading})).toBeVisible();
    await expect(page.locator('#member-password')).toBeHidden();
    await expect(page.getByRole('link',{name:locale.terms})).toHaveAttribute('href','/terms.html?lang='+locale.lang);
    await expect(page.getByRole('link',{name:locale.privacy})).toHaveAttribute('href','/privacy.html?lang='+locale.lang);
    await expect(page.locator('[data-lang="fr"]')).toHaveAttribute('href',/mode=signup/);
    await page.getByRole('button',{name:locale.next}).click();
    await expect(page.locator('#member-password')).toBeHidden();
    await page.locator('#member-email').fill('first@example.test');
    await page.getByRole('button',{name:locale.next}).click();
    await expect(page.locator('#member-password')).toBeFocused();
    await expect(page.locator('#chosen-email')).toHaveText('first@example.test');
    await page.getByRole('button',{name:locale.edit}).click();
    await expect(page.locator('#member-email')).toBeFocused();
    await page.locator('#member-email').fill('second@example.test');
    await page.getByRole('button',{name:locale.next}).click();
    await page.locator('#member-password').fill('short');
    await page.getByRole('button',{name:locale.create}).click();
    await expect(page.locator('#member-password')).toBeVisible();
    expect(calls).toEqual([]);
    await page.locator('#member-password').fill('A fixture passphrase.');
    await page.getByRole('button',{name:locale.create}).click();
    await expect(page.getByRole('status')).toContainText(locale.sent);
    expect(calls).toHaveLength(1);
    expect(calls[0].email).toBe('second@example.test');
    await expect(page.locator('#member-password')).toHaveValue('');
  });
}
