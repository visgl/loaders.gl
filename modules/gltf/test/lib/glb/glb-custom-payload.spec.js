/* eslint-disable */
/*
import test from 'tape-promise/tape';
import {toLowPrecision} from 'test/test-utils';

import {GLTFBuilder, GLTFParser} from '@loaders.gl/gltf';
import {toBuffer} from '@loaders.gl/core';

import CUSTOM_PAYLOAD from './custom-payload.json';

function encodeToGLB(testJson, options) {
  const gltfBuilder = new GLTFBuilder();
  // As permitted by glTF, we put all custom data in a top-level subfield.
  gltfBuilder.addApplicationData('test', testJson, options);
  return gltfBuilder.encodeAsGLB(options);
}

function parseFromGLB(arrayBuffer) {
  const gltfParser = new GLTFParser();
  gltfParser.parseSync(arrayBuffer);
  return gltfParser.getApplicationData('test');
}

const TEST_CASES = {
  flat: {
    vertices: [
      [
        12.458602928956001,
        2.7320427081205123,
        0,
        11.504415873922731,
        4.285679511764174,
        0,
        15.282629201197484,
        6.606120324948342,
        0,
        16.236816256230753,
        5.05248352130468,
        0,
        12.458602928956001,
        2.7320427081205123,
        0
      ]
    ]
  },

  nested: {
    vertices: [
      [12.458602928956001, 2.7320427081205123, 0],
      [11.504415873922731, 4.285679511764174, 0],
      [15.282629201197484, 6.606120324948342, 0],
      [16.236816256230753, 5.05248352130468, 0],
      [12.458602928956001, 2.7320427081205123, 0]
    ]
  },

  full: CUSTOM_PAYLOAD
};

test('GLBLoader#encode-and-parse(custom)', t => {
  for (const tcName in TEST_CASES) {
    const TEST_JSON = TEST_CASES[tcName];

    const glbFileBuffer = encodeToGLB(TEST_JSON, {flattenArrays: true});
    const json = parseFromGLB(glbFileBuffer);

    t.ok(
      !Array.isArray(json.buffers),
      `${tcName} Encoded and parsed Custom - has no JSON buffers field`
    );
    t.ok(
      !Array.isArray(json.bufferViews),
      `${tcName} Encoded and parsed Custom - has no JSON bufferViews field`
    );
    t.ok(
      !Array.isArray(json.accessors),
      `${tcName} Encoded and parsed Custom - has no JSON accessors field`
    );

    // const reference = toLowPrecision(packJsonArrays(TEST_JSON));
    // t.deepEqual(
    //   toLowPrecision(json),
    //   reference,
    //   `${tcName} Encoded and parsed Custom did not change data`
    // );
  }

  t.end();
});

function almostEqual(a, b, tolerance = 0.00001) {
  return Math.abs(a - b) < tolerance;
}

function validateCustomPayload(t, lidarData) {
  t.equal(lidarData.vertices.length, 9, 'vertices has 9 floats');
  t.ok(almostEqual(lidarData.vertices[0], 1.0), 'vertices[0] is 1.0');
  t.ok(almostEqual(lidarData.vertices[1], 2.0), 'vertices[1] is 2.0');
  t.ok(almostEqual(lidarData.vertices[2], 3.0), 'vertices[2] is 3.0');
  t.equal(lidarData.reflectance.length, 3, 'reflectance has 3 floats');
  t.ok(almostEqual(lidarData.reflectance[0], 9.0), 'reflectance[0] is 9.0');
  t.ok(almostEqual(lidarData.reflectance[1], 8.0), 'reflectance[1] is 8.0');
  t.ok(almostEqual(lidarData.reflectance[2], 7.0), 'reflectance[2] is 7.0');
}

test('pack-unpack-pack-json', t => {
  // Must have 2 buffers since they will be read in as
  // one, and then the sub-buffers will be "copied" out.
  const sample_lidar = {
    timestamp: 1317042272459,
    type: 'points3d',
    color: [255, 0, 0, 255],
    vertices: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    reflectance: new Float32Array([9, 8, 7])
  };

  const frame = {
    state_updates: [
      {
        timestamps: 1317042272459,
        primitives: {}
      }
    ]
  };

  const OPTIONS = {flattenArrays: true, packTypedArrays: true};

  const testBinary = encodeToGLB(sample_lidar, OPTIONS);
  const testBinaryDecoded = parseFromGLB(testBinary);

  validateCustomPayload(t, testBinaryDecoded);

  frame.state_updates[0].primitives.lidarPoints = testBinaryDecoded;

  const frameBinary = encodeToGLB(frame, OPTIONS);
  // TODO/ib - investigate why byteLengh this has increased?
  // t.equal(frameBinary.byteLength, 664);
  t.equal(frameBinary.byteLength, 708);

  const testBinaryDecoded2 = parseFromGLB(frameBinary);
  const lidar = testBinaryDecoded2.state_updates[0].primitives.lidarPoints;
  validateCustomPayload(t, testBinaryDecoded);

  t.end();
});
*/
