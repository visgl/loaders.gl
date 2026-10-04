// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {I3SLEPCCDecoder} from '../src/i3s-lepcc';

/** Packs small unsigned values using LEPCC's least-significant-bit-first simple encoding. */
function encodeValues(values: number[], bits: number, countWidth: 1 | 2 | 4 = 1): number[] {
  const countCode = countWidth === 1 ? 2 : countWidth === 2 ? 1 : 0;
  const bytes = new Uint8Array(1 + countWidth + Math.ceil((values.length * bits) / 8));
  bytes[0] = (countCode << 6) | bits;
  for (let index = 0; index < countWidth; index++) {
    bytes[index + 1] = (values.length >>> (index * 8)) & 255;
  }
  let bitOffset = 0;
  for (const value of values) {
    for (let bitIndex = 0; bitIndex < bits; bitIndex++, bitOffset++) {
      bytes[1 + countWidth + Math.floor(bitOffset / 8)] |=
        ((value >>> bitIndex) & 1) << (bitOffset % 8);
    }
  }
  return Array.from(bytes);
}

/** Builds a standalone LEPCC blob with a deliberately unchecked checksum for wire-boundary tests. */
function createBlob(magic: string, payload: number[]): Uint8Array {
  const bytes = new Uint8Array(24 + payload.length);
  bytes.set(new TextEncoder().encode(magic));
  const view = new DataView(bytes.buffer);
  view.setUint16(10, 1, true);
  view.setBigUint64(16, BigInt(bytes.length), true);
  bytes.set(payload, 24);
  return bytes;
}

/** Encodes little-endian unsigned words without sharing decoder implementation. */
function encodeWords(values: number[]): number[] {
  const bytes = new Uint8Array(values.length * 4);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => view.setUint32(index * 4, value, true));
  return Array.from(bytes);
}

/** Encodes the fixed-width LEPCC attribute header. */
function createAttributeBlob(
  magic: string,
  pointCount: number,
  fields: number[],
  values: number[]
) {
  return createBlob(magic, [...encodeWords([pointCount]), ...fields, ...values]);
}

/** Encodes a two-symbol Huffman table with explicit codes 0 and 1 and padded word storage. */
function encodeHuffman(
  valueWord: number,
  overrides: {tableSize?: number; lengths?: number[]} = {}
) {
  return [
    ...encodeWords([2, overrides.tableSize ?? 2, 0, 2]),
    ...encodeValues(overrides.lengths ?? [1, 1], 6),
    ...encodeWords([0x40000000, valueWord, 0])
  ];
}

/** Creates a one-row XYZ blob with explicit lower bounds, maximum errors and delta segments. */
function createXyzBlob(
  yDelta: number[],
  pointsPerRow: number[],
  xDelta: number[],
  zValues: number[]
) {
  const fixedHeader = new Uint8Array(80);
  const view = new DataView(fixedHeader.buffer);
  [10, 20, 30, 13, 24, 35, 1, 1, 1].forEach((value, index) =>
    view.setFloat64(index * 8, value, true)
  );
  view.setUint32(72, 2, true);
  const sections = [yDelta, pointsPerRow, xDelta, zValues].flatMap(values => [
    ...encodeValues([0], 0),
    ...encodeValues(values, 3)
  ]);
  return createBlob('LEPCC     ', [...fixedHeader, ...sections]);
}

const DECODER = new I3SLEPCCDecoder({verifyChecksum: false});

describe('LEPCC small wire-format boundaries', () => {
  test.each([
    1, 2, 4
  ] as const)('decodes packed intensity with a %s-byte count and scale factor', countWidth => {
    const bytes = createAttributeBlob(
      'Intensity ',
      3,
      [5, 0, 3, 0],
      encodeValues([0, 3, 7], 3, countWidth)
    );
    expect(Array.from(DECODER.decode(bytes))).toEqual([0, 15, 35]);
  });

  test('decodes zero-bit, byte and full-width intensity values', () => {
    const zero = createAttributeBlob('Intensity ', 2, [3, 0, 0, 0], encodeValues([0, 0], 0));
    const byte = createAttributeBlob('Intensity ', 2, [3, 0, 8, 0], [4, 9]);
    const fullWidth = createAttributeBlob('Intensity ', 2, [1, 0, 16, 0], [0x34, 0x12, 0xff, 0xff]);
    expect(Array.from(DECODER.decode(zero))).toEqual([0, 0]);
    expect(Array.from(DECODER.decode(byte))).toEqual([12, 27]);
    expect(Array.from(DECODER.decode(fullWidth))).toEqual([0x1234, 65535]);
  });

  test('decodes raw, indexed, constant and Huffman RGB colors', () => {
    const colorMap = [10, 20, 30, 40, 50, 60];
    const raw = createAttributeBlob('ClusterRGB', 2, [0, 0, 0, 0], colorMap);
    const indexed = createAttributeBlob('ClusterRGB', 3, [2, 0, 1, 0], [...colorMap, 1, 0, 1]);
    const constant = createAttributeBlob('ClusterRGB', 2, [1, 0, 2, 1], colorMap.slice(0, 3));
    const huffman = createAttributeBlob(
      'ClusterRGB',
      3,
      [2, 0, 1, 2],
      [...colorMap, ...encodeHuffman(0x40000000)]
    );
    expect(Array.from(DECODER.decode(raw))).toEqual(colorMap);
    expect(Array.from(DECODER.decode(indexed))).toEqual([40, 50, 60, 10, 20, 30, 40, 50, 60]);
    expect(Array.from(DECODER.decode(constant))).toEqual([10, 20, 30, 10, 20, 30]);
    expect(Array.from(DECODER.decode(huffman))).toEqual([10, 20, 30, 40, 50, 60, 10, 20, 30]);
  });

  test('adds the flag minimum to simple and Huffman values', () => {
    const simple = createAttributeBlob('FlagBytes ', 3, [0, 4, 0, 0], encodeValues([0, 1, 3], 2));
    const huffman = createAttributeBlob('FlagBytes ', 3, [1, 4, 0, 0], encodeHuffman(0x40000000));
    expect(Array.from(DECODER.decode(simple))).toEqual([4, 5, 7]);
    expect(Array.from(DECODER.decode(huffman))).toEqual([4, 5, 4]);
  });

  test('accumulates XYZ deltas and clamps reconstructed coordinates to the extent', () => {
    const bytes = createXyzBlob([1], [2], [1, 1], [1, 7]);
    expect(Array.from(DECODER.decode(bytes))).toEqual([12, 22, 32, 13, 22, 35]);
    verifySubviewDecode(bytes);
  });

  test.each([
    [[1], [1], [1, 1], [1, 1], 'row count'],
    [[1, 1], [2], [1, 1], [1, 1], 'inconsistent lengths'],
    [[1], [2], [1], [1, 1], 'inconsistent lengths'],
    [[1], [2], [1, 1], [1], 'inconsistent lengths']
  ])('rejects inconsistent XYZ segment lengths %j/%j/%j/%j', (yDelta, rows, xDelta, heights, message) => {
    expect(() =>
      DECODER.decode(
        createXyzBlob(yDelta as number[], rows as number[], xDelta as number[], heights as number[])
      )
    ).toThrow(message as string);
  });

  test.each([
    ['lookup method', [1, 0, 0, 0], [10, 20, 30, 0]],
    ['compression method', [1, 0, 1, 3], [10, 20, 30]],
    ['outside the color map', [1, 0, 1, 0], [10, 20, 30, 1]],
    ['Huffman color index', [1, 0, 1, 2], [10, 20, 30, ...encodeHuffman(0x80000000)]]
  ])('rejects RGB %s violations', (message, fields, values) => {
    expect(() => DECODER.decode(createAttributeBlob('ClusterRGB', 1, fields, values))).toThrow(
      message
    );
  });

  test('rejects invalid attribute headers, unsupported packing and mismatched counts', () => {
    for (const fields of [
      [0, 0, 8, 0],
      [1, 0, 17, 0]
    ]) {
      expect(() => DECODER.decode(createAttributeBlob('Intensity ', 1, fields, [0]))).toThrow(
        'Invalid LEPCC intensity header'
      );
    }
    expect(() =>
      DECODER.decode(createAttributeBlob('Intensity ', 2, [1, 0, 3, 0], encodeValues([1], 3)))
    ).toThrow('value count');
    expect(() =>
      DECODER.decode(createAttributeBlob('FlagBytes ', 2, [0, 0, 0, 0], encodeValues([1], 1)))
    ).toThrow('value count');
    expect(() =>
      DECODER.decode(createAttributeBlob('Intensity ', 1, [1, 0, 1, 0], [0xc1]))
    ).toThrow('element width');
    expect(() =>
      DECODER.decode(createAttributeBlob('Intensity ', 1, [1, 0, 1, 0], [0xa1, 1]))
    ).toThrow('lookup-table bit stuffing');
  });

  test('rejects invalid Huffman tables before attempting values', () => {
    for (const words of [
      [1, 2, 0, 2],
      [2, 0, 0, 2],
      [2, 32769, 0, 2],
      [2, 2, 2, 2]
    ]) {
      expect(() =>
        DECODER.decode(createAttributeBlob('FlagBytes ', 1, [1, 0, 0, 0], encodeWords(words)))
      ).toThrow('Invalid LEPCC Huffman code table');
    }
    expect(() =>
      DECODER.decode(
        createAttributeBlob(
          'FlagBytes ',
          1,
          [1, 0, 0, 0],
          [...encodeWords([2, 2, 0, 2]), ...encodeValues([1], 1)]
        )
      )
    ).toThrow('table length mismatch');
    expect(() =>
      DECODER.decode(
        createAttributeBlob('FlagBytes ', 1, [1, 0, 0, 0], encodeHuffman(0, {lengths: [33, 1]}))
      )
    ).toThrow('code is too long');
    expect(() =>
      DECODER.decode(
        createAttributeBlob('FlagBytes ', 1, [1, 0, 0, 0], encodeHuffman(0, {lengths: [0, 1]}))
      )
    ).toThrow('fewer than two symbols');
  });

  test('validates magic, version, declared size, checksum and exact consumption', () => {
    expect(() => DECODER.getBlobType(new Uint8Array(9))).toThrow('Truncated LEPCC blob header');
    expect(() => DECODER.decode(new TextEncoder().encode('Unknown   '))).toThrow(
      'Unsupported LEPCC blob magic'
    );
    const valid = createAttributeBlob('Intensity ', 1, [1, 0, 8, 0], [7]);
    expect(() => DECODER.decodeRgb(valid)).toThrow('Unexpected LEPCC blob type');
    expect(() => new I3SLEPCCDecoder().decode(valid)).toThrow('checksum mismatch');
    const version = valid.slice();
    new DataView(version.buffer).setUint16(10, 2, true);
    expect(() => DECODER.decode(version)).toThrow('Unsupported LEPCC version');
    for (const size of [31n, 34n, 9007199254740992n]) {
      const bytes = valid.slice();
      new DataView(bytes.buffer).setBigUint64(16, size, true);
      expect(() => DECODER.decode(bytes)).toThrow(
        size > BigInt(Number.MAX_SAFE_INTEGER) ? 'safe integer range' : 'Invalid LEPCC blob size'
      );
    }
    const truncated = valid.slice(0, 32);
    new DataView(truncated.buffer).setBigUint64(16, 32n, true);
    expect(() => DECODER.decode(truncated)).toThrow('Truncated LEPCC blob');
    const trailing = createAttributeBlob('Intensity ', 1, [1, 0, 8, 0], [7, 9]);
    expect(() => DECODER.decode(trailing)).toThrow('consumed 33 bytes, expected 34');
  });
});

/** Verifies that a non-zero byte offset is honored by the floating-point reader. */
function verifySubviewDecode(bytes: Uint8Array): void {
  const backing = new Uint8Array(bytes.length + 7);
  backing.set(bytes, 7);
  expect(DECODER.decode(backing.subarray(7))).toEqual(DECODER.decode(bytes));
}
