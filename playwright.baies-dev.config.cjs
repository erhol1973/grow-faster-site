const {defineConfig}=require('playwright/test');
const base=require('./playwright.config.cjs');
// Exercise the isolated BAEIS flows and accessibility checks on all five profiles.
module.exports=defineConfig({...base,projects:base.projects.map(p=>({...p,testMatch:'**/baies-dev.spec.cjs'}))});
