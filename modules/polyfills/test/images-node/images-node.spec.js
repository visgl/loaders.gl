/* eslint-disable max-len */
import test from 'tape-promise/tape';
import '@loaders.gl/polyfills';

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
