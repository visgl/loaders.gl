// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateWriter, validateMeshCategoryData} from 'test/common/conformance';

import {PLYLoader, PLYWriter} from '@loaders.gl/ply';
import {encode, parse} from '@loaders.gl/core';
import {convertMeshToTable, deduceMeshSchema} from '@loaders.gl/schema-utils';

const attributes = {
  POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3},
  NORMAL: {value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), size: 3},
  TEXCOORD_0: {value: new Float32Array([0, 0, 1, 0, 0, 1]), size: 2},
  COLOR_0: {value: new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255]), size: 3, normalized: true}
};

const mesh = {
  attributes,
  indices: {value: new Uint32Array([0, 1, 2]), size: 1},
  topology: 'triangle-list',
  mode: 4,
  schema: deduceMeshSchema(attributes, {topology: 'triangle-list', mode: '4'})
};

test('PLYWriter#writer conformance', t => {
  validateWriter(t, PLYWriter, 'PLYWriter');
  t.end();
});

test('PLYWriter#encode plain and Arrow mesh data', async t => {
  const arrayBuffer = await encode(mesh, PLYWriter);
  const data = await parse(arrayBuffer, PLYLoader, {core: {worker: false}});

  validateMeshCategoryData(t, data);
  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');
  t.equal(data.attributes.POSITION.value.length, 9, 'POSITION attribute roundtripped');
  t.equal(data.indices.value.length, 3, 'indices roundtripped');

  const arrowTable = convertMeshToTable(mesh, 'arrow-table');
  const arrowArrayBuffer = await encode(arrowTable, PLYWriter);
  const arrowData = await parse(arrowArrayBuffer, PLYLoader, {core: {worker: false}});

  validateMeshCategoryData(t, arrowData);
  t.equal(arrowData.attributes.POSITION.value.length, 9, 'Arrow POSITION attribute roundtripped');
  t.end();
});
