// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {readTiffContainer, checkTiffRange} from '../../../src/lib/tiff/read-tiff-directory';
import {decodeTiffSamples} from '../../../src/lib/tiff/decode-tiff-samples';
import {planTiffBlocks} from '../../../src/lib/tiff/plan-tiff-blocks';
import {openTiffNumericDecoder} from '../../../src/lib/tiff/tiff-numeric-decoder';
import {createTiffFixture} from './tiff-fixture';

const representations = [
  [8, 1, Uint8Array],
  [16, 1, Uint16Array],
  [32, 1, Uint32Array],
  [8, 2, Int8Array],
  [16, 2, Int16Array],
  [32, 2, Int32Array],
  [32, 3, Float32Array],
  [64, 3, Float64Array]
] as const;

test.each(
  representations.flatMap(([bits, format, arrayType]) =>
    [false, true].flatMap(bigTiff =>
      [false, true].map(littleEndian => ({bits, format, arrayType, bigTiff, littleEndian}))
    )
  )
)('original decoder preserves $bits-bit format $format with bigTiff=$bigTiff littleEndian=$littleEndian', async ({
  bits,
  format,
  arrayType,
  bigTiff,
  littleEndian
}) => {
  const fixture = createTiffFixture({bits: [bits], formats: [format], bigTiff, littleEndian});
  const decoder = await openTiffNumericDecoder(fixture.data, {decoder: 'native'});
  expect(decoder.backend).toBe('native');
  const result = await decoder.images[0].readSamples();
  expect(result.data[0]).toBeInstanceOf(arrayType);
  expect(Array.from(result.data[0])).toEqual(fixture.values[0]);
  expect(result).toMatchObject({width: 3, height: 3});
});

test.each([
  false,
  true
])('mixed samples, planar=$planar, padded tiles and selection retain original values', async planar => {
  const fixture = createTiffFixture({
    bits: [16, 32, 64],
    formats: [2, 3, 3],
    planar,
    tileSize: [2, 2],
    values: [
      [-2, 0, 2, 3, 4, 5, 6, 7, 8],
      [NaN, Infinity, 0, 1, 2, 3, 4, 5, 6],
      [1e100, 2e100, 0, 1, 2, 3, 4, 5, 6]
    ]
  });
  const container = readTiffContainer(fixture.data);
  const directory = container.directories[0];
  const blocks = planTiffBlocks(directory, fixture.data.byteLength, [1, 1, 3, 3], [2, 0]);
  expect(blocks.length).toBe(planar ? 8 : 4);
  const result = await decodeTiffSamples(fixture.data, directory, true, {
    window: [1, 1, 3, 3],
    bands: [2, 0]
  });
  expect(result.data[0]).toBeInstanceOf(Float64Array);
  expect(result.data[1]).toBeInstanceOf(Int16Array);
  expect(Array.from(result.data[0])).toEqual([2, 3, 5, 6]);
  expect(Array.from(result.data[1])).toEqual([4, 5, 7, 8]);
  const entire = await decodeTiffSamples(fixture.data, directory, true);
  expect(Array.from(entire.data[1])).toEqual(fixture.values[1]);
  expect(entire.data[2][1]).toBe(2e100);
  const transferred = structuredClone(entire, {
    transfer: entire.data.map(array => array.buffer as ArrayBuffer)
  });
  expect(transferred.data[2]).toBeInstanceOf(Float64Array);
  expect(transferred.data[2][1]).toBe(2e100);
});

test('planner reads only selected planar blocks and includes final short strips', () => {
  const fixture = createTiffFixture({planar: true, bits: [8, 16], formats: [1, 1]});
  const blocks = planTiffBlocks(
    readTiffContainer(fixture.data).directories[0],
    fixture.data.byteLength,
    [0, 2, 3, 3],
    [1]
  );
  expect(blocks).toEqual([
    {
      offset: fixture.blocks[3].offset,
      byteLength: 6,
      column: 0,
      row: 2,
      width: 3,
      height: 1,
      band: 1
    }
  ]);
});

test('directory fields retain unknown tags and exact signed/unsigned 64-bit values', () => {
  const fixture = createTiffFixture({
    bigTiff: true,
    tags: [
      {tag: 65000, type: 16, values: [2n ** 63n + 1n]},
      {tag: 65001, type: 17, values: [-(2n ** 62n)]},
      {tag: 65002, type: 5, values: [3]},
      {tag: 65003, type: 10, values: [-2]},
      {tag: 65004, type: 6, values: [-8]},
      {tag: 65005, type: 7, values: [0, 255]},
      {tag: 65006, type: 8, values: [-17]},
      {tag: 65007, type: 9, values: [-30]},
      {tag: 65008, type: 11, values: [1.25]},
      {tag: 65009, type: 12, values: [2.5]}
    ]
  });
  const directory = readTiffContainer(fixture.data).directories[0];
  expect(directory.tags.get(65000)).toEqual([2n ** 63n + 1n]);
  expect(directory.tags.get(65001)).toEqual([-(2n ** 62n)]);
  expect(directory.tags.get(65002)).toEqual([3]);
  expect(directory.tags.get(65003)).toEqual([-2]);
  expect(directory.tags.get(65009)).toEqual([2.5]);
});

test.each([
  {},
  {maxDirectories: 0},
  {maxEntriesPerDirectory: 1},
  {maxMetadataBytes: 8}
])('directory limits and malformed input reject before decoding: %j', limits => {
  const fixture = createTiffFixture();
  if (Object.keys(limits).length === 0) new DataView(fixture.data).setUint16(0, 0);
  expect(() => readTiffContainer(fixture.data, limits)).toThrow();
});

test.each([
  'header',
  'version',
  'reserved',
  'unsafeOffset',
  'unsafeCount',
  'duplicate',
  'fieldType',
  'truncatedTag',
  'cycle',
  'alignment'
])('rejects malformed BigTIFF %s', condition => {
  const fixture = createTiffFixture({bigTiff: true});
  const view = new DataView(fixture.data);
  const first = fixture.entryOffsets.get(256)!;
  if (condition === 'header') expect(() => readTiffContainer(fixture.data.slice(0, 12))).toThrow();
  else {
    if (condition === 'version') view.setUint16(2, 44, true);
    if (condition === 'reserved') view.setUint16(6, 1, true);
    if (condition === 'unsafeOffset') view.setBigUint64(8, 2n ** 60n, true);
    if (condition === 'unsafeCount') view.setBigUint64(16, 2n ** 60n, true);
    if (condition === 'duplicate') view.setUint16(first + 20, 256, true);
    if (condition === 'fieldType') view.setUint16(first + 2, 99, true);
    if (condition === 'truncatedTag') {
      view.setBigUint64(first + 4, 10n, true);
      view.setBigUint64(first + 12, BigInt(fixture.data.byteLength - 1), true);
    }
    if (condition === 'cycle')
      view.setBigUint64(16 + 8 + fixture.entryOffsets.size * 20, 16n, true);
    if (condition === 'alignment') view.setBigUint64(8, 17n, true);
    expect(() => readTiffContainer(fixture.data)).toThrow();
  }
});

test('byte addressing rejects negative, fractional, overflowing and truncated ranges', () => {
  for (const [offset, length] of [
    [-1, 1],
    [0, -1],
    [0.5, 1],
    [0, NaN],
    [Number.MAX_SAFE_INTEGER, 2],
    [3, 2]
  ])
    expect(() => checkTiffRange(offset, length, 4)).toThrow();
  expect(() => checkTiffRange(4, 0, 4)).not.toThrow();
});

test('native decode rejects malformed windows, block descriptors, selections and budgets', async () => {
  const fixture = createTiffFixture();
  const directory = readTiffContainer(fixture.data).directories[0];
  for (const parameters of [
    {window: [0, 0, 4, 3]},
    {window: [1, 0, 0, 1]},
    {window: [0.5, 0, 2, 2]},
    {bands: []},
    {bands: [0, 0]},
    {bands: [1]},
    {maxPixels: 8},
    {maxDecodedBytes: 17},
    {maxPixels: 0}
  ]) {
    await expect(decodeTiffSamples(fixture.data, directory, true, parameters)).rejects.toThrow();
  }
  const tags = new Map(directory.tags);
  tags.set(279, [11, 6]);
  await expect(decodeTiffSamples(fixture.data, {...directory, tags}, true)).rejects.toThrow(
    'block byte count'
  );
  tags.set(279, [1]);
  expect(() => planTiffBlocks({...directory, tags}, fixture.data.byteLength, [0, 0, 3, 3])).toThrow(
    'table lengths'
  );
});

test('native cancellation preserves reasons before decode and during cooperative sample copying', async () => {
  const fixture = createTiffFixture({width: 200, height: 200, rowsPerStrip: 200, bits: [8]});
  const directory = readTiffContainer(fixture.data).directories[0];
  const controller = new AbortController();
  const reason = new Error('view superseded');
  const pending = decodeTiffSamples(fixture.data, directory, true, {signal: controller.signal});
  controller.abort(reason);
  await expect(pending).rejects.toBe(reason);
  await expect(
    decodeTiffSamples(fixture.data, directory, true, {signal: controller.signal})
  ).rejects.toBe(reason);
  await expect(openTiffNumericDecoder(fixture.data, {signal: controller.signal})).rejects.toBe(
    reason
  );
});

test('SubIFD graph keeps main order, shares repeated children and rejects cycles or exhausted traversal budgets', () => {
  const fixture = createTiffFixture({tags: [{tag: 330, type: 13, values: [3000, 3000]}]});
  const view = new DataView(fixture.data);
  const directoryLength = 2 + fixture.entryOffsets.size * 12 + 4;
  new Uint8Array(fixture.data).copyWithin(3000, 8, 8 + directoryLength);
  const childSubEntry = 3000 + fixture.entryOffsets.get(330)! - 8;
  view.setUint16(childSubEntry, 254, true);
  view.setUint32(childSubEntry + 4, 1, true);
  view.setUint32(childSubEntry + 8, 1, true);
  const container = readTiffContainer(fixture.data);
  expect(container.directories.map(directory => directory.offset)).toEqual([8]);
  expect([...container.directoriesByOffset.keys()]).toEqual([8, 3000]);
  expect(() => readTiffContainer(fixture.data, {maxDirectories: 1})).toThrow('directory count');
  const childNextPosition = 3000 + directoryLength - 4;
  view.setUint32(childNextPosition, fixture.data.byteLength + 8, true);
  expect(() => readTiffContainer(fixture.data)).toThrow('truncated');
  view.setUint32(childNextPosition, 8, true);
  expect(() => readTiffContainer(fixture.data)).toThrow('Cyclic TIFF SubIFD');
  view.setUint32(childNextPosition, 0, true);
  view.setUint16(childSubEntry, 330, true);
  view.setUint32(childSubEntry + 8, 8, true);
  expect(() => readTiffContainer(fixture.data)).toThrow('Cyclic TIFF SubIFD');
});

test('unknown metadata explicitly selects compatibility while malformed metadata never falls back', async () => {
  const fixture = createTiffFixture({tags: [{tag: 65000, type: 3, values: [7]}]});
  await expect(openTiffNumericDecoder(fixture.data, {decoder: 'native'})).rejects.toThrow(
    'metadata tag'
  );
  expect((await openTiffNumericDecoder(fixture.data)).backend).toBe('geotiff');
  await expect(
    openTiffNumericDecoder(fixture.data, {decoder: 'invalid' as 'auto'})
  ).rejects.toThrow('decoder policy');
  new DataView(fixture.data).setUint32(4, fixture.data.byteLength + 8, true);
  await expect(openTiffNumericDecoder(fixture.data)).rejects.toThrow('truncated');
});

test('native metadata separates bands, preserves raw strings, nodata, affine tags and declared CRS', async () => {
  const fixture = createTiffFixture({
    tags: [
      {
        tag: 42112,
        type: 2,
        values:
          '<GDALMetadata><Item name="NAME"> raw &amp; text </Item><Item name="SCALE" sample="0">0.25</Item></GDALMetadata>'
      },
      {tag: 42113, type: 2, values: '-9999.1'},
      {tag: 34735, type: 3, values: [1, 1, 0, 3, 1024, 0, 1, 2, 1025, 0, 1, 2, 2048, 0, 1, 4326]},
      {tag: 33550, type: 12, values: [1, 1, 0]},
      {tag: 33922, type: 12, values: [2, 1, 0, 12, 42, 0]}
    ]
  });
  const originalBytes = new Uint8Array(fixture.data.slice(0));
  const decoder = await openTiffNumericDecoder(fixture.data);
  const image = decoder.images[0];
  expect(decoder.backend).toBe('native');
  expect(image.metadata).toEqual({NAME: ' raw &amp; text '});
  expect(image.bandMetadata).toEqual([{SCALE: '0.25'}]);
  expect(image.noData).toBe(-9999.1);
  expect(image.geoKeys).toMatchObject({GeographicTypeGeoKey: 4326, GTRasterTypeGeoKey: 2});
  expect(image.fileDirectory.ModelTiepoint).toEqual([2, 1, 0, 12, 42, 0]);
  const samples = await image.readSamples();
  expect(samples.data[0][0]).toBe(1);
  expect(new Uint8Array(fixture.data)).toEqual(originalBytes);
});

test.each([
  'native',
  'geotiff'
] as const)('both decoder contracts preserve numeric values and enforce selected output budgets: %s', async decoderPolicy => {
  const fixture = createTiffFixture({bits: [16, 32], formats: [2, 3], planar: true});
  const decoder = await openTiffNumericDecoder(fixture.data, {decoder: decoderPolicy});
  const image = decoder.images[0];
  const result = await image.readSamples({
    bands: [1],
    window: [1, 1, 3, 3],
    maxDecodedBytes: 16,
    maxPixels: 4
  });
  expect(result.data[0]).toBeInstanceOf(Float32Array);
  expect(Array.from(result.data[0])).toEqual([37.25, 38.25, 40.25, 41.25]);
  await expect(image.readSamples({bands: [1], maxDecodedBytes: 35})).rejects.toThrow('budget');
  const controller = new AbortController();
  controller.abort('obsolete');
  await expect(image.readSamples({signal: controller.signal})).rejects.toBe('obsolete');
});

test('compatibility float16 budgets include Float32 expansion before allocation', async () => {
  const fixture = createTiffFixture({width: 1, height: 1, bits: [16], formats: [1]});
  const view = new DataView(fixture.data);
  view.setUint16(fixture.entryOffsets.get(339)! + 8, 3, fixture.littleEndian);
  view.setUint16(fixture.blocks[0].offset, 0x3c00, fixture.littleEndian);
  const decoder = await openTiffNumericDecoder(fixture.data);
  expect(decoder.backend).toBe('geotiff');
  await expect(decoder.images[0].readSamples({maxDecodedBytes: 2})).rejects.toThrow('budget');
  const samples = await decoder.images[0].readSamples({maxDecodedBytes: 4});
  expect(samples.data[0]).toBeInstanceOf(Float32Array);
  expect(Array.from(samples.data[0])).toEqual([1]);
});

test.each([
  '<GDALMetadata><Item></GDALMetadata>',
  '<Other><Item name="x">1</Item></Other>'
])('malformed GDAL metadata does not trigger fallback: %s', async xml => {
  const fixture = createTiffFixture({tags: [{tag: 42112, type: 2, values: xml}]});
  await expect(openTiffNumericDecoder(fixture.data)).rejects.toThrow('Invalid TIFF GDAL');
});

test('empty GDAL metadata remains an explicit empty record', async () => {
  const fixture = createTiffFixture({tags: [{tag: 42112, type: 2, values: '<GDALMetadata/>'}]});
  const decoder = await openTiffNumericDecoder(fixture.data);
  expect(decoder.backend).toBe('native');
  expect(decoder.images[0].metadata).toEqual({});
  expect(decoder.images[0].bandMetadata).toEqual([{}]);
});

test.each([
  {bigTiff: false, littleEndian: true},
  {bigTiff: true, littleEndian: false}
])('GeoKeys resolve referenced numeric and ASCII values: %j', async layout => {
  const fixture = createTiffFixture({
    ...layout,
    tags: [
      {
        tag: 34735,
        type: 3,
        values: [
          1, 1, 0, 4, 2057, 34736, 1, 0, 1026, 34737, 6, 0, 2053, 34736, 1, 1, 2052, 34735, 1, 20,
          9001
        ]
      },
      {tag: 34736, type: 12, values: [6378137, 0.001]},
      {tag: 34737, type: 2, values: 'Earth|'}
    ]
  });
  const decoder = await openTiffNumericDecoder(fixture.data, {decoder: 'native'});
  expect(decoder.images[0].geoKeys).toEqual({
    GeogSemiMajorAxisGeoKey: 6378137,
    GTCitationGeoKey: 'Earth',
    GeogLinearUnitSizeGeoKey: 0.001,
    GeogLinearUnitsGeoKey: 9001
  });
});

test.each(
  [
    [1, 1, 0, 1, 1026, 34737, 7, 0],
    [1, 1, 0, 1, 2057, 34736, 1, 3],
    [1, 1, 0, 1, 2048, 0, 2, 4326],
    [1, 1, 0, 1, 2048, 1234, 1, 0],
    [1, 1, 0, 2, 2048, 0, 1, 4326, 2048, 0, 1, 4326]
  ].map(keys => ({keys}))
)('invalid GeoKey storage fails without compatibility fallback: %j', async ({keys}) => {
  const fixture = createTiffFixture({
    tags: [
      {tag: 34735, type: 3, values: keys},
      {tag: 34736, type: 12, values: [6378137]},
      {tag: 34737, type: 2, values: 'Earth|'}
    ]
  });
  await expect(openTiffNumericDecoder(fixture.data)).rejects.toThrow('GeoTIFF key');
});
