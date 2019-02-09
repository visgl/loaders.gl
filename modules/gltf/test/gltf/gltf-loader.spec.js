/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {deepCopy} from 'test/setup';
import {readFileSync} from '@loaders.gl/core';
import {GLBParser, GLTFLoader, GLTFParser} from '@loaders.gl/gltf';
import path from 'path';

const GLTF_BINARY =
  readFileSync(path.resolve(__dirname, '../../data/gltf-2.0/2CylinderEngine.glb')) ||
  require('../../data/gltf-2.0/2CylinderEngine.glb');

const GLTF_JSON = deepCopy(require('../../data/gltf-2.0/2CylinderEngine.gltf.json'));

test('GLTFLoader#imports', t => {
  t.ok(GLTFLoader, 'GLTFLoader was imported');
  t.ok(GLTFParser, 'GLTFParser was imported');

  const gltfParser = new GLTFParser({});
  t.ok(gltfParser, 'GLTFParser was instantiated');

  t.end();
});

test('GLTFParser#parse JSON', t => {
  const gltf = new GLTFParser().parse(GLTF_JSON);
  t.ok(gltf, 'GLTFParser returned parsed data');

  t.end();
});

test('GLTFParser#parse binary', t => {
  const json = new GLBParser().parse(GLTF_BINARY).getJSON();
  const gltf = new GLTFParser().parse(json);
  t.ok(gltf, 'GLTFParser returned parsed data');

  t.end();
});
