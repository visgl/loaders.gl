// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateWriter, validateMeshCategoryData} from 'test/common/conformance';

import {LASLoader, LASWriter} from '@loaders.gl/las';
import {encode, parse} from '@loaders.gl/core';
import {convertMeshToTable, deduceMeshSchema} from '@loaders.gl/schema-utils';

const attributes = {
  POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 1]), size: 3},
  intensity: {value: new Uint16Array([10, 20, 30]), size: 1},
  classification: {value: new Uint8Array([1, 2, 3]), size: 1}
};

const mesh = {
  attributes,
  topology: 'point-list' as const,
  mode: 0,
  schema: deduceMeshSchema(attributes, {topology: 'point-list', mode: '0'})
};

test('LASWriter#writer conformance', t => {
  validateWriter(t, LASWriter, 'LASWriter');
  t.end();
});

test('LASWriter#encode plain and Arrow mesh data', async t => {
  const arrayBuffer = await encode(mesh, LASWriter);
  const data = await parse(arrayBuffer, LASLoader, {core: {worker: false}});

  validateMeshCategoryData(t, data);
  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.equal(data.attributes.POSITION.value.length, 9, 'POSITION attribute roundtripped');

  const arrowTable = convertMeshToTable(mesh, 'arrow-table');
  const arrowArrayBuffer = await encode(arrowTable, LASWriter);
  const arrowData = await parse(arrowArrayBuffer, LASLoader, {core: {worker: false}});

  validateMeshCategoryData(t, arrowData);
  t.equal(arrowData.attributes.POSITION.value.length, 9, 'Arrow POSITION attribute roundtripped');
  t.end();
});

test('LASWriter#preserves normalized byte colors', async t => {
  const colorAttributes = {
    POSITION: attributes.POSITION,
    COLOR_0: {value: new Uint8Array([128, 255, 0]), size: 3, normalized: true}
  };
  const colorMesh = {
    attributes: colorAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(colorAttributes, {topology: 'point-list', mode: '0'})
  };

  const arrayBuffer = await encode(colorMesh, LASWriter);
  const dataView = new DataView(arrayBuffer);

  t.equal(dataView.getUint16(227 + 20, true), 32896, 'red channel preserves normalized byte value');
  t.equal(dataView.getUint16(227 + 22, true), 65535, 'green channel preserves max byte value');
  t.equal(dataView.getUint16(227 + 24, true), 0, 'blue channel preserves zero byte value');
  t.end();
});
