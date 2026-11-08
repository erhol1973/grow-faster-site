/* Published snapshots only. A backend outage leaves the original website usable. */
(function(){
  'use strict';
  const config=window.GF_CMS_CONFIG;
  const client=window.GFCms.createClient(config),page=document.body.dataset.cmsPage;
  if(!page)return;
  let records=[],generation=0,previewUrls={};
  async function render(){const current=++generation,lang=document.documentElement.lang==='fr'?'fr':'nl';
    for(const record of records){const fields=record.settings?.fields||{};
      for(const [key,value] of Object.entries(fields)){
        const node=document.querySelector('[data-cms="'+CSS.escape(key)+'"]');if(!node)continue;
        if(value.type==='text'&&typeof value[lang]==='string'){
          if(node.hasAttribute('data-cms-heading')){const [first,...rest]=value[lang].split('\n');node.replaceChildren(document.createTextNode(first));if(rest.length){const em=document.createElement('em');em.textContent=rest.join(' ');node.append(document.createTextNode(' '),em);}}
          else node.textContent=value[lang];
        }
        if(value.type==='media'&&value.path){try{const url=previewUrls[value.path]||await client.media(value.path);if(current!==generation)return;
          if(node.tagName==='IMG'){node.closest('picture')?.querySelectorAll('source').forEach(s=>s.remove());node.removeAttribute('srcset');node.src=url;node.alt=value.alt?.[lang]||'';}
          else if(node.tagName==='VIDEO'){node.src=url;node.hidden=false;node.closest('[data-cms-video-section]').hidden=false;node.load();}
        }catch{ /* Keep existing media if signing fails. */ }}
      }
    }
  }
  document.addEventListener('gf:language',render);
  if(new URLSearchParams(location.search).has('cms-preview')&&parent!==window){
    addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='gf:preview')return;previewUrls=Object.fromEntries(Object.entries(event.data.urls||{}).filter(([,url])=>{try{return new URL(url).origin===config.url;}catch{return false;}}));records=[event.data.content];render();});
    parent.postMessage({type:'gf:preview-ready'},location.origin);
    return;
  }
  if(!config?.key)return;
  client.published(page).then(data=>{records=data.map(r=>r.content);render();}).catch(()=>{});
})();
