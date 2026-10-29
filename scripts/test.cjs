const fs=require('node:fs'),{spawnSync}=require('node:child_process');
fs.mkdirSync('reports',{recursive:true});
const result=spawnSync(process.execPath,['--test','--test-reporter=spec','--test-reporter-destination=stdout','--test-reporter=junit','--test-reporter-destination=reports/unit.xml','tests/*.test.cjs'],{stdio:'inherit'});
if(fs.existsSync('reports/unit.xml')){fs.mkdirSync('reports/unit-history',{recursive:true});fs.copyFileSync('reports/unit.xml','reports/unit-history/'+new Date().toISOString().replaceAll(':','-')+'.xml')}
process.exitCode=result.status===null?1:result.status;
