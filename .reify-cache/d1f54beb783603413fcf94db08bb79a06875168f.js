"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var isBrowser;module.link('@loaders.gl/core',{isBrowser(v){isBrowser=v}},1);var resolvePath;module.link('@loaders.gl/core/lib/fetch/file-aliases',{resolvePath(v){resolvePath=v}},2);module.link('@loaders.gl/polyfills/');/* global fetch */





const PLY_CUBE_ATT_URL = resolvePath('@loaders.gl/ply/test/data/cube_att.ply');

test('fetch polyfill (Node.js)#fetch()', async t => {
  if (!isBrowser) {
    const response = await fetch(PLY_CUBE_ATT_URL);
    const data = await response.text();
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js');
  }
  t.end();
});
