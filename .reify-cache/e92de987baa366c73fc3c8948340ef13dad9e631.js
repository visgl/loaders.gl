"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var copyPaddedStringToDataView;module.link('@loaders.gl/gltf/utils/encode-utils',{copyPaddedStringToDataView(v){copyPaddedStringToDataView=v}},1);/* eslint-disable max-len */




test('encode-utils', t => {
  const STRING = 'abcdef';
  const byteLength = copyPaddedStringToDataView(null, 0, STRING);
  t.equals(byteLength, 8); // padded
  const arrayBuffer = new ArrayBuffer(byteLength);
  const dataView = new DataView(arrayBuffer);
  const finalLength = copyPaddedStringToDataView(dataView, 0, STRING);
  t.equals(finalLength, 8);
  t.end();
});
