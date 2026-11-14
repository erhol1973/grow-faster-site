'use strict';
const {inlineComponentStyles}=require('./component-style-delivery.cjs');
function typographyMarkup(css){if(typeof css!=='string'||/<\/style(?:\s|>|\/)/i.test(css))throw Error('Unsafe typography stylesheet');return '<link rel="stylesheet" href="/assets/typography.css?v=20261114-integration">';}
module.exports={typographyMarkup,inlineComponentStyles};
