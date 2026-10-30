
(function initializeSite(){
  // A cached HTML document may still reference the previous script version.
  const missing=[];if(!window.GFModels)missing.push('models');if(!window.GFConsent)missing.push('consent');
  if(missing.length){Promise.all(missing.map(name=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='assets/'+name+'.js?v=20261029-quality';script.onload=resolve;script.onerror=reject;document.head.appendChild(script)}))).then(initializeSite).catch(()=>console.error('Website support modules could not be loaded'));return}
  document.querySelectorAll('.nav .nav-cta, footer .fcol a[href="about.html#contact"]').forEach(a=>a.setAttribute('href','about.html'));

  // Cached pages may still contain the retired German selector and content.
  document.querySelectorAll('[data-lang="de"], [lang="de"]:not(html), meta[property="og:locale:alternate"][content="de_DE"]').forEach(el=>el.remove());
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  {const _o=IntersectionObserver.prototype.observe;IntersectionObserver.prototype.observe=function(el){if(el instanceof Element)return _o.call(this,el)}}
  const $=s=>document.querySelector(s)||document.createElement("div");
  const LIDX={nl:0,fr:1}, LOCALE={nl:"nl-BE",fr:"fr-BE",en:"en-GB"};
  let LANG="en";
  const t=k=>LANG==="en"?k:(((window.I18N||{})[k]||[])[LIDX[LANG]]||k);

  /* nav progress + active link */
  const prog=$("#progress"), links=[...document.querySelectorAll(".nav a.l")];
  const secs=links.map(a=>{const h=a.getAttribute("href")||"";try{return h.startsWith("#")?document.querySelector(h):null}catch(e){return null}});
  /* hero flow */
  const nodes=[...document.querySelectorAll("#flow .fnode")], hero=$("#hero");
  function onScroll(){
    const y=scrollY, h=document.documentElement.scrollHeight-innerHeight;
    prog.style.width=(h>0?y/h*100:0)+"%";
    let act=-1;secs.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<innerHeight*.35)act=i});
    links.forEach((a,i)=>a.classList.toggle("on",i===act||a.classList.contains("cur")));
    const step=reduce?6:Math.min(6,1+Math.floor(y/Math.max(60,hero.offsetHeight*.09)));
    nodes.forEach((n,i)=>n.classList.toggle("on",i<step));
    stepsProgress();
  }

  /* horizontal vs vertical mini diagrams */
  const hd=$("#hdots");let h="";
  for(let r=0;r<4;r++)for(let c=0;c<16;c++){const x=22+c*23.5,y=18+r*28;h+=`<circle cx="${x}" cy="${y}" r="3.2"/><line x1="${x+5}" y1="${y}" x2="${x+11}" y2="${y}" stroke="var(--ai)"/>`}
  hd.innerHTML=h;
  let v="";[20,92,164,236,308,380].forEach((x,i)=>{v+=`<circle cx="${x}" cy="60" r="${i===5?11:8}" fill="${i===5?'var(--ai)':'var(--bg)'}" stroke="var(--ai)" stroke-width="2"/>`});
  $("#vnodes").innerHTML=v;

  /* value card reveal (border accent only) */
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.3});
  document.querySelectorAll(".vcard").forEach((c,i)=>{c.style.transitionDelay=(i*90)+"ms";io.observe(c)});

  /* before / after */
  const bB=$("#b-before"), bA=$("#b-after"), pB=$("#p-before"), pA=$("#p-after"), par=$("#par");
  function ba(after){bB.setAttribute("aria-pressed",String(!after));bA.setAttribute("aria-pressed",String(after));pB.hidden=after;pA.hidden=!after;}
  bB.onclick=()=>ba(false); bA.onclick=()=>ba(true);

  /* autonomy spectrum */
  const SPEC=[
    ["Assist","AI drafts, searches and summarizes. A human decides and acts. Governance: usage policy and data access."],
    ["Recommend","AI proposes an action with its rationale. A human reviews and chooses. Governance: quality evaluation and transparency."],
    ["Act with approval","The agent prepares the action and executes it after human sign-off. Governance: approval workflows and audit logs."],
    ["Act within boundaries","The agent acts on its own inside defined limits, such as amount, policy or customer segment. Humans monitor and handle what falls outside. Governance: permissions, observability, escalation rules."],
    ["Autonomous execution","The agent runs the routine flow end-to-end. Humans set goals, audit outcomes and stay accountable. Governance: full control layer, continuous evaluation and risk classification."]
  ];
  const spec=$("#spec"), sd=$("#spec-desc");
  SPEC.forEach((s,i)=>{const b=document.createElement("button");b.type="button";b.id="spec-"+i;const hgt=12+i*14;b.style.setProperty("--gw",(16+i*10)+"px");b.innerHTML=`<span class="gov" style="height:${hgt}px"></span><span class="t">${s[0]}</span>`;b.onclick=()=>pick(i);spec.appendChild(b)});
  let curSpec=3;function pick(i){curSpec=i;[...spec.children].forEach((b,k)=>b.setAttribute("aria-pressed",String(k===i)));sd.innerHTML=`<b>${t(SPEC[i][0])}.</b> ${t(SPEC[i][1])}`}
  // applyLang performs the first render once all controls are initialised.

  /* roadmap progress line */
  const stepsEl=$("#steps"), sItems=[...stepsEl.children].filter(e=>e.tagName==="LI");
  function stepsProgress(){
    const r=stepsEl.getBoundingClientRect(), mid=innerHeight*.6;
    const p=Math.max(0,Math.min(1,(mid-r.top)/r.height));
    stepsEl.style.setProperty("--fill",(p*(r.height-16))+"px");
    sItems.forEach(li=>{const t=li.getBoundingClientRect().top;li.classList.toggle("done",t<mid)});
  }


  /* coherence diagnostic */
  const DIM=[["Strategic","Priorities point in one direction.","Link every AI initiative to one business outcome with a sponsor and a KPI. Pause the rest.",4,["Many priorities, no shared outcome", "Priorities agreed, but initiatives compete", "Every initiative tied to one outcome and KPI"]],
    ["Governance","Controls are proportional to risk.","Simplify approval layers and make controls proportional to risk before adding agents.",3,["A new control layer after every incident", "Controls exist, but are rarely pruned", "Controls proportional to risk and reviewed yearly"]],
    ["Decision","Decisions are made fast, at the right level.","Map decision rights and give every handoff one accountable human owner.",2,["Decisions wait for several committees", "Clear owners, but escalations are slow", "One owner decides within days, at the right level"]],
    ["Organizational","Roles and structures fit together.","Clarify roles across units and design how people and agents share the work.",3,["Roles overlap; units work against each other", "Roles clear within units, vague across them", "Roles and structures fit end-to-end"]],
    ["Operational","Work flows end-to-end with few handoffs.","Redesign the process end-to-end before you automate any part of it.",3,["Work changes hands many times; no flow owner", "Some processes owned end-to-end", "Key processes run end-to-end with few handoffs"]],
    ["Transformation","Change is sequenced, not stacked.","Reduce parallel initiatives and sequence the roadmap to what teams can absorb.",2,["Many initiatives stacked in parallel", "A portfolio exists, but change load is not managed", "Change sequenced to what teams can absorb"]],
    ["Technological","Data and platforms connect across units.","Build shared data products and common platforms before you scale agents.",3,["Data locked in silos and spreadsheets", "Shared platforms, but data quality varies", "Shared data products and connected platforms"]],
    ["Adaptive","The organization learns and corrects quickly.","Install short feedback loops, such as a weekly value review, and act on them.",4,["Problems repeat; little is learned", "Reviews happen, but actions lag", "Weekly feedback loops change how work is done"]]];
  const dgScore=DIM.map(d=>d[3]);
  function coh(){
    const rows=document.getElementById("dg-rows"),out=document.getElementById("dg-out");if(!rows||!out)return;
    const {mn:min,bottleneck:bi,avg}=GFModels.coherenceFactors(dgScore);
    const fmt=v=>v.toLocaleString(LOCALE[LANG]||"en-GB",{minimumFractionDigits:1,maximumFractionDigits:1});
    rows.innerHTML=DIM.map((d,i)=>`<div class="dg-row${dgScore[i]===min&&min<4?" low":""}"><b>${t(d[0])}</b><small>${t(d[1])}</small><span class="dg-anc">${d[4].map((a,j)=>`<span${dgScore[i]===[1,3,5][j]?' class="on"':''}><i>${[1,3,5][j]}</i>${t(a)}</span>`).join("")}</span><span class="dg-sc" role="group" aria-label="${t(d[0])}">${[1,2,3,4,5].map(v=>`<button type="button" data-i="${i}" data-v="${v}" aria-pressed="${dgScore[i]===v}" aria-label="${t(d[0])}: ${v}">${v}</button>`).join("")}</span></div>`).join("");
    const bars=DIM.map((d,i)=>`<div class="dg-bar${dgScore[i]===min&&min<4?" low":""}"><span>${t(d[0])}</span><i style="--w:${dgScore[i]*20}%"></i><span>${dgScore[i]}</span></div>`).join("");
    out.innerHTML=(min<4?`<span class="k">${t("Your bottleneck")}</span><div class="bn">${t(DIM[bi][0])}</div><p><b>${t("Start here")}${document.documentElement.lang==="fr"?"\u00a0":""}:</b> ${t(DIM[bi][2])}</p>`
      :`<span class="k">${t("Your bottleneck")}</span><div class="bn">${t("Coherent enough to accelerate")}</div><p>${t("No dimension scores below 4. Scale what works, and keep measuring how the enterprise moves.")}</p>`)
      +`<span class="k">${t("Coherence score")} · ${fmt(avg)} / 5</span><div class="dg-bars">${bars}</div>`;
  }
  document.getElementById("dg-rows")?.addEventListener("click",e=>{const b=e.target.closest("button[data-i]");if(!b)return;dgScore[+b.dataset.i]=+b.dataset.v;coh();if(typeof sim==="function")sim();const nb=document.querySelector(`#dg-rows button[data-i="${b.dataset.i}"][data-v="${b.dataset.v}"]`);if(nb)nb.focus()});
  /* decision framework */
  const CRIT=[["value","Business value","Value"],["complexity","Process complexity","Coordination"],["coord","Coordination overhead","Coordination"],["handoffs","Number of handoffs","Coordination"],["decision","Decision intensity","Coordination"],["data","Data availability","Readiness"],["repeat","Repetitive workload","Readiness"],["exceptions","Exception frequency","Readiness"],["personal","Personalization potential","Value"],["scale","Scalability potential","Value"],["risk","Risk","Risk"]];
  const PRE={
    "Invoice matching":[2,1,1,2,1,5,5,2,1,3,2],
    "Contract review":[4,2,2,2,5,3,2,3,3,2,4],
    "IT incident handling":[3,4,4,4,3,4,4,3,2,3,2],
    "Customer claims, end-to-end":[5,4,5,5,4,4,4,3,5,5,3]
  };
  const vals={};const slEl=$("#sliders"), preEl=$("#presets");
  CRIT.forEach(([k,l,g])=>{const d=document.createElement("div");d.className="sl";d.innerHTML=`<label for="s-${k}"><span>${l} <span class="g">${g}</span></span><output id="so-${k}">3</output></label><input type="range" id="s-${k}" min="1" max="5" step="1" value="3">`;slEl.appendChild(d);d.querySelector("input").oninput=e=>{vals[k]=+e.target.value;markPreset(null);evalP()}});
  Object.keys(PRE).forEach(n=>{const b=document.createElement("button");b.type="button";b.id="pre-"+n.replace(/\W+/g,"-").toLowerCase();b.dataset.n=n;b.textContent=n;b.onclick=()=>setPreset(n);preEl.appendChild(b)});
  function markPreset(n){[...preEl.children].forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.n===n)))}
  function setPreset(n,render=true){PRE[n].forEach((v,i)=>{const k=CRIT[i][0];vals[k]=v;$("#s-"+k).value=v});markPreset(n);if(render)evalP()}
  const Q={Automate:"Simple, repetitive work. Use rules and straightforward automation; agents help mainly with the exceptions.","Prepare first":"High potential, but the data or the exception rate is not ready. Build the data foundation and reduce exceptions before you deploy agents.",Augment:"Knowledge-intensive human work. Give experts AI support; keep the human in charge of the work.","Agent-enable":"Complex workflows where agents can coordinate execution across steps and systems.",Reinvent:"A strategic, end-to-end process with high value and high transformation potential. Redesign it around humans and agents."};
  const quad=$("#quad");
  function evalP(){
    if(!document.getElementById("cls"))return;
    CRIT.forEach(([k])=>$("#so-"+k).textContent=vals[k]);
    const {x,y,cls,fin,r,rd}=GFModels.classify(vals);
    const c=$("#cls");c.textContent=t(fin);c.classList.toggle("re",fin==="Reinvent");$("#cls-d").textContent=t(Q[fin])+(fin!==cls?" "+t("Risk or readiness changed the result from {c}.").replace("{c}",t(cls)):"");$("#v-aut").textContent=t(r<=2?"Act within boundaries; autonomous for routine cases":r===3?"Bounded autonomy with monitoring":r===4?"Act with human approval":"Human decides, AI recommends");
    $("#v-ready").textContent=t(rd>=3.7?"Strong: data and volume support agents":rd>=2.7?"Moderate: close data or exception gaps first":"Limited: build the data foundation first");
    drawQuad(x,y,cls);
  }
  function drawQuad(x,y,cls){
    const L=44,T=10,S=280;const cx=L+x*S, cy=T+(1-y)*S;
    const cell=(qx,qy,name,on,reinv)=>`<rect x="${L+qx*S/2}" y="${T+qy*S/2}" width="${S/2}" height="${S/2}" fill="${reinv?'var(--ai-soft)':'var(--bg2)'}" stroke="var(--line)"/><text x="${L+qx*S/2+12}" y="${T+qy*S/2+24}" font-family="Aptos, Hanken Grotesk, Segoe UI, sans-serif" font-size="11" letter-spacing="1" fill="${on?(reinv?'var(--ai-ink)':'var(--brand)'):'var(--muted)'}" font-weight="${on?600:400}">${t(name).toUpperCase()}</text>`;
    quad.innerHTML=
      cell(0,0,"Augment",cls==="Augment")+cell(1,0,"Reinvent",cls==="Reinvent",true)+cell(0,1,"Automate",cls==="Automate")+cell(1,1,"Agent-enable",cls==="Agent-enable")+
      `<text x="${L+S/2}" y="${T+S+26}" text-anchor="middle" font-family="Aptos, Hanken Grotesk, Segoe UI, sans-serif" font-size="10.5" letter-spacing="1" fill="var(--muted)">${t("Workflow coordination").toUpperCase()} →</text>`+
      `<text transform="translate(16 ${T+S/2}) rotate(-90)" text-anchor="middle" font-family="Aptos, Hanken Grotesk, Segoe UI, sans-serif" font-size="10.5" letter-spacing="1" fill="var(--muted)">${t("Value potential").toUpperCase()} →</text>`+
      `<circle cx="${cx}" cy="${cy}" r="16" fill="var(--ai)" opacity=".18"/><circle cx="${cx}" cy="${cy}" r="7" fill="var(--brand)" stroke="var(--bg)" stroke-width="2"/>`;
  }
  // applyLang performs the first render after the stored language is selected.
  setPreset("Customer claims, end-to-end",false);

  /* simulator */
  const fmtN=v=>Math.round(v).toLocaleString(LOCALE[LANG]);
  const fmtE=v=>new Intl.NumberFormat(LOCALE[LANG],{style:"currency",currency:"EUR",notation:v>=1e6?"compact":"standard",maximumFractionDigits:v>=1e6?1:0}).format(v);
  const fmtD=v=>v.toLocaleString(LOCALE[LANG],{minimumFractionDigits:1,maximumFractionDigits:1});
  const ids=["vol","time","cost","cycle","rout","auto","red","gen","ov","cyc","run","hand","wait","dec","cons","real"];
  ["c-g1","c-g2","c-a1","c-a2","c-r1","c-r2"].forEach(k=>$("#"+k).addEventListener("input",sim));
  ids.forEach(k=>$("#i-"+k).addEventListener("input",sim));
  function g(k){const v=parseFloat($("#i-"+k).value);return isFinite(v)&&v>0?v:0}
  const cohF=GFModels.coherenceFactors;
  function sim(){
    if(!document.getElementById("scen"))return;
    ["rout","auto","red","gen","ov","cyc","wait","cons","real"].forEach(k=>$("#o-"+k).textContent=g(k)+"%");
    const V=g("vol"),P=g("time"),C=g("cost"),CT=g("cycle"),R=g("rout")/100,A=g("auto")/100,D=g("red")/100,G=g("gen")/100,OV=g("ov")/100,CY=g("cyc")/100,RUN=g("run");
    const {base,a,pot}=GFModels.potentials({V,P,CT,R,A,D,G,OV,CY});
    const names=["GenAI assistance","Agentic automation","Process reinvention"];
    const CO=cohF(dgScore), CF=cohF(dgScore.map(v=>Math.max(v,4)));
    const sc=pot.map((p,i)=>({n:names[i],hp:p.h,h:p.h*CO.f[i],ct:CT-(CT-p.ct)*CO.f[i],f:CO.f[i]}));
    /* coherence realization */
    const bi=dgScore.indexOf(CO.mn), pct=v=>Math.round(v*100)+"%";
    $("#scen").innerHTML=sc.map((s,i)=>{
      const prodP=base?s.h/base:0, ctP=CT?(CT-s.ct)/CT:0;
      return `<article class="sc${i===2?' top':''}"><h3>${t(s.n)}</h3>
        <div class="metric"><span>${t("Hours released / year")}</span><b>${fmtN(s.h)}</b><span>${t("≈ {n} FTE capacity").replace("{n}",fmtD(s.h/1600))}</span><span class="pot">${t("At full coherence: {n} hours").replace("{n}",fmtN(s.hp))}</span></div>
        <div class="metric"><span>${t("Cost capacity released")}</span><b>${fmtE(s.h*C)}</b></div>
        <div class="metric"><span>${t("Cycle-time improvement")}</span><b>${(ctP*100).toFixed(0)}%</b><span>${CT?t("{a} → {b} days").replace("{a}",fmtD(CT)).replace("{b}",fmtD(s.ct)):""}</span><div class="mbar"><i style="width:${Math.min(100,ctP*100)}%"></i></div></div>
        <div class="metric"><span>${t("Productivity potential")}</span><b>${(prodP*100).toFixed(0)}%</b><div class="mbar"><i style="width:${Math.min(100,prodP*100)}%"></i></div></div>
      </article>`}).join("");
    /* flow */
    const H=g("hand"),W=g("wait")/100,TD=g("dec");
    const today={h:H,w:CT*W,d:TD,ct:CT};
    const fp=[
      {h:H,w:CT*W,d:TD,ct:pot[0].ct},
      {h:a*1+(1-a)*H,w:a*CT*CY*W+(1-a)*CT*W,d:a*TD*CY+(1-a)*TD,ct:pot[1].ct},
      {h:a*1+(1-a)*H*(1-D),w:a*CT*CY*W+(1-a)*CT*W*(1-D),d:a*TD*CY+(1-a)*TD*(1-D),ct:pot[2].ct}];
    const fl=[today].concat(fp.map((x,i)=>{const f=CO.f[i],o={};for(const k in today)o[k]=today[k]-(today[k]-x[k])*f;return o}));
    const head=`<thead><tr><th></th><th>${t("Today")}</th>${sc.map(x=>`<th>${t(x.n)}</th>`).join("")}</tr></thead>`;
    const row=(lbl,f,cls)=>`<tr${cls?` class="${cls}"`:""}><td>${t(lbl)}</td>${fl.map((x,i)=>`<td${i===3?' class="top"':''}>${f(x)}</td>`).join("")}</tr>`;
    $("#flow-t").innerHTML=`<table>${head}<tbody>${row("Handoffs per case",x=>fmtD(x.h))}${row("Waiting time (days)",x=>fmtD(x.w))}${row("Time to decision (days)",x=>fmtD(x.d))}${row("Cycle time (days)",x=>fmtD(x.ct),"key")}</tbody></table>`;
    /* business case */
    const F=g("cons")/100,RR=g("real")/100;
    const gc=k=>{const v=parseFloat($("#"+k).value);return isFinite(v)&&v>0?v:0};const cost=[[gc("c-g1"),gc("c-g2")],[gc("c-a1"),gc("c-a2")],[gc("c-r1"),gc("c-r2")]];
    const fmtM=v=>(v<0?"−":"")+fmtE(Math.abs(v));
    const cell=v=>{v=Math.round(v/1000)*1000;return `<span${v<0?' class="neg"':''}>${fmtM(v)}</span>`};
    const calc=(h,i,f)=>GFModels.businessCase({h,C,F,RUN,V,a,f,I:cost[i][0],R0:cost[i][1],RR,i});
    const bc=sc.map((x,i)=>calc(x.h,i,x.f));
    const brow=(lbl,f,cls)=>`<tr${cls?` class="${cls}"`:""}><td>${t(lbl)}</td>${bc.map((x,i)=>`<td${i===2?' class="top"':''}>${f(x)}</td>`).join("")}</tr>`;
    $("#bc-t").innerHTML=`<table><thead><tr><th></th>${sc.map(x=>`<th>${t(x.n)}</th>`).join("")}</tr></thead><tbody>
      ${brow("Benefit per year · conservative",x=>cell(x.B))}
      ${brow("Net value · year 1",x=>cell(x.y1))}
      ${brow("Net value per year · from year 2",x=>cell(x.yN))}
      ${brow("Net value over 3 years",x=>cell(x.y3),"key")}
      ${brow("Break-even",x=>x.be?t("month {n}").replace("{n}",x.be):t("not within 5 years"),"key")}
      ${brow("Upside · expected benefit per year",x=>cell(x.gross))}
    </tbody></table>`;
    const wi=calc(pot[2].h*CF.f[2],2,CF.f[2]).y3-bc[2].y3;
    $("#coh-sim").innerHTML=`<div class="cs-top"><span class="k">${t("Coherence realization")}</span><b>${fmtD(CO.cs)} / 5</b><span>${CO.mn<4?t("Bottleneck: {b}").replace("{b}",t(DIM[bi][0])):t("No dimension below 4")}</span></div>
      <p>${t("Share of the AI potential you capture at your current coherence. The more an approach changes the process, the more it depends on coherence. Change your scores in the coherence diagnostic above.")}</p>
      <div class="cs-bars">${sc.map(x=>`<div class="cs-bar"><span>${t(x.n)}</span><i style="--w:${pct(x.f)}"></i><b>${pct(x.f)}</b></div>`).join("")}</div>
      ${CO.mn<4&&wi>0?`<p class="wi">${t("If no dimension scored below 4, process reinvention would add {v} net value over 3 years.").replace("{v}",fmtE(Math.round(wi/1000)*1000))}</p>`:""}`;
  }

  /* final reveal */
  const rv=$("#reveal");
  if(reduce)rv.classList.remove("pre");else new IntersectionObserver((es,o)=>es.forEach(e=>{if(e.isIntersecting){rv.classList.remove("pre");o.disconnect()}}),{threshold:.6}).observe(rv);

  addEventListener("scroll",onScroll,{passive:true});addEventListener("resize",onScroll);onScroll();

  /* ---- v2 motion ---- */
  const nav=document.querySelector(".nav");
  const heroBg=document.querySelector(".hero-bg"), bands=[...document.querySelectorAll(".band")];
  function parallax(){
    nav.classList.toggle("scrolled",scrollY>20);
    const heroTop=document.querySelector(".hero-top");
    document.documentElement.classList.toggle("nav-over",!nav.classList.contains("open")&&!!heroTop&&scrollY<heroTop.offsetHeight-64);
    // Decorative motion is opt-in; navigation behaviour remains available.
    if(reduce||document.documentElement.dataset.motion!=="full")return;
    const y=scrollY; if(heroBg&&y<innerHeight*1.2)heroBg.style.transform="translate3d(0,"+(y*.25)+"px,0)";
    bands.forEach(b=>{const r=b.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;const p=(r.top+r.height/2-innerHeight/2)/innerHeight;b.querySelector("img").style.transform="translate3d(0,"+(p*-10)+"%,0)"});
  }
  addEventListener("scroll",parallax,{passive:true});parallax();

  /* hamburger menu */
  const burger=document.getElementById("burger"), navlist=document.getElementById("navlist");
  function setMenu(o){nav.classList.toggle("open",o);burger.setAttribute("aria-expanded",String(o));burger.setAttribute("aria-label",o?"Close menu":"Menu");parallax();}
  burger.addEventListener("click",e=>{e.stopPropagation();setMenu(!nav.classList.contains("open"))});
  navlist.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>setMenu(false)));
  document.addEventListener("click",e=>{if(nav.classList.contains("open")&&!e.target.closest(".nav"))setMenu(false)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("open")){setMenu(false);burger.focus()}});
  addEventListener("resize",()=>{if(innerWidth>1100&&nav.classList.contains("open"))setMenu(false)});
  /* fit the desktop menu, else switch to hamburger */
  function fitNav(){if(!navlist)return;nav.classList.remove("compact");if(innerWidth>1100){const w=nav.querySelector(".wrap");if(navlist.scrollWidth>navlist.clientWidth+1||w.scrollWidth>w.clientWidth+1)nav.classList.add("compact")}if(!nav.classList.contains("compact")&&innerWidth>1100&&nav.classList.contains("open"))setMenu(false)}
  addEventListener("resize",fitNav);


  const io2=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io2.unobserve(e.target)}}),{threshold:.18,rootMargin:"0px 0px -6% 0px"});
  document.querySelectorAll(".rv,.band,.head,#bars").forEach(el=>io2.observe(el));
  document.querySelectorAll(".ft2-row").forEach((tr,i)=>tr.style.transitionDelay=(i*60)+"ms");
  document.querySelectorAll(".pillars .pillar").forEach((p,i)=>p.style.transitionDelay=(i*90)+"ms");
  document.querySelectorAll(".levels .lvl").forEach((p,i)=>p.style.transitionDelay=(i*110)+"ms");
  if(reduce)document.querySelectorAll(".rv,.band,.head,#bars").forEach(el=>el.classList.add("in"));

  /* tilt on level cards */
  if(!reduce&&matchMedia("(hover:hover)").matches){
    document.querySelectorAll(".lvl").forEach(c=>{
      c.addEventListener("pointermove",e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transition="transform .1s";c.style.transform=`perspective(900px) rotateY(${x*5}deg) rotateX(${-y*5}deg) translateY(-3px)`});
      c.addEventListener("pointerleave",()=>{c.style.transition="transform .5s";c.style.transform=""});
    });
  }

  /* ===== BPMN process diagrams ===== */
  const ICON={
    user:'<circle cx="6" cy="3.8" r="2.5"/><path d="M1.3 11.3c.6-2.9 2.5-4.3 4.7-4.3s4.1 1.4 4.7 4.3"/>',
    manual:'<path d="M3 11.2V6.2M5.2 11.2V3.4M7.4 11.2V2.8M9.6 11.2V4.6M1.6 7.4L3 6.2M1.6 11.2h9.2"/>',
    service:'<circle cx="6" cy="6" r="2.1"/><path d="M6 .9v1.9M6 9.2v1.9M.9 6h1.9M9.2 6h1.9M2.4 2.4l1.3 1.3M8.3 8.3l1.3 1.3M2.4 9.6l1.3-1.3M8.3 3.7l1.3-1.3"/>',
    agent:'<path d="M6 .8l4.5 2.6v5.2L6 11.2 1.5 8.6V3.4z"/><circle cx="6" cy="6" r="1.5"/>',
    clock:'<circle cx="6" cy="6" r="5"/><path d="M6 3.2V6l2 1.4"/>'
  };
  const B_CFG={id:"bb",colW:108,TW:94,TH:60,num:true,
    lanes:[{n:"Customer",h:96},{n:"Case handler",h:108},{n:"Other department",h:100},{n:"Systems",h:100}],
    nodes:[{k:"start",l:0,c:0,t:"Customer request"},{k:"task",l:1,c:1,t:"Employee receives case",m:"user"},{k:"task",l:1,c:2,t:"Search information",m:"user"},
      {k:"task",l:1,c:3,t:"Request missing data",m:"clock",w:1},{k:"task",l:1,c:4,t:"Analyze",m:"user"},{k:"task",l:2,c:5,t:"Ask another department",m:"user"},
      {k:"timer",l:1,c:6,t:"Wait for reply",w:1},{k:"xor",l:1,c:7,t:"Decide",lab:"up"},{k:"task",l:3,c:8,t:"Update system",m:"manual",cls:"svc"},{k:"end",l:0,c:9,t:"Contact customer",lab:"left"}],
    edges:[[0,1,"ho"],[1,2],[2,3],[3,4],[4,5,"ho"],[5,6],[6,7],[7,8,"ho"],[8,9,"ho"]]};
  const SIX=["Retrieve customer data","Check policies","Search knowledge","Analyze history","Identify missing information","Calculate possible resolution"];
  const A_CFG={id:"ab",colW:126,TW:106,TH:60,rowH:54,
    lanes:[{n:"Customer",h:96},{n:"AI agent",h:108},{n:"Systems & data",h:6*54+20,rows:6},{n:"Human expert",h:112}],
    nodes:[{k:"start",l:0,c:0,t:"Customer request"},{k:"task",l:1,c:1,t:"AI agent understands intent",m:"agent",cls:"agent",a:0},{k:"and",l:1,c:2,t:"In parallel",lab:"up",a:1}]
      .concat(SIX.map((t,r)=>({k:"task",l:2,c:3,r,t,m:"service",cls:"svc small",a:1})))
      .concat([{k:"and",l:1,c:4,a:1},{k:"task",l:1,c:5,t:"Agent assesses the case against its mandate",m:"agent",cls:"agent",a:2},{k:"xor",l:1,c:6,t:"Within mandate?",lab:"up",a:2},{k:"task",l:1,c:7,t:"Agent resolves routine case",m:"agent",cls:"agent",a:3},
        {k:"task",l:3,c:7,t:"Human receives the exception, a recommendation and full context",m:"user",cls:"tall human"},{k:"end",l:0,c:8,t:"Customer receives resolution",lab:"left",a:4}]),
    edges:[[0,1,"ag"],[1,2,"ag"]].concat(SIX.map((_,i)=>[2,3+i,"ag"])).concat(SIX.map((_,i)=>[3+i,9,"ag"])).concat([[9,10,"ag"],[10,11,"ag"],[11,12,"ag","Yes"],[11,13,"ex","No"],[12,14,"ag"],[13,14,"ex"]])};
  const LEFT=60;
  function layout(cfg){
    let top=0;const lt=cfg.lanes.map(L=>{const o=top;top+=L.h;return o});
    const H=top, W=LEFT+cfg.colW*(Math.max(...cfg.nodes.map(n=>n.c))+1)+16;
    const pos=cfg.nodes.map(n=>{const L=cfg.lanes[n.l];const x=LEFT+cfg.colW*n.c+cfg.colW/2;
      const y=L.rows?lt[n.l]+10+n.r*cfg.rowH+cfg.rowH/2:lt[n.l]+L.h/2;return{x,y}});
    return{lt,H,W,pos};
  }
  const isTask=n=>n.k==="task", isGw=n=>n.k==="xor"||n.k==="and";
  function hw(cfg,n){return isTask(n)?cfg.TW/2:isGw(n)?19:15}
  function hh(cfg,n){return isTask(n)?(n.cls&&n.cls.includes("small")?22:n.cls&&n.cls.includes("tall")?39:cfg.TH/2):isGw(n)?19:15}
  function fo(x,y,w,h,txt,cls){return `<foreignObject x="${x}" y="${y}" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" class="bp-lbl ${cls||""}">${txt}</div></foreignObject>`}
  function esc2(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")}
  function buildBPMN(cfg){
    const {lt,H,W,pos}=layout(cfg), id=cfg.id;let s="";
    s+=`<defs>${["","w","a"].map(v=>`<marker id="${id}-m${v}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="bp-mk ${v}"/></marker>`).join("")}</defs>`;
    cfg.lanes.forEach((L,i)=>{s+=`<rect class="bp-lane${i%2?" alt":""}" x="36" y="${lt[i]}" width="${W-36}" height="${L.h}"/><rect class="bp-lh" x="0" y="${lt[i]}" width="36" height="${L.h}"/><text class="bp-lt" text-anchor="middle" transform="translate(21 ${lt[i]+L.h/2}) rotate(-90)">${esc2(t(L.n))}</text>`});
    s+=`<rect class="bp-pool" x="0.6" y="0.6" width="${W-1.2}" height="${H-1.2}"/>`;
    cfg.edges.forEach(([a,b,ty,lab])=>{
      const A=pos[a],B=pos[b],na=cfg.nodes[a],nb=cfg.nodes[b];const dy=B.y-A.y;let d;
      if(Math.abs(dy)<1){d=`M${A.x+hw(cfg,na)} ${A.y}H${B.x-hw(cfg,nb)}`}
      else if(!isTask(na)){const sy=A.y+Math.sign(dy)*hh(cfg,na);d=`M${A.x} ${sy}V${B.y}H${B.x-hw(cfg,nb)}`}
      else if(!isTask(nb)){d=`M${A.x+hw(cfg,na)} ${A.y}H${B.x}V${B.y-Math.sign(dy)*hh(cfg,nb)}`}
      else{const sx=A.x+hw(cfg,na),ex=B.x-hw(cfg,nb),mx=(sx+ex)/2;d=`M${sx} ${A.y}H${mx}V${B.y}H${ex}`}
      const mk=ty==="ho"?"w":ty==="ag"?"a":"";
      s+=`<path class="bp-e ${ty||""}" d="${d}" marker-end="url(#${id}-m${mk})"/>`;
      if(lab){const lx=Math.abs(dy)<1?A.x+hw(cfg,na)+6:A.x+7, ly=Math.abs(dy)<1?A.y-7:A.y+hh(cfg,na)+16;s+=`<text class="bp-el" x="${lx}" y="${ly}">${esc2(t(lab))}</text>`}
    });
    cfg.nodes.forEach((n,i)=>{
      const p=pos[i],da=n.a!==undefined?` data-a="${n.a}"`:"",cls=`bp-n ${n.k} ${n.cls||""} ${n.w?"wait":""}`;
      if(isTask(n)){const h=hh(cfg,n)*2,w=cfg.TW,x=p.x-w/2,y=p.y-h/2,small=n.cls&&n.cls.includes("small");
        s+=`<g class="${cls}" data-i="${i}"${da}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`;
        if(small){s+=`<g class="bp-ic" transform="translate(${x+6} ${p.y-6})">${ICON[n.m]}</g>`+fo(x+20,y+2,w-24,h-4,esc2(t(n.t)),"sm")}
        else{s+=`<g class="bp-ic" transform="translate(${x+7} ${y+6})">${ICON[n.m]}</g>`+(cfg.num?`<text class="bp-num" x="${x+w-7}" y="${y+14}" text-anchor="end">${String(i+1).padStart(2,"0")}</text>`:"")+fo(x+4,y+19,w-8,h-22,esc2(t(n.t)))}
        s+=`</g>`;
      }else{
        s+=`<g class="${cls} bp-ev" data-i="${i}"${da}>`;
        if(n.k==="xor"||n.k==="and"){s+=`<path class="d" d="M${p.x} ${p.y-19}L${p.x+19} ${p.y}L${p.x} ${p.y+19}L${p.x-19} ${p.y}Z"/>`+(n.k==="xor"?`<path class="s" d="M${p.x-6} ${p.y-6}L${p.x+6} ${p.y+6}M${p.x+6} ${p.y-6}L${p.x-6} ${p.y+6}"/>`:`<path class="s" d="M${p.x} ${p.y-8}V${p.y+8}M${p.x-8} ${p.y}H${p.x+8}"/>`)}
        else{s+=`<circle cx="${p.x}" cy="${p.y}" r="15"/>`;if(n.k==="timer")s+=`<circle cx="${p.x}" cy="${p.y}" r="11.5"/><path class="s" d="M${p.x} ${p.y-7}V${p.y}L${p.x+5} ${p.y+3}"/>`;if(n.k==="end"&&b2(n))s+=""}
        if(n.t){const up=n.lab==="up",lf=n.lab==="left";s+=lf?fo(p.x-15-8-120,p.y-18,120,36,esc2(t(n.t)),"ev left"):fo(p.x-58,up?p.y-19-38:p.y+(isGw(n)?21:18),116,36,esc2(t(n.t)),"ev"+(up?" up":""))}
        s+=`</g>`;
      }
    });
    s+=`<circle class="bp-token" r="7" cx="0" cy="0" style="transform:translate(${pos[0].x}px,${pos[0].y}px)"/>`;
    return{svg:s,W,H,pos};
  }
  function b2(){return false}
  const BP={};
  function renderBPMN(){
    [["b",B_CFG],["a",A_CFG]].forEach(([k,cfg])=>{
      const el=document.getElementById("bpmn-"+k);if(!el)return;
      const r=buildBPMN(cfg);el.setAttribute("viewBox",`0 0 ${r.W} ${r.H}`);el.style.minWidth=Math.round(r.W*0.9)+"px";el.innerHTML=r.svg;BP[k]={pos:r.pos,W:r.W,el};
    });
    const lg=document.getElementById("bp-legend");
    if(lg){const it=[
      ['<circle cx="13" cy="9" r="7" class="lg-ev"/>',"Start event"],
      ['<rect x="2" y="2" width="22" height="14" rx="3" class="lg-t"/>',"Human task"],
      ['<rect x="2" y="2" width="22" height="14" rx="3" class="lg-t ag"/>',"Agent task"],
      ['<rect x="2" y="2" width="22" height="14" rx="3" class="lg-t sv"/>',"System task"],
      ['<circle cx="13" cy="9" r="7" class="lg-tm"/><circle cx="13" cy="9" r="5" class="lg-tm"/>',"Wait (timer)"],
      ['<path d="M13 1L21 9L13 17L5 9Z" class="lg-ev"/><path d="M10 6L16 12M16 6L10 12" class="lg-s"/>',"Decision gateway"],
      ['<path d="M13 1L21 9L13 17L5 9Z" class="lg-ev"/><path d="M13 5V13M9 9H17" class="lg-s"/>',"Parallel gateway"],
      ['<circle cx="13" cy="9" r="6.5" class="lg-ev end"/>',"End event"],
      ['<path d="M1 9H23" class="lg-ho"/><path d="M20 5L25 9L20 13" class="lg-ho"/>',"Handoff"]];
      lg.innerHTML=it.map(([g,l])=>`<span><svg viewBox="0 0 26 18" aria-hidden="true">${g}</svg>${esc2(t(l))}</span>`).join("")}
  }

  /* process simulation: one case moving through */
  const runB=document.getElementById("run-b"), runA=document.getElementById("run-a");
  let bi=0,ai=0,tB,tA,follow=true;
  function moveToken(k,i){const b=BP[k];if(!b)return;const p=b.pos[i],tk=b.el.querySelector(".bp-token");if(tk)tk.style.transform=`translate(${p.x}px,${p.y}px)`;
    const wrap=b.el.parentElement;if(follow&&wrap.scrollWidth>wrap.clientWidth+4){const sc=b.el.clientWidth/b.W;wrap.scrollTo({left:Math.max(0,p.x*sc-wrap.clientWidth/2),behavior:reduce?"auto":"smooth"})}}
  function tickB(){const ns=[...BP.b.el.querySelectorAll(".bp-n[data-i]")];ns.forEach(n=>{const k=+n.dataset.i;n.classList.toggle("cur",k===bi);n.classList.toggle("past",k<bi)});
    moveToken("b",bi);const isWait=ns[bi].classList.contains("wait");
    runB.textContent=t("Step {a} of {b}").replace("{a}",bi+1).replace("{b}",ns.length)+(isWait?" · "+t("waiting"):"");
    const d=isWait?2300:1000;bi=(bi+1)%ns.length;tB=setTimeout(tickB,bi===0?2200:d)}
  const A_LABEL=["Intent understood","Six actions in parallel","Case assessed against the mandate","Routine case resolved","Outcome delivered"], A_TOKEN=[1,2,10,12,14];
  function tickA(){BP.a.el.querySelectorAll(".bp-n").forEach(n=>n.classList.toggle("cur",n.dataset.a!==undefined&&+n.dataset.a===ai));
    moveToken("a",A_TOKEN[ai]);runA.textContent=t(A_LABEL[ai]);ai=(ai+1)%A_LABEL.length;tA=setTimeout(tickA,ai===0?2000:1300)}
  function startSim(){clearTimeout(tB);clearTimeout(tA);if(reduce)return;if(!pB.hidden){bi=0;tickB()}else{ai=0;tickA()}}
  const baBox=document.querySelector(".ba");let baVis=false;
  new IntersectionObserver(es=>es.forEach(e=>{baVis=e.isIntersecting;if(baVis)startSim();else{clearTimeout(tB);clearTimeout(tA)}}),{threshold:.25}).observe(baBox);
  bB.addEventListener("click",()=>{follow=true;baVis&&startSim()});bA.addEventListener("click",()=>{follow=true;baVis&&startSim()});
  document.querySelectorAll(".bpmn-wrap").forEach(w=>["pointerdown","wheel","touchstart"].forEach(ev=>w.addEventListener(ev,()=>{follow=false},{passive:true})));




  /* ===== contact: LinkedIn + copy email ===== */
  const LINKEDIN_URL="https://www.linkedin.com/in/erlend-hollebosch-053361181/"; /* paste the full profile URL here, e.g. https://www.linkedin.com/in/your-name/ */
  if(LINKEDIN_URL){const lb=$("#li-btn");lb.href=LINKEDIN_URL;lb.hidden=false;document.querySelectorAll(".li-link").forEach(a=>{a.href=LINKEDIN_URL;a.parentElement.hidden=false})}
  const auCopy=$("#au-copy");
  auCopy.addEventListener("click",()=>{const txt=$("#au-mail").textContent;const done=()=>{auCopy.textContent=t("Copied");setTimeout(()=>auCopy.textContent=t("Copy"),1600)};const sel=()=>{const r=document.createRange();r.selectNodeContents($("#au-mail"));const sl=getSelection();sl.removeAllRanges();sl.addRange(r)};try{navigator.clipboard.writeText(txt).then(done,sel)}catch(e){sel()}});
  /* ===== i18n ===== */
  const NATIVE={nl:"Nederlands (BE)",fr:"Français (BE)",en:"English"};
  const SKIP="script,style,output,[data-dyn],[data-notr],[data-ih]";
  const recs=[], ihs=[...document.querySelectorAll("[data-ih]")].map(el=>({el,orig:el.innerHTML}));
  const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(n){if(!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;const pe=n.parentElement;return(!pe||pe.closest(SKIP))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
  while(tw.nextNode()){const n=tw.currentNode,v=n.nodeValue;recs.push({n,key:v.trim().replace(/\s+/g," "),pre:v.match(/^\s*/)[0],post:v.match(/\s*$/)[0]})}
  const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  const fcopy=$("#fcopy");
  function applyLang(l,save){
    if(!Object.hasOwn(NATIVE,l))l="en";LANG=l;
    const root=document.documentElement;root.lang=l;root.dir="ltr";
    recs.forEach(r=>{r.n.nodeValue=r.pre+t(r.key)+r.post});
    ihs.forEach(o=>{o.el.innerHTML=l==="en"?o.orig:((((window.I18N_HTML||{})[o.el.dataset.ih])||[])[LIDX[l]]||o.orig)});
    document.querySelectorAll(".lang-cur").forEach(e=>e.textContent=e.closest(".lang-top")?({nl:"NL-BE",fr:"FR-BE",en:"EN"})[l]:NATIVE[l]);document.querySelectorAll(".lang-btn").forEach(b=>b.dataset.code=({nl:"NL-BE",fr:"FR-BE",en:"EN"})[l]);document.querySelectorAll(".lang-btn .flag").forEach(f=>f.className="flag flag-"+l);
    document.querySelectorAll(".lang-menu [data-lang]").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.lang===l)));
    document.querySelectorAll(".lang-btn").forEach(b=>b.setAttribute("aria-label",t("Language")+": "+(b.closest(".lang-top")?({nl:"NL-BE",fr:"FR-BE",en:"EN"})[l]+" — ":"")+NATIVE[l]));
    if(fcopy)fcopy.textContent=t("Copy");auCopy.textContent=t("Copy");
    {const st=(document.querySelector('meta[name="seo-title"]')||{}).content,pt=(document.querySelector('meta[name="page-title"]')||{}).content;document.title=st?t(st):pt?t(pt)+" · The Coherent Enterprise":"The Coherent Enterprise · Erlend Hollebosch";}
    pick(curSpec);evalP();sim();renderBPMN();coh();if(typeof fitNav==="function")fitNav();
    if(save)store.set("avs-lang",l);
  }
  /* language menus */
  const langs=[...document.querySelectorAll(".lang")];
  function closeMenus(){langs.forEach(w=>{w.querySelector(".lang-menu").hidden=true;w.querySelector(".lang-btn").setAttribute("aria-expanded","false")})}
  langs.forEach(w=>{
    const b=w.querySelector(".lang-btn"),m=w.querySelector(".lang-menu");
    b.addEventListener("click",e=>{e.stopPropagation();const open=m.hidden;closeMenus();if(open){m.hidden=false;b.setAttribute("aria-expanded","true");(m.querySelector('[aria-checked="true"]')||m.querySelector("button")).focus()}});
    m.addEventListener("click",e=>{const o=e.target.closest("[data-lang]");if(!o)return;applyLang(o.dataset.lang,true);closeMenus();b.focus()});
    m.addEventListener("keydown",e=>{const items=[...m.querySelectorAll("button")],i=items.indexOf(document.activeElement);if(e.key==="ArrowDown"){e.preventDefault();items[(i+1)%items.length].focus()}if(e.key==="ArrowUp"){e.preventDefault();items[(i-1+items.length)%items.length].focus()}});
  });
  document.addEventListener("click",e=>{if(!e.target.closest(".lang"))closeMenus()});

  /* copy email */
  if(fcopy)fcopy.addEventListener("click",()=>{const txt=$("#fmail").textContent;const done=()=>{fcopy.textContent=t("Copied");setTimeout(()=>fcopy.textContent=t("Copy"),1600)};const sel=()=>{const r=document.createRange();r.selectNodeContents($("#fmail"));const sl=getSelection();sl.removeAllRanges();sl.addRange(r)};try{navigator.clipboard.writeText(txt).then(done,sel)}catch(e){sel()}});

  /* ===== overlays: consent + privacy ===== */
  const modal=$("#consent"), panel=document.getElementById("privacy-panel"), cExt=$("#c-ext"), cAna=$("#c-ana");
  let lastFocus=null, privacyFocus=null;
  function lock(){document.body.classList.toggle("locked",!modal.hidden||!!(panel&&!panel.hidden))}
  function focusables(el){return [...el.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')].filter(x=>x.offsetParent!==null)}
  function trap(el,e){if(e.key!=="Tab")return;const f=focusables(el);if(!f.length)return;const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
  const CONSENT_V=3,CONSENT_MAX=182*864e5,GC_CODE="growfaster";
  function readConsent(){return GFConsent.parse(store.get("avs-consent"))}
  function applyConsent(c){
    const gs=document.getElementById("gc");
    if(c&&c.ana&&GC_CODE){
      if(!gs){
        // Explicit pageview only: the third-party script never installs its own event listeners.
        window.goatcounter={no_onload:true,no_events:true};
        const x=document.createElement("script");x.id="gc";x.async=true;x.src="https://gc.zgo.at/count.js";
        x.dataset.goatcounter="https://"+GC_CODE+".goatcounter.com/count";
        x.onload=()=>{if(readConsent()?.ana)window.goatcounter?.count?.()};document.head.appendChild(x);
      }
    }else{
      if(gs)gs.remove();
      if(window.goatcounter){window.goatcounter.no_onload=true;window.goatcounter.no_events=true;window.goatcounter.count=()=>{};window.goatcounter.bind_events=()=>{}}
    }
    const font=document.getElementById("gf");if(!(c&&c.ext)){if(font)font.remove();return}
    if(!font){const l=document.createElement("link");l.id="gf";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,400..700;1,400..600&family=Noto+Sans+Arabic:wght@400..700&display=swap";document.head.appendChild(l)}
  }
  function openConsent(expanded=true){const c=readConsent();cExt.checked=!!(c&&c.ext);cAna.checked=!!(c&&c.ana);lastFocus=document.activeElement;modal.classList.toggle("compact",!expanded);tab(false);modal.hidden=false;lock();setTimeout(()=>$(expanded?"#c-save":"#c-cust").focus(),30)}
  function closeConsent(){modal.hidden=true;lock();if(lastFocus&&lastFocus.focus)lastFocus.focus()}
  function saveConsent(ext,ana){const c={v:CONSENT_V,ext:!!ext,ana:!!ana,ts:Date.now()};store.set("avs-consent",JSON.stringify(c));applyConsent(c);closeConsent()}
  $("#c-save").addEventListener("click",()=>saveConsent(cExt.checked,cAna.checked));
  $("#c-all").addEventListener("click",()=>{cExt.checked=cAna.checked=true;saveConsent(true,true)});
  $("#c-none").addEventListener("click",()=>{cExt.checked=cAna.checked=false;saveConsent(false,false)});
  $("#c-cust").addEventListener("click",()=>{modal.classList.remove("compact");setTimeout(()=>cExt.focus(),30)});
  const tabC=$("#tab-cat"),tabS=$("#tab-srv");
  function tab(srv){tabC.setAttribute("aria-selected",String(!srv));tabS.setAttribute("aria-selected",String(srv));$("#pane-cat").hidden=srv;$("#pane-srv").hidden=!srv}
  tabC.addEventListener("click",()=>tab(false));tabS.addEventListener("click",()=>tab(true));
  modal.querySelectorAll(".c-exp").forEach(b=>b.addEventListener("click",()=>{const d=document.getElementById(b.getAttribute("aria-controls"));const o=d.hidden;d.hidden=!o;b.setAttribute("aria-expanded",String(o))}));
  modal.addEventListener("keydown",e=>{trap(modal.querySelector(".cbox"),e);if(e.key==="Escape"&&readConsent())closeConsent()});
  function openPrivacy(sec){if(!panel){location.assign("privacy.html"+(sec?"#"+encodeURIComponent(sec):""));return}privacyFocus=document.activeElement;panel.hidden=false;lock();panel.scrollTop=0;if(sec){const tgt=document.getElementById(sec);if(tgt)setTimeout(()=>panel.scrollTo({top:tgt.offsetTop-80,behavior:reduce?"auto":"smooth"}),30)}setTimeout(()=>document.getElementById("pp-close")?.focus(),30)}
  function closePrivacy(){if(!panel)return;panel.hidden=true;lock();if(!modal.hidden)$("#c-save").focus();else if(privacyFocus&&privacyFocus.isConnected)privacyFocus.focus()}
  document.getElementById("pp-close")?.addEventListener("click",closePrivacy);
  panel?.addEventListener("keydown",e=>{trap(panel,e);if(e.key==="Escape")closePrivacy()});
  document.addEventListener("click",e=>{
    const pv=e.target.closest(".open-priv");if(pv){e.preventDefault();openPrivacy(pv.dataset.sec);return}
    const oc=e.target.closest(".open-consent");if(oc){e.preventDefault();if(panel&&!panel.hidden)closePrivacy();openConsent()}
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenus()});

  /* e-mail address assembled at runtime (anti-spam) */
  (function(){const a=["erlend","hollebosch"].join("")+String.fromCharCode(64)+["gmail","com"].join(".");
    document.querySelectorAll("[data-em]").forEach(e=>e.textContent=a);
    document.querySelectorAll("a[data-mail]").forEach(e=>{e.href="mailto:"+a+e.dataset.mail.replace(/&amp;/g,"&")})})();
  /* start */
  const stored=store.get("avs-lang"), nav0=(navigator.language||"en").slice(0,2).toLowerCase();
  const initial=Object.hasOwn(NATIVE,stored)?stored:(Object.hasOwn(NATIVE,nav0)?nav0:"en");
  applyLang(initial,!!stored&&stored!==initial);
  const c0=readConsent();applyConsent(c0);
  if(location.hash==="#privacy")openPrivacy(); 
  if(!c0)openConsent(false);

  /* spotlight on final section */
  const fin=document.getElementById("final");
  if(!reduce&&fin)fin.addEventListener("pointermove",e=>{const r=fin.getBoundingClientRect();fin.style.setProperty("--mx",(e.clientX-r.left)+"px");fin.style.setProperty("--my",(e.clientY-r.top)+"px")});

})();
