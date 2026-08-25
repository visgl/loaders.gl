// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {validateWriter, validateMeshCategoryData} from 'test/common/conformance';

import {LASCOPCLoader, LASLoader, LASWriter} from '@loaders.gl/las';
import {encode, parse} from '@loaders.gl/core';
import {decodeLAZChunkTable} from '@loaders.gl/loader-utils';
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
    core: {worker: false}
  });
  const wasmData = await parse(arrayBuffer.slice(0), LASCOPCLoader, {
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

test('LASWriter#encodes fixed-chunk LAZ point formats 6-8', async t => {
  for (const pointDataRecordFormat of [6, 7, 8] as const) {
    const arrayBuffer = await encode(mesh, LASWriter, {
      las: {format: 'laz', pointDataRecordFormat, chunkSize: 2}
    });
    const dataView = new DataView(arrayBuffer);
    const pointDataOffset = dataView.getUint32(96, true);
    const chunkTableOffset = readUint64(dataView, pointDataOffset);
    const chunkCount = dataView.getUint32(chunkTableOffset + 4, true);
    const chunks = decodeLAZChunkTable(new Uint8Array(arrayBuffer, chunkTableOffset + 8), {
      chunkCount,
      pointCount: 3,
      chunkSize: 2,
      variable: false
    });
    const data = await parse(arrayBuffer, LASLoader, {core: {worker: false}});
    const wasmData = await parse(arrayBuffer.slice(0), LASCOPCLoader, {
      core: {worker: false}
    });

    t.equal(
      dataView.getUint8(104),
      0x80 | pointDataRecordFormat,
      `PDRF ${pointDataRecordFormat} sets the compressed format flag`
    );
    t.equal(dataView.getUint32(100, true), 1, `PDRF ${pointDataRecordFormat} writes one VLR`);
    t.equal(chunkCount, 2, `PDRF ${pointDataRecordFormat} writes two chunks`);
    t.deepEqual(
      chunks.map(chunk => chunk.pointCount),
      [2, 1],
      `PDRF ${pointDataRecordFormat} fixed chunk counts roundtrip`
    );
    t.equal(
      chunks.reduce((byteLength, chunk) => byteLength + chunk.byteLength, 0),
      chunkTableOffset - pointDataOffset - 8,
      `PDRF ${pointDataRecordFormat} chunk sizes reach the table`
    );
    t.deepEqual(
      Array.from(data.attributes.POSITION.value),
      Array.from(wasmData.attributes.POSITION.value),
      `PDRF ${pointDataRecordFormat} TypeScript positions match WASM`
    );
    t.deepEqual(
      Array.from(data.attributes.intensity.value),
      Array.from(wasmData.attributes.intensity.value),
      `PDRF ${pointDataRecordFormat} TypeScript intensities match WASM`
    );
    t.deepEqual(
      Array.from(data.attributes.classification.value),
      Array.from(wasmData.attributes.classification.value),
      `PDRF ${pointDataRecordFormat} TypeScript classifications match WASM`
    );
  }
  t.end();
});

test('LASWriter#validates compressed output options', t => {
  t.throws(
    () =>
      LASWriter.encodeSync?.(mesh, {
        las: {format: 'laz', version: '1.2', pointDataRecordFormat: 6}
      }),
    /LAZ output requires LAS 1.4/,
    'LAZ writer rejects legacy LAS versions'
  );
  t.throws(
    () =>
      LASWriter.encodeSync?.(mesh, {
        las: {format: 'laz', version: '1.4', pointDataRecordFormat: 3}
      }),
    /only supports point data record formats 6-8/,
    'LAZ writer rejects legacy point formats'
  );
  t.throws(
    () => LASWriter.encodeSync?.(mesh, {las: {format: 'laz', chunkSize: 0}}),
    /invalid LAZ chunk size/,
    'LAZ writer rejects empty chunks'
  );
  t.end();
});

test('LASWriter#encodes variable LAZ chunks', async t => {
  const arrayBuffer = await encode(mesh, LASWriter, {
    las: {
      format: 'laz',
      pointDataRecordFormat: 7,
      chunkSize: 2,
      variableChunkTable: true
    }
  });
  const dataView = new DataView(arrayBuffer);
  const pointDataOffset = dataView.getUint32(96, true);
  const chunkTableOffset = readUint64(dataView, pointDataOffset);
  const chunkCount = dataView.getUint32(chunkTableOffset + 4, true);
  const chunks = decodeLAZChunkTable(new Uint8Array(arrayBuffer, chunkTableOffset + 8), {
    chunkCount,
    pointCount: 3,
    chunkSize: 0xffffffff,
    variable: true
  });
  const data = await parse(arrayBuffer, LASLoader, {core: {worker: false}});

  t.equal(dataView.getUint32(100, true), 1, 'writes one LASzip VLR');
  t.deepEqual(
    chunks.map(chunk => chunk.pointCount),
    [2, 1],
    'variable chunk table preserves point counts'
  );
  t.equal(data.attributes.POSITION.value.length, 9, 'variable LAZ parses through LASLoader');
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

/** Read a little-endian UInt64 that is known to fit in JavaScript's safe integer range. */
function readUint64(dataView: DataView, byteOffset: number): number {
  return dataView.getUint32(byteOffset, true) + dataView.getUint32(byteOffset + 4, true) * 2 ** 32;
}
