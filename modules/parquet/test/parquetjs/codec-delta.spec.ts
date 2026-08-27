// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { expect, test } from "vitest";
import { PARQUET_CODECS } from '@loaders.gl/parquet/parquetjs/codecs';
/** Creates an exact byte vector for concise codec fixtures. */
function bytes(values: number[]): Uint8Array {
    return new Uint8Array(values);
}
/** Encodes one non-negative base-128 variable-length integer. */
function encodeUnsignedVariableInteger(value: bigint): number[] {
    const output: number[] = [];
    let remainingValue = value;
    do {
        const byte = Number(remainingValue & 0x7fn);
        remainingValue >>= 7n;
        output.push(remainingValue === 0n ? byte : byte | 0x80);
    } while (remainingValue !== 0n);
    return output;
}
/** Encodes one signed zig-zag base-128 variable-length integer. */
function encodeZigZagVariableInteger(value: bigint): number[] {
    const zigZagValue = value >= 0n ? value * 2n : -value * 2n - 1n;
    return encodeUnsignedVariableInteger(zigZagValue);
}
/** Packs one padded DELTA_BINARY_PACKED mini-block little-endian within each byte. */
function encodePackedMiniBlock(values: bigint[], bitWidth: number): number[] {
    const output: number[] = [];
    const mask = bitWidth === 0 ? 0n : (1n << BigInt(bitWidth)) - 1n;
    let packedBits = 0n;
    let packedBitCount = 0;
    for (let valueIndex = 0; valueIndex < 32; valueIndex++) {
        const value = values[valueIndex] || 0n;
        if (value < 0n || value > mask) {
            throw new Error(`Packed test value ${value} exceeds bit width ${bitWidth}`);
        }
        packedBits |= value << BigInt(packedBitCount);
        packedBitCount += bitWidth;
        while (packedBitCount >= 8) {
            output.push(Number(packedBits & 0xffn));
            packedBits >>= 8n;
            packedBitCount -= 8;
        }
    }
    return output;
}
/** Creates a single-block DELTA_BINARY_PACKED test vector with four 32-value mini-blocks. */
function createDeltaBinaryPackedFixture(firstValue: bigint, minimumDelta: bigint, packedDeltas: bigint[], bitWidth: number): Uint8Array {
    return bytes([
        ...encodeUnsignedVariableInteger(128n),
        ...encodeUnsignedVariableInteger(4n),
        ...encodeUnsignedVariableInteger(BigInt(packedDeltas.length + 1)),
        ...encodeZigZagVariableInteger(firstValue),
        ...encodeZigZagVariableInteger(minimumDelta),
        bitWidth,
        0,
        0,
        0,
        ...encodePackedMiniBlock(packedDeltas, bitWidth)
    ]);
}
test('ParquetCodec::DELTA_BINARY_PACKED#decodes constant deltas', () => {
    const cursor = {
        buffer: bytes([0x80, 0x01, 0x04, 0x03, 0x02, 0x02, 0x00, 0x00, 0x00, 0x00]),
        offset: 0
    };
    expect(PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues('INT32', cursor, 3, {})).toEqual([
        1, 2, 3
    ]);
    expect(cursor.offset, 'consumes the encoded block').toBe(cursor.buffer.length);
});
test('ParquetCodec::DELTA_BINARY_PACKED#decodes INT32 values with wrapping semantics', () => {
    const buffer = createDeltaBinaryPackedFixture(2147483647n, 0n, [1n, 0xffffffffn], 32);
    const cursor = { buffer, offset: 0 };
    expect(PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues('INT32', cursor, 3, {})).toEqual([
        2147483647, -2147483648, 2147483647
    ]);
    expect(cursor.offset, 'consumes the padded INT32 mini-block').toBe(cursor.buffer.length);
});
test('ParquetCodec::DELTA_BINARY_PACKED#decodes exact-number INT64 packed values', () => {
    const largestPackedDelta = (1n << 45n) - 1n;
    const buffer = createDeltaBinaryPackedFixture(0n, -1n, [largestPackedDelta, 7n], 45);
    const cursor = { buffer, offset: 0 };
    expect(PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues('INT64', cursor, 3, {})).toEqual([
        0, Number(largestPackedDelta - 1n), Number(largestPackedDelta + 5n)
    ]);
    expect(cursor.offset, 'consumes the padded number-reservoir mini-block').toBe(cursor.buffer.length);
});
test('ParquetCodec::DELTA_BINARY_PACKED#decodes wide INT64 packed values', () => {
    const largestPackedDelta = (1n << 64n) - 1n;
    const buffer = createDeltaBinaryPackedFixture(0n, 0n, [largestPackedDelta, 1n], 64);
    const cursor = { buffer, offset: 0 };
    expect(PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues('INT64', cursor, 3, {})).toEqual([
        0, -1, 0
    ]);
    expect(cursor.offset, 'consumes the padded BigInt-reservoir mini-block').toBe(cursor.buffer.length);
});
test('ParquetCodec::DELTA_BINARY_PACKED#validates physical integer bit widths', () => {
    /** Creates a DELTA_BINARY_PACKED block that declares one invalid mini-block width. */
    const createInvalidWidthFixture = (bitWidth: number): Uint8Array => bytes([0x80, 0x01, 0x04, 0x02, 0x00, 0x00, bitWidth, 0x00, 0x00, 0x00]);
    expect(() => PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues('INT32', { buffer: createInvalidWidthFixture(33), offset: 0 }, 2, {})).toThrow(/Invalid DELTA_BINARY_PACKED bit width/);
    expect(() => PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues('INT64', { buffer: createInvalidWidthFixture(65), offset: 0 }, 2, {})).toThrow(/Invalid DELTA_BINARY_PACKED bit width/);
});
test('ParquetCodec::DELTA_LENGTH_BYTE_ARRAY#decodes lengths and payloads', () => {
    const cursor = {
        buffer: bytes([
            0x80,
            0x01,
            0x04,
            0x02,
            0x02,
            0x02,
            0x00,
            0x00,
            0x00,
            0x00,
            0x61,
            0x62,
            0x63
        ]),
        offset: 0
    };
    const values = PARQUET_CODECS.DELTA_LENGTH_BYTE_ARRAY.decodeValues('BYTE_ARRAY', cursor, 2, {});
    expect(values.map(value => Array.from(value))).toEqual([[0x61], [0x62, 0x63]]);
    expect(cursor.offset, 'consumes lengths and payloads').toBe(cursor.buffer.length);
});
test('ParquetCodec::DELTA_BYTE_ARRAY#reconstructs shared prefixes', () => {
    const prefixLengths = [
        0x80, 0x01, 0x04, 0x02, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00
    ];
    const suffixLengths = [
        0x80, 0x01, 0x04, 0x02, 0x06, 0x03, 0x00, 0x00, 0x00, 0x00
    ];
    const cursor = {
        buffer: bytes([...prefixLengths, ...suffixLengths, 0x61, 0x62, 0x63, 0x64]),
        offset: 0
    };
    const values = PARQUET_CODECS.DELTA_BYTE_ARRAY.decodeValues('BYTE_ARRAY', cursor, 2, {});
    expect(values.map(value => Array.from(value))).toEqual([
        [0x61, 0x62, 0x63],
        [0x61, 0x62, 0x64]
    ]);
    expect(cursor.offset, 'consumes prefixes, suffixes, and payloads').toBe(cursor.buffer.length);
});
test('ParquetCodec::DELTA_BINARY_PACKED#rejects truncated data', () => {
    expect(() => PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues('INT32', { buffer: bytes([0x80]), offset: 0 }, 1, {})).toThrow(/Unexpected end/);
});
