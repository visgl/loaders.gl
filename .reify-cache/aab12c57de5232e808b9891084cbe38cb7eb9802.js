"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);module.link('@loaders.gl/polyfills');/* eslint-disable max-len */



/* global _encodeImageNode, _parseImageNode */
test('TextEncoder', t => {
  t.equals(
    typeof _encodeImageNode,
    'function',
    '_encodeImageNode successfully installed on global'
  );
  t.end();
});

test('TextDecoder', t => {
  t.equals(typeof _parseImageNode, 'function', '_parseImageNode successfully installed on global');
  t.end();
});
