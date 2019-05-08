"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var toArrayBuffer,toDataView;module.link('@loaders.gl/core',{toArrayBuffer(v){toArrayBuffer=v},toDataView(v){toDataView=v}},1);


test('toArrayBuffer', t => {
  t.ok(toArrayBuffer, 'toArrayBuffer defined');
  t.end();
});

test('toDataView', t => {
  t.ok(toDataView, 'toDataView defined');
  t.end();
});
