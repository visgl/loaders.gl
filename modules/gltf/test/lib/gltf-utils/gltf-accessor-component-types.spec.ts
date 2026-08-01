import test from 'tape-promise/tape';

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

test('glTF 2.1 accessor component types', t => {
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
    t.equal(scenegraphValues.constructor, testCase.source.constructor, `${testCase.name} type`);
    t.deepEqual(
      Array.from(scenegraphValues),
      Array.from(testCase.source),
      `${testCase.name} values`
    );

    const processed = postProcessGLTF(gltf);
    const processedValues = processed.accessors[0].value;
    t.equal(
      processedValues.constructor,
      testCase.source.constructor,
      `${testCase.name} postprocessed type`
    );
    t.deepEqual(
      Array.from(processedValues),
      Array.from(testCase.source),
      `${testCase.name} postprocessed values`
    );
  }
  t.end();
});
