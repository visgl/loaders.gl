/* eslint-disable */
import test from 'tape-catch';
import {toLowPrecision} from 'loaders.gl/test/test-utils';

import {GLTFBuilder, GLTFParser} from '@loaders.gl/gltf';
import {toBuffer} from '@loaders.gl/core';

const MAGIC_XVIZ = 0x5856495a; // XVIZ in Big-Endian ASCII
const MAGIC_GLTF = 0x676c5446; // glTF in Big-Endian ASCII
const BE = false; // Magic needs to be written as BE

function encodeBinaryXVIZ(xvizJson, options) {
  const gltfBuilder = new GLTFBuilder();

  // TODO/ib - the following options would break backwards compatibility
  // gltfBuilder.addExtraData('xviz', xvizJson, options)
  // gltfBuilder.addExtension('UBER_xviz', xvizJson, options);
  // gltfBuilder.addRequiredExtension('UBER_xviz', xvizJson, options);

  // As permitted by glTF, we put all XVIZ data in a top-level subfield.
  gltfBuilder.addApplicationData('xviz', xvizJson, options);

  return gltfBuilder.encodeAsGLB(options);
}

function parseBinaryXVIZ(arrayBuffer) {
  const gltfParser = new GLTFParser(arrayBuffer);
  gltfParser.parse({magic: MAGIC_XVIZ});

  // TODO/ib - the following options would break backwards compatibility
  // return gltfParser.getExtras('xviz')
  // return gltfParser.getExtension('UBER_xviz');

  // TODO/ib - Fix when loaders.gl API is fixed
  return gltfParser.getApplicationData('xviz');
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

  full: require('./sample.json')
};

test('XVIZLoader#encode-and-parse', t => {
  for (const tcName in TEST_CASES) {
    const TEST_JSON = TEST_CASES[tcName];

    const glbFileBuffer = encodeBinaryXVIZ(TEST_JSON, {flattenArrays: true});
    const json = parseBinaryXVIZ(glbFileBuffer);

    t.ok(
      !Array.isArray(json.buffers),
      `${tcName} Encoded and parsed XVIZ - has no JSON buffers field`
    );
    t.ok(
      !Array.isArray(json.bufferViews),
      `${tcName} Encoded and parsed XVIZ - has no JSON bufferViews field`
    );
    t.ok(
      !Array.isArray(json.accessors),
      `${tcName} Encoded and parsed XVIZ - has no JSON accessors field`
    );

    // const reference = toLowPrecision(packJsonArrays(TEST_JSON));
    // t.deepEqual(
    //   toLowPrecision(json),
    //   reference,
    //   `${tcName} Encoded and parsed XVIZ did not change data`
    // );
  }

  t.end();
});

function almostEqual(a, b, tolerance = 0.00001) {
  return Math.abs(a - b) < tolerance;
}

function validateLidarData(t, lidarData) {
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
  const options = {flattenArrays: true};
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

  const xvizBinary = encodeBinaryXVIZ(sample_lidar, options);
  const xvizBinaryDecoded = parseBinaryXVIZ(xvizBinary);

  validateLidarData(t, xvizBinaryDecoded);

  frame.state_updates[0].primitives.lidarPoints = xvizBinaryDecoded;

  const frameBinary = encodeBinaryXVIZ(frame, options);
  t.equal(frameBinary.byteLength, 664);

  const xvizBinaryDecoded2 = parseBinaryXVIZ(frameBinary);
  const lidar = xvizBinaryDecoded2.state_updates[0].primitives.lidarPoints;
  validateLidarData(t, xvizBinaryDecoded);

  t.end();
});
