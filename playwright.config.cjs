const {defineConfig,devices}=require('playwright/test');
const critical=["**/member-access.spec.cjs","**/member-registration.spec.cjs","**/member-invitation.spec.cjs","**/radar-access.spec.cjs","**/cms-recovery.spec.cjs","**/cms.spec.cjs","**/coherence-film-layout.spec.cjs","**/book-reader.spec.cjs","**/books.spec.cjs","**/navigation.spec.cjs","**/workshop.spec.cjs","**/refinements.spec.cjs","**/eca.spec.cjs","**/smoke.spec.cjs","**/contact.spec.cjs","**/site.spec.cjs","**/critical-flows.spec.cjs","**/cache-transition.spec.cjs","**/transformation.spec.cjs","**/editorial.spec.cjs","**/typography-states.spec.cjs","**/typography.spec.cjs","**/decision-journey/*.spec.cjs"];
const baseIgnore=process.env.TEST_E2E_PARTITION==='base'?['**/typography.spec.cjs','**/typography-states.spec.cjs','**/decision-journey/**']:[];

module.exports=defineConfig({
  testDir:'./tests/browser',timeout:45000,fullyParallel:true,
  // Mandatory typography and journey jobs own these cases outside the base partition.
  // With no explicit partition, local runs continue to register every test.
  testIgnore:baseIgnore,
  forbidOnly:!!process.env.CI,failOnFlakyTests:!!process.env.CI,retries:process.env.CI?1:0,
  reporter:[['list'],['html',{open:'never'}],['junit',{outputFile:'test-results/e2e.xml'}],['./tests/reporters/quality.cjs']],
  use:{baseURL:process.env.TEST_BASE_URL||'http://127.0.0.1:4173',launchOptions:process.env.TEST_BROWSER_EXECUTABLE?{executablePath:process.env.TEST_BROWSER_EXECUTABLE}:{},trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'node scripts/server.cjs --cms-test',url:process.env.TEST_BASE_URL||'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},
  projects:[
    {name:'firefox',testMatch:critical,use:{...devices['Desktop Firefox'],launchOptions:{}}},
    {name:'webkit',testMatch:critical,use:{...devices['Desktop Safari'],launchOptions:{}}},
    {name:'mobile-webkit',testMatch:critical,testIgnore:[...baseIgnore,'**/decision-journey/tablet.spec.cjs'],use:{...devices['iPhone 13'],defaultBrowserType:'webkit',launchOptions:{}}},
    {name:'chromium',use:{...devices['Desktop Chrome']}},
    {name:'mobile',testIgnore:[...baseIgnore,'**/decision-journey/tablet.spec.cjs'],use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}
  ]
});
