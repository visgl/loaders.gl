// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {Mesh, MeshAttribute, MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable, deduceMeshSchema} from '@loaders.gl/schema-utils';
import {LASWriter, type LASWriterOptions} from '../src/las-writer';

/** Creates a minimal point mesh with optional attribute and metadata overrides. */
function createMesh(
  attributes: Mesh['attributes'] = {},
  metadata: Record<string, string> = {}
): Mesh {
  const meshAttributes = {
    POSITION: {value: new Float64Array([10, 20, 30]), size: 3},
    ...attributes
  };
  return {
    attributes: meshAttributes,
    topology: 'point-list',
    mode: 0,
    schema: deduceMeshSchema(meshAttributes, {topology: 'point-list', mode: '0', ...metadata})
  };
}

/** Collects the single LAS file emitted by the buffered batch writer. */
async function encodeBatches(batches: (Mesh | MeshArrowTable)[]): Promise<ArrayBuffer[]> {
  const output: ArrayBuffer[] = [];
  const input = (async function* () {
    yield* batches;
  })();
  for await (const buffer of LASWriter.encodeInBatches(input, {})) {
    output.push(buffer);
  }
  return output;
}

test('LAS writer encodes an empty point mesh with finite zero bounds', async () => {
  const mesh = createMesh({POSITION: {value: new Float64Array(), size: 3}});
  const buffers = await encodeBatches([mesh]);
  expect(buffers).toHaveLength(1);
  const header = new DataView(buffers[0]);
  expect(header.byteLength).toBe(227);
  expect(header.getUint32(107, true)).toBe(0);
  for (const byteOffset of [155, 163, 171, 179, 187, 195, 203, 211, 219]) {
    expect(header.getFloat64(byteOffset, true)).toBe(0);
  }
});

test('LAS writer merges mixed mesh and Arrow batches and computes bounds over all points', async () => {
  const firstMesh = createMesh();
  const lastMesh = createMesh({POSITION: {value: new Float64Array([-2, 40, 5]), size: 3}});
  const buffers = await encodeBatches([firstMesh, convertMeshToTable(lastMesh, 'arrow-table')]);
  expect(buffers).toHaveLength(1);
  const header = new DataView(buffers[0]);
  expect(header.byteLength).toBe(267);
  expect(header.getUint32(107, true)).toBe(2);
  expect([179, 195, 211].map(byteOffset => header.getFloat64(byteOffset, true))).toEqual([
    10, 40, 30
  ]);
  expect([187, 203, 219].map(byteOffset => header.getFloat64(byteOffset, true))).toEqual([
    -2, 20, 5
  ]);
  expect([227, 247].map(byteOffset => header.getInt32(byteOffset, true))).toEqual([12000, 0]);
});

test('LAS writer rejects empty batch streams', async () => {
  await expect(encodeBatches([])).rejects.toThrow(/at least one input batch/);
});

test.each([
  {value: new Float32Array([10, 20, 30]), size: 3},
  {value: new Float64Array([10, 20, 30, 40]), size: 4}
])('LAS writer rejects inconsistent batched POSITION layouts %#', async position => {
  await expect(encodeBatches([createMesh(), createMesh({POSITION: position})])).rejects.toThrow(
    /consistent POSITION layout/
  );
});

test('LAS writer rejects renamed attributes even when batch widths match', async () => {
  await expect(
    encodeBatches([
      createMesh({intensity: {value: new Uint16Array([1]), size: 1}}),
      createMesh({classification: {value: new Uint8Array([1]), size: 1}})
    ])
  ).rejects.toThrow(/consistent attribute names/);
});

test('LAS writer reads coordinate metadata and lets explicit options override it', () => {
  const mesh = createMesh({}, {las_scale: '[2,4,5]', las_offset: '[8,16,20]'});
  const output = new DataView(LASWriter.encodeSync(mesh));
  expect([131, 139, 147].map(byteOffset => output.getFloat64(byteOffset, true))).toEqual([2, 4, 5]);
  expect([155, 163, 171].map(byteOffset => output.getFloat64(byteOffset, true))).toEqual([
    8, 16, 20
  ]);
  expect([227, 231, 235].map(byteOffset => output.getInt32(byteOffset, true))).toEqual([1, 1, 2]);
  const overridden = new DataView(
    LASWriter.encodeSync(mesh, {las: {scale: [1, 1, 1], offset: [0, 0, 0]}})
  );
  expect(overridden.getInt32(227, true)).toBe(10);
});

test.each([
  'invalid JSON',
  '[1,2]',
  '[1,"2",3]',
  '{}'
])('LAS writer ignores malformed coordinate metadata %s', metadata => {
  const output = new DataView(
    LASWriter.encodeSync(createMesh({}, {las_scale: metadata, las_offset: metadata}))
  );
  expect(output.getFloat64(131, true)).toBe(0.001);
  expect(output.getFloat64(155, true)).toBe(10);
  expect(output.getInt32(227, true)).toBe(0);
});

test.each([
  [{pointDataRecordFormat: 11}, /unsupported point data record format/],
  [{version: '1.0', pointDataRecordFormat: 1}, /requires LAS 1.1/],
  [{version: '1.2', pointDataRecordFormat: 4}, /requires LAS 1.3/],
  [{version: '1.5', pointDataRecordFormat: 0}, /requires point data record format 6-10/],
  [{version: '1.5', pointDataRecordFormat: 6, wkt: '  '}, /requires las.wkt/],
  [
    {version: '1.5', pointDataRecordFormat: 6, wkt: 'LOCAL_CS["test"]', timeOffset: -1},
    /unsigned 16-bit/
  ],
  [
    {version: '1.5', pointDataRecordFormat: 6, wkt: 'LOCAL_CS["test"]', timeOffset: 65536},
    /unsigned 16-bit/
  ],
  [
    {version: '1.5', pointDataRecordFormat: 6, wkt: 'LOCAL_CS["test"]', timeOffset: 0.5},
    /unsigned 16-bit/
  ],
  [
    {version: '1.5', pointDataRecordFormat: 6, wkt: 'LOCAL_CS["test"]', timeOffset: 1},
    /requires a GPS time attribute/
  ],
  [{format: 'laz', version: '1.0', pointDataRecordFormat: 1}, /LAZ PDRF 1 output requires LAS 1.1/],
  [{format: 'laz', version: '1.1', pointDataRecordFormat: 2}, /LAZ PDRF 2 output requires LAS 1.2/],
  [{format: 'laz', version: '1.2', pointDataRecordFormat: 5}, /LAZ PDRF 5 requires LAS 1.3/]
] as const)('LAS writer validates header and point-format options %#', (lasOptions, error) => {
  expect(() => LASWriter.encodeSync(createMesh(), {las: lasOptions} as LASWriterOptions)).toThrow(
    error
  );
});

test.each([
  ['POSITION', {value: new Float64Array([1, 2]), size: 3}, /length must be divisible/],
  ['intensity', {value: new Uint16Array([1, 2]), size: 2}, /intensity attribute must have size 1/],
  ['COLOR_0', {value: new Uint8Array([1, 2]), size: 2}, /COLOR_0 attribute must have size 3/],
  ['COLOR_0', {value: new Uint8Array([1, 2]), size: 3}, /COLOR_0 attribute is too short/],
  ['returnNumber', {value: new Uint8Array([0]), size: 1}, /returnNumber must be between/],
  ['returnNumber', {value: new Uint8Array([6]), size: 1}, /returnNumber must be between/],
  ['numberOfReturns', {value: new Uint8Array([0]), size: 1}, /numberOfReturns must be between/],
  ['numberOfReturns', {value: new Uint8Array([6]), size: 1}, /numberOfReturns must be between/]
] as const)('LAS writer validates %s boundary %#', (attributeName, attribute, error) => {
  expect(() => LASWriter.encodeSync(createMesh({[attributeName]: attribute}))).toThrow(error);
});

test('LAS writer reports missing required and declared Extra Bytes attributes', () => {
  const mesh = createMesh();
  delete mesh.attributes.POSITION;
  expect(() => LASWriter.encodeSync(mesh)).toThrow(/POSITION attribute is required/);
  expect(() =>
    LASWriter.encodeSync(createMesh(), {las: {extraBytes: [{attribute: 'missing'}]}})
  ).toThrow(/Extra Bytes attribute missing is missing/);
  expect(() =>
    LASWriter.encodeSync(
      createMesh({extra: {value: new Uint8ClampedArray([1]), size: 1} as MeshAttribute}),
      {las: {extraBytes: [{attribute: 'extra'}]}}
    )
  ).toThrow(/require a supported typed array/);
});

test.each([
  [new Int8Array([-7]), 2],
  [new Int16Array([-1234]), 4],
  [new Uint32Array([4000000000]), 5],
  [new Int32Array([-2000000000]), 6],
  [new Float64Array([1.125]), 10]
] as const)('LAS writer preserves previously untested Extra Bytes scalar type %#', (values, dataType) => {
  const output = new DataView(
    LASWriter.encodeSync(createMesh({extra: {value: values, size: 1}}), {
      las: {extraBytes: [{attribute: 'extra'}]}
    })
  );
  expect(output.byteLength).toBeLessThan(1024);
  expect(output.getUint8(227 + 54 + 2)).toBe(dataType);
  const pointOffset = output.getUint32(96, true);
  const result =
    values instanceof Int8Array
      ? output.getInt8(pointOffset + 20)
      : values instanceof Int16Array
        ? output.getInt16(pointOffset + 20, true)
        : values instanceof Uint32Array
          ? output.getUint32(pointOffset + 20, true)
          : values instanceof Int32Array
            ? output.getInt32(pointOffset + 20, true)
            : output.getFloat64(pointOffset + 20, true);
  expect(result).toBe(values[0]);
});

test('LAS writer places a math transform VLR before the coordinate system VLR', () => {
  const output = new DataView(
    LASWriter.encodeSync(createMesh(), {
      las: {version: '1.4', wktMathTransform: 'PARAM_MT["test"]', wkt: 'LOCAL_CS["test"]'}
    })
  );
  expect(output.byteLength).toBeLessThan(1024);
  expect(output.getUint8(104)).toBe(6);
  expect(output.getUint32(100, true)).toBe(2);
  expect(output.getUint16(375 + 18, true)).toBe(2111);
  const secondOffset = 375 + 54 + output.getUint16(375 + 20, true);
  expect(output.getUint16(secondOffset + 18, true)).toBe(2112);
  expect(output.getUint32(96, true)).toBe(
    secondOffset + 54 + output.getUint16(secondOffset + 20, true)
  );
});

test('LAS writer scales normalized float colors and preserves 16-bit colors', () => {
  const colorAttributes = [
    {value: new Float32Array([0.5, 1, 0]), size: 3, normalized: true},
    {value: new Uint16Array([32768, 65535, 0]), size: 3, normalized: true},
    {value: new Uint16Array([32768, 65535, 0]), size: 3}
  ];
  for (const colorAttribute of colorAttributes) {
    const output = new DataView(LASWriter.encodeSync(createMesh({COLOR_0: colorAttribute})));
    expect(output.getUint8(104)).toBe(2);
    expect([247, 249, 251].map(byteOffset => output.getUint16(byteOffset, true))).toEqual([
      32768, 65535, 0
    ]);
  }
});
