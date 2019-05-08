"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);/* eslint-disable max-len */
/* global TextEncoder, TextDecoder */


test('TextEncoder', t => {
  t.ok(new TextEncoder(), 'TextEncoder successfully instantiated (available or polyfilled)');
  t.end();
});

test('TextDecoder', t => {
  t.ok(new TextDecoder(), 'TextDecoder successfully instantiated (available or polyfilled)');
  t.end();
});
