'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cases = require('../decision-journey/assets/cases.js');
const model = require('../decision-journey/assets/model.js');
const root = path.resolve(__dirname, '..');
function complete(id = 'external', lang = 'nl') {
  const state = model.createState(id, lang);
  state.selectedDimensions = ['process', 'governance'];
  return state;
}
function hasError(result, field, code) { return result.errors.some(e => e.field === field && e.code === code); }

test('two frozen fictional cases each cover six named contextual areas and NL/FR content', () => {
  assert.deepEqual(cases.map(c => c.id), ['external', 'internal']);
  for (const item of cases) {
    assert.equal(item.id, item.kind);
    assert.deepEqual(item.dimensions.map(d => d.id), ['strategy', 'people', 'process', 'governance', 'data', 'technology']);
    assert.deepEqual(item.canvas.options.map(o => o.id), ['wait', 'pilot', 'scale']);
    for (const lang of ['nl', 'fr']) {
      for (const key of ['title', 'summary', 'source', 'implication', 'evidence', 'uncertainty']) assert.ok(item[key][lang].length > 20);
      assert.match(item.source[lang], /[Ff]ict|[Vv]erzonnen|invent/i);
      for (const dimension of item.dimensions) assert.ok(dimension.observation[lang].length > 30);
    }
  }
  assert.throws(() => { cases[0].canvas.options[0].id = 'other'; }, TypeError);
  assert.throws(() => { cases.push({}); }, TypeError);
});

test('defaults have no diagnostic selection; complete selections permit a valid Canvas', () => {
  const initial = model.createState();
  assert.deepEqual({ id: initial.caseId, lang: initial.lang, step: initial.step, option: initial.chosenOption, saved: initial.draftSaved }, { id: 'external', lang: 'nl', step: 0, option: 'pilot', saved: false });
  assert.equal(model.validate(initial).valid, false);
  assert.ok(hasError(model.validate(initial), 'selectedDimensions', 'count'));
  for (const id of ['external', 'internal']) for (const lang of ['nl', 'fr']) assert.deepEqual(model.validate(complete(id, lang)), { valid: true, errors: [] });
});

test('independent states and immutable case defaults prevent cross-case draft leakage', () => {
  const first = complete(), second = complete();
  const originalQuestion = model.getCase('external').canvas.question.nl;
  first.fields.question = 'Edited local question'; first.selectedDimensions.push('data');
  assert.equal(second.fields.question, originalQuestion);
  assert.deepEqual(second.selectedDimensions, ['process', 'governance']);
  assert.equal(model.getCase('external').canvas.question.nl, originalQuestion);
});

test('language changes preserve all edited free text, chosen option, date and selections without mutating input', () => {
  const before = complete(); before.fields.question = 'Mijn eigen Nederlandstalige vraag'; before.fields.decisionDate = '2028-02-29'; before.chosenOption = 'wait'; before.step = 2; before.draftSaved = true;
  const snapshot = JSON.stringify(before), french = model.setLanguage(before, 'fr');
  assert.equal(french.lang, 'fr'); assert.equal(french.fields.question, before.fields.question);
  assert.equal(french.fields.decisionDate, '2028-02-29'); assert.equal(french.chosenOption, 'wait'); assert.equal(french.draftSaved, true); assert.equal(french.step, 2);
  assert.deepEqual(french.selectedDimensions, before.selectedDimensions);
  assert.equal(JSON.stringify(before), snapshot);
  french.fields.question = 'Une autre question'; french.selectedDimensions.pop();
  assert.equal(before.fields.question, 'Mijn eigen Nederlandstalige vraag'); assert.equal(before.selectedDimensions.length, 2);
  const returned = model.setLanguage(model.setLanguage(before, 'fr'), 'nl');
  assert.deepEqual(returned, before);
});

test('selecting another case resets draft and observations in the selected UI language', () => {
  const previous = complete('external', 'fr'); previous.fields.question = 'Brouillon modifié'; previous.step = 3; previous.draftSaved = true; previous.chosenOption = 'scale';
  const snapshot = JSON.stringify(previous), next = model.selectCase(previous, 'internal');
  assert.equal(next.caseId, 'internal'); assert.equal(next.lang, 'fr'); assert.equal(next.fields.question, model.getCase('internal').canvas.question.fr);
  assert.deepEqual(next.selectedDimensions, []); assert.equal(next.step, 0); assert.equal(next.draftSaved, false); assert.equal(next.chosenOption, 'pilot');
  assert.equal(JSON.stringify(previous), snapshot);
});

test('unknown cases and unsupported languages fail closed at model entry points', () => {
  for (const id of ['unknown', '__proto__', null, 7]) assert.throws(() => model.getCase(id), RangeError);
  assert.throws(() => model.createState('missing'), RangeError);
  for (const lang of ['en', '', null]) {
    assert.throws(() => model.createState('external', lang), TypeError);
    assert.throws(() => model.setLanguage(complete(), lang), TypeError);
    assert.throws(() => model.selectCase({ lang }, 'internal'), TypeError);
  }
});

test('validation reports malformed state and field types without crashing or accepting truthy objects', () => {
  for (const value of [null, undefined, [], false, 'state']) assert.equal(model.validate(value).valid, false);
  for (const fields of [null, [], true, 'fields']) { const state = complete(); state.fields = fields; assert.ok(hasError(model.validate(state), 'fields', 'type')); }
  for (const value of [null, undefined, 123, {}, []]) { const state = complete(); state.fields.owner = value; assert.ok(hasError(model.validate(state), 'owner', 'type')); }
  const state = complete(); state.caseId = 'unknown'; state.lang = 'en'; state.step = 8; state.draftSaved = 'yes';
  const result = model.validate(state);
  for (const [field, code] of [['caseId', 'unknown'], ['lang', 'unsupported'], ['step', 'range'], ['draftSaved', 'type']]) assert.ok(hasError(result, field, code));
});

test('all required editable fields reject whitespace and oversize independently', () => {
  for (const field of ['question', 'situation', 'value', 'resources', 'risks', 'unknowns', 'recommendation', 'owner', 'success']) {
    const state = complete(); state.fields[field] = ' \n\t ';
    assert.ok(hasError(model.validate(state), field, 'required'), field);
    state.fields[field] = 'x'.repeat(12001);
    assert.ok(hasError(model.validate(state), field, 'too_long'), field);
    state.fields[field] = 'x'.repeat(12000);
    assert.equal(model.validate(state).valid, true, field);
  }
});

test('calendar validation handles century and leap boundaries without a clock dependency', () => {
  for (const date of ['2024-02-29', '2000-02-29', '2026-04-30', '0001-01-01', '9999-12-31', '2020-01-01']) {
    const state = complete(); state.fields.decisionDate = date;
    assert.equal(model.validate(state).valid, true, date);
  }
  for (const date of ['2026-02-29', '1900-02-29', '2026-04-31', '2026-00-10', '2026-13-01', '2026-01-00', '2026-1-01', '0000-01-01', '2026-11-27T00:00:00Z', '', 'not a date']) {
    const state = complete(); state.fields.decisionDate = date;
    assert.ok(hasError(model.validate(state), 'decisionDate', 'calendar'), date);
  }
});

test('one to six unique selected contextual areas are allowed; they are not scores', () => {
  const state = complete();
  state.selectedDimensions = ['strategy']; assert.equal(model.validate(state).valid, true);
  state.selectedDimensions = ['strategy', 'people', 'process', 'governance', 'data', 'technology']; assert.equal(model.validate(state).valid, true);
  for (const selected of [[], ['process', 'process'], ['strategy', 'people', 'process', 'governance', 'data', 'technology', 'other'], ['__proto__'], [{ id: 'process' }]]) {
    state.selectedDimensions = selected; assert.equal(model.validate(state).valid, false);
  }
  for (const selected of [null, 'process']) { state.selectedDimensions = selected; assert.ok(hasError(model.validate(state), 'selectedDimensions', 'type')); }
});

test('chosen option must be an exact option ID from the current case', () => {
  const state = complete();
  for (const option of ['wait', 'pilot', 'scale']) { state.chosenOption = option; assert.equal(model.validate(state).valid, true); }
  for (const option of ['', 'PILOT', 'other', {}, null, 0]) { state.chosenOption = option; assert.ok(hasError(model.validate(state), 'chosenOption', 'unknown')); }
});

test('report rejects incomplete Canvas rather than fabricating a decision', () => {
  const state = model.createState();
  assert.throws(() => model.makeReport(state), error => error.code === 'INVALID_REPORT' && error.errors.some(e => e.field === 'selectedDimensions'));
});

test('export contains all eleven elements, linked source/evidence/uncertainty and selected option', () => {
  const state = complete(); state.chosenOption = 'wait';
  const report = model.makeReport(state);
  const headings = [...report.matchAll(/^(\d+)\. /gm)].map(m => Number(m[1]));
  assert.deepEqual(headings, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  for (const value of [state.fields.question, state.fields.owner, state.fields.decisionDate, state.fields.success, model.getCase('external').date, model.getCase('external').source.nl, model.getCase('external').evidence.nl, model.getCase('external').uncertainty.nl]) assert.ok(report.includes(value));
  assert.match(report, /\[X\] Nog niet automatiseren/); assert.match(report, /\[ \] Beperkte gecontroleerde proef/);
  assert.match(report, /GEEN ECA-SCORE/); assert.match(report, /geen financieel resultaat gerealiseerd/);
});

test('diagnostic export includes selected observations only and states non-validation', () => {
  const state = complete('internal'); state.selectedDimensions = ['data'];
  const report = model.makeReport(state), item = model.getCase('internal');
  assert.ok(report.includes(item.dimensions.find(d => d.id === 'data').observation.nl));
  assert.ok(!report.includes(item.dimensions.find(d => d.id === 'strategy').observation.nl));
  assert.match(report, /FICTIEVE DEMO — NIET GOEDGEKEURD — RESULTATEN NIET GEVALIDEERD/);
});

test('French export localizes source and option labels but preserves manually edited Dutch text', () => {
  const state = model.setLanguage(complete('external'), 'fr'); state.fields.question = 'Mijn aangepaste vraag blijft behouden';
  const report = model.makeReport(state);
  assert.match(report, /DÉMONSTRATION FICTIVE — NON APPROUVÉE — RÉSULTATS NON VALIDÉS/);
  assert.ok(report.includes(model.getCase('external').source.fr)); assert.match(report, /\[X\] Essai limité et contrôlé/);
  assert.ok(report.includes('Mijn aangepaste vraag blijft behouden')); assert.match(report, /ne le traduit pas/);
});

test('export is inert plain text and strips control characters without changing entered state', () => {
  const state = complete(); state.fields.question = '<script>alert("x")</script>\u0000'; state.fields.recommendation = '<img src=x onerror=alert(1)> javascript:example';
  const snapshot = JSON.stringify(state), report = model.makeReport(state);
  assert.ok(!report.includes('<')); assert.ok(!report.includes('>')); assert.ok(!report.includes('\u0000'));
  assert.ok(report.includes('‹script›')); assert.equal(JSON.stringify(state), snapshot);
});

test('reporting and validation are deterministic and never mutate state', () => {
  const state = complete('internal', 'fr'), snapshot = JSON.stringify(state);
  assert.equal(model.makeReport(state), model.makeReport(state));
  assert.deepEqual(model.validate(state), model.validate(state));
  assert.equal(JSON.stringify(state), snapshot);
});

test('browser scripts expose only the agreed model/case globals without DOM, storage or network', () => {
  const sandbox = { fetch() { throw Error('network forbidden'); }, localStorage: new Proxy({}, { get() { throw Error('storage forbidden'); } }) };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'decision-journey/assets/cases.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'decision-journey/assets/model.js'), 'utf8'), sandbox);
  assert.equal(sandbox.GFDemoCases.length, 2);
  const state = sandbox.GFDemoModel.createState('internal', 'fr'); state.selectedDimensions = ['people'];
  assert.equal(sandbox.GFDemoModel.validate(state).valid, true);
  assert.ok(sandbox.GFDemoModel.makeReport(state).includes('DÉMONSTRATION FICTIVE'));
  assert.equal(Object.isFrozen(sandbox.GFDemoModel), true);
});

test('V2 journey allows plan and dossier without altering Canvas validation', () => {
  const state = complete(); assert.equal(state.roadmap, null);
  state.step = 4; assert.equal(model.validate(state).valid, true);
  state.step = 5; assert.equal(model.validate(state).valid, true);
  state.step = 6; assert.ok(hasError(model.validate(state), 'step', 'range'));
});

test('V3 language preserves detached review input and changing case clears it', () => {
  const state = complete(); assert.equal(state.valueReview, null);
  state.valueReview = { reviewOwner:'Moi', measures:[{baseline:{value:'0,500'},reviews:[{day:30,value:'-0.5',context:'Eigen tekst'}]}] };
  const next = model.setLanguage(state,'fr');assert.deepEqual(next.valueReview,state.valueReview);
  next.valueReview.measures[0].baseline.value='1';next.valueReview.measures[0].reviews[0].context='Autre';
  assert.equal(state.valueReview.measures[0].baseline.value,'0,500');assert.equal(state.valueReview.measures[0].reviews[0].context,'Eigen tekst');
  assert.equal(model.selectCase(state,'internal').valueReview,null);
});

test('language changes deep-clone edited roadmap while case changes reset it', () => {
  const state = complete(); state.roadmap = { objective: 'Edited', actions: [{ id: 'a-1', dependencies: ['a-2'], title: 'Mijn taak' }] };
  const changed = model.setLanguage(state, 'fr');
  assert.deepEqual(changed.roadmap, state.roadmap);
  changed.roadmap.actions[0].dependencies.push('a-3'); changed.roadmap.objective = 'Other';
  assert.deepEqual(state.roadmap.actions[0].dependencies, ['a-2']); assert.equal(state.roadmap.objective, 'Edited');
  assert.equal(model.selectCase(state, 'internal').roadmap, null);
});
