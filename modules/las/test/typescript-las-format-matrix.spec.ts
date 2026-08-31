// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {
  parseLAS,
  parseLASChunkedIterator,
  parseLASHeader,
  parseLASInBatches
} from '../src/lib/typescript/parse-las';

const POINT_FORMAT_LENGTHS = [20, 28, 26, 34, 57, 63, 30, 36, 38, 59, 67] as const;
const ALL_COLUMNS = [
  'POSITION',
  'intensity',
  'classification',
  'synthetic',
  'keyPoint',
  'withheld',
  'overlap',
  'COLOR_0',
  'GPS_TIME',
  'NIR',
  'scanAngle',
  'userData',
  'pointSourceId',
  'returnNumber',
  'numberOfReturns',
  'scannerChannel',
  'scanDirectionFlag',
  'edgeOfFlightLine',
  'WAVEFORM',
  'EXTRA_BYTES'
] as const;

test.each(
  Array.from({length: 11}, (_, index) => index)
)('TypeScript LAS parses every selected field from PDRF %i', pointDataRecordFormat => {
  const source = createLASFixture(pointDataRecordFormat, true);
  const table = parseLAS(source, {
    las: {columns: ALL_COLUMNS, colorDepth: 'auto', fp64: true}
  });
  const names = table.data.schema.fields.map(field => field.name);

  expect(table.data.numRows).toBe(3);
  const positionColumn = table.data.getChild('POSITION')!;
  expect(Array.from({length: 3}, (_, index) => Array.from(positionColumn.get(index)))).toEqual([
    [510, -3980, 230],
    [510.5, -3978, 234],
    [511, -3976, 238]
  ]);
  expect(table.data.getChild('intensity')!.toArray()).toEqual(new Uint16Array([200, 217, 234]));
  expect(table.data.getChild('classification')!.toArray()).toEqual(
    pointDataRecordFormat <= 5 ? new Uint8Array([3, 4, 5]) : new Uint8Array([20, 21, 22])
  );
  const extraBytesColumn = table.data.getChild('EXTRA_BYTES')!;
  expect(Array.from({length: 3}, (_, index) => Array.from(extraBytesColumn.get(index)))).toEqual([
    [0, 255],
    [1, 254],
    [2, 253]
  ]);
  expect(names.includes('GPS_TIME')).toBe(
    [1, 3, 4, 5, 6, 7, 8, 9, 10].includes(pointDataRecordFormat)
  );
  expect(names.includes('COLOR_0')).toBe([2, 3, 5, 7, 8, 10].includes(pointDataRecordFormat));
  expect(names.includes('NIR')).toBe(pointDataRecordFormat === 8 || pointDataRecordFormat === 10);
  expect(names.includes('WAVEFORM')).toBe([4, 5, 9, 10].includes(pointDataRecordFormat));
});

test('TypeScript LAS color selection covers explicit and auto 8-bit paths', () => {
  const source = createLASFixture(7, false);
  for (const colorDepth of [8, 16, 'auto', undefined] as const) {
    const table = parseLAS(source, {
      las: {columns: ['POSITION', 'COLOR_0'], colorDepth}
    });
    const colors = table.data.getChild('COLOR_0')!;
    expect(colors.length).toBe(3);
    const firstColor = Array.from(colors.get(0));
    expect(firstColor).toHaveLength(4);
    expect(firstColor[3]).toBe(255);
  }
});

test('TypeScript LAS streams fragmented modern records into exact batches', async () => {
  const source = createLASFixture(10, true);
  const chunks = [
    new Uint8Array(source, 0, 111),
    new DataView(source, 111, 277),
    source.slice(388)
  ];
  const batches: MeshArrowTable[] = [];

  for await (const batch of parseLASInBatches(chunks, {
    batchSize: 2,
    las: {columns: ALL_COLUMNS, colorDepth: 16, fp64: true}
  })) {
    batches.push(batch);
  }

  expect(batches.map(batch => batch.data.numRows)).toEqual([2, 1]);
  expect(batches.map(batch => batch.progress)).toEqual([2 / 3, 1]);
  expect(batches[1].data.getChild('GPS_TIME')!.get(0)).toBe(1002.5);
  expect(Array.from(batches[1].data.getChild('NIR')!.toArray())).toEqual([902]);
});

test.each(ALL_COLUMNS)('TypeScript LAS independently selects the %s column', columnName => {
  const table = parseLAS(createLASFixture(10, true), {
    las: {columns: [columnName], colorDepth: 16, fp64: false}
  });
  expect(table.data.numRows).toBe(3);
  expect(table.data.schema.fields.map(field => field.name)).toContain(columnName);
});

test('TypeScript LAS covers default, empty, and unsupported-per-format column selections', () => {
  const source = createLASFixture(0, false);
  const defaultTable = parseLAS(source);
  expect(defaultTable.data.schema.fields.map(field => field.name)).toContain('POSITION');

  const emptySelection = parseLAS(source, {las: {columns: []}});
  expect(emptySelection.data.numRows).toBe(3);
  expect(emptySelection.data.schema.fields.map(field => field.name)).toEqual(['POSITION']);

  const unavailableSelection = parseLAS(source, {
    las: {columns: ['COLOR_0', 'GPS_TIME', 'NIR', 'WAVEFORM']}
  });
  expect(unavailableSelection.data.numRows).toBe(3);
  expect(unavailableSelection.data.schema.fields.map(field => field.name)).toEqual(['POSITION']);
});

test('TypeScript LAS chunk iterator covers exact, partial, and oversized batches', () => {
  const source = createLASFixture(6, false);
  expect(
    Array.from(parseLASChunkedIterator(source, 1)).map(batch => batch.header.pointsCount)
  ).toEqual([1, 1, 1]);
  expect(
    Array.from(parseLASChunkedIterator(source, 2)).map(batch => batch.header.pointsCount)
  ).toEqual([2, 1]);
  expect(
    Array.from(parseLASChunkedIterator(source, 10)).map(batch => batch.header.pointsCount)
  ).toEqual([3]);
});

test('TypeScript LAS streams synchronous and asynchronous chunk shapes', async () => {
  const source = createLASFixture(8, true);
  const synchronousChunks = [
    new Uint8Array(source, 0, 227),
    new DataView(source, 227, 148),
    source.slice(375)
  ];
  const synchronousBatches: MeshArrowTable[] = [];
  for await (const batch of parseLASInBatches(synchronousChunks, {
    batchSize: 1,
    las: {columns: ALL_COLUMNS, colorDepth: 'auto'}
  })) {
    synchronousBatches.push(batch);
  }
  expect(synchronousBatches.map(batch => batch.data.numRows)).toEqual([1, 1, 1]);

  async function* getAsynchronousChunks() {
    yield source.slice(0, 100);
    yield new Uint8Array(source, 100, 275);
    yield new DataView(source, 375);
  }
  const asynchronousBatches: MeshArrowTable[] = [];
  for await (const batch of parseLASInBatches(getAsynchronousChunks(), {
    batchSize: 10,
    las: {columns: ['POSITION'], fp64: true}
  })) {
    asynchronousBatches.push(batch);
  }
  expect(asynchronousBatches).toHaveLength(1);
  expect(asynchronousBatches[0].data.schema.fields[0].type.toString()).toContain('Float64');
});

test('TypeScript LAS streaming rejects incomplete headers, signatures, and point records', async () => {
  await expect(collectLASBatches([new Uint8Array(100)])).rejects.toThrow('incomplete LAS header');

  const invalidSignature = createLASFixture(0, false).slice(0, 300);
  new Uint8Array(invalidSignature)[0] = 0;
  await expect(collectLASBatches([invalidSignature])).rejects.toThrow('invalid LAS header');

  const truncated = createLASFixture(0, false).slice(0, -1);
  await expect(collectLASBatches([truncated])).rejects.toThrow('truncated LAS point data');
});

test.each([
  0, 1, 2, 3, 4
])('TypeScript LAS header covers legacy LAS 1.%i metadata', minorVersion => {
  const source = createLASFixture(0, false);
  const bytes = new Uint8Array(source);
  const view = new DataView(source);
  bytes[25] = minorVersion;
  if (minorVersion < 4) {
    view.setBigUint64(247, 0n, true);
  }
  const header = parseLASHeader(source);
  expect(header.versionAsString).toBe(`1.${minorVersion}`);
  expect(header.pointsCount).toBe(3);
  expect(header.metadata?.pointsByReturn).toHaveLength(minorVersion >= 4 ? 15 : 5);
  expect(header.metadata?.maxGpsTime).toBeUndefined();
});

test.each([
  ['major version', (bytes: Uint8Array) => (bytes[24] = 2), 'unsupported LAS version 2.5'],
  [
    'short header',
    (_bytes: Uint8Array, view: DataView) => view.setUint16(94, 375, true),
    'at least 393'
  ],
  [
    'legacy point format',
    (bytes: Uint8Array) => (bytes[104] = 5),
    'requires point data record formats 6-10'
  ],
  [
    'missing WKT flag',
    (_bytes: Uint8Array, view: DataView) => view.setUint16(6, 0, true),
    'requires the WKT'
  ],
  [
    'reserved encoding bit',
    (_bytes: Uint8Array, view: DataView) => view.setUint16(6, 0x30, true),
    'reserved bits'
  ],
  [
    'time offset without GPS type',
    (_bytes: Uint8Array, view: DataView) => view.setUint16(6, 0x50, true),
    'requires GPS Time Type'
  ],
  [
    'non-finite GPS maximum',
    (_bytes: Uint8Array, view: DataView) => view.setFloat64(375, Number.NaN, true),
    'GPS time range'
  ],
  [
    'reversed GPS range',
    (_bytes: Uint8Array, view: DataView) => {
      view.setFloat64(375, 1, true);
      view.setFloat64(383, 2, true);
    },
    'GPS time range'
  ]
] as const)('TypeScript LAS 1.5 rejects %s', (_name, mutate, message) => {
  const source = createLAS15Header();
  mutate(new Uint8Array(source), new DataView(source));
  expect(() => parseLASHeader(source)).toThrow(message);
});

test('TypeScript LAS 1.5 accepts its boundary header and GPS metadata', () => {
  const source = createLAS15Header();
  const view = new DataView(source);
  view.setFloat64(375, 20, true);
  view.setFloat64(383, 10, true);
  const header = parseLASHeader(source);
  expect(header.versionAsString).toBe('1.5');
  expect(header.pointsFormatId).toBe(6);
  expect(header.metadata?.maxGpsTime).toBe(20);
  expect(header.metadata?.minGpsTime).toBe(10);
});

test('TypeScript LAS metadata tolerates truncated VLR and EVLR records', () => {
  const truncatedHeader = createLASFixture(0, false).slice(0, 390);
  const truncatedView = new DataView(truncatedHeader);
  truncatedView.setUint32(100, 1, true);
  expect(parseLASHeader(truncatedHeader).metadata).toBeUndefined();

  const truncatedPayload = createLASFixture(0, false).slice(0, 430);
  const payloadView = new DataView(truncatedPayload);
  payloadView.setUint32(100, 1, true);
  payloadView.setUint16(375 + 20, 1000, true);
  const truncatedPayloadMetadata = parseLASHeader(truncatedPayload).metadata;
  expect(truncatedPayloadMetadata).toBeDefined();
  expect(truncatedPayloadMetadata?.vlrCount).toBe(1);
  expect(truncatedPayloadMetadata?.vlrs).toEqual([]);

  const truncatedExtendedHeader = createLASFixture(0, false);
  const extendedHeaderView = new DataView(truncatedExtendedHeader);
  extendedHeaderView.setBigUint64(235, 430n, true);
  extendedHeaderView.setUint32(243, 1, true);
  const truncatedExtendedMetadata = parseLASHeader(truncatedExtendedHeader).metadata;
  expect(truncatedExtendedMetadata).toBeDefined();
  expect(truncatedExtendedMetadata?.evlrCount).toBe(1);
  expect(truncatedExtendedMetadata?.evlrs).toEqual([]);
});

test('TypeScript LAS resolves VLR and EVLR metadata families and GeoTIFF key values', () => {
  const geoKeyDirectory = new Uint16Array([
    1, 1, 0, 5, 1024, 0, 1, 4326, 2048, 34735, 2, 24, 2054, 34736, 1, 0, 3073, 34737, 5, 0, 4096,
    999, 1, 0, 7, 8
  ]);
  const geoDoubleParameters = new Float64Array([12.5]);
  const waveform = new Uint8Array(28);
  const waveformView = new DataView(waveform.buffer);
  waveform[2] = 16;
  waveform[3] = 2;
  waveformView.setUint32(4, 32, true);
  waveformView.setUint32(8, 4, true);
  waveformView.setFloat64(12, 1.5, true);
  waveformView.setFloat64(20, -2.5, true);

  const source = createLASMetadataFixture(
    [
      {userId: 'LASF_Spec', recordId: 100, data: waveform},
      {userId: 'LASF_Projection', recordId: 2111, data: encodeLASString('TRANSFORM')},
      {userId: 'LASF_Projection', recordId: 2112, data: encodeLASString('VLR_WKT')},
      {
        userId: 'LASF_Projection',
        recordId: 34735,
        data: new Uint8Array(geoKeyDirectory.buffer)
      },
      {
        userId: 'LASF_Projection',
        recordId: 34736,
        data: new Uint8Array(geoDoubleParameters.buffer)
      },
      {userId: 'LASF_Projection', recordId: 34737, data: encodeLASString('EPSG|')}
    ],
    [{userId: 'LASF_Projection', recordId: 2112, data: encodeLASString('EVLR_WKT')}]
  );
  const metadata = parseLASHeader(source).metadata!;

  expect(metadata.vlrs).toHaveLength(6);
  expect(metadata.evlrs).toHaveLength(1);
  expect(metadata.wktMathTransform).toBe('TRANSFORM');
  expect(metadata.wkt).toBe('EVLR_WKT');
  expect(metadata.waveformPacketDescriptors).toEqual([
    {
      recordId: 100,
      bitsPerSample: 16,
      compressionType: 2,
      numberOfSamples: 32,
      temporalSampleSpacing: 4,
      digitizerGain: 1.5,
      digitizerOffset: -2.5
    }
  ]);
  expect(metadata.geotiff?.keyDirectory?.entries.map(entry => entry.value)).toEqual([
    4326,
    [7, 8],
    12.5,
    'EPSG',
    undefined
  ]);
});

test('TypeScript LAS rejects truncated waveform metadata and ignores incomplete GeoKeys', () => {
  expect(() =>
    parseLASHeader(
      createLASMetadataFixture([{userId: 'LASF_Spec', recordId: 100, data: new Uint8Array(27)}])
    )
  ).toThrow('waveform descriptor VLR 100 is truncated');

  const keys = new Uint16Array([1, 1, 0, 2, 1024, 0, 1, 4326]);
  const metadata = parseLASHeader(
    createLASMetadataFixture([
      {userId: 'LASF_Projection', recordId: 34735, data: new Uint8Array(keys.buffer)}
    ])
  ).metadata;
  expect(metadata?.geotiff?.keys).toEqual(keys);
  expect(metadata?.geotiff?.keyDirectory).toBeUndefined();
});

/** Collects all batches from the TypeScript streaming parser. */
async function collectLASBatches(
  chunks: Iterable<ArrayBuffer | ArrayBufferView>
): Promise<MeshArrowTable[]> {
  const batches: MeshArrowTable[] = [];
  for await (const batch of parseLASInBatches(chunks)) {
    batches.push(batch);
  }
  return batches;
}

/** Create three deterministic uncompressed LAS records with two Extra Bytes. */
function createLASFixture(pointDataRecordFormat: number, highColor: boolean): ArrayBuffer {
  const headerLength = 375;
  const pointCount = 3;
  const baseRecordLength = POINT_FORMAT_LENGTHS[pointDataRecordFormat];
  const pointDataRecordLength = baseRecordLength + 2;
  const arrayBuffer = new ArrayBuffer(headerLength + pointCount * pointDataRecordLength);
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  bytes.set(new TextEncoder().encode('LASF'));
  bytes[24] = 1;
  bytes[25] = 4;
  view.setUint16(94, headerLength, true);
  view.setUint32(96, headerLength, true);
  view.setUint32(100, 0, true);
  bytes[104] = pointDataRecordFormat;
  view.setUint16(105, pointDataRecordLength, true);
  view.setUint32(107, pointCount, true);
  view.setBigUint64(247, BigInt(pointCount), true);
  view.setFloat64(131, 0.5, true);
  view.setFloat64(139, 2, true);
  view.setFloat64(147, 4, true);
  view.setFloat64(155, 10, true);
  view.setFloat64(163, 20, true);
  view.setFloat64(171, 30, true);

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const pointOffset = headerLength + pointIndex * pointDataRecordLength;
    view.setInt32(pointOffset, 1000 + pointIndex, true);
    view.setInt32(pointOffset + 4, -2000 + pointIndex, true);
    view.setInt32(pointOffset + 8, 50 + pointIndex, true);
    view.setUint16(pointOffset + 12, 200 + pointIndex * 17, true);
    if (pointDataRecordFormat <= 5) {
      bytes[pointOffset + 14] = 0xc9;
      bytes[pointOffset + 15] = 0xe3 + pointIndex;
      view.setInt8(pointOffset + 16, -5 + pointIndex);
      bytes[pointOffset + 17] = 30 + pointIndex;
      view.setUint16(pointOffset + 18, 400 + pointIndex, true);
    } else {
      bytes[pointOffset + 14] = 0x31;
      bytes[pointOffset + 15] = 0xf9;
      bytes[pointOffset + 16] = 20 + pointIndex;
      bytes[pointOffset + 17] = 30 + pointIndex;
      view.setInt16(pointOffset + 18, -500 + pointIndex, true);
      view.setUint16(pointOffset + 20, 400 + pointIndex, true);
    }

    if ([1, 3, 4, 5].includes(pointDataRecordFormat)) {
      view.setFloat64(pointOffset + 20, 1000.5 + pointIndex, true);
    } else if (pointDataRecordFormat >= 6) {
      view.setFloat64(pointOffset + 22, 1000.5 + pointIndex, true);
    }

    const colorOffset = getColorOffset(pointDataRecordFormat);
    if (colorOffset >= 0) {
      const multiplier = highColor ? 256 : 1;
      view.setUint16(pointOffset + colorOffset, (10 + pointIndex) * multiplier, true);
      view.setUint16(pointOffset + colorOffset + 2, (20 + pointIndex) * multiplier, true);
      view.setUint16(pointOffset + colorOffset + 4, (30 + pointIndex) * multiplier, true);
    }
    if (pointDataRecordFormat === 8 || pointDataRecordFormat === 10) {
      view.setUint16(pointOffset + 36, 900 + pointIndex, true);
    }
    const waveformOffset = getWaveformOffset(pointDataRecordFormat);
    if (waveformOffset >= 0) {
      for (let index = 0; index < 29; index++) {
        bytes[pointOffset + waveformOffset + index] = pointIndex * 29 + index;
      }
    }
    bytes[pointOffset + baseRecordLength] = pointIndex;
    bytes[pointOffset + baseRecordLength + 1] = 255 - pointIndex;
  }
  return arrayBuffer;
}

/** Creates a valid empty LAS 1.5 header for mutation-based validation tests. */
function createLAS15Header(): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(393);
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  bytes.set(new TextEncoder().encode('LASF'));
  bytes[24] = 1;
  bytes[25] = 5;
  view.setUint16(6, 0x11, true);
  view.setUint16(94, 393, true);
  view.setUint32(96, 393, true);
  bytes[104] = 6;
  view.setUint16(105, POINT_FORMAT_LENGTHS[6], true);
  return arrayBuffer;
}

type TestLASMetadataRecord = {userId: string; recordId: number; data: Uint8Array};

/** Creates an empty LAS 1.4 file containing caller-selected VLR and EVLR metadata records. */
function createLASMetadataFixture(
  vlrs: TestLASMetadataRecord[],
  evlrs: TestLASMetadataRecord[] = []
): ArrayBuffer {
  const headerLength = 375;
  const vlrByteLength = vlrs.reduce((sum, record) => sum + 54 + record.data.byteLength, 0);
  const pointDataOffset = headerLength + vlrByteLength;
  const evlrByteLength = evlrs.reduce((sum, record) => sum + 60 + record.data.byteLength, 0);
  const arrayBuffer = new ArrayBuffer(pointDataOffset + evlrByteLength);
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  bytes.set(new TextEncoder().encode('LASF'));
  bytes[24] = 1;
  bytes[25] = 4;
  view.setUint16(94, headerLength, true);
  view.setUint32(96, pointDataOffset, true);
  view.setUint32(100, vlrs.length, true);
  bytes[104] = 6;
  view.setUint16(105, POINT_FORMAT_LENGTHS[6], true);
  view.setBigUint64(235, evlrs.length ? BigInt(pointDataOffset) : 0n, true);
  view.setUint32(243, evlrs.length, true);

  let byteOffset = headerLength;
  for (const record of vlrs) {
    writeLASMetadataRecord(bytes, view, byteOffset, record, false);
    byteOffset += 54 + record.data.byteLength;
  }
  for (const record of evlrs) {
    writeLASMetadataRecord(bytes, view, byteOffset, record, true);
    byteOffset += 60 + record.data.byteLength;
  }
  return arrayBuffer;
}

/** Writes one LAS metadata record header and payload. */
function writeLASMetadataRecord(
  bytes: Uint8Array,
  view: DataView,
  byteOffset: number,
  record: TestLASMetadataRecord,
  extended: boolean
): void {
  bytes.set(new TextEncoder().encode(record.userId), byteOffset + 2);
  view.setUint16(byteOffset + 18, record.recordId, true);
  if (extended) {
    view.setBigUint64(byteOffset + 20, BigInt(record.data.byteLength), true);
    bytes.set(record.data, byteOffset + 60);
  } else {
    view.setUint16(byteOffset + 20, record.data.byteLength, true);
    bytes.set(record.data, byteOffset + 54);
  }
}

/** Encodes one null-terminated LAS metadata string. */
function encodeLASString(value: string): Uint8Array {
  return new TextEncoder().encode(`${value}\0`);
}

/** Return the RGB field offset for a LAS point format. */
function getColorOffset(pointDataRecordFormat: number): number {
  if (pointDataRecordFormat === 2) return 20;
  if (pointDataRecordFormat === 3 || pointDataRecordFormat === 5) return 28;
  if ([7, 8, 10].includes(pointDataRecordFormat)) return 30;
  return -1;
}

/** Return the waveform packet-reference offset for a LAS point format. */
function getWaveformOffset(pointDataRecordFormat: number): number {
  if (pointDataRecordFormat === 4) return 28;
  if (pointDataRecordFormat === 5) return 34;
  if (pointDataRecordFormat === 9) return 30;
  if (pointDataRecordFormat === 10) return 38;
  return -1;
}
