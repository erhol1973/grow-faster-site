// Heuristic source checks supplement dependency/secret scanners; not a penetration test.
const fs=require('node:fs'),path=require('node:path');
function inspectText(name,s){const findings=[];for(const [rule,re]of [['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['GitHub token',/\bgh[pousr]_[A-Za-z0-9]{30,}\b/],['AWS access key',/\bAKIA[A-Z0-9]{16}\b/],['executable URL',/(?:href|src)\s*=\s*["']\s*javascript:/i]])if(re.test(s))findings.push(`${name}: ${rule}`);return findings}
function scan(root){const errors=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(html|js|json|css|svg)$/.test(p))errors.push(...inspectText(path.relative(root,p),fs.readFileSync(p,'utf8')))}}walk(root);return errors}
module.exports={inspectText,scan};
if(require.main===module){const errors=scan(path.resolve(__dirname,'..','dist'));console.log(errors.length?errors.join('\n'):'Deployment artifact security checks passed (heuristic scope).');if(errors.length)process.exitCode=1}
