// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {fetchFile, parse} from '@loaders.gl/core';
import {LASLoader, type LASLoaderOptions} from '@loaders.gl/las';
import type {MeshAttributes} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {parseLAS, parseLASInBatches, decodeLAZFileInBatches} from '../src/lib/typescript/parse-las';

const formats = [6, 7, 8, 9, 10] as const;
const fixtures = new Map<
  number,
  {source: ArrayBuffer; plain: ArrayBuffer; compressed: ArrayBuffer; expected: MeshAttributes}
>();
beforeAll(async () => {
  for (const pointFormat of formats) {
    const files = await Promise.all(
      ['.las', '-compatible.las', '-compatible.laz'].map(async suffix => {
        const response = await fetchFile(
          `@loaders.gl/las/test/data/compatibility/pdrf${pointFormat}${suffix}`
        );
        return response.arrayBuffer();
      })
    );
    fixtures.set(pointFormat, {
      source: files[0],
      plain: files[1],
      compressed: files[2],
      expected: convertTableToMesh(parseLAS(files[0])).attributes
    });
  }
});

/** Split fixture bytes across VLR and point-record boundaries. */
function* splitInput(file: ArrayBuffer): Iterable<Uint8Array> {
  const bytes = new Uint8Array(file);
  for (let byteOffset = 0; byteOffset < bytes.length; byteOffset += 97)
    yield bytes.subarray(byteOffset, byteOffset + 97);
}

test.each(
  formats
)('restores PDRF %i columns from independently generated compatibility LAS and LAZ', async pointFormat => {
  const fixture = fixtures.get(pointFormat)!;
  const expected = fixture.expected;
  for (const file of [fixture.plain, fixture.compressed]) {
    const parsed = parseLAS(file);
    expect(parsed.loaderData.metadata?.compatibility?.pointDataRecordFormat).toBe(pointFormat);
    expect(parsed.loaderData.metadata?.compatibility?.version).toBe('1.4');
    expect(parsed.loaderData.pointsFormatId).toBeLessThan(6);
    expect(convertTableToMesh(parsed).attributes).toEqual(expected);
    const streamed: Record<string, number[]> = {};
    for await (const batch of parseLASInBatches(splitInput(file), {batchSize: 13})) {
      for (const [name, attribute] of Object.entries(convertTableToMesh(batch).attributes)) {
        streamed[name] ??= [];
        streamed[name].push(...attribute.value);
      }
    }
    for (const [name, attribute] of Object.entries(expected))
      expect(streamed[name]).toEqual([...attribute.value]);
  }
});

test('projects reconstructed fields without publishing the internal Extra Bytes source', async () => {
  const fixture = fixtures.get(8)!;
  const options: LASLoaderOptions = {
    las: {columns: ['classification', 'NIR', 'overlap', 'scannerChannel']}
  };
  const parsed = parseLAS(fixture.compressed, options);
  const expected = Object.fromEntries(
    ['POSITION', 'classification', 'NIR', 'overlap', 'scannerChannel'].map(name => [
      name,
      fixture.expected[name]
    ])
  );
  expect(convertTableToMesh(parsed).attributes).toEqual(expected);
  expect(parsed.data.getChild('EXTRA_BYTES')).toBeNull();
  for await (const batch of parseLASInBatches(splitInput(fixture.compressed), {
    ...options,
    batchSize: 11
  })) {
    expect(batch.data.getChild('EXTRA_BYTES')).toBeNull();
    expect(batch.data.getChild('NIR')).not.toBeNull();
  }
});

test('raw compatibility mode and raw decompression retain the physical legacy records', async () => {
  const fixture = fixtures.get(8)!;
  const raw = parseLAS(fixture.compressed, {las: {compatibilityMode: 'raw'}});
  expect(raw.data.getChild('NIR')).toBeNull();
  expect([...raw.data.getChild('classification')!.toArray()].every(value => value <= 31)).toBe(
    true
  );
  const view = new DataView(fixture.plain);
  const expected = new Uint8Array(fixture.plain, view.getUint32(96, true));
  const actual: number[] = [];
  for await (const batch of decodeLAZFileInBatches(splitInput(fixture.compressed), {batchSize: 11}))
    actual.push(...new Uint8Array(batch.arrayBuffer));
  expect(actual).toEqual([...expected]);
});

test('public parsing and positions-only projection retain compatibility semantics', async () => {
  const fixture = fixtures.get(8)!;
  const parsed = await parse(fixture.compressed, LASLoader, {core: {worker: false}});
  expect(convertTableToMesh(parsed).attributes).toEqual(fixture.expected);
  for (const file of [fixture.plain, fixture.compressed]) {
    const positionsOnly = parseLAS(file, {las: {columns: ['POSITION']}});
    expect(positionsOnly.data.numCols).toBe(1);
    expect(convertTableToMesh(positionsOnly).attributes.POSITION).toEqual(
      fixture.expected.POSITION
    );
  }
});

test('requires a supported compatibility control record and descriptor layout', () => {
  const file = fixtures.get(6)!.plain.slice(0);
  const bytes = new Uint8Array(file);
  const view = new DataView(file);
  let byteOffset = view.getUint16(94, true);
  while (
    new TextDecoder()
      .decode(bytes.subarray(byteOffset + 2, byteOffset + 18))
      .replace(/\0+$/, '') !== 'lascompatible'
  ) {
    byteOffset += 54 + view.getUint16(byteOffset + 20, true);
  }
  view.setUint16(byteOffset + 54 + 2, 5, true);
  expect(() => parseLAS(file)).toThrow(/compatibility VLR version 5/);
  const missing = fixtures.get(6)!.plain.slice(0);
  const missingBytes = new Uint8Array(missing);
  const needle = new TextEncoder().encode('LAS 1.4 extended returns');
  let descriptorNameOffset = 0;
  for (; descriptorNameOffset < missingBytes.length; descriptorNameOffset++) {
    if (needle.every((value, index) => missingBytes[descriptorNameOffset + index] === value)) break;
  }
  expect(descriptorNameOffset).toBeLessThan(missingBytes.length);
  missingBytes[descriptorNameOffset] = 0;
  expect(() => parseLAS(missing)).toThrow(/compatibility field LAS 1.4 extended returns/);
});
