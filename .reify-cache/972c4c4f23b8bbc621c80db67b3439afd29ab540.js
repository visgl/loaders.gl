"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var GLBParser,GLBBuilder;module.link('@loaders.gl/gltf',{GLBParser(v){GLBParser=v},GLBBuilder(v){GLBBuilder=v}},1);/* eslint-disable */




test('GLBParser#parse', t => {
  const testJson = {nested: {typedArray: new Float32Array([10.0, 11.0, 12.0])}};
  const builder = new GLBBuilder();
  builder.addApplicationData('test', testJson, {packTypedArrays: true});
  const arrayBuffer = builder.encodeAsGLB();

  const parser = new GLBParser();
  parser.parseSync(arrayBuffer);
  const json = parser.getApplicationData('test');
  t.ok(json.nested.typedArray instanceof Float32Array, 'Float32Array present');

  t.end();
});
