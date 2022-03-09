/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {MTLLoader} from '@loaders.gl/obj';
import {load} from '@loaders.gl/core';

const MTL_URL = '@loaders.gl/obj/test/data/windmill.mtl';

test('MTLLoader#loader objects', (t) => {
  validateLoader(t, MTLLoader, 'MTLLoader');
  t.end();
});

test('MTLLoader#parse(windmill.mtl', async (t) => {
  /** @type {import('../src/lib/parse-mtl').MTLMaterial[]} */
  const materials = await load(MTL_URL, MTLLoader);

  t.comment(JSON.stringify(materials));
  t.equal(materials.length, 2, '2 material');

  t.equal(materials[0].name, 'Material', 'Material');
  t.equal(materials[0].shininess, 0.0);
  t.deepEqual(materials[0].ambientColor, [1.0, 1.0, 1.0]);
  t.deepEqual(materials[0].diffuseColor, [0.8, 0.8, 0.8]);
  t.deepEqual(materials[0].specularColor, [0.0, 0.0, 0.0]);
  t.deepEqual(materials[0].emissiveColor, [0.0, 0.0, 0.0]);
  t.equal(materials[0].refraction, 1.0);
  // t.equal(materials[0].d, 1.000000);
  // t.equal(materials[0].illum, 1);
  t.equal(materials[0].diffuseTextureUrl, 'windmill_001_lopatky_COL.jpg');
  // t.equal(materials[0].map_Bump, 'windmill_001_lopatky_NOR.jpg');

  t.equal(materials[1].name, 'windmill', 'windmill');
  t.equal(materials[1].shininess, 0.0);
  t.deepEqual(materials[1].ambientColor, [1.0, 1.0, 1.0]);
  t.deepEqual(materials[1].diffuseColor, [0.8, 0.8, 0.8]);
  t.deepEqual(materials[1].specularColor, [0.0, 0.0, 0.0]);
  t.deepEqual(materials[1].emissiveColor, [0.0, 0.0, 0.0]);
  t.equal(materials[1].refraction, 1.0);
  // t.equal(materials[1].d, 1.000000);
  // t.equal(materials[1].illum, 1);
  t.equal(materials[1].diffuseTextureUrl, 'windmill_001_base_COL.jpg');
  // t.equal(materials[1].map_Bump, 'windmill_001_base_NOR.jpg');
  // t.equal(materials[1].specularTextureUrl, 'windmill_001_base_SPEC.jpg');
  t.end();
});
