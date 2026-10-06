// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {LASWriter} from '@loaders.gl/las';
import {makeMeshArrowTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import {parseLAS, parseLASInBatches, decodeLAZFileInBatches} from '../src/lib/typescript/parse-las';

/** Generate a tiny fixed-chunk file without involving a remote fixture. */
function createFixture(pointDataRecordFormat: 3 | 6 | 10, chunkSize = 2): ArrayBuffer {
  return LASWriter.encodeSync!(
    makeMeshArrowTable({
      POSITION: {
        value: new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
        size: 3
      }
    }),
    {las: {format: 'laz', pointDataRecordFormat, chunkSize}}
  );
}

/** Remove the table and retain LASzip's explicit interrupted-writer pointer marker. */
function removeChunkTable(file: ArrayBuffer): ArrayBuffer {
  const view = new DataView(file);
  const pointOffset = view.getUint32(96, true);
  const tableOffset = Number(view.getBigUint64(pointOffset, true));
  const incomplete = file.slice(0, tableOffset);
  new DataView(incomplete).setBigUint64(pointOffset, BigInt(pointOffset), true);
  return incomplete;
}

/** Split input across both chunk boundaries and the initial pointer. */
function* splitInput(file: ArrayBuffer): Iterable<Uint8Array> {
  const bytes = new Uint8Array(file);
  for (let byteOffset = 0; byteOffset < bytes.length; byteOffset += 23)
    yield bytes.subarray(byteOffset, byteOffset + 23);
}

test.each([
  3, 6, 10
] as const)('recovers interrupted fixed chunks for PDRF %i only when requested', async pointDataRecordFormat => {
  const file = createFixture(pointDataRecordFormat);
  const incomplete = removeChunkTable(file);
  expect(() => parseLAS(incomplete)).toThrow();
  const options = {las: {recoverMissingChunkTable: true}};
  const expected = convertTableToMesh(parseLAS(file)).attributes;
  expect(convertTableToMesh(parseLAS(incomplete, options)).attributes).toEqual(expected);
  const streamedPositions: number[] = [];
  for await (const batch of parseLASInBatches(splitInput(incomplete), {...options, batchSize: 3})) {
    streamedPositions.push(...convertTableToMesh(batch).attributes.POSITION.value);
  }
  expect(streamedPositions).toEqual([...expected.POSITION.value]);
  const expectedRaw: number[] = [];
  const actualRaw: number[] = [];
  for await (const batch of decodeLAZFileInBatches(splitInput(file), {batchSize: 3}))
    expectedRaw.push(...new Uint8Array(batch.arrayBuffer));
  for await (const batch of decodeLAZFileInBatches(splitInput(incomplete), {
    ...options,
    batchSize: 3
  }))
    actualRaw.push(...new Uint8Array(batch.arrayBuffer));
  expect(actualRaw).toEqual(expectedRaw);
});

test('recovery keeps malformed existing tables and truncated point data invalid', async () => {
  const file = createFixture(3);
  const options = {las: {recoverMissingChunkTable: true}};
  const malformed = file.slice(0);
  const view = new DataView(malformed);
  const pointOffset = view.getUint32(96, true);
  view.setUint32(Number(view.getBigUint64(pointOffset, true)), 42, true);
  expect(() => parseLAS(malformed, options)).toThrow(/chunk table version 42/);
  const truncated = removeChunkTable(file).slice(0, -8);
  expect(() => parseLAS(truncated, options)).toThrow();
  await expect(async () => {
    for await (const _batch of parseLASInBatches(splitInput(truncated), options)) {
      /* Consume the stream to verify final-input errors. */
    }
  }).rejects.toThrow();
});

test('recovery rejects the interrupted marker when chunk point counts are variable', () => {
  const incomplete = removeChunkTable(createFixture(6));
  const view = new DataView(incomplete);
  const headerLength = view.getUint16(94, true);
  view.setUint32(headerLength + 54 + 12, 0xffffffff, true);
  expect(() => parseLAS(incomplete, {las: {recoverMissingChunkTable: true}})).toThrow(
    /variable-size/
  );
});

test('recovery rejects stale LAS counts that would omit layered records', async () => {
  const incomplete = removeChunkTable(createFixture(6, 5));
  new DataView(incomplete).setBigUint64(247, 4n, true);
  const options = {las: {recoverMissingChunkTable: true}};
  expect(() => parseLAS(incomplete, options)).toThrow(/contains 5 points; expected 4/);
  await expect(async () => {
    for await (const _batch of parseLASInBatches(splitInput(incomplete), options)) {
      /* Consume the stream to verify the embedded count before emitting recovered points. */
    }
  }).rejects.toThrow(/contains 5 points; expected 4/);
  await expect(async () => {
    for await (const _batch of decodeLAZFileInBatches(splitInput(incomplete), options)) {
      /* Exercise the independent raw streaming path. */
    }
  }).rejects.toThrow(/contains 5 points; expected 4/);
});
