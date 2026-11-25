'use strict';
// Minimal, dependency-free HTML tree for structural assertions on built pages (25 Nov 2026, homepage redesign).
// It is not a conforming HTML5 parser: it handles the markup this site writes (void elements, comments, raw-text
// script/style, quoted attributes, implied </p> and </li>). Unbalanced closing tags are ignored instead of guessed.
const VOID=new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);
const RAW=new Set(['script','style']);
const decode=s=>s.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
function attrs(src){const out={};for(const m of src.matchAll(/([^\s"'=<>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g))out[m[1].toLowerCase()]=decode(m[2]??m[3]??m[4]??'');return out}
function parse(html){
  const root={tag:'#root',attrs:{},children:[],parent:null};let cur=root,i=0;
  const close=tag=>{let n=cur;while(n&&n!==root&&n.tag!==tag)n=n.parent;if(n&&n!==root)cur=n.parent};
  while(i<html.length){
    if(html.startsWith('<!--',i)){const e=html.indexOf('-->',i+4);i=e<0?html.length:e+3;continue}
    if(html[i]==='<'&&html[i+1]==='!'){const e=html.indexOf('>',i);i=e<0?html.length:e+1;continue}
    const m=html[i]==='<'?/^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/.exec(html.slice(i,i+4000)):null;
    if(!m){const e=html.indexOf('<',i+1);const end=e<0?html.length:e;cur.children.push({text:decode(html.slice(i,end)),parent:cur});i=end;continue}
    const tag=m[2].toLowerCase();i+=m[0].length;
    if(m[1]){close(tag);continue}
    // Implied end tags used in hand-written markup.
    if(tag==='li'&&cur.tag==='li')cur=cur.parent;
    if(tag==='p'&&cur.tag==='p')cur=cur.parent;
    const el={tag,attrs:attrs(m[3]),children:[],parent:cur};cur.children.push(el);
    if(RAW.has(tag)){const e=html.toLowerCase().indexOf('</'+tag,i);el.children.push({text:html.slice(i,e<0?html.length:e),parent:el,raw:true});i=e<0?html.length:html.indexOf('>',e)+1;continue}
    if(!VOID.has(tag)&&!/\/\s*$/.test(m[3]))cur=el;
  }
  return root;
}
const isEl=n=>n&&n.tag!==undefined;
function walk(n,fn){for(const c of n.children||[]){if(isEl(c)){fn(c);walk(c,fn)}}}
function all(n,pred){const out=[];walk(n,e=>{if(pred(e))out.push(e)});return out}
const byId=(n,id)=>all(n,e=>e.attrs.id===id)[0];
const classes=e=>(e.attrs.class||'').split(/\s+/).filter(Boolean);
const text=n=>n.text!==undefined?(n.raw?'':n.text):(['script','style'].includes(n.tag)?'':n.children.map(text).join(''));
const norm=s=>s.replace(/\s+/g,' ').trim();
// Text segments as assets/site.js translates them: one key per non-empty text node, skipping
// script, style, output, [data-dyn], [data-notr] and [data-ih] subtrees (the latter are translated as HTML).
const SKIP=e=>['script','style','output'].includes(e.tag)||'data-dyn' in e.attrs||'data-notr' in e.attrs||'data-ih' in e.attrs;
function segments(n){const out=[];(function rec(x){for(const c of x.children||[]){if(isEl(c)){if(!SKIP(c))rec(c)}else if(!c.raw){const k=norm(c.text);if(k)out.push(k)}}})(n);if(isEl(n)&&SKIP(n))return[];return out}
const ancestors=e=>{const out=[];for(let p=e.parent;p;p=p.parent)out.push(p);return out};
const before=(root,a,b)=>{let seen=null;walk(root,e=>{if(seen===null&&(e===a||e===b))seen=e});return seen===a&&a!==b};
module.exports={parse,all,byId,classes,text,norm,segments,ancestors,before,isEl,decode};
