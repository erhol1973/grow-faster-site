'use strict';
// Social crawlers do not run the language switch. Build a directly shareable French
// document using the same approved text, images and template as the Dutch edition.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function writeFrenchOrion(out) {
  const context = { window: {} };
  for (const file of ['i18n.js', 'i18n-orion.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(out, 'assets', file), 'utf8'), context);
  }
  const dictionary = context.window.I18N;
  const decode = value => value.replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&amp;', '&');
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  function translate(text) {
    const key = decode(text.trim()).replace(/\s+/g, ' ');
    const french = dictionary[key]?.[1];
    return french ? text.replace(text.trim(), () => escape(french)) : text;
  }
  let page = fs.readFileSync(path.join(out, 'orion.html'), 'utf8');
  page = page.replace('<html lang="nl">', '<html lang="fr" data-page-language="fr">')
    .replace('<head>', '<head>\n<base href="../../">')
    .replace(/(<(?:link|meta) [^>]*?)(href|content)="[^"]*"([^>]*?data-fr="([^"]*)"[^>]*>)/g,
      (_, prefix, attr, rest, fr) => prefix + attr + '="' + fr + '"' + rest)
    .replace(/<title>(.*?)<\/title>/, (_, title) => '<title>' + translate(title) + '</title>')
    .replace(/(<script type="application\/ld\+json">)(.*?)(<\/script>)/, (_, start, json, end) => {
      const data = JSON.parse(json);
      const app = data['@graph'].find(item => item['@type'] === 'SoftwareApplication');
      app.description = dictionary[app.description][1];
      app.url = 'https://grow-faster.be/fr/orion/';
      return start + JSON.stringify(data) + end;
    })
    .replace(/<body[\s\S]*?<\/body>/, body => body.replace(
      /<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<[^>]+>|[^<]+/g, token => {
        if (!token.startsWith('<')) return translate(token);
        if (/^<(script|style)\b/.test(token)) return token;
        return token.replace(/(alt|aria-label)="([^"]+)"/g,
          (_, attr, value) => attr + '="' + translate(value).replaceAll('"', '&quot;') + '"')
          .replaceAll('href="afspraak.html?onderwerp=vragenlijsten"', 'href="afspraak.html?onderwerp=vragenlijsten&amp;lang=fr"')
          .replace(/href="#/g, 'href="/fr/orion/#');
      }))
    .replace(/(<button\b[^>]*\bid="lang-btn-(top|modal)"[^>]*>)<span class="lang-cur">[^<]*<\/span>/g,
      (_, button, position) => {
        const label = position === 'top' ? 'FR-BE' : 'Français (BE)';
        const name = position === 'top' ? 'Langue : FR-BE — Français (BE)' : 'Langue : Français (BE)';
        return button.replace(/aria-label="[^"]*"/, 'aria-label="' + name + '"') + '<span class="lang-cur">' + label + '</span>';
      })
    .replaceAll('aria-checked="false" data-lang="fr"', 'aria-checked="true" data-lang="fr"')
    .replaceAll('poster="img/orion-werking-nl.webp"', 'poster="img/orion-werking-fr.webp"')
    .replace('<source src="media/orion-werking-nl.mp4"', '<source src="media/orion-werking-fr.mp4"');
  const dir = path.join(out, 'fr', 'orion');
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, 'index.html'), page);
}
module.exports = { writeFrenchOrion };
