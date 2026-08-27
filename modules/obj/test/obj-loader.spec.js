import {expect, test} from 'vitest';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';
import {validateArrowTableSchema} from '@loaders.gl/arrow';
import {meshArrowSchema} from '@loaders.gl/schema';
import {OBJLoader, OBJWorkerLoader} from '@loaders.gl/obj';
import {setLoaderOptions, load, parseInBatches} from '@loaders.gl/core';
import {equals} from '@math.gl/core';
const OBJ_ASCII_URL = '@loaders.gl/obj/test/data/bunny.obj';
const OBJ_NORMALS_URL = '@loaders.gl/obj/test/data/cube.obj';
const OBJ_MULTI_PART_URL = '@loaders.gl/obj/test/data/magnolia.obj';
const OBJ_VERTEX_COLOR_URL = '@loaders.gl/obj/test/data/cube-vertex-colors.obj';
setLoaderOptions({
  _workerType: 'test'
});
test('OBJLoader#loader objects', () => {
  validateLoader(OBJLoader, 'OBJLoader');
  validateLoader(OBJWorkerLoader, 'OBJWorkerLoader');
});
test('OBJLoader#parseText', async () => {
  const data = await load(OBJ_ASCII_URL, OBJLoader);
  validateMeshCategoryData(data);
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(14904 * 3);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
test('OBJLoader#parseText(shape: arrow-table)', async () => {
  const table = await load(OBJ_ASCII_URL, OBJLoader, {
    obj: {shape: 'arrow-table'}
  });
  expect(table.shape, 'table has arrow-table shape').toBe('arrow-table');
  validateArrowTableSchema(table.data, meshArrowSchema, {
    schemaName: 'OBJLoader Mesh table'
  });
  const rowCount =
    table.data.numRows ??
    table.data.length ??
    table.data.batches?.[0]?.numRows ??
    table.data.batches?.[0]?.data?.length;
  expect(rowCount, 'table has expected vertex count').toBe(14904);
});
test('OBJLoader#parseInBatches(vertex-only point cloud, arrow-table)', async () => {
  const batches = await parseInBatches(
    [new TextEncoder().encode(['v 0 0 0', 'v 1 1 1', 'v 2 2 2', 'v 3 3 3', ''].join('\n')).buffer],
    OBJLoader,
    {
      batchSize: 2,
      obj: {shape: 'arrow-table'}
    }
  );
  const batchRowCounts = [];
  for await (const batch of batches) {
    expect(batch.shape, 'batch has arrow-table shape').toBe('arrow-table');
    expect(batch.batchType, 'batch has data batchType').toBe('data');
    expect(batch.data.getChild('POSITION'), 'batch includes POSITION column').toBeTruthy();
    batchRowCounts.push(batch.length);
  }
  expect(batchRowCounts, 'emits requested OBJ point cloud Arrow batches').toEqual([2, 2]);
});
test('OBJLoader#parseInBatches(pointCloud flag streams vertices without geometry scan)', async () => {
  const batches = await parseInBatches(
    [
      new TextEncoder().encode(
        ['v 0 0 0', 'v 1 1 1', 'f 1 1 1', 'v 2 2 2', 'v 3 3 3', ''].join('\n')
      ).buffer
    ],
    OBJLoader,
    {
      batchSize: 2,
      obj: {shape: 'arrow-table', pointCloud: true}
    }
  );
  const batchRowCounts = [];
  for await (const batch of batches) {
    expect(batch.shape, 'batch has arrow-table shape').toBe('arrow-table');
    expect(batch.batchType, 'batch has data batchType').toBe('data');
    batchRowCounts.push(batch.length);
  }
  expect(batchRowCounts, 'pointCloud mode streams vertex rows and ignores faces').toEqual([2, 2]);
});
test('OBJLoader#parseInBatches(faces, arrow-table) falls back to atomic parse', async () => {
  const batches = await parseInBatches(
    [new TextEncoder().encode(['v 0 0 0', 'v 1 0 0', 'v 0 1 0', 'f 1 2 3', ''].join('\n')).buffer],
    OBJLoader,
    {
      batchSize: 1,
      obj: {shape: 'arrow-table'}
    }
  );
  const batchRowCounts = [];
  for await (const batch of batches) {
    expect(batch.shape, 'batch has arrow-table shape').toBe('arrow-table');
    expect(batch.batchType, 'batch has data batchType').toBe('data');
    batchRowCounts.push(batch.length);
  }
  expect(batchRowCounts, 'face geometry emits one atomic Arrow batch').toEqual([3]);
});
test('OBJLoader#parse(SCHEMA)', async () => {
  const data = await load(OBJ_NORMALS_URL, OBJLoader);
  validateMeshCategoryData(data);
  expect(data.schema.fields.length, 'schema field count is correct').toBe(3);
  expect(data.schema.metadata.mode, 'schema metadata is correct').toBe('4');
  expect(data.schema.metadata.boundingBox, 'schema metadata is correct').toBeTruthy();
  const positionField = data.schema.fields.find(field => field.name === 'POSITION');
  // @ts-expect-error
  expect(positionField?.type.listSize, 'schema size correct').toBe(3);
  // TODO/ActionEngine - restore this test
  // t.equal(positionField.type.valueType.precision, 32, 'schema type correct');
  const colorField = data.schema.fields.find(field => field.name === 'TEXCOORD_0');
  // @ts-expect-error
  expect(colorField?.type.listSize, 'schema size correct').toBe(2);
  expect(data.mode, 'mode is correct').toBe(4);
  expect(data.indices, 'INDICES attribute was not found').toBeFalsy();
});
test('OBJLoader#parseText - object with normals', async () => {
  const data = await load(OBJ_NORMALS_URL, OBJLoader);
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(108);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
  expect(data.attributes.NORMAL.value.length, 'NORMAL attribute was found').toBe(108);
  expect(data.attributes.NORMAL.size, 'NORMAL attribute was found').toBe(3);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(72);
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
});
test('OBJLoader#parseText - multi-part object', async () => {
  const data = await load(OBJ_MULTI_PART_URL, OBJLoader);
  validateMeshCategoryData(data);
  expect(data.header?.vertexCount, 'Vertices are loaded').toBe(1372 * 3);
});
test('OBJLoader#parseText - object with vertex colors', async () => {
  const data = await load(OBJ_VERTEX_COLOR_URL, OBJLoader);
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(108);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
  expect(data.attributes.NORMAL.value.length, 'NORMAL attribute was found').toBe(108);
  expect(data.attributes.NORMAL.size, 'NORMAL attribute was found').toBe(3);
  expect(data.attributes.COLOR_0.value.length, 'COLOR_0 attribute was found').toBe(108);
  expect(data.attributes.COLOR_0.size, 'COLOR_0 attribute was found').toBe(3);
  // Test two verticies with different colors.
  const vertex1Color = [0.2801, 0.4429, 0.8987];
  expect(
    vertex1Color.every((value, index) =>
      equals(data.attributes.COLOR_0.value[index], value, 0.0001)
    ),
    'vertex 1 color parsed as float rgb'
  ).toBeTruthy();
  const vertex2Color = [0.6907, 0.2524, 0.8987];
  expect(
    vertex2Color.every((value, index) =>
      equals(data.attributes.COLOR_0.value[index + 18], value, 0.0001)
    ),
    'vertex 2 color parsed as float rgb'
  ).toBeTruthy();
});
test('OBJWorkerLoader#parse(text)', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Worker is not usable in non-browser environments');
    return;
  }
  const data = await load(OBJ_ASCII_URL, OBJWorkerLoader);
  validateMeshCategoryData(data);
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(14904 * 3);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
