(function(){
  let lang='nl';try{lang=localStorage.getItem('avs-lang')||'nl'}catch{}
  if(!['nl','en','fr'].includes(lang))lang='nl';document.documentElement.lang=lang;
  const labels={nl:['Bestel het boek','Vorige pagina','Volgende pagina','Het boek wordt geopend…','Preview — de eerste 25 pagina’s van 82','Klik op het boek om te vergroten','Vergroot pagina','Terug naar de website','Sluiten ✕','Na de preview stopt het — bestel het volledige boek via grow-faster.be'],en:['Order the book','Previous page','Next page','Opening the book…','Preview — the first 25 pages of 82','Click the book to enlarge','Enlarge page','Back to the website','Close ✕','End of preview — order the full book via grow-faster.be'],fr:['Commander le livre','Page précédente','Page suivante','Ouverture du livre…','Aperçu — les 25 premières pages sur 82','Cliquez sur le livre pour agrandir','Agrandir la page','Retour au site','Fermer ✕','Fin de l’aperçu — commandez le livre complet sur grow-faster.be']}[lang];
  document.querySelector('.buy').textContent=labels[0];document.getElementById('prev').setAttribute('aria-label',labels[1]);document.getElementById('next').setAttribute('aria-label',labels[2]);document.getElementById('loader').textContent=labels[3];document.querySelector('.status > span:nth-child(2)').textContent=labels[4];document.querySelector('.zoomhint').textContent=labels[5];document.getElementById('zoomButton').textContent=labels[6];document.getElementById('backHome').textContent=labels[7];document.getElementById('zoomClose').textContent=labels[8];document.querySelector('footer').textContent=labels[9];document.getElementById('zoom').setAttribute('aria-label',labels[6]);
  const TOTAL = 26;
  if(!window.St){document.getElementById('loader').remove();document.getElementById('fallback').open=true;document.querySelector('.book-wrap').hidden=true;document.getElementById('zoomButton').disabled=true;return;}
  const pages = [];
  for (let i = 1; i <= TOTAL; i++){
    pages.push('pages/page-' + String(i).padStart(2,'0') + '.jpg');
  }

  // A4 ratio
  const PW = 620, PH = 877;

  const pageFlip = new St.PageFlip(document.getElementById('book'), {
    width: PW, height: PH,
    size: 'stretch',
    minWidth: Math.min(340, Math.max(120, innerWidth - 112)), maxWidth: PW, minHeight: 170, maxHeight: PH,
    maxShadowOpacity: 0,          // no flip shadow at all
    drawShadow: false,
    showCover: true,
    mobileScrollSupport: true,
    usePortrait: true,
    flippingTime: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 700
  });

  const info = document.getElementById('pageInfo');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const zoom = document.getElementById('zoom');
  const zoomInner = document.getElementById('zoomInner');
  const zoomClose = document.getElementById('zoomClose');

  document.getElementById('zoomButton').addEventListener('click',openZoom);
  // preload all pages, then init the flipbook
  Promise.all(pages.map(src => new Promise(res => {
    const im = new Image(); im.onload = im.onerror = res; im.src = src;
  }))).then(() => {
    pageFlip.loadFromImages(pages);
    // kill the library's built-in spine gradient (not covered by drawShadow:false)
    try { pageFlip.getRender().drawBookShadow = function(){}; } catch(e) {}
    // clear to transparent instead of white: the empty half next to the cover disappears
    try {
      const r = pageFlip.getRender();
      r.clear = function(){ this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); };
    } catch(e) {}
    const loader = document.getElementById('loader');
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 450);
    // deep link: ?p=12 opens that page directly
    const p = parseInt(new URLSearchParams(location.search).get('p'), 10);
    if (p >= 2 && p <= TOTAL) pageFlip.flip(p - 1, 'immediate');
    update();
  });

  function update(){
    document.getElementById('book').dataset.orientation=pageFlip.getOrientation();
    const idx = pageFlip.getCurrentPageIndex(); // 0-based left page
    info.textContent = (idx + 1) + ' / ' + TOTAL;
    prev.disabled = idx <= 0;
    next.disabled = idx >= TOTAL - 1;
  }

  pageFlip.on('flip', update);
  prev.addEventListener('click', () => pageFlip.flipPrev());
  next.addEventListener('click', () => pageFlip.flipNext());
  document.addEventListener('keydown', e => {
    if (zoom.classList.contains('open')){
      if (e.key === 'Escape') closeZoom();
      if (e.key === 'Tab'){e.preventDefault();zoomClose.focus();}
      return;
    }
    if (e.key === 'ArrowLeft') pageFlip.flipPrev();
    if (e.key === 'ArrowRight') pageFlip.flipNext();
  });

  // ---- click-to-zoom (full resolution pages, for comfortable reading) ----
  let downAt = 0, downIdx = 0;
  document.getElementById('book').addEventListener('pointerdown', () => {
    downAt = Date.now(); downIdx = pageFlip.getCurrentPageIndex();
  });
  document.getElementById('book').addEventListener('pointerup', () => {
    if (Date.now() - downAt > 250) return;   // it was a drag/flip, not a click
    if (pageFlip.getCurrentPageIndex() !== downIdx) return; // a corner tap flipped the page
    openZoom();
  });

  function openZoom(){
    const idx = pageFlip.getCurrentPageIndex();
    const landscape = pageFlip.getOrientation() === 'landscape';
    zoomInner.innerHTML = '';
    const show = [];
    if (landscape && idx > 0){
      // in landscape a spread shows idx (left) and idx+1 (right); cover (0) stands alone
      show.push(idx);
      if (idx + 1 < TOTAL) show.push(idx + 1);
    } else {
      show.push(idx);
    }
    show.forEach(i => {
      const im = document.createElement('img');
      im.src = pages[i];
      im.alt = 'Pagina ' + (i + 1);
      zoomInner.appendChild(im);
    });
    zoom.classList.add('open');
    zoomClose.classList.add('show');
    zoom.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    zoomClose.focus();
  }
  function closeZoom(){
    zoom.classList.remove('open');
    zoomClose.classList.remove('show');
    document.body.style.overflow = '';
    document.getElementById('zoomButton').focus();
  }
  zoomClose.addEventListener('click', closeZoom);
  zoom.addEventListener('click', e => { if (e.target === zoom) closeZoom(); });
})();
