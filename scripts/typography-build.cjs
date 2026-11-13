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
module.exports = {typographyMarkup};
