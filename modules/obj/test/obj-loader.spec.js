/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';

import {OBJLoader, OBJWorkerLoader} from '@loaders.gl/obj';
import {setLoaderOptions, load} from '@loaders.gl/core';
import {equals} from '@math.gl/core';

const OBJ_ASCII_URL = '@loaders.gl/obj/test/data/bunny.obj';
const OBJ_NORMALS_URL = '@loaders.gl/obj/test/data/cube.obj';
const OBJ_MULTI_PART_URL = '@loaders.gl/obj/test/data/magnolia.obj';
const OBJ_VERTEX_COLOR_URL = '@loaders.gl/obj/test/data/cube-vertex-colors.obj';

setLoaderOptions({
  _workerType: 'test'
});

test('OBJLoader#loader objects', (t) => {
  validateLoader(t, OBJLoader, 'OBJLoader');
  validateLoader(t, OBJWorkerLoader, 'OBJWorkerLoader');
  t.end();
});

test('OBJLoader#parseText', async (t) => {
  const data = await load(OBJ_ASCII_URL, OBJLoader);
  validateMeshCategoryData(t, data);

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.attributes.POSITION.value.length, 14904 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});

test('OBJLoader#parse(SCHEMA)', async (t) => {
  const data = await load(OBJ_NORMALS_URL, OBJLoader);
  validateMeshCategoryData(t, data);

  t.equal(data.schema.fields.length, 3, 'schema field count is correct');
  t.equal(data.schema.metadata.get('mode'), '4', 'schema metadata is correct');
  t.ok(data.schema.metadata.get('boundingBox'), 'schema metadata is correct');

  const positionField = data.schema.fields.find((field) => field.name === 'POSITION');
  t.equal(positionField.type.listSize, 3, 'schema size correct');
  // TODO/ActionEngine - restore this test
  // t.equal(positionField.type.valueType.precision, 32, 'schema type correct');

  const colorField = data.schema.fields.find((field) => field.name === 'TEXCOORD_0');
  t.equal(colorField.type.listSize, 2, 'schema size correct');

  t.equal(data.mode, 4, 'mode is correct');
  t.notOk(data.indices, 'INDICES attribute was not found');

  t.end();
});

test('OBJLoader#parseText - object with normals', async (t) => {
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

test('OBJLoader#parseText - multi-part object', async (t) => {
  const data = await load(OBJ_MULTI_PART_URL, OBJLoader);
  validateMeshCategoryData(t, data);

  t.equal(data.header.vertexCount, 1372 * 3, 'Vertices are loaded');
  t.end();
});

test('OBJLoader#parseText - object with vertex colors', async (t) => {
  const data = await load(OBJ_VERTEX_COLOR_URL, OBJLoader);
  validateMeshCategoryData(t, data);

  t.equal(data.attributes.POSITION.value.length, 108, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');
  t.equal(data.attributes.NORMAL.value.length, 108, 'NORMAL attribute was found');
  t.equal(data.attributes.NORMAL.size, 3, 'NORMAL attribute was found');
  t.equal(data.attributes.COLOR_0.value.length, 108, 'COLOR_0 attribute was found');
  t.equal(data.attributes.COLOR_0.size, 3, 'COLOR_0 attribute was found');

  // Test two verticies with different colors.
  const vertex1Color = [0.2801, 0.4429, 0.8987];
  t.ok(
    vertex1Color.every((value, index) =>
      equals(data.attributes.COLOR_0.value[index], value, 0.0001)
    ),
    'vertex 1 color parsed as float rgb'
  );

  const vertex2Color = [0.6907, 0.2524, 0.8987];
  t.ok(
    vertex2Color.every((value, index) =>
      equals(data.attributes.COLOR_0.value[index + 18], value, 0.0001)
    ),
    'vertex 2 color parsed as float rgb'
  );
  t.end();
});

test('OBJWorkerLoader#parse(text)', async (t) => {
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
