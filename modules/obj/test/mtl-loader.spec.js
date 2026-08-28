import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {MTLLoader} from '@loaders.gl/obj';
import {load} from '@loaders.gl/core';
const MTL_URL = '@loaders.gl/obj/test/data/windmill.mtl';
test('MTLLoader#loader objects', () => {
  validateLoader(MTLLoader, 'MTLLoader');
});
test('MTLLoader#parse(windmill.mtl', async () => {
  /** @type {import('../src/lib/parse-mtl').MTLMaterial[]} */
  const materials = await load(MTL_URL, MTLLoader, {core: {worker: false}});
  // t.comment(JSON.stringify(materials));
  expect(materials.length, '2 material').toBe(2);
  expect(materials[0].name, 'Material').toBe('Material');
  expect(materials[0].shininess).toBe(0.0);
  expect(materials[0].ambientColor).toEqual([1.0, 1.0, 1.0]);
  expect(materials[0].diffuseColor).toEqual([0.8, 0.8, 0.8]);
  expect(materials[0].specularColor).toEqual([0.0, 0.0, 0.0]);
  expect(materials[0].emissiveColor).toEqual([0.0, 0.0, 0.0]);
  expect(materials[0].refraction).toBe(1.0);
  // t.equal(materials[0].d, 1.000000);
  // t.equal(materials[0].illum, 1);
  expect(materials[0].diffuseTextureUrl).toBe('windmill_001_lopatky_COL.jpg');
  // t.equal(materials[0].map_Bump, 'windmill_001_lopatky_NOR.jpg');
  expect(materials[1].name, 'windmill').toBe('windmill');
  expect(materials[1].shininess).toBe(0.0);
  expect(materials[1].ambientColor).toEqual([1.0, 1.0, 1.0]);
  expect(materials[1].diffuseColor).toEqual([0.8, 0.8, 0.8]);
  expect(materials[1].specularColor).toEqual([0.0, 0.0, 0.0]);
  expect(materials[1].emissiveColor).toEqual([0.0, 0.0, 0.0]);
  expect(materials[1].refraction).toBe(1.0);
  // t.equal(materials[1].d, 1.000000);
  // t.equal(materials[1].illum, 1);
  expect(materials[1].diffuseTextureUrl).toBe('windmill_001_base_COL.jpg');
});
