// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parseLAS, parseLASInBatches} from '../src/lib/typescript/parse-las';

/** A LASzip item stored in the validation fixture's VLR. */
type ValidationItem = {
  /** LASzip codec item identifier. */
  type: number;
  /** Uncompressed bytes contributed by this item. */
  size: number;
  /** Codec version. */
  version: number;
};

const RECORD_LENGTHS = [20, 28, 26, 34, 57, 63, 30, 36, 38, 59, 67];
const ITEM_LAYOUTS = [
  [[6, 20]],
  [
    [6, 20],
    [7, 8]
  ],
  [
    [6, 20],
    [8, 6]
  ],
  [
    [6, 20],
    [7, 8],
    [8, 6]
  ],
  [
    [6, 20],
    [7, 8],
    [9, 29]
  ],
  [
    [6, 20],
    [7, 8],
    [8, 6],
    [9, 29]
  ],
  [[10, 30]],
  [
    [10, 30],
    [11, 6]
  ],
  [
    [10, 30],
    [12, 8]
  ],
  [
    [10, 30],
    [13, 29]
  ],
  [
    [10, 30],
    [12, 8],
    [13, 29]
  ]
];

/** Constructs an empty compressed LAS file; no encoder or external fixture is involved. */
function createValidationFile(format = 7, items?: ValidationItem[]): ArrayBuffer {
  const descriptors =
    items ??
    ITEM_LAYOUTS[format].map(([type, size]) => ({
      type,
      size,
      version: type === 9 ? 1 : type <= 8 ? 2 : 3
    }));
  const recordLength = 34 + descriptors.length * 6;
  const pointOffset = 375 + 54 + recordLength;
  const bytes = new Uint8Array(pointOffset + 16);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode('LASF'));
  bytes[24] = 1;
  bytes[25] = 4;
  view.setUint16(94, 375, true);
  view.setUint32(96, pointOffset, true);
  view.setUint32(100, 1, true);
  bytes[104] = format | 0x80;
  view.setUint16(105, RECORD_LENGTHS[format], true);
  for (const offset of [131, 139, 147]) view.setFloat64(offset, 1, true);
  bytes.set(new TextEncoder().encode('laszip encoded'), 377);
  view.setUint16(393, 22204, true);
  view.setUint16(395, recordLength, true);
  view.setUint16(429, format <= 5 ? 2 : 3, true);
  view.setUint32(441, 50000, true);
  view.setUint16(461, descriptors.length, true);
  descriptors.forEach((item, index) => {
    view.setUint16(463 + index * 6, item.type, true);
    view.setUint16(465 + index * 6, item.size, true);
    view.setUint16(467 + index * 6, item.version, true);
  });
  view.setBigInt64(pointOffset, BigInt(pointOffset + 8), true);
  return bytes.buffer;
}

test.each(
  RECORD_LENGTHS.map((_, format) => format)
)('LASzip validates record layouts for PDRF %i before decoding', format => {
  const valid = createValidationFile(format);
  expect(parseLAS(valid).data.numRows).toBe(0);
  const tooShort = valid.slice(0);
  new DataView(tooShort).setUint16(105, RECORD_LENGTHS[format] - 1, true);
  expect(() => parseLAS(tooShort)).toThrow('record length');
  const wrongSize = valid.slice(0);
  new DataView(wrongSize).setUint16(465, 1, true);
  expect(() => parseLAS(wrongSize)).toThrow('has size 1');
  const wrongType = valid.slice(0);
  new DataView(wrongType).setUint16(463, 99, true);
  expect(() => parseLAS(wrongType)).toThrow('has type 99');
  const missingItem = valid.slice(0);
  new DataView(missingItem).setUint16(461, 0, true);
  expect(() => parseLAS(missingItem)).toThrow('has 0 LASzip items');
});

test.each([
  [0, 6, 3, 'legacy LASzip'],
  [0, 0, 0, 'legacy LASzip'],
  [4, 9, 2, 'WavePacket13'],
  [7, 10, 1, 'LAS 1.4'],
  [7, 11, 5, 'LAS 1.4'],
  [8, 12, 0, 'LAS 1.4'],
  [9, 13, 2, 'WavePacket14'],
  [7, 14, 1, 'LAS 1.4']
])('LASzip rejects PDRF %i item %i version %i', (format, type, version, message) => {
  const source = createValidationFile(format, [
    {type: Number(type), size: 30, version: Number(version)}
  ]);
  expect(() => parseLAS(source)).toThrow(String(message));
});

test.each([
  [0, 429, 3, 'compressor 1 or 2'],
  [7, 429, 2, 'compressor 3'],
  [7, 431, 1, 'arithmetic coder 0'],
  [7, 395, 33, 'malformed LASzip VLR'],
  [7, 461, 10, 'malformed LASzip VLR item table'],
  [7, 393, 0, 'does not contain a LASzip VLR']
])('LASzip reports malformed metadata at byte %i/%i', (format, offset, value, message) => {
  const source = createValidationFile(Number(format));
  new DataView(source).setUint16(Number(offset), Number(value), true);
  expect(() => parseLAS(source)).toThrow(String(message));
});

test.each([
  -2n,
  0x20000000000000n,
  1000000n
])('LAZ rejects out-of-file chunk table pointer %s', pointer => {
  const source = createValidationFile();
  const view = new DataView(source);
  view.setBigInt64(view.getUint32(96, true), pointer, true);
  expect(() => parseLAS(source)).toThrow('incomplete LAZ chunk table');
});

test('LAZ validates chunk table versions, missing entries, and interrupted writers', () => {
  const source = createValidationFile();
  const view = new DataView(source);
  const pointOffset = view.getUint32(96, true);
  view.setUint32(pointOffset + 8, 5, true);
  expect(() => parseLAS(source)).toThrow('chunk table version 5');
  view.setUint32(pointOffset + 8, 0, true);
  view.setBigUint64(247, 1n, true);
  expect(() => parseLAS(source)).toThrow('missing LAZ chunk table');
  view.setBigInt64(pointOffset, BigInt(pointOffset), true);
  view.setUint32(441, 0, true);
  expect(() => parseLAS(source, {las: {recoverMissingChunkTable: true}})).toThrow('variable-size');
  view.setUint32(441, 1, true);
  expect(() => parseLAS(source, {las: {recoverMissingChunkTable: true}})).toThrow(
    'truncated recovered layered LAZ chunk header'
  );
});

test('LAZ streaming rejects an incomplete header and VLR prefix with fragmented input', async () => {
  const source = new Uint8Array(createValidationFile());
  const iterator = parseLASInBatches([source.subarray(0, 376), source.subarray(376, 440)], {});
  await expect(iterator[Symbol.asyncIterator]().next()).rejects.toThrow('incomplete LAS header');
});
