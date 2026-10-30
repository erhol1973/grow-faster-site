const fs=require('node:fs'),path=require('node:path');
class QualityReporter{
  onBegin(config,suite){this.suite=suite}
  onEnd(result){
    const cases=this.suite.allTests().map(t=>({title:t.titlePath().join(' > '),outcome:t.outcome(),attempts:t.results.length,annotations:t.annotations}));
    const summary={status:result.status,registered:cases.length,passed:cases.filter(t=>t.outcome==='expected').length,failed:cases.filter(t=>t.outcome==='unexpected').length,flaky:cases.filter(t=>t.outcome==='flaky').length,skipped:cases.filter(t=>t.outcome==='skipped').length,cases};
    const unreviewedSkips=cases.filter(t=>t.outcome==='skipped'&&!t.annotations.some(a=>a.type==='skip'&&a.description));summary.unreviewedSkips=unreviewedSkips.length;
    fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/browser-summary.json',JSON.stringify(summary,null,2));
    const md=`## Browser quality\n\n| Registered | Passed | Failed | Flaky | Skipped |\n|---:|---:|---:|---:|---:|\n|${summary.registered}|${summary.passed}|${summary.failed}|${summary.flaky}|${summary.skipped}|\n\nSkips and retries are recorded individually in browser-summary.json.\n`;
    fs.writeFileSync('reports/browser-summary.md',md);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md);
    if(process.env.CI&&(summary.flaky||summary.unreviewedSkips))return{status:'failed'};
  }
}
module.exports=QualityReporter;
