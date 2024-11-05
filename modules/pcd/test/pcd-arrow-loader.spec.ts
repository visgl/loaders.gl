// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {PCDArrowLoader} from '@loaders.gl/pcd';
import {setLoaderOptions, fetchFile, parse} from '@loaders.gl/core';

const PCD_ASCII_URL = '@loaders.gl/pcd/test/data/simple-ascii.pcd';
// const PCD_BINARY_URL = '@loaders.gl/pcd/test/data/Zaghetto.pcd';

setLoaderOptions({
  _workerType: 'test'
});

test('PCDArrowLoader#loader conformance', (t) => {
  validateLoader(t, PCDArrowLoader, 'PCDArrowLoader');
  t.end();
});

test('PCDArrowLoader#parse(text)', async (t) => {
  const arrowTable = await parse(fetchFile(PCD_ASCII_URL), PCDArrowLoader);

  // TODO - validate arrow mesh category data?
  // validateMeshCategoryData(t, arrowTable);

  const {data} = arrowTable;
  t.equal(data.schema.fields.length, 2, 'schema field count is correct');
  t.equal(data.schema.metadata.get('topology'), 'point-list', 'schema metadata is correct');
  t.ok(data.schema.metadata.get('boundingBox'), 'schema metadata is correct');

  t.equal(data.numRows, 639 / 3, 'table has 213 points');

  const positionField = arrowTable.schema?.fields.find((field) => field.name === 'POSITION');
  // @ts-expect-error
  t.equal(positionField?.type?.listSize, 3, 'position column size correct');
  // @ts-expect-error
  t.equal(positionField?.type?.children[0]?.type, 'float32', 'position column type correct');
  // t.equal(positionField.type.valueType.precision, 32, 'schema type correct');

  const colorField = arrowTable.schema?.fields.find((field) => field.name === 'COLOR_0');
  // @ts-expect-error
  t.equal(colorField?.type?.listSize, 3, 'color column size correct');
  // @ts-expect-error
  t.equal(colorField?.type?.children[0]?.type, 'uint8', 'color column type correct');
  // t.equal(colorField.type.valueType.bitWidth, 8, 'schema type correct');
  // t.equal(colorField.type.valueType.isSigned, false, 'schema type correct');

  t.end();
});

// test('PCDArrowLoader#parse(binary)', async (t) => {
//   const data = await parse(fetchFile(PCD_BINARY_URL), PCDArrowLoader);
//   validateMeshCategoryData(t, data);

//   t.equal(data.mode, 0, 'mode is POINTS (0)');
//   t.notOk(data.indices, 'indices were not preset');
//   t.notOk(data.attributes.COLOR_0, 'COLOR_0 attribute was not preset');
//   t.notOk(data.attributes.NORMAL, 'NORMAL attribute was not preset');
//   t.equal(data.attributes.POSITION.value.length, 179250, 'POSITION attribute was found');

//   t.end();
// });

// test.skip('PCDWorkerLoader#parse(binary)', async (t) => {
//   if (typeof Worker === 'undefined') {
//     t.comment('Worker is not usable in non-browser environments');
//     t.end();
//     return;
//   }

//   const data = await load(PCD_BINARY_URL, PCDWorkerLoader);
//   validateMeshCategoryData(t, data);

//   t.equal(data.mode, 0, 'mode is POINTS (0)');
//   t.notOk(data.indices, 'indices were not preset');
//   t.notOk(data.attributes.COLOR_0, 'COLOR_0 attribute was not preset');
//   t.notOk(data.attributes.NORMAL, 'NORMAL attribute was not preset');
//   t.equal(data.attributes.POSITION.value.length, 179250, 'POSITION attribute was found');
//   t.end();
// });
