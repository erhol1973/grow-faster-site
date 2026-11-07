
'use strict';
const book = document.querySelector('.book');
const sheets = [...book.querySelectorAll('.sheet')];
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

function fitPage() {
  const width = 297 * 96 / 25.4;
  const height = 210 * 96 / 25.4;
  const fit = Math.min((windowArea.clientWidth - 16) / width, (windowArea.clientHeight - 16) / height, 1);
  const scale = enlarged ? readingScale : Math.max(fit, 0.01);
  book.style.setProperty('--page-scale', scale);
  book.style.setProperty('--book-width', width * scale + 'px');
  book.style.setProperty('--book-height', height * scale + 'px');
}
document.documentElement.classList.add('enhanced-reader');
new ResizeObserver(fitPage).observe(windowArea);
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

