"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var TextEncoder,TextDecoder;module.link('@loaders.gl/core',{TextEncoder(v){TextEncoder=v},TextDecoder(v){TextDecoder=v}},1);/* eslint-disable max-len */



test('TextEncoder', t => {
  t.ok(new TextEncoder(), 'TextEncoder successfully instantiated (available or polyfilled)');
  t.end();
});

test('TextDecoder', t => {
  t.ok(new TextDecoder(), 'TextDecoder successfully instantiated (available or polyfilled)');
  t.end();
});
