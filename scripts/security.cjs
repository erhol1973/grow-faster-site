// Heuristic source checks supplement dependency/secret scanners; not a penetration test.
const fs=require('node:fs'),path=require('node:path');
const publicPolicy=require('./baies-dev-public-policy.cjs');
function inspectSecrets(name,s){const findings=[];for(const [rule,re]of [['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['GitHub token',/\bgh[pousr]_[A-Za-z0-9]{30,}\b/],['AWS access key',/\bAKIA[A-Z0-9]{16}\b/],['executable URL',/(?:href|src)\s*=\s*["']\s*javascript:/i]])if(re.test(s))findings.push(`${name}: ${rule}`);return findings}
function inspectText(name,s){return [...inspectSecrets(name,s),...publicPolicy.inspectPublicText(name,s)];}
function scan(root){const errors=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isSymbolicLink()){errors.push(`${path.relative(root,p)}: artifact symbolic link rejected`);continue;}if(e.isDirectory())walk(p);else if(/\.(html|js|json|css|svg)$/i.test(p))errors.push(...inspectSecrets(path.relative(root,p),fs.readFileSync(p,'utf8')))}}walk(root);return [...errors,...publicPolicy.scanPublicArtifact(root)];}
module.exports={inspectText,scan};
if(require.main===module){const errors=scan(path.resolve(__dirname,'..','dist'));console.log(errors.length?errors.join('\n'):'Deployment artifact security and public-content policy checks passed (heuristic scope).');if(errors.length)process.exitCode=1}
