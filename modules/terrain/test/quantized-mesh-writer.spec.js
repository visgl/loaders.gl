// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateWriter, validateMeshCategoryData} from 'test/common/conformance';

import {QuantizedMeshLoader, QuantizedMeshWriter} from '@loaders.gl/terrain';
import {encode, parse} from '@loaders.gl/core';
import {convertMeshToTable, deduceMeshSchema} from '@loaders.gl/schema-utils';

const attributes = {
  POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 1]), size: 3}
};

const mesh = {
  attributes,
  indices: {value: new Uint32Array([0, 1, 2]), size: 1},
  topology: 'triangle-list',
  mode: 4,
  schema: deduceMeshSchema(attributes, {topology: 'triangle-list', mode: '4'})
};

test('QuantizedMeshWriter#writer conformance', t => {
  validateWriter(t, QuantizedMeshWriter, 'QuantizedMeshWriter');
  t.end();
});

test('QuantizedMeshWriter#encode plain and Arrow mesh data', async t => {
  const options = {'quantized-mesh': {bounds: [0, 0, 1, 1]}};
  const arrayBuffer = await encode(mesh, QuantizedMeshWriter, options);
  const data = await parse(arrayBuffer, QuantizedMeshLoader, options);

  validateMeshCategoryData(t, data);
  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');
  t.equal(data.attributes.POSITION.value.length, 9, 'POSITION attribute roundtripped');
  t.equal(data.indices.value.length, 3, 'indices roundtripped');

  const arrowTable = convertMeshToTable(mesh, 'arrow-table');
  const arrowArrayBuffer = await encode(arrowTable, QuantizedMeshWriter, options);
  const arrowData = await parse(arrowArrayBuffer, QuantizedMeshLoader, options);

  validateMeshCategoryData(t, arrowData);
  t.equal(arrowData.attributes.POSITION.value.length, 9, 'Arrow POSITION attribute roundtripped');
  t.end();
});

test('QuantizedMeshWriter#encodes non-sequential triangle indices', async t => {
  const reorderedMesh = {
    ...mesh,
    indices: {value: new Uint32Array([0, 2, 1]), size: 1}
  };
  const options = {'quantized-mesh': {bounds: [0, 0, 1, 1]}};
  const arrayBuffer = await encode(reorderedMesh, QuantizedMeshWriter, options);
  const data = await parse(arrayBuffer, QuantizedMeshLoader, options);

  validateMeshCategoryData(t, data);
  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');
  t.equal(data.indices.value.length, 3, 'indices roundtripped');
  t.end();
});
