'use strict';

const path = require('node:path');
const { readRegularFile } = require('./file-reader.cjs');

function bundleMemberNavigation(data, relative, root) {
  const asset = name => readRegularFile(path.join(root, 'assets', name)).toString('utf8');
  const file = relative.replaceAll('\\', '/');
  if (file === 'assets/navigation.css') {
    return data.toString('utf8') + '\n' + asset('member-account.css');
  }
  if (file === 'assets/site.js') {
    // Deferred page scripts set the environment before the account menu starts.
    const init = [
      "if (!document.querySelector('nav.nav-executive')) return;",
      "if (!window.GF_CMS_CONFIG) {" + asset('cms-config.js') + "}",
      asset('member-auth.js'),
      asset('member-menu.js')
    ].join('\n');
    return data.toString('utf8') + "\ndocument.addEventListener('DOMContentLoaded', function () {\n" + init + "\n}, { once: true });\n";
  }
  if (file.endsWith('.html')) {
    // The tiny media layout rule can travel with the document, as on the homepage.
    const html = data.toString('utf8');
    const link = '<link rel="stylesheet" href="assets/cms-public.css">';
    return html.includes(link) ? html.replace(link, '<style data-cms-media>' + asset('cms-public.css').trim() + '</style>') : data;
  }
  return data;
}

module.exports = { bundleMemberNavigation };
