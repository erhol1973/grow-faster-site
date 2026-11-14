'use strict';
const {test,expect}=require('playwright/test');
const project='https://gqsvoioccvklzfmdmexy.supabase.co';
async function setup(page,admin,language='nl') {
  const calls=[];
  await page.addInitScript(lang=>{
    localStorage.setItem('avs-lang',lang);
    localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));
  },language);
  await page.route('**/assets/cms-config.js*',route=>route.fulfill({contentType:'text/javascript',
    body:'window.GF_CMS_CONFIG='+JSON.stringify({url:project,key:'sb_publishable_fixture'})}));
  await page.route(project+'/**',async route=>{
    const req=route.request(), pathname=new URL(req.url()).pathname;
    calls.push(pathname);
    const responses={
      '/auth/v1/token':{access_token:'test.member.session',expires_in:3600},
      '/auth/v1/user':{id:'local-member',email:'reader@example.test',email_confirmed_at:'2026-11-12'},
      '/rest/v1/rpc/member_has_access':true,'/rest/v1/rpc/cms_is_admin':admin,
      '/rest/v1/page_sections':[],'/rest/v1/cms_publications':[],'/auth/v1/logout':{}
    };
    const preflight=req.method()==='OPTIONS';
    const status=preflight || Object.hasOwn(responses,pathname)?200:404;
    await route.fulfill({status,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*',
      'content-type':'application/json'},body:JSON.stringify(preflight?{}:responses[pathname]??{})});
  });
  return calls;
}
async function openNavigation(page){
  const burger=page.locator('#burger');
  if(await burger.isVisible() && !await page.locator('#navlist').isVisible()) await burger.click();
}
async function login(page,language){
  const target='/books.html?lang='+language+'#design-for-coherence';
  await page.goto('/account.html?lang='+language+'&return='+encodeURIComponent(target));
  await page.locator('#member-email').fill('reader@example.test');
  await page.locator('#member-password').fill('fixture');
  await Promise.all([page.waitForURL(url=>url.pathname==='/books.html' && url.hash==='#design-for-coherence'),page.locator('#submit').click()]);
  expect(new URL(page.url()).searchParams.get('lang')).toBe(language);
  await openNavigation(page);
}
test('ordinary member returns to the French book and is refused direct CMS access',async({page})=>{
  const calls=await setup(page,false,'fr');
  await login(page,'fr');
  await page.locator('.member-nav summary').click();
  await expect(page.locator('.member-nav summary')).toHaveText('Mon compte');
  await expect(page.locator('.member-nav a[href="/admin"]')).toHaveCount(0);
  await page.goto('/admin.html');
  await expect(page.locator('#login-panel')).toBeVisible();
  await expect(page.locator('#workspace')).toBeHidden();
  await page.evaluate(()=>window.GFMember.getAdminSession());
  expect(calls).not.toContain('/rest/v1/page_sections');
});
test('authorized administrator enters Contentstudio through the menu without a second password',async({page})=>{
  const calls=await setup(page,true);
  await login(page,'nl');
  await page.locator('.member-nav summary').click();
  await page.getByRole('link',{name:'Contentstudio openen'}).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#login-panel')).toBeHidden();
  expect(calls.filter(p=>p==='/auth/v1/token').length).toBe(1);
  expect(calls).toContain('/rest/v1/page_sections');
});
test('anonymous visitor and expired tab show only the sign-in action',async({page})=>{
  await setup(page,true);
  await page.goto('/index.html');
  await openNavigation(page);
  await expect(page.locator('.member-nav')).toHaveText('Aanmelden');
  await login(page,'nl');
  await expect(page.locator('.member-nav summary')).toHaveText('Mijn account');
  await page.evaluate(()=>{
    const key='gf.member.v1.'+window.GF_CMS_CONFIG.url;
    const session=JSON.parse(sessionStorage.getItem(key));
    session.end=Date.now()-1;
    sessionStorage.setItem(key,JSON.stringify(session));
    return window.GFMember.ready();
  });
  await expect(page.locator('.member-nav')).toHaveText('Aanmelden');
  await expect(page.locator('.member-nav a[href="/admin"]')).toHaveCount(0);
});
