"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);module.link('@loaders.gl/polyfills');var isBrowser;module.link('@loaders.gl/polyfills/utils/globals',{isBrowser(v){isBrowser=v}},1);/* eslint-disable max-len */




/* global _encodeImageNode, _parseImageNode */
test('Node image polyfills', t => {
  if (!isBrowser) {
    t.equals(typeof _encodeImageNode, 'function', 'global._encodeImageNode successfully installed');

    t.equals(typeof _parseImageNode, 'function', 'global._parseImageNode successfully installed');
  }
  t.end();
});
