'use strict';

// Preserve authored cascade order while removing small blocking requests.
// The shared typography policy remains the final external, versioned stylesheet.
function inlineComponentStyles(html, loadCSS) {
  // Conservatively leave all HTTP-equivalent meta documents external. Accept
  // unquoted attributes and '>' inside quoted values, as the HTML parser does.
  const metas = html.match(/<meta\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi) || [];
  if (metas.some(tag => /\shttp-equiv\s*=/i.test(tag))) return html;
  return html.replace(/<link\b[^>]*>/gi, tag => {
    const rel = tag.match(/\srel\s*=\s*(["'])(.*?)\1/i);
    const href = tag.match(/\shref\s*=\s*(["'])(.*?)\1/i);
    if (!rel || rel[2].toLowerCase() !== 'stylesheet' || !href) return tag;
    // Links with additional behavior/identity retain their original semantics.
    const remainder = tag.replace(rel[0], '').replace(href[0], '').replace(/^<link\b|\/?\s*>$/gi, '').trim();
    if (remainder) return tag;
    const asset = href[2].match(/^\/?assets\/(navigation|books|cms-public)\.css(?:\?[^#]*)?$/);
    if (!asset) return tag;
    const name = 'assets/' + asset[1] + '.css';
    const css = loadCSS(name);
    if (typeof css !== 'string' || /<\/style(?:\s|>|\/)/i.test(css)) throw new Error('Unsafe component stylesheet');
    // Relative resources must retain their external URL resolution context.
    if (Buffer.byteLength(css) > 16384 || /\burl\s*\(|@import\b/i.test(css)) return tag;
    return '<style data-gf-component-style="' + name + '">' + css + '</style>';
  });
}

module.exports = { inlineComponentStyles };
