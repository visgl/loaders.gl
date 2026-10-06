// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {LASLoader, type LASLoaderOptions} from '@loaders.gl/las';
import type {LASMesh} from '../src/lib/las-types';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {parseLAS, parseLASInBatches, decodeLAZFileInBatches} from '../src/lib/typescript/parse-las';
import {
  loadLegacyLAZFixture,
  type LegacyLAZFixture
} from '../../loader-utils/test/lib/laz/legacy-laz-fixtures';

let fixtures: LegacyLAZFixture[];
beforeAll(async () => {
  fixtures = await Promise.all(
    ['', '-chunked', '-v2'].map(suffix => loadLegacyLAZFixture(3, suffix))
  );
});

const options: LASLoaderOptions = {
  las: {
    columns: [
      'POSITION',
      'COLOR_0',
      'intensity',
      'classification',
      'GPS_TIME',
      'EXTRA_BYTES',
      'scanAngle',
      'userData',
      'pointSourceId',
      'returnNumber',
      'numberOfReturns'
    ]
  }
};

/** Build a plain LAS file from the independent reference records and their source header. */
function createUncompressedFile(fixture: LegacyLAZFixture): ArrayBuffer {
  const headerLength = new DataView(fixture.compressedFile.buffer).getUint16(94, true);
  const bytes = new Uint8Array(headerLength + fixture.rawPointData.byteLength);
  bytes.set(fixture.compressedFile.subarray(0, headerLength));
  const header = new DataView(bytes.buffer);
  header.setUint32(96, headerLength, true);
  header.setUint32(100, 0, true);
  bytes[104] &= 63;
  bytes.set(fixture.rawPointData, headerLength);
  return bytes.buffer;
}

/** Yield deterministic byte fragments without copying or accessing a remote source. */
function* splitInput(bytes: Uint8Array, chunkSize = 257): Iterable<Uint8Array> {
  for (let byteOffset = 0; byteOffset < bytes.byteLength; byteOffset += chunkSize)
    yield bytes.subarray(byteOffset, byteOffset + chunkSize);
}

test.each([
  ['pointwise v1', 0],
  ['chunked v1', 1],
  ['pointwise v2', 2]
] as const)('LASLoader parses %s into the same columns as uncompressed LAS', async (_label, fixtureIndex) => {
  const fixture = fixtures[fixtureIndex];
  const expected = convertTableToMesh(
    parseLAS(createUncompressedFile(fixture), options)
  ).attributes;
  const actual = convertTableToMesh(parseLAS(fixture.compressedFile.buffer, options)).attributes;
  expect(actual).toEqual(expected);
  const streamedAttributes: Record<string, number[]> = {};
  for await (const batch of parseLASInBatches(splitInput(fixture.compressedFile), {
    ...options,
    batchSize: 37
  })) {
    for (const [name, attribute] of Object.entries(convertTableToMesh(batch).attributes)) {
      streamedAttributes[name] ??= [];
      streamedAttributes[name].push(...attribute.value);
    }
  }
  for (const [name, attribute] of Object.entries(expected))
    expect(streamedAttributes[name]).toEqual(Array.from(attribute.value));
});

test('LASLoader public entrypoint supports legacy pointwise mesh output', async () => {
  const fixture = fixtures[0];
  const actual = (await parse(fixture.compressedFile.buffer, LASLoader, {
    las: {shape: 'mesh'},
    core: {worker: false}
  })) as LASMesh;
  const expected = convertTableToMesh(parseLAS(createUncompressedFile(fixture)));
  expect(actual.attributes).toEqual(expected.attributes);
});

test('pointwise raw streaming emits before EOF and preserves every reference byte', async () => {
  const fixture = fixtures[0];
  let inputComplete = false;
  /** Mark EOF after yielding the complete source. */
  async function* readInput(): AsyncIterable<Uint8Array> {
    yield* splitInput(fixture.compressedFile);
    inputComplete = true;
  }
  const actual = new Uint8Array(fixture.rawPointData.byteLength);
  let byteOffset = 0;
  let emittedBeforeEnd = false;
  for await (const batch of decodeLAZFileInBatches(readInput(), {batchSize: 37})) {
    emittedBeforeEnd = emittedBeforeEnd || !inputComplete;
    const bytes = new Uint8Array(batch.arrayBuffer);
    actual.set(bytes, byteOffset);
    byteOffset += bytes.byteLength;
  }
  expect(emittedBeforeEnd).toBe(true);
  expect(byteOffset).toBe(actual.byteLength);
  expect(actual).toEqual(fixture.rawPointData);
});

test('pointwise streams reject truncation and invalid codec declarations', async () => {
  const fixture = fixtures[0];
  const truncated = fixture.compressedFile.slice(0, -100);
  expect(() => parseLAS(truncated.buffer)).toThrow(/needs more compressed data/);
  await expect(async () => {
    for await (const _batch of parseLASInBatches(splitInput(truncated), {batchSize: 37})) {
      /* Consume the iterator to verify final-input errors. */
    }
  }).rejects.toThrow(/needs more compressed data|truncated/);
  const invalidVersion = fixture.compressedFile.slice();
  const versionOffset = new DataView(invalidVersion.buffer).getUint16(94, true) + 54 + 34 + 4;
  new DataView(invalidVersion.buffer).setUint16(versionOffset, 3, true);
  expect(() => parseLAS(invalidVersion.buffer)).toThrow(
    /unsupported legacy LASzip item type 6 version 3/
  );
  const invalidCompressor = fixture.compressedFile.slice();
  const compressorOffset = new DataView(invalidCompressor.buffer).getUint16(94, true) + 54;
  new DataView(invalidCompressor.buffer).setUint16(compressorOffset, 0, true);
  expect(() => parseLAS(invalidCompressor.buffer)).toThrow(/requires LASzip compressor 1 or 2/);
});
