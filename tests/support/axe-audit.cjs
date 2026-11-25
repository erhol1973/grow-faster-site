'use strict';
// Same WCAG 2.2 AA tag set and reporting as tests/browser/accessibility.spec.cjs, shared for page-specific audits (25 Nov 2026).
const {expect}=require('playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
async function audit(page,info,label){
  // Render all offscreen chapters for a complete contrast audit.
  await page.addStyleTag({content:'*{content-visibility:visible!important}'});
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  await info.attach(label,{body:JSON.stringify(result,null,2),contentType:'application/json'});
  expect(result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
}
module.exports={audit};
