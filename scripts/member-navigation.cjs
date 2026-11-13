'use strict';

const path = require('node:path');
const { readRegularFile } = require('./file-reader.cjs');

function bundleMemberNavigation(data, relative, root) {
  const asset = name => readRegularFile(path.join(root, 'assets', name)).toString('utf8');
  const file = relative.replaceAll('\\', '/');
  const menuBundle = () => "if (!window.GF_CMS_CONFIG) {" + asset('cms-config.js') + "}\n" +
    "if (!window.GFMember) {" + asset('member-auth.js') + "}\n" + asset('member-menu.js');
  if (file === 'assets/models.js') {
    // Share an existing response; execute after every DOMContentLoaded listener,
    // just as the former dynamically downloaded menu did, without a second fetch.
    return data.toString('utf8') + `
(function () {
  if (typeof document === 'undefined') return;
  let scheduled = false;
  function bootMemberNavigation() {
  if (scheduled) return;
  scheduled = true;
  if (!document.querySelector('nav.nav-executive')) return;
  setTimeout(function () {
${menuBundle()}
  }, 0);
  }
  if (document.readyState === 'complete') bootMemberNavigation();
  else {
    document.addEventListener('DOMContentLoaded', bootMemberNavigation, { once: true });
    // Cached pages can inject the missing models after DOMContentLoaded.
    window.addEventListener('load', bootMemberNavigation, { once: true });
  }
})();
`;
  }
  if (file === 'assets/member-menu.js') {
    return menuBundle();
  }
  if (!file.endsWith('.html')) return data;
  let html = data.toString('utf8');
  if (/<nav\b[^>]*class="[^"]*\bnav-executive\b/.test(html)) {
    const styles = '<style>' + asset('member-navigation.css') + '</style>';
    const returnTo = encodeURIComponent('/' + file);
    const login = '<li class="member-nav" data-member-placeholder data-notr><a class="member-login-link" href="/account?return=' + returnTo + '">Aanmelden</a></li>';
    html = html.replace('</head>', styles + '</head>')
      .replace('<li class="nav-action">', login + '<li class="nav-action">')
      .replace(/(src="(?:\.\/)?assets\/site\.js\?[^"]+)"/, '$1&amp;members=2"')
      .replace(/(src="(?:\.\/)?assets\/models\.js\?[^"]+)"/, '$1&amp;members=2"');
  }
  const link = '<link rel="stylesheet" href="assets/cms-public.css">';
  return html.includes(link) ? html.replace(link, '<style data-cms-media>' + asset('cms-public.css').trim() + '</style>') : html;
}

module.exports = { bundleMemberNavigation };
