/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';

import {OBJLoader, OBJWorkerLoader} from '@loaders.gl/obj';
import {setLoaderOptions, load} from '@loaders.gl/core';

const OBJ_ASCII_URL = '@loaders.gl/obj/test/data/bunny.obj';
const OBJ_NORMALS_URL = '@loaders.gl/obj/test/data/cube.obj';
const OBJ_MULTI_PART_URL = '@loaders.gl/obj/test/data/magnolia.obj';

setLoaderOptions({
  obj: {
    workerUrl: 'modules/obj/dist/obj-loader.worker.js'
  }
});

test('OBJLoader#loader objects', t => {
  validateLoader(t, OBJLoader, 'OBJLoader');
  validateLoader(t, OBJWorkerLoader, 'OBJWorkerLoader');
  t.end();
});

test('OBJLoader#parseText', async t => {
  const data = await load(OBJ_ASCII_URL, OBJLoader);
  validateMeshCategoryData(t, data);

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.attributes.POSITION.value.length, 14904 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});

test('OBJLoader#parse(SCHEMA)', async t => {
  const data = await load(OBJ_NORMALS_URL, OBJLoader);
  validateMeshCategoryData(t, data);

  t.equal(data.schema.fields.length, 3, 'schema field count is correct');
  t.equal(data.schema.metadata.get('mode'), '4', 'schema metadata is correct');
  t.ok(data.schema.metadata.get('boundingBox'), 'schema metadata is correct');

  const positionField = data.schema.fields.find(field => field.name === 'POSITION');
  t.equal(positionField.type.listSize, 3, 'schema size correct');
  t.equal(positionField.type.valueType.precision, 32, 'schema type correct');

  const colorField = data.schema.fields.find(field => field.name === 'TEXCOORD_0');
  t.equal(colorField.type.listSize, 2, 'schema size correct');

  t.equal(data.mode, 4, 'mode is correct');
  t.notOk(data.indices, 'INDICES attribute was not found');

  t.end();
});

test('OBJLoader#parseText - object with normals', async t => {
  const data = await load(OBJ_NORMALS_URL, OBJLoader);
  validateMeshCategoryData(t, data);

  t.equal(data.attributes.POSITION.value.length, 108, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');
  t.equal(data.attributes.NORMAL.value.length, 108, 'NORMAL attribute was found');
  t.equal(data.attributes.NORMAL.size, 3, 'NORMAL attribute was found');
  t.equal(data.attributes.TEXCOORD_0.value.length, 72, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');
  t.end();
});

test('OBJLoader#parseText - multi-part object', async t => {
  const data = await load(OBJ_MULTI_PART_URL, OBJLoader);
  validateMeshCategoryData(t, data);

  t.equal(data.header.vertexCount, 1372 * 3, 'Vertices are loaded');
  t.end();
});

test('OBJWorkerLoader#parse(text)', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(OBJ_ASCII_URL, OBJWorkerLoader);

  validateMeshCategoryData(t, data);

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.attributes.POSITION.value.length, 14904 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');
  t.end();
});
