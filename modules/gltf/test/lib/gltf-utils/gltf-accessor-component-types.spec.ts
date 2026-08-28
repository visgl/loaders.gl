// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GLTFScenegraph, postProcessGLTF} from '@loaders.gl/gltf';
import type {BigTypedArray} from '@loaders.gl/schema';
const TEST_CASES: {
  name: string;
  componentType: number;
  source: BigTypedArray;
}[] = [
  {name: 'INT', componentType: 5124, source: new Int32Array([-123456789, 123456789])},
  {name: 'DOUBLE', componentType: 5130, source: new Float64Array([Math.PI, -0.25])},
  {name: 'HALF_FLOAT', componentType: 5131, source: new Uint16Array([0x3c00, 0xc000])},
  {
    name: 'INT64',
    componentType: 5134,
    source: new BigInt64Array([-9007199254740993n, 9223372036854775807n])
  },
  {
    name: 'UNSIGNED_INT64',
    componentType: 5135,
    source: new BigUint64Array([9007199254740993n, 18446744073709551615n])
  }
];
test('glTF 2.1 accessor component types', () => {
  for (const testCase of TEST_CASES) {
    const gltf = {
      json: {
        asset: {version: '2.1'},
        buffers: [{byteLength: testCase.source.byteLength}],
        bufferViews: [{buffer: 0, byteLength: testCase.source.byteLength}],
        accessors: [
          {
            bufferView: 0,
            componentType: testCase.componentType,
            count: testCase.source.length,
            type: 'SCALAR' as const
          }
        ]
      },
      buffers: [
        {
          arrayBuffer: testCase.source.buffer as ArrayBuffer,
          byteOffset: testCase.source.byteOffset,
          byteLength: testCase.source.byteLength
        }
      ]
    };
    const scenegraph = new GLTFScenegraph(gltf);
    const scenegraphValues = scenegraph.getTypedArrayForAccessor(0);
    expect(scenegraphValues.constructor, `${testCase.name} type`).toBe(testCase.source.constructor);
    expect(Array.from(scenegraphValues), `${testCase.name} values`).toEqual(
      Array.from(testCase.source)
    );
    const processed = postProcessGLTF(gltf);
    const processedValues = processed.accessors[0].value;
    expect(processedValues.constructor, `${testCase.name} postprocessed type`).toBe(
      testCase.source.constructor
    );
    expect(Array.from(processedValues), `${testCase.name} postprocessed values`).toEqual(
      Array.from(testCase.source)
    );
  }
});
test('GLTFScenegraph#addBinaryBuffer accepts 64-bit integer arrays', () => {
  const gltf = {json: {asset: {version: '2.1'}}, buffers: []};
  const scenegraph = new GLTFScenegraph(gltf);
  scenegraph.addBinaryBuffer(new BigInt64Array([-1n, 1n]), {
    size: 1,
    min: [-1n],
    max: [1n]
  });
  scenegraph.addBinaryBuffer(new BigUint64Array([0n, 2n]), {
    size: 1,
    min: [0n],
    max: [2n]
  });
  expect(
    gltf.json.accessors?.map(accessor => accessor.componentType),
    'maps signed and unsigned 64-bit constructors to glTF component types'
  ).toEqual([5134, 5135]);
});
