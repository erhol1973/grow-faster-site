'use strict';

function withMemberNavigation(html) {
  if (!/<nav\b[^>]*class="[^"]*\bnav-executive\b/.test(html)) return html;
  const resources = [
    '<link rel="stylesheet" href="/assets/member-account.css">',
    ...(!html.includes('assets/cms-config.js') ? ['<script defer src="/assets/cms-config.js"></script>'] : []),
    '<script defer src="/assets/member-auth.js"></script>',
    '<script defer src="/assets/member-menu.js"></script>'
  ];
  return html.replace('</body>', resources.filter(resource => !html.includes(resource)).join('\n') + '\n</body>');
}

module.exports = { withMemberNavigation };
