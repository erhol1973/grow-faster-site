'use strict';
const fs=require('node:fs'),path=require('node:path');
// Keep raw references during measurement; serialize/compress only after every sample.
function captureCoherenceDiagnostic(result,{production,mode,route,run}){
  if(production||mode!=='mobile'||route!=='/coherence.html'||run!==1)return null;
  return {formatVersion:1,mode,route,run,lighthouseVersion:result.lhr.lighthouseVersion,
    fetchTime:result.lhr.fetchTime,configSettings:result.lhr.configSettings,
    metrics:result.lhr.audits.metrics?.details,trace:result.artifacts?.Trace,devtoolsLog:result.artifacts?.DevtoolsLog};
}
function writeCoherenceDiagnostic(out,diagnostic){
  if(!Array.isArray(diagnostic.trace?.traceEvents)||!Array.isArray(diagnostic.devtoolsLog))throw Error('Expected Lighthouse Trace and DevtoolsLog artifacts');
  const sensitive=name=>/^(authorization|proxy-authorization|apikey|x-api-key|x-auth-token|x-access-token|x-refresh-token|x-csrf-token|cookie|set-cookie)$/i.test(name);
  const secretQuery=name=>/^(access_token|refresh_token|id_token|token|apikey|api_key|api-key|key|signature|sig|credential|authorization|auth|code|client_secret|password|secret|x-amz-signature|x-amz-credential|x-amz-security-token|x-goog-signature|x-goog-credential)$/i.test(name);
  const json=JSON.stringify(diagnostic,(key,value)=>{
    if(sensitive(key)||/cookie|headersText|postData/i.test(key))return undefined;
    if(value&&typeof value==='object'&&typeof value.name==='string'&&sensitive(value.name))return undefined;
    if(key==='headers'&&typeof value==='string')return '[REDACTED]';
    if(typeof value==='string')return value.replace(/([?&])([^=&#\s]+)=([^&#\s]*)/g,(match,separator,name,content)=>{let decoded;try{decoded=decodeURIComponent(name)}catch{return match}return secretQuery(decoded)?separator+name+'=[REDACTED]':match});
    return value;
  });
  const file=path.join(out,'mobile-coherence-1-diagnostic.json.gz');
  fs.writeFileSync(file,require('node:zlib').gzipSync(json));return file;
}
module.exports={captureCoherenceDiagnostic,writeCoherenceDiagnostic};
