"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var GLTFBuilder;module.link('@loaders.gl/gltf',{GLTFBuilder(v){GLTFBuilder=v}},1);var packBinaryJson;module.link('@loaders.gl/gltf/packed-json/pack-binary-json',{default(v){packBinaryJson=v}},2);/* eslint-disable max-len */






const inputJSONTypedArraysMixed = {
  slices: [
    {
      primitives: new Int8Array([3, 2, 3])
    },
    {
      primitives: new Uint16Array([6, 2, 4, 5])
    },
    {
      primitives: new Float32Array([8, 2, 4, 5])
    }
  ]
};

const inputJSONTypedArrays = {
  slices: [
    {
      primitives: new Float32Array([3, 2, 3])
    },
    {
      primitives: new Float32Array([6, 2, 4, 5])
    },
    {
      primitives: new Float32Array([8, 2, 4, 5])
    }
  ]
};

const inputJSONClassicArrays = {
  slices: [
    {
      primitives: [3, 2, 3]
    },
    {
      primitives: [[6, 2], [4, 5]]
    },
    {
      primitives: [[8, 2], [4, 5]]
    }
  ]
};

const flattenArraysFalse = {
  slices: [
    {
      primitives1: [3, 2, 3],
      primitives2: [[6, 2], [4, 5]],
      primitives3: [[8, 2], [4, 5]]
    }
  ]
};

test('pack-and-unpack-json', t => {
  let glbBuilder;
  let json;

  glbBuilder = new GLTFBuilder();
  json = packBinaryJson(inputJSONTypedArraysMixed, glbBuilder, {flattenArrays: true});
  t.comment(JSON.stringify(json));
  t.equals(glbBuilder.sourceBuffers.length, 3, 'Right number of buffers extracted');

  glbBuilder = new GLTFBuilder();
  json = packBinaryJson(inputJSONTypedArrays, glbBuilder, {flattenArrays: true});
  t.comment(JSON.stringify(json));
  t.equals(glbBuilder.sourceBuffers.length, 3, 'Right number of buffers extracted');

  glbBuilder = new GLTFBuilder();
  json = packBinaryJson(inputJSONClassicArrays, glbBuilder, {flattenArrays: true});
  t.comment(JSON.stringify(json));
  t.equals(glbBuilder.sourceBuffers.length, 3, 'Right number of buffers extracted');

  t.end();
});

test('pack-and-unpack-json#flattenArrays:false', t => {
  const glbBuilder = new GLTFBuilder();
  const json = packBinaryJson(flattenArraysFalse, glbBuilder, {flattenArrays: false});
  t.comment(JSON.stringify(json));
  t.equals(glbBuilder.sourceBuffers.length, 0, 'Right number of buffers extracted');
  t.equals(
    JSON.stringify(flattenArraysFalse),
    JSON.stringify(json),
    'Returned JSON structurally equivalent'
  );

  t.end();
});
