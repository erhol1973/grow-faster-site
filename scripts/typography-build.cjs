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
// The chosen-language content cannot be revealed until this existing dictionary
// has loaded. Raise its network priority without preloading a second request or
// changing script order, defer/async semantics, URLs or translation bytes.
function prioritizeTranslations(html) {
  return html.replace(/<script\b[^>]*>/gi, tag => {
    const source = tag.match(/\ssrc\s*=\s*(["'])(.*?)\1/i);
    if (!source || !/^\/?assets\/i18n\.js(?:[?#]|$)/.test(source[2])) return tag;
    if (/\sfetchpriority\s*=/i.test(tag)) {
      return tag.replace(/(\sfetchpriority\s*=\s*)(["'])[^"']*\2/i, '$1"high"');
    }
    return tag.replace(/>$/, ' fetchpriority="high">');
  });
}
module.exports = {typographyMarkup, prioritizeTranslations};
