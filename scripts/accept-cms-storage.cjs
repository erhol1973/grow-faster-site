'use strict';
// Standalone Node 22+ runner. Fixed isolated project; never use a privileged key.
const {randomUUID}=require('node:crypto');
const project='https://gqsvoioccvklzfmdmexy.supabase.co';
const key='sb_publishable_PrzDBgnoLtpUjOLnAM0lfw_up3URiTf';
const email='erlend.hollebosch@proximus.be';
function isBucketRejection(status,body,kind){
 const message=JSON.stringify(body).toLowerCase();
 if(kind==='size')return status===413||(status===400&&/entitytoolarge|payload too large|maximum allowed size|file size.*limit|exceeds.*size/.test(message));
 return [400,415].includes(status)&&/invalidmimetype|mime.*(not supported|not allowed|invalid)|unsupported.*(mime|media)/.test(message);
}
function passwordPrompt(){
 if(!process.stdin.isTTY||!process.stdout.isTTY)throw Error('Run interactively in a terminal; do not pipe credentials.');
 return new Promise((resolve,reject)=>{
  let value='';process.stdout.write('Test-account password (hidden): ');process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');process.stdin.resume();
  function done(){process.stdin.off('data',read);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');}
  function read(text){for(const char of text){if(char==='\u0003'){done();reject(Error('Cancelled'));return;}if(char==='\r'||char==='\n'){done();resolve(value);return;}if(char==='\u007f'||char==='\b')value=value.slice(0,-1);else if(char>=' ')value+=char;}}
  process.stdin.on('data',read);
 });
}
async function main(){
 console.log('ISOLATED CMS STORAGE ACCEPTANCE: growfaster-test only');
 console.log('Account: '+email+'; no password or session token is logged.');
 let token=null,password=await passwordPrompt();
 const headers=()=>({apikey:key,Authorization:'Bearer '+token});
 async function json(path,options={}){const r=await fetch(project+path,{...options,signal:AbortSignal.timeout(120000)});return {status:r.status,ok:r.ok,body:await r.json().catch(()=>null)};}
 const result={project:'gqsvoioccvklzfmdmexy',startedAt:new Date().toISOString(),checks:[]};
 const check=(name,condition)=>{result.checks.push({name,passed:!!condition});if(!condition)throw Error('FAILED: '+name);console.log('PASS: '+name);};
 try{
  const login=await json('/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});password='';
  if(!login.ok||!login.body?.access_token)throw Error('Test login failed. Verify the test-account password.');
  token=login.body.access_token;delete login.body.access_token;delete login.body.refresh_token;
  const admin=await json('/rest/v1/rpc/cms_is_admin',{method:'POST',headers:{...headers(),'Content-Type':'application/json'},body:'{}'});check('Real test administrator Auth',admin.ok&&admin.body===true);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5V8AAAAASUVORK5CYII=','base64');
  const positive=randomUUID()+'.png';
  const upload=(name,type,body)=>json('/storage/v1/object/cms-media/'+name,{method:'POST',headers:{...headers(),'Content-Type':type},body});
  const good=await upload(positive,'image/png',png);check('Allowed PNG upload through Storage gateway',good.ok);result.allowedObject=positive;
  for(const kind of ['mime','size']){
   const name=randomUUID()+'.png';
   const body=kind==='mime'?Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'):Buffer.alloc(26214401);
   if(kind==='size')png.copy(body);
   const response=await upload(name,kind==='mime'?'image/svg+xml':'image/png',body);
   check(kind==='mime'?'Gateway rejects forbidden MIME independently of CMS validation':'Gateway rejects 26214401 bytes above the unchanged 25 MiB limit',!response.ok&&isBucketRejection(response.status,response.body,kind));
   result.checks.at(-1).httpStatus=response.status;result.checks.at(-1).errorCode=response.body?.code||response.body?.error||null;
   const sign=await json('/storage/v1/object/sign/cms-media/'+name,{method:'POST',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({expiresIn:60})});
   check('Rejected '+kind+' upload has no signable object',!sign.ok&&/not.?found|nosuchkey/i.test(JSON.stringify(sign.body)));
  }
  result.status='passed';
 }catch(error){result.status='failed';result.failure=error.message;process.exitCode=1;}
 finally{
  password='';if(token){await json('/auth/v1/logout?scope=local',{method:'POST',headers:headers()}).catch(()=>{});token=null;}
  console.log(JSON.stringify({...result,finishedAt:new Date().toISOString()},null,2));
 }
}
module.exports={isBucketRejection,passwordPrompt,testProject:project,testPublishableKey:key};
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
