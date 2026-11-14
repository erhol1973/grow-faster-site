const {test}=require('node:test');
const assert=require('node:assert/strict');
const {inlineComponentStyles}=require('../scripts/component-style-delivery.cjs');

test('component delivery preserves exact CSS bytes and cascade positions before the external type policy',()=>{
  for(const component of ['navigation','books','cms-public']){
    const css='nav { color: navy; }\n';
    const link='<link rel="stylesheet" href="assets/'+component+'.css?v=1">';
    const input='<head><style>nav{color:red}</style>'+link+'<style>nav{color:blue}</style><link rel="stylesheet" href="assets/typography.css?v=2"></head>';
    assert.equal(inlineComponentStyles(input,name=>{assert.equal(name,'assets/'+component+'.css');return css}),input.replace(link,'<style data-gf-component-style="assets/'+component+'.css">'+css+'</style>'));
  }
});

test('strict CSP and links with media, integrity, identity or behavior remain external',()=>{
  const link='<link rel="stylesheet" href="assets/books.css">';
  const inputs=["<meta http-equiv='Content-Security-Policy' content=\"style-src 'self'\">"+link,'<meta http-equiv=Content-Security-Policy content="style-src &apos;self&apos;">'+link,'<meta content="example > value" HTTP-EQUIV=Content-Security-Policy>'+link,...['media="print"','integrity="sha256-example"','id="theme"','onload="ready()"','disabled'].map(attr=>link.replace('>',' '+attr+'>'))];
  for(const input of inputs)assert.equal(inlineComponentStyles(input,()=>{throw Error('Must not load CSS')}),input);
});

test('relative resources, oversized files and non-allowlisted styles retain external delivery',()=>{
  const link='<link href="/assets/books.css?v=1" rel="stylesheet">';
  for(const css of ['p{background:url(../img/a.svg)}','@import "theme.css";','x'.repeat(16385)])assert.equal(inlineComponentStyles(link,()=>css),link);
  const other='<link rel="stylesheet" href="assets/site.css">';
  assert.equal(inlineComponentStyles(other,()=>{throw Error('Not allowlisted')}),other);
});

test('component delivery fails closed on style-container injection',()=>{
  const link='<link rel="stylesheet" href="assets/navigation.css">';
  assert.throws(()=>inlineComponentStyles(link,()=>'</StYle><script>bad()</script>'),/Unsafe/);
});
test('canonical finalizer preserves CSP and component order, refuses duplicate/behavioral type links',()=>{
  const {finalTypography}=require('../scripts/component-style-delivery.cjs');
  const csp='<meta http-equiv="Content-Security-Policy" content="style-src self">',component='<style>.member{color:navy}</style>';
  const old='<link rel="stylesheet" href="assets/typography.css?v=old">';
  const result=finalTypography('<head>'+csp+old+component+'</head>');
  assert.equal(result,'<head>'+csp+component+'<link rel="stylesheet" href="/assets/typography.css?v=20261114-integration"></head>');
  assert.doesNotMatch(result,/<style data-gf-typography>/);
  assert.throws(()=>finalTypography('<head>'+old+old+'</head>'),/Duplicate/);
  for(const attr of ['media="print"','integrity="sha256-test"','onload="x()"'])assert.throws(()=>finalTypography('<head>'+old.replace('>',' '+attr+'>')+'</head>'),/semantics/);
});
