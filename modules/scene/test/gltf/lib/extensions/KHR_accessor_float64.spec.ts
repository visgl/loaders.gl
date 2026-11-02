import {expect, test} from 'vitest';
import {name, preprocess} from '../../../../src/gltf/lib/extensions/KHR_accessor_float64';
import type {GLTFWithBuffers} from '../../../../src/gltf/lib/types/gltf-types';

test('float64 declarations survive validation without precision conversion', () => {
  const gltf: GLTFWithBuffers = {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: [name],
      extensionsRequired: [name],
      accessors: [{componentType: 5130, count: 1, type: 'SCALAR', min: [1 + 2 ** -40]}]
    },
    buffers: []
  };
  const before = JSON.stringify(gltf);
  preprocess(gltf);
  expect(JSON.stringify(gltf)).toBe(before);
  gltf.json.accessors![0].normalized = true;
  expect(() => preprocess(gltf)).toThrow('must not be normalized');
});

test.each([
  'extensionsUsed',
  'extensionsRequired'
] as const)('rejects incomplete %s declaration', key => {
  expect(() => preprocess({json: {asset: {version: '2.0'}, [key]: [name]}, buffers: []})).toThrow(
    'must be declared'
  );
});

test('leaves assets without the extension unchanged', () => {
  expect(() => preprocess({json: {asset: {version: '2.0'}}, buffers: []})).not.toThrow();
  expect(() =>
    preprocess({
      json: {asset: {version: '2.0'}, extensionsUsed: [name], extensionsRequired: [name]},
      buffers: []
    })
  ).not.toThrow();
});
