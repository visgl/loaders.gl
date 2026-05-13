// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateWriter, validateMeshCategoryData} from 'test/common/conformance';

import {PCDLoader, PCDWriter} from '@loaders.gl/pcd';
import {encode, parse} from '@loaders.gl/core';
import {convertMeshToTable, deduceMeshSchema} from '@loaders.gl/schema-utils';

const attributes = {
  POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 1]), size: 3},
  NORMAL: {value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), size: 3}
};

const mesh = {
  attributes,
  topology: 'point-list' as const,
  mode: 0,
  schema: deduceMeshSchema(attributes, {topology: 'point-list', mode: '0'})
};

test('PCDWriter#writer conformance', t => {
  validateWriter(t, PCDWriter, 'PCDWriter');
  t.end();
});

test('PCDWriter#encode plain and Arrow mesh data', async t => {
  const arrayBuffer = await encode(mesh, PCDWriter);
  const data = await parse(arrayBuffer, PCDLoader, {core: {worker: false}});

  validateMeshCategoryData(t, data);
  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.equal(data.attributes.POSITION.value.length, 9, 'POSITION attribute roundtripped');

  const arrowTable = convertMeshToTable(mesh, 'arrow-table');
  const arrowArrayBuffer = await encode(arrowTable, PCDWriter);
  const arrowData = await parse(arrowArrayBuffer, PCDLoader, {core: {worker: false}});

  validateMeshCategoryData(t, arrowData);
  t.equal(arrowData.attributes.POSITION.value.length, 9, 'Arrow POSITION attribute roundtripped');
  t.end();
});
