'use strict';

const path = require('node:path');
const { readRegularFile } = require('./file-reader.cjs');

function bundleMemberNavigation(data, relative, root) {
  const asset = name => readRegularFile(path.join(root, 'assets', name)).toString('utf8');
  const file = relative.replaceAll('\\', '/');
  if (file === 'assets/site.js') {
    // The account link is already usable. Load session-aware controls after the page scripts.
    return data.toString('utf8') + `
document.addEventListener('DOMContentLoaded', function () {
  if (!document.querySelector('nav.nav-executive')) return;
  const menu = document.createElement('script');
  menu.src = '/assets/member-menu.js?v=members-1';
  menu.fetchPriority = 'low';
  document.head.append(menu);
}, { once: true });
`;
  }
  if (file === 'assets/member-menu.js') {
    return "if (!window.GF_CMS_CONFIG) {" + asset('cms-config.js') + "}\n" +
      "if (!window.GFMember) {" + asset('member-auth.js') + "}\n" + data.toString('utf8');
  }
  if (!file.endsWith('.html')) return data;
  let html = data.toString('utf8');
  if (/<nav\b[^>]*class="[^"]*\bnav-executive\b/.test(html)) {
    const styles = '<style>' + asset('member-navigation.css') + '</style>';
    const returnTo = encodeURIComponent('/' + file);
    const login = '<li class="member-nav" data-member-placeholder data-notr><a class="member-login-link" href="/account?return=' + returnTo + '">Aanmelden</a></li>';
    html = html.replace('</head>', styles + '</head>')
      .replace('<li class="nav-action">', login + '<li class="nav-action">')
      .replace(/(src="(?:\.\/)?assets\/site\.js\?[^"]+)"/, '$1&amp;members=1"');
  }
  const link = '<link rel="stylesheet" href="assets/cms-public.css">';
  return html.includes(link) ? html.replace(link, '<style data-cms-media>' + asset('cms-public.css').trim() + '</style>') : html;
}

module.exports = { bundleMemberNavigation };
