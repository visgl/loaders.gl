// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateWriter, validateMeshCategoryData} from 'test/common/conformance';

import {OBJLoader, OBJWriter} from '@loaders.gl/obj';
import {encode, parse} from '@loaders.gl/core';
import {convertMeshToTable, deduceMeshSchema} from '@loaders.gl/schema-utils';

const attributes = {
  POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3},
  NORMAL: {value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), size: 3},
  TEXCOORD_0: {value: new Float32Array([0, 0, 1, 0, 0, 1]), size: 2}
};

const mesh = {
  attributes,
  indices: {value: new Uint32Array([0, 1, 2]), size: 1},
  topology: 'triangle-list',
  mode: 4,
  schema: deduceMeshSchema(attributes, {topology: 'triangle-list', mode: '4'})
};

test('OBJWriter#writer conformance', t => {
  validateWriter(t, OBJWriter, 'OBJWriter');
  t.end();
});

test('OBJWriter#encode plain and Arrow mesh data', async t => {
  const arrayBuffer = await encode(mesh, OBJWriter);
  const data = await parse(arrayBuffer, OBJLoader, {core: {worker: false}});

  validateMeshCategoryData(t, data);
  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');
  t.equal(data.attributes.POSITION.value.length, 9, 'POSITION attribute roundtripped');

  const arrowTable = convertMeshToTable(mesh, 'arrow-table');
  const arrowArrayBuffer = await encode(arrowTable, OBJWriter);
  const arrowData = await parse(arrowArrayBuffer, OBJLoader, {core: {worker: false}});

  validateMeshCategoryData(t, arrowData);
  t.equal(arrowData.attributes.POSITION.value.length, 9, 'Arrow POSITION attribute roundtripped');
  t.end();
});
