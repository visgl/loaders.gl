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

test('LASWriter#encode LAS 1.4 point format 7', async t => {
  const arrayBuffer = await encode(mesh, LASWriter, {
    las: {version: '1.4', pointDataRecordFormat: 7}
  });
  const data = await parse(arrayBuffer, LASLoader, {
    las: {backend: 'typescript'},
    core: {worker: false}
  });
  const wasmData = await parse(arrayBuffer.slice(0), LASLoader, {
    las: {backend: 'copc'},
    core: {worker: false}
  });

  t.equal(data.loaderData.versionAsString, '1.4', 'writes LAS 1.4 header');
  t.equal(data.loaderData.pointsFormatId, 7, 'writes point format 7');
  t.equal(data.header.vertexCount, attributes.POSITION.value.length / 3, 'round trips point count');
  t.ok(data.attributes.COLOR_0, 'round trips color attribute');
  t.deepEqual(
    Array.from(data.attributes.POSITION.value),
    Array.from(wasmData.attributes.POSITION.value),
    'TypeScript parser matches WASM parser for written positions'
  );
  t.deepEqual(
    Array.from(data.attributes.intensity.value),
    Array.from(wasmData.attributes.intensity.value),
    'TypeScript parser matches WASM parser for written intensities'
  );
  t.deepEqual(
    Array.from(data.attributes.classification.value),
    Array.from(wasmData.attributes.classification.value),
    'TypeScript parser matches WASM parser for written classifications'
  );
  t.end();
});

test('LASWriter#rejects compressed formats until TypeScript encoder is complete', t => {
  t.throws(
    () => LASWriter.encodeSync?.(mesh, {las: {format: 'laz'}}),
    /LAZ encoding is not implemented/,
    'LAZ writer fails clearly'
  );
  t.throws(
    () => LASWriter.encodeSync?.(mesh, {las: {format: 'copc'}}),
    /COPC encoding is not implemented/,
    'COPC writer fails clearly'
  );
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
