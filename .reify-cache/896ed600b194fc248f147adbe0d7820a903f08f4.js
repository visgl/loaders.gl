"use strict";var load,registerLoaders;module.link('@loaders.gl/core',{load(v){load=v},registerLoaders(v){registerLoaders=v}},0);var test;module.link('tape-promise/tape',{default(v){test=v}},1);



test('load#load', t => {
  t.ok(load, 'load defined');
  load('.').then(loadedData => {
    t.ok(true, 'load accepts undefined loaders');
    t.end();
  });
});

test('load#auto detect loader', t => {
  registerLoaders({
    name: 'JSON',
    extensions: ['json'],
    parse: data => {
      t.ok(data instanceof ArrayBuffer, 'Got ArrayBuffer');
      t.end();
    }
  });
  load('package.json');
});
