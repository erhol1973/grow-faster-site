(function () {
  'use strict';

  // SVG font-size is expressed in drawing units. Convert the same website
  // label token to those units; outer CSS/user zoom must still enlarge it.
  function svgUnitScale(matrix) {
    if (!matrix) return null;
    const scale = Math.hypot(matrix.c, matrix.d);
    return Number.isFinite(scale) && scale > 0 ? scale : null;
  }
  function rawLabelSize(token, matrix) {
    const scale = svgUnitScale(matrix);
    return scale && Number.isFinite(token) && token > 0 ? token / scale : null;
  }
  if (typeof document === 'undefined' && typeof module !== 'undefined') {
    module.exports = { svgUnitScale, rawLabelSize };
    return;
  }

  const pending = new Set(), registered = new WeakSet();
  let frame = 0;
  function outerSvg(svg) {
    while (svg.ownerSVGElement) svg = svg.ownerSVGElement;
    return svg;
  }
  function canvas(svg) {
    let port = svg.parentElement;
    if (!port.matches('.bpmn-wrap,.diagram-scroll,.typography-diagram-scroll')) {
      const wrapper = document.createElement('div');
      port.insertBefore(wrapper,svg); wrapper.appendChild(svg); port = wrapper;
    }
    port.classList.add('typography-diagram-scroll');
    port.tabIndex = 0; port.setAttribute('role','region');
    if (!port.hasAttribute('aria-label')) port.setAttribute('aria-label',svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent || 'Diagram');
    const width = Math.max(600,svg.viewBox.baseVal.width);
    if (svg.style.minWidth !== width + 'px') svg.style.minWidth = width + 'px';
  }
  function normalize(svgs) {
    const token = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--type-label'));
    const measurements = [];
    svgs.forEach(svg => {
      if (!svg.isConnected || !svg.clientWidth || !svg.clientHeight) return;
      svg.querySelectorAll('text,foreignObject .bp-lbl').forEach(text => {
        const coordinates = text.getCTM ? text : text.closest('foreignObject');
        const raw = rawLabelSize(token, coordinates.getCTM());
        if (raw !== null) measurements.push({text,value:Number(raw.toFixed(6)) + 'px'});
      });
    });
    // Complete every layout read before the first style write.
    measurements.forEach(({text,value}) => {
      if (text.style.getPropertyValue('--svg-label-font-size') !== value) text.style.setProperty('--svg-label-font-size', value);
      if (!text.hasAttribute('data-typography-svg')) text.setAttribute('data-typography-svg','');
    });
  }
  function flush() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    const work = [...pending]; pending.clear();
    normalize(work);
  }
  function queue(svg) {
    if (!svg) return;
    pending.add(svg);
    if (!frame) frame = requestAnimationFrame(flush);
  }
  // ResizeObserver already batches before paint. Updating a text font does not
  // resize the SVG viewport, so it cannot create a resize feedback loop.
  const resize = new ResizeObserver(entries => normalize(entries.map(entry => entry.target)));
  function register(svg) {
    svg = outerSvg(svg);
    if (!svg.querySelector('text,foreignObject .bp-lbl')) return;
    canvas(svg);
    if (!registered.has(svg)) { registered.add(svg); resize.observe(svg); }
    queue(svg);
  }
  function discover(node) {
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    if (!(node instanceof Element)) return;
    const owner = node.closest('svg'); if (owner) register(owner);
    node.querySelectorAll('svg').forEach(register);
  }
  function removed(node) {
    if (!(node instanceof Element)) return;
    const roots = node.matches('svg') ? [node,...node.querySelectorAll('svg')] : [...node.querySelectorAll('svg')];
    roots.forEach(svg => {
      if (!svg.isConnected && registered.has(svg)) {
        resize.unobserve(svg); registered.delete(svg); pending.delete(svg);
      }
    });
  }
  document.querySelectorAll('svg').forEach(register);
  flush();
  new MutationObserver(records => records.forEach(record => {
    if (record.type === 'attributes') discover(record.target);
    else { record.removedNodes.forEach(removed); record.addedNodes.forEach(discover); }
  }))
    .observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['transform','viewBox','preserveAspectRatio']});
  // Cover token/font stylesheet readiness without relying on a particular
  // application's initialization order. Our own attribute/style writes are
  // deliberately outside the mutation subscription.
  document.fonts.ready.then(() => { document.querySelectorAll('svg').forEach(register); flush(); });
})();
