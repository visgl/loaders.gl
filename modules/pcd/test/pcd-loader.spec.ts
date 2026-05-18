// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import * as arrow from 'apache-arrow';
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

test('PCDLoader#loader conformance', t => {
  validateLoader(t, PCDLoader, 'PCDLoader');
  validateLoader(t, PCDWorkerLoader, 'PCDWorkerLoader');
  t.end();
});

test('PCDLoader#parse(text)', async t => {
  const data = await parse(fetchFile(PCD_ASCII_URL), PCDLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(Object.keys(data.schema.fields).length, 2, 'schema field count is correct');
  t.equal(data.schema.metadata.mode, '0', 'schema metadata is correct');
  t.equal(data.schema.metadata.topology, 'point-list', 'schema metadata is correct');
  t.ok(data.schema.metadata.boundingBox, 'schema metadata is correct');

  const positionField = data.schema.fields.find(field => field.name === 'POSITION');
  // @ts-expect-error
  t.equal(positionField?.type?.listSize, 3, 'schema size correct');
  // @ts-expect-error
  t.equal(positionField?.type?.children[0]?.type, 'float32', 'schema type correct');
  // t.equal(positionField.type.valueType.precision, 32, 'schema type correct');

  const colorField = data.schema.fields.find(field => field.name === 'COLOR_0');
  // @ts-expect-error
  t.equal(colorField?.type?.listSize, 3, 'schema size correct');
  // @ts-expect-error
  t.equal(colorField?.type?.children[0]?.type, 'uint8', 'schema type correct');
  // t.equal(colorField.type.valueType.bitWidth, 8, 'schema type correct');
  // t.equal(colorField.type.valueType.isSigned, false, 'schema type correct');

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not found');

  t.equal(data.attributes.POSITION.value.length, 639, 'POSITION attribute was found');
  t.equal(data.attributes.COLOR_0.value.length, 639, 'COLOR attribute was found');

  t.end();
});

test('PCDLoader#parse(shape: arrow-table)', async t => {
  const arrowTable = await parse(fetchFile(PCD_ASCII_URL), PCDLoader, {
    core: {worker: false},
    pcd: {shape: 'arrow-table'}
  });

  validateArrowTableSchema(arrowTable.data, meshArrowSchema, {
    schemaName: 'PCDLoader Mesh table'
  });

  const {data} = arrowTable;
  t.equal(data.schema.fields.length, 2, 'schema field count is correct');
  t.equal(data.schema.metadata.get('topology'), 'point-list', 'schema metadata is correct');
  t.ok(data.schema.metadata.get('boundingBox'), 'schema metadata is correct');

  t.equal(data.numRows, 639 / 3, 'table has 213 points');

  const positionField = arrowTable.schema?.fields.find(field => field.name === 'POSITION');
  // @ts-expect-error
  t.equal(positionField?.type?.listSize, 3, 'position column size correct');
  // @ts-expect-error
  t.equal(positionField?.type?.children[0]?.type, 'float32', 'position column type correct');

  const colorField = arrowTable.schema?.fields.find(field => field.name === 'COLOR_0');
  // @ts-expect-error
  t.equal(colorField?.type?.listSize, 3, 'color column size correct');
  // @ts-expect-error
  t.equal(colorField?.type?.children[0]?.type, 'uint8', 'color column type correct');

  t.end();
});

test('PCDLoader#parseInBatches(ascii, arrow-table)', async t => {
  const response = await fetchFile(PCD_ASCII_URL);
  const batches = await parseInBatches(response, PCDLoader, {
    batchSize: 100,
    core: {worker: false},
    pcd: {shape: 'arrow-table'}
  });
  const batchRowCounts: number[] = [];

  for await (const batch of batches) {
    t.equal(batch.shape, 'arrow-table', 'batch has arrow-table shape');
    t.equal(batch.batchType, 'data', 'batch has data batchType');
    t.ok(batch.data.getChild('POSITION'), 'batch includes POSITION column');
    batchRowCounts.push(batch.length);
  }

  t.deepEqual(batchRowCounts, [100, 100, 13], 'emits requested ASCII PCD Arrow batches');
  t.end();
});

test('PCDLoader#parse(binary)', async t => {
  const data = await parse(fetchFile(PCD_BINARY_URL), PCDLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'indices were not preset');
  t.notOk(data.attributes.COLOR_0, 'COLOR_0 attribute was not preset');
  t.notOk(data.attributes.NORMAL, 'NORMAL attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 179250, 'POSITION attribute was found');

  t.end();
});

test('PCDLoader#parse(binary with counted fields)', async t => {
  const binaryArrayBuffer = createBinaryArrayBufferWithCountedField();
  const data = await parse(binaryArrayBuffer, PCDLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.loaderData.rowSize, 20, 'row size accounts for count values');
  t.equal(data.loaderData.offset.x, 8, 'offset for x accounts for count values');
  t.equal(data.loaderData.offset.y, 12, 'offset for y accounts for count values');
  t.equal(data.loaderData.offset.z, 16, 'offset for z accounts for count values');
  t.deepEqual(
    Array.from(data.attributes.POSITION.value),
    [1, 2, 3, 4, 5, 6],
    'positions read correctly'
  );

  t.end();
});

test('PCDLoader#parse(binary interleaved with counted fields)', async t => {
  const binaryArrayBuffer = createBinaryArrayBufferWithCountedField();
  const table = await parse(binaryArrayBuffer, PCDLoader, {
    core: {worker: false},
    pcd: {shape: 'arrow-table', interleaved: true}
  });

  t.deepEqual(
    table.data.schema.fields.map(field => field.name),
    ['vertexData'],
    'packed output exposes one binary vertex column'
  );
  t.ok(
    table.data.schema.fields[0].type instanceof arrow.FixedSizeBinary,
    'packed column uses FixedSizeBinary'
  );
  t.equal(table.data.numRows, 2, 'packed table has point rows');
  t.equal(table.packedLayout.byteStride, 12, 'position-only PCD rows use a 12-byte stride');

  const vertexBytes = table.data.getChild('vertexData').data[0].values;
  const packedView = new DataView(
    vertexBytes.buffer,
    vertexBytes.byteOffset,
    vertexBytes.byteLength
  );
  t.deepEqual(
    [
      packedView.getFloat32(0, true),
      packedView.getFloat32(4, true),
      packedView.getFloat32(8, true),
      packedView.getFloat32(12, true),
      packedView.getFloat32(16, true),
      packedView.getFloat32(20, true)
    ],
    [1, 2, 3, 4, 5, 6],
    'packed PCD positions match decoded point rows'
  );
  t.end();
});

test('PCDLoader#parseInBatches(binary with counted fields, arrow-table)', async t => {
  const binaryArrayBuffer = createBinaryArrayBufferWithCountedField();
  const batches = await parseInBatches([binaryArrayBuffer], PCDLoader, {
    batchSize: 1,
    core: {worker: false},
    pcd: {shape: 'arrow-table'}
  });
  const positions: number[] = [];
  const batchRowCounts: number[] = [];

  for await (const batch of batches) {
    t.equal(batch.shape, 'arrow-table', 'batch has arrow-table shape');
    t.equal(batch.batchType, 'data', 'batch has data batchType');
    batchRowCounts.push(batch.length);
    const positionColumn = batch.data.getChild('POSITION');
    positions.push(...Array.from(positionColumn.get(0)));
  }

  t.deepEqual(batchRowCounts, [1, 1], 'emits requested binary PCD Arrow batches');
  t.deepEqual(positions, [1, 2, 3, 4, 5, 6], 'positions read correctly across batches');
  t.end();
});

test('PCDWorkerLoader#parse(binary)', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(PCD_BINARY_URL, PCDWorkerLoader);
  validateMeshCategoryData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'indices were not preset');
  t.notOk(data.attributes.COLOR_0, 'COLOR_0 attribute was not preset');
  t.notOk(data.attributes.NORMAL, 'NORMAL attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 179250, 'POSITION attribute was found');
  t.end();
});
