
'use strict';
const book = document.querySelector('.book');
let sheets = [...book.querySelectorAll('.sheet')];
const toolbar = document.querySelector('.toolbar');
const previous = document.querySelector('[data-prev]');
const next = document.querySelector('[data-next]');
const position = toolbar.querySelector('output');
const alternate = document.querySelector('[data-alternate]');
const alternateRoute = alternate.getAttribute('href');
let current = -1;
let enlarged = false;
let readingScale = 1;
try { localStorage.setItem("avs-lang", document.documentElement.lang); } catch {}
const windowArea = document.querySelector('.page-window');
const zoom = toolbar.querySelector('[data-zoom]');

const baseWidth = 297 * 96 / 25.4;
const pageAspect = 297 / 210;
const measuredWidth = new WeakMap();

function sizeSheet(sheet, width) {
  sheet.style.setProperty('--sheet-width', width + 'px');
  sheet.style.setProperty('--sheet-height', width / pageAspect + 'px');
}

function fitPage() {
  const sheet = sheets[current];
  if (!sheet || sheet.hidden) return;
  let width = measuredWidth.get(sheet) || baseWidth;
  sizeSheet(sheet, width);
  // Layout metrics are unscaled CSS pixels. Wider landscape paper also gives
  // long translated paragraphs more room to wrap. Keep scroll/zoom available
  // if an exceptionally large future item exceeds the bounded layout pass.
  for (let pass = 0; pass < 4; pass++) {
    const excess = sheet.scrollHeight - sheet.clientHeight;
    const horizontal = sheet.scrollWidth - sheet.clientWidth;
    if (excess <= 1 && horizontal <= 1) break;
    width = Math.max(width + Math.max(0, excess) * pageAspect, width + Math.max(0, horizontal)) + 2;
    sizeSheet(sheet, width);
  }
  measuredWidth.set(sheet, width);
  const height = width / pageAspect;
  const fit = Math.min((windowArea.clientWidth - 16) / width, (windowArea.clientHeight - 16) / height, 1);
  const scale = enlarged ? readingScale : Math.max(fit, 0.01);
  book.style.setProperty('--page-scale', scale);
  book.style.setProperty('--book-width', width * scale + 'px');
  book.style.setProperty('--book-height', height * scale + 'px');
}
document.documentElement.classList.add('enhanced-reader');
new ResizeObserver(fitPage).observe(windowArea);
book.addEventListener('load', fitPage, true);
document.fonts.ready.then(fitPage);
zoom.addEventListener('click', () => {
  enlarged = !enlarged;
  readingScale = 1;
  zoom.setAttribute('aria-pressed', String(enlarged));
  fitPage();
});

function resizeText(direction) {
  readingScale = Math.max(.4, Math.min(2.5, (enlarged ? readingScale : Math.max(Number(book.style.getPropertyValue('--page-scale')), .8)) + direction * .2));
  enlarged = true;
  zoom.setAttribute('aria-pressed', 'true');
  fitPage();
}
toolbar.querySelector('[data-bigger]').addEventListener('click', () => resizeText(1));
toolbar.querySelector('[data-smaller]').addEventListener('click', () => resizeText(-1));

function targetIndex() {
  const target = document.getElementById(location.hash.slice(1));
  const sheet = target?.closest('.sheet');
  return sheet ? sheets.indexOf(sheet) : Math.max(current, 0);
}

function show(index, focus = false) {
  const sheet = sheets[index];
  if (current !== index) {
    sheets.forEach((item, number) => {
      item.hidden = number !== index;
      item.classList.remove('turning', 'back');
    });
    if (current >= 0) {
      sheet.classList.toggle('back', index < current);
      sheet.classList.add('turning');
    }
    current = index;
    fitPage();
  }
  previous.disabled = index === 0;
  next.disabled = index === sheets.length - 1;
  position.value = `${index + 1} / ${sheets.length}`;
  alternate.href = alternateRoute + location.hash;
  if (focus) {
    sheet.querySelector('h1, h2').focus({preventScroll:true});
    windowArea.scrollTop = 0;
    windowArea.scrollLeft = 0;
  }
}

function turn(offset) {
  const index = current + offset;
  if (index < 0 || index >= sheets.length) return;
  history.pushState(null, '', '#' + sheets[index].id);
  show(index, true);
}
toolbar.hidden = false;
book.classList.add('enhanced');
fitPage();
show(targetIndex());
previous.addEventListener('click', () => turn(-1));
next.addEventListener('click', () => turn(1));
window.addEventListener('hashchange', () => {
  if (location.hash === '#subscribe') {
    alternate.href = alternateRoute + location.hash;
    return;
  }
  show(targetIndex(), true);
  const target = document.getElementById(location.hash.slice(1));
  if (target?.closest('.sheet') && target !== sheets[current]) {
    sheets[current].scrollTop = target.offsetTop;
  }
});
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target.closest('input, select, textarea, [contenteditable]')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    turn(event.key === 'ArrowRight' ? 1 : -1);
  }
});


const joinLink = document.querySelector('[data-journal-join]');
const sourcesLink = document.querySelector('[data-journal-sources]');
const journalStatus = document.querySelector('[data-journal-status]');
const isFrench = document.documentElement.lang === 'fr';
const editionPath = '/storage/v1/object/authenticated/member-content/journal/2026-11/';
let requestVersion = 0;
let protectedImageUrl;
let editionOwner;

function removeMemberPages() {
  requestVersion++;
  book.querySelectorAll('[data-member-sheet]').forEach(sheet => sheet.remove());
  if (protectedImageUrl) URL.revokeObjectURL(protectedImageUrl);
  protectedImageUrl = undefined;
  editionOwner = undefined;
  sheets = [...book.querySelectorAll('.sheet')];
  current = -1;
  joinLink.hidden = false;
  sourcesLink.hidden = true;
  document.querySelectorAll('[data-member-ref]').forEach(link => { link.href = '#journal-source'; });
  journalStatus.textContent = '';
  show(targetIndex());
}

async function updateEdition() {
  if (!window.GFMember) return;
  joinLink.href = GFMember.accountUrl();
  const version = ++requestVersion;
  try {
    const member = await GFMember.ready();
    if (version !== requestVersion) return;
    if (!member) { removeMemberPages(); return; }
    if (editionOwner === member.id && sheets.length === 15) return;
    if (editionOwner && editionOwner !== member.id) {
      removeMemberPages();
      return updateEdition();
    }
    const editionResponse = await GFMember.request(editionPath + (isFrench ? 'fr.json' : 'nl.json'));
    if (!editionResponse.ok) throw Error('Edition unavailable');
    const bytes = await editionResponse.arrayBuffer();
    // Only render the exact editorial markup approved with this release.
    const hash = await crypto.subtle.digest('SHA-256',bytes);
    const digest = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2,'0')).join('');
    if (digest !== book.dataset.editionDigest) throw Error('Edition integrity');
    const contents = JSON.parse(new TextDecoder().decode(bytes));
    if (contents.sheets.length !== 12) throw Error('Incomplete edition');
    const template = document.createElement('template');
    template.innerHTML = contents.sheets.join('');
    if (version !== requestVersion) return;
    for (const sheet of template.content.children) {
      sheet.dataset.memberSheet = '';
      sheet.hidden = true;
    }
    book.append(template.content);
    sheets = [...book.querySelectorAll('.sheet')];
    editionOwner = member.id;
    joinLink.hidden = true;
    sourcesLink.hidden = false;
    document.querySelectorAll('[data-member-ref]').forEach(link => { link.href = link.dataset.memberRef; });
    journalStatus.textContent = '';
    current = -1;
    show(targetIndex());
    const pictureResponse = await GFMember.request(editionPath + 'cartoon.webp');
    if (!pictureResponse.ok) throw Error('Artwork unavailable');
    const picture = await pictureResponse.blob();
    if (version !== requestVersion) return;
    protectedImageUrl = URL.createObjectURL(picture);
    book.querySelector('[data-journal-cartoon]').src = protectedImageUrl;
  } catch {
    if (version !== requestVersion) return;
    removeMemberPages();
    journalStatus.textContent = isFrench ? 'Le numéro complet est temporairement indisponible.' : 'De volledige editie is tijdelijk niet beschikbaar.';
  }
}

book.addEventListener('click', event => {
  const citation = event.target.closest('a[data-member-ref][title]');
  if (citation && !editionOwner) {
    event.preventDefault();
    journalStatus.textContent = citation.title;
  }
});
window.addEventListener('gf-member-change', updateEdition);
// Browsers can retain the DOM in the back-forward cache after logout.
window.addEventListener('pagehide', removeMemberPages);
window.addEventListener('pageshow', event => { if (event.persisted) updateEdition(); });
updateEdition();
