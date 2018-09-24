/* eslint-disable max-len */
import test from 'tape-catch';

import {deepCopy} from 'loaders.gl/test/setup';
import {loadBinaryFile, GLBParser, GLTFLoader, GLTFParser} from 'loaders.gl';
import path from 'path';

const GLTF_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../data/gltf-2.0/2CylinderEngine.glb')) ||
  require('../data/gltf-2.0/2CylinderEngine.glb');

const GLTF_JSON = deepCopy(require('../data/gltf-2.0/2CylinderEngine.gltf.json'));

test('GLTFLoader#imports', t => {
  t.ok(GLTFLoader, 'GLTFLoader was imported');
  t.ok(GLTFParser, 'GLTFParser was imported');

  const gltfParser = new GLTFParser({});
  t.ok(gltfParser, 'GLTFParser was instantiated');

  t.end();
});

test('GLTFParse#parse JSON', t => {
  const gltf = new GLTFParser(GLTF_JSON).resolve({});
  t.ok(gltf, 'GLTFParser returned parsed data');

  t.end();
});

test('GLTFParse#parse binary', t => {
  const json = new GLBParser(GLTF_BINARY).parseWithMetadata({});
  const gltf = new GLTFParser(json).resolve({});
  t.ok(gltf, 'GLTFParser returned parsed data');

  t.end();
});
