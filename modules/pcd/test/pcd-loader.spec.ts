import {expect, test} from 'vitest';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';
import {validateArrowTableSchema} from '@loaders.gl/arrow';
import {meshArrowSchema} from '@loaders.gl/schema';
import {PCDLoader, PCDWorkerLoader} from '@loaders.gl/pcd';
import {setLoaderOptions, fetchFile, parse, load, parseInBatches} from '@loaders.gl/core';
const PCD_ASCII_URL = '@loaders.gl/pcd/test/data/simple-ascii.pcd';
const PCD_BINARY_URL = '@loaders.gl/pcd/test/data/Zaghetto.pcd';
setLoaderOptions({
  _workerType: 'test'
});
function createBinaryArrayBufferWithCountedField(): ArrayBuffer {
  const headerText = [
    '# .PCD v0.7 - Point Cloud Data file format',
    'VERSION .7',
    'FIELDS padding x y z',
    'SIZE 4 4 4 4',
    'TYPE F F F F',
    'COUNT 2 1 1 1',
    'WIDTH 2',
    'HEIGHT 1',
    'VIEWPOINT 0 0 0 1 0 0 0',
    'POINTS 2',
    'DATA binary',
    ''
  ].join('\n');
  const headerBytes = new TextEncoder().encode(headerText);
  const pointCount = 2;
  const rowByteSize = 20;
  const binaryData = new ArrayBuffer(pointCount * rowByteSize);
  const binaryDataView = new DataView(binaryData);
  const littleEndian = true;
  const positionValues = [
    {padding: [10, 20], position: [1, 2, 3]},
    {padding: [30, 40], position: [4, 5, 6]}
  ];
  for (let pointIndex = 0; pointIndex < positionValues.length; pointIndex++) {
    const rowOffset = pointIndex * rowByteSize;
    const pointValues = positionValues[pointIndex];
    binaryDataView.setFloat32(rowOffset + 0, pointValues.padding[0], littleEndian);
    binaryDataView.setFloat32(rowOffset + 4, pointValues.padding[1], littleEndian);
    binaryDataView.setFloat32(rowOffset + 8, pointValues.position[0], littleEndian);
    binaryDataView.setFloat32(rowOffset + 12, pointValues.position[1], littleEndian);
    binaryDataView.setFloat32(rowOffset + 16, pointValues.position[2], littleEndian);
  }
  const pcdArrayBuffer = new ArrayBuffer(headerBytes.length + binaryData.byteLength);
  const pcdBytes = new Uint8Array(pcdArrayBuffer);
  pcdBytes.set(headerBytes, 0);
  pcdBytes.set(new Uint8Array(binaryData), headerBytes.length);
  return pcdArrayBuffer;
}
test('PCDLoader#loader conformance', () => {
  validateLoader(PCDLoader, 'PCDLoader');
  validateLoader(PCDWorkerLoader, 'PCDWorkerLoader');
});
test('PCDLoader#parse(text)', async () => {
  const data = await parse(fetchFile(PCD_ASCII_URL), PCDLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(data);
  expect(Object.keys(data.schema.fields).length, 'schema field count is correct').toBe(2);
  expect(data.schema.metadata.mode, 'schema metadata is correct').toBe('0');
  expect(data.schema.metadata.topology, 'schema metadata is correct').toBe('point-list');
  expect(data.schema.metadata.boundingBox, 'schema metadata is correct').toBeTruthy();
  const positionField = data.schema.fields.find(field => field.name === 'POSITION');
  // @ts-expect-error
  expect(positionField?.type?.listSize, 'schema size correct').toBe(3);
  // @ts-expect-error
  expect(positionField?.type?.children[0]?.type, 'schema type correct').toBe('float32');
  // t.equal(positionField.type.valueType.precision, 32, 'schema type correct');
  const colorField = data.schema.fields.find(field => field.name === 'COLOR_0');
  // @ts-expect-error
  expect(colorField?.type?.listSize, 'schema size correct').toBe(3);
  // @ts-expect-error
  expect(colorField?.type?.children[0]?.type, 'schema type correct').toBe('uint8');
  // t.equal(colorField.type.valueType.bitWidth, 8, 'schema type correct');
  // t.equal(colorField.type.valueType.isSigned, false, 'schema type correct');
  expect(data.mode, 'mode is POINTS (0)').toBe(0);
  expect(data.indices, 'INDICES attribute was not found').toBeFalsy();
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(639);
  expect(data.attributes.COLOR_0.value.length, 'COLOR attribute was found').toBe(639);
});
test('PCDLoader#parse(shape: arrow-table)', async () => {
  const arrowTable = await parse(fetchFile(PCD_ASCII_URL), PCDLoader, {
    core: {worker: false},
    pcd: {shape: 'arrow-table'}
  });
  validateArrowTableSchema(arrowTable.data, meshArrowSchema, {
    schemaName: 'PCDLoader Mesh table'
  });
  const {data} = arrowTable;
  expect(data.schema.fields.length, 'schema field count is correct').toBe(2);
  expect(data.schema.metadata.get('topology'), 'schema metadata is correct').toBe('point-list');
  expect(data.schema.metadata.get('boundingBox'), 'schema metadata is correct').toBeTruthy();
  expect(data.numRows, 'table has 213 points').toBe(639 / 3);
  const positionField = arrowTable.schema?.fields.find(field => field.name === 'POSITION');
  // @ts-expect-error
  expect(positionField?.type?.listSize, 'position column size correct').toBe(3);
  // @ts-expect-error
  expect(positionField?.type?.children[0]?.type, 'position column type correct').toBe('float32');
  const colorField = arrowTable.schema?.fields.find(field => field.name === 'COLOR_0');
  // @ts-expect-error
  expect(colorField?.type?.listSize, 'color column size correct').toBe(3);
  // @ts-expect-error
  expect(colorField?.type?.children[0]?.type, 'color column type correct').toBe('uint8');
});
test('PCDLoader#parseInBatches(ascii, arrow-table)', async () => {
  const response = await fetchFile(PCD_ASCII_URL);
  const batches = await parseInBatches(response, PCDLoader, {
    batchSize: 100,
    core: {worker: false},
    pcd: {shape: 'arrow-table'}
  });
  const batchRowCounts: number[] = [];
  for await (const batch of batches) {
    expect(batch.shape, 'batch has arrow-table shape').toBe('arrow-table');
    expect(batch.batchType, 'batch has data batchType').toBe('data');
    expect(batch.data.getChild('POSITION'), 'batch includes POSITION column').toBeTruthy();
    batchRowCounts.push(batch.length);
  }
  expect(batchRowCounts, 'emits requested ASCII PCD Arrow batches').toEqual([100, 100, 13]);
});
test('PCDLoader#parse(binary)', async () => {
  const data = await parse(fetchFile(PCD_BINARY_URL), PCDLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(data);
  expect(data.mode, 'mode is POINTS (0)').toBe(0);
  expect(data.indices, 'indices were not preset').toBeFalsy();
  expect(data.attributes.COLOR_0, 'COLOR_0 attribute was not preset').toBeFalsy();
  expect(data.attributes.NORMAL, 'NORMAL attribute was not preset').toBeFalsy();
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(179250);
});
test('PCDLoader#parse(binary with counted fields)', async () => {
  const binaryArrayBuffer = createBinaryArrayBufferWithCountedField();
  const data = await parse(binaryArrayBuffer, PCDLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(data);
  expect(data.loaderData.rowSize, 'row size accounts for count values').toBe(20);
  expect(data.loaderData.offset.x, 'offset for x accounts for count values').toBe(8);
  expect(data.loaderData.offset.y, 'offset for y accounts for count values').toBe(12);
  expect(data.loaderData.offset.z, 'offset for z accounts for count values').toBe(16);
  expect(Array.from(data.attributes.POSITION.value), 'positions read correctly').toEqual([
    1, 2, 3, 4, 5, 6
  ]);
});
test('PCDLoader#parseInBatches(binary with counted fields, arrow-table)', async () => {
  const binaryArrayBuffer = createBinaryArrayBufferWithCountedField();
  const batches = await parseInBatches([binaryArrayBuffer], PCDLoader, {
    batchSize: 1,
    core: {worker: false},
    pcd: {shape: 'arrow-table'}
  });
  const positions: number[] = [];
  const batchRowCounts: number[] = [];
  for await (const batch of batches) {
    expect(batch.shape, 'batch has arrow-table shape').toBe('arrow-table');
    expect(batch.batchType, 'batch has data batchType').toBe('data');
    batchRowCounts.push(batch.length);
    const positionColumn = batch.data.getChild('POSITION');
    positions.push(...Array.from(positionColumn.get(0)));
  }
  expect(batchRowCounts, 'emits requested binary PCD Arrow batches').toEqual([1, 1]);
  expect(positions, 'positions read correctly across batches').toEqual([1, 2, 3, 4, 5, 6]);
});
test('PCDWorkerLoader#parse(binary)', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Worker is not usable in non-browser environments');
    return;
  }
  const data = await load(PCD_BINARY_URL, PCDWorkerLoader);
  validateMeshCategoryData(data);
  expect(data.mode, 'mode is POINTS (0)').toBe(0);
  expect(data.indices, 'indices were not preset').toBeFalsy();
  expect(data.attributes.COLOR_0, 'COLOR_0 attribute was not preset').toBeFalsy();
  expect(data.attributes.NORMAL, 'NORMAL attribute was not preset').toBeFalsy();
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(179250);
});
