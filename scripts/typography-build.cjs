'use strict';
// Inline the small shared type contract to avoid an extra render-blocking RTT.
// Keep the source stylesheet independently served for cached older documents.
function typographyMarkup(css, {external = false} = {}) {
  if (typeof css !== 'string' || /<\/style(?:\s|>|\/)/i.test(css)) {
    throw new Error('Unsafe typography stylesheet');
  }
  const preload = '<link rel="preload" href="/assets/hanken-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>';
  // Account and CMS pages deliberately prohibit inline styles. Never relax CSP.
  return preload + (external ? '<link rel="stylesheet" href="/assets/typography.css">' :
    '<style data-gf-typography>' + css + '</style>');
}
// Inline only the four small local component styles, at their original cascade
// positions. Keep standalone assets for cached documents and strict-CSP pages.
// Styles with imports/URLs stay external so URL resolution never changes.
function inlineComponentStyles(html, loadCSS) {
  if (/<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["']/i.test(html)) return html;
  return html.replace(/<link\b[^>]*>/gi, tag => {
    const relation = tag.match(/\srel\s*=\s*(["'])(.*?)\1/i);
    const href = tag.match(/\shref\s*=\s*(["'])(.*?)\1/i);
    if (!relation || relation[2].toLowerCase() !== 'stylesheet' || !href ||
        /\s(?:media|disabled|integrity|onload)\b/i.test(tag)) return tag;
    const asset = href[2].match(/^\/?assets\/(navigation|home-hero|books|journal)\.css(?:[?][^#]*)?$/);
    if (!asset) return tag;
    const name = 'assets/' + asset[1] + '.css';
    const css = loadCSS(name);
    if (typeof css !== 'string' || /<\/style(?:\s|>|\/)/i.test(css)) throw new Error('Unsafe component stylesheet');
    if (/\burl\s*\(|@import\b/i.test(css)) return tag;
    return '<style data-gf-component-style="' + name + '">' + css + '</style>';
  });
}
module.exports = {typographyMarkup, inlineComponentStyles};
