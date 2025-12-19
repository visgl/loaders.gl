// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';

import {PCDLoader, PCDWorkerLoader} from '@loaders.gl/pcd';
import {setLoaderOptions, fetchFile, parse, load} from '@loaders.gl/core';

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

test('PCDLoader#loader conformance', (t) => {
  validateLoader(t, PCDLoader, 'PCDLoader');
  validateLoader(t, PCDWorkerLoader, 'PCDWorkerLoader');
  t.end();
});

test('PCDLoader#parse(text)', async (t) => {
  const data = await parse(fetchFile(PCD_ASCII_URL), PCDLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(Object.keys(data.schema.fields).length, 2, 'schema field count is correct');
  t.equal(data.schema.metadata.mode, '0', 'schema metadata is correct');
  t.equal(data.schema.metadata.topology, 'point-list', 'schema metadata is correct');
  t.ok(data.schema.metadata.boundingBox, 'schema metadata is correct');

  const positionField = data.schema.fields.find((field) => field.name === 'POSITION');
  // @ts-expect-error
  t.equal(positionField?.type?.listSize, 3, 'schema size correct');
  // @ts-expect-error
  t.equal(positionField?.type?.children[0]?.type, 'float32', 'schema type correct');
  // t.equal(positionField.type.valueType.precision, 32, 'schema type correct');

  const colorField = data.schema.fields.find((field) => field.name === 'COLOR_0');
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

test('PCDLoader#parse(binary)', async (t) => {
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

test('PCDLoader#parse(binary with counted fields)', async (t) => {
  const binaryArrayBuffer = createBinaryArrayBufferWithCountedField();
  const data = await parse(binaryArrayBuffer, PCDLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.loaderData.rowSize, 20, 'row size accounts for count values');
  t.equal(data.loaderData.offset.x, 8, 'offset for x accounts for count values');
  t.equal(data.loaderData.offset.y, 12, 'offset for y accounts for count values');
  t.equal(data.loaderData.offset.z, 16, 'offset for z accounts for count values');
  t.deepEqual(Array.from(data.attributes.POSITION.value), [1, 2, 3, 4, 5, 6], 'positions read correctly');

  t.end();
});

test('PCDWorkerLoader#parse(binary)', async (t) => {
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
