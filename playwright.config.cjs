const {defineConfig,devices}=require('playwright/test');
const critical=['**/smoke.spec.cjs','**/contact.spec.cjs','**/site.spec.cjs','**/critical-flows.spec.cjs','**/cache-transition.spec.cjs'];
module.exports=defineConfig({
  testDir:'./tests/browser',timeout:45000,fullyParallel:true,
  forbidOnly:!!process.env.CI,failOnFlakyTests:!!process.env.CI,retries:process.env.CI?1:0,
  reporter:[['list'],['html',{open:'never'}],['junit',{outputFile:'test-results/e2e.xml'}],['./tests/reporters/quality.cjs']],
  use:{baseURL:'http://127.0.0.1:4173',launchOptions:process.env.TEST_BROWSER_EXECUTABLE?{executablePath:process.env.TEST_BROWSER_EXECUTABLE}:{},trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'node scripts/server.cjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},
  projects:[
    {name:'firefox',testMatch:critical,use:{...devices['Desktop Firefox'],launchOptions:{}}},
    {name:'webkit',testMatch:critical,use:{...devices['Desktop Safari'],launchOptions:{}}},
    {name:'mobile-webkit',testMatch:critical,use:{...devices['iPhone 13'],defaultBrowserType:'webkit',launchOptions:{}}},
    {name:'chromium',use:{...devices['Desktop Chrome']}},
    {name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}
  ]
});


