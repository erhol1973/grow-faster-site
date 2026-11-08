(function(root){
  'use strict';
  function createClient(config,transport=fetch){
    if(!config || !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(config.url))throw Error('Ongeldige projectconfiguratie.');
    let session=null;
    async function request(path,{method='GET',body,auth=false}={}){
      if(!config.key)throw Error('De publieke Supabase-sleutel is nog niet ingesteld.');
      if(auth&&(!session||session.expires_at<=Date.now())){session=null;throw Error('Je sessie is verlopen. Meld je opnieuw aan.');}
      const response=await transport(config.url+path,{method,cache:'no-store',headers:{apikey:config.key,...(session&&auth?{Authorization:'Bearer '+session.access_token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
      const data=await response.json().catch(()=>null);
      if(!response.ok){if(response.status===401)session=null;throw Error(response.status===409||data?.code==='40001'?'Deze inhoud is elders gewijzigd. Herlaad voordat je verdergaat.':response.status===401||response.status===403?'Geen toegang. Meld je aan als beheerder.':data?.message||'De aanvraag is mislukt. Probeer opnieuw.');}
      return data;
    }
    return {
      request,
      async login(email,password){const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});session={access_token:result.access_token,expires_at:Date.now()+result.expires_in*1000};try{if(await request('/rest/v1/rpc/cms_is_admin',{method:'POST',body:{},auth:true})!==true)throw Error('Dit account heeft geen beheerdersrechten.');}catch(e){session=null;throw e;}},
      async logout(){try{if(session)await request('/auth/v1/logout',{method:'POST',auth:true});}finally{session=null;}},
      list:()=>request('/rest/v1/page_sections?select=*&order=page_slug,sort_order,section_key',{auth:true}),
      save:(id,expected,data)=>request('/rest/v1/rpc/cms_save_section',{method:'POST',auth:true,body:{section_id:id,expected_updated_at:expected,content:data}}),
      publish:(id,expected)=>request('/rest/v1/rpc/cms_publish_section',{method:'POST',auth:true,body:{section_id:id,expected_updated_at:expected}}),
      published:page=>request('/rest/v1/cms_publications?select=content&page_slug=eq.'+encodeURIComponent(page)),
      async media(path,auth=false){if(!/^[a-f0-9-]+\.(jpg|png|webp|avif|mp4)$/.test(path))throw Error('Ongeldig mediapad.');const data=await request('/storage/v1/object/sign/cms-media/'+path,{method:'POST',body:{expiresIn:300},auth});return new URL(config.url+'/storage/v1'+data.signedURL).href;},
      async upload(file){const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif','video/mp4':'mp4'};if(!extensions[file.type]||file.size>26214400||file.size===0)throw Error('Kies JPG, PNG, WebP, AVIF of MP4 van maximaal 25 MB.');if(!session||session.expires_at<=Date.now())throw Error('Meld je opnieuw aan.');const path=crypto.randomUUID()+'.'+extensions[file.type];const res=await transport(config.url+'/storage/v1/object/cms-media/'+path,{method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+session.access_token,'Content-Type':file.type,'Cache-Control':'max-age=60'},body:file,signal:AbortSignal.timeout(120000)});if(!res.ok)throw Error('Upload mislukt; het concept is niet gewijzigd.');return path;}
    };
  }
  if(typeof module==='object')module.exports={createClient};else root.GFCms={createClient};
})(typeof window==='object'?window:globalThis);
