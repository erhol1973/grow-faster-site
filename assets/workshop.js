'use strict';
(() => {
  const supported = ['nl', 'fr'];
  const requested = new URLSearchParams(location.search).get('lang');
  if (supported.includes(requested)) {
    try { localStorage.setItem('avs-lang', requested); } catch { /* The page remains usable without storage. */ }
    document.documentElement.lang = requested;
  }
  const language = () => document.documentElement.lang;
  const t = key => window.I18N?.[key]?.[{nl: 0, fr: 1}[language()]] || key;
  const sample = document.getElementById('voorbeeldplan');
  const wide = matchMedia('(min-width: 900px)');
  const setSample = () => { sample.open = wide.matches; };
  setSample();
  wide.addEventListener('change', setSample);

  const form = document.getElementById('request-form');
  const questionField = document.getElementById('request-question');
  const result = document.getElementById('request-result');
  const link = document.getElementById('request-mail');
  const preview = document.getElementById('request-preview');
  const status = document.getElementById('request-status');
  const copyStatus = document.getElementById('copy-status');
  let draft = '';
  const missing = 'Please briefly describe your AI application or question.';
  const subject = () => t('Introduction: From AI pilot to business value');
  function resetDraft() {
    result.hidden = true;
    status.textContent = '';
    copyStatus.textContent = '';
    draft = '';
    link.removeAttribute('href');
    preview.textContent = '';
  }
  function localize() {
    resetDraft();
    link.textContent = t('Reopen email draft');
    document.getElementById('copy-request').textContent = t('Copy request');
    document.querySelector('#draft-details>summary').textContent = t('Review your request');
    document.querySelectorAll('#kennismaking a[href^="mailto:"]').forEach(a => {
      a.href = 'mailto:' + form.dataset.recipient + '?subject=' + encodeURIComponent(subject());
    });
    const assessment = document.querySelector('.ws-eca-link');
    assessment.href = 'eca.html?lang=' + (supported.includes(language()) ? language() : 'nl');
    if (questionField.validity.customError) questionField.setCustomValidity(t(missing));
  }
  new MutationObserver(localize).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  localize();
  form.addEventListener('input', resetDraft);
  questionField.addEventListener('input', () => questionField.setCustomValidity(''));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const question = questionField.value.trim();
    questionField.setCustomValidity(question ? '' : t(missing));
    if (!form.reportValidity()) return;
    const name = document.getElementById('request-name').value.trim();
    const company = document.getElementById('request-company').value.trim();
    const body = [
      t('Hello Erlend,'), '',
      t('I would like to discuss whether the workshop From AI pilot to business value fits our needs.'), '',
      ...(name ? [t('Name') + ': ' + name] : []),
      ...(company ? [t('Organisation') + ': ' + company] : []),
      t('Our AI application or question:'), question, '',
      t('I would welcome a 30-minute introductory conversation.'), '',
      t('Kind regards'), name
    ].join('\n');
    draft = t('Subject:') + ' ' + subject() + '\n\n' + body;
    link.href = 'mailto:' + form.dataset.recipient + '?subject=' + encodeURIComponent(subject()) + '&body=' + encodeURIComponent(body);
    preview.textContent = draft;
    result.hidden = false;
    copyStatus.textContent = '';
    status.textContent = t('Send the request in your email application. If it does not open, use the link below or copy the request.');
    link.click();
  });
  document.getElementById('copy-request').addEventListener('click', async () => {
    if (!draft) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(draft);
      copyStatus.textContent = t('Request copied. Paste it into an email to') + ' ' + form.dataset.recipient + '.';
    } catch {
      document.getElementById('draft-details').open = true;
      const selection = getSelection(), range = document.createRange();
      range.selectNodeContents(preview);
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = t('Automatic copying is unavailable. The text is selected; copy it using your device’s copy command.');
      preview.focus();
    }
  });
  // No request contents enter storage, a URL, analytics or CRM. Only the visitor sends the email draft.
  form.hidden = false;
})();
