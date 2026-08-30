// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { expect, test } from "vitest";
import { PARQUET_CODECS } from '@loaders.gl/parquet/parquetjs/codecs';
function bytes(values: number[]): Uint8Array {
    return new Uint8Array(values);
}
/** Encodes one eight-value bit-packed run for cross-width decoder tests. */
function encodeBitPackedRun(values: number[], bitWidth: number): Uint8Array {
    const encoded = [0x03];
    let packedBits = 0n;
    let packedBitCount = 0;
    for (const value of values) {
        packedBits |= BigInt(value) << BigInt(packedBitCount);
        packedBitCount += bitWidth;
        while (packedBitCount >= 8) {
            encoded.push(Number(packedBits & 0xffn));
            packedBits >>= 8n;
            packedBitCount -= 8;
        }
    }
    return bytes(encoded);
}
test('ParquetCodec::RLE#should encode bitpacked values', () => {
    const buf = PARQUET_CODECS.RLE.encodeValues('INT32', [0, 1, 2, 3, 4, 5, 6, 7], {
        disableEnvelope: true,
        bitWidth: 3
    });
    expect(buf).toEqual(bytes([0x03, 0x88, 0xc6, 0xfa]));
});
test('ParquetCodec::RLE#should decode bitpacked values', () => {
    const vals = PARQUET_CODECS.RLE.decodeValues('INT32', {
        buffer: bytes([0x03, 0x88, 0xc6, 0xfa]),
        offset: 0,
    }, 8, {
        disableEnvelope: true,
        bitWidth: 3
    });
    expect(vals).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
});
// test('number of values not a multiple of 8', () => {
test('ParquetCodec::RLE#should encode bitpacked values', () => {
    const buf = PARQUET_CODECS.RLE.encodeValues('INT32', [0, 1, 2, 3, 4, 5, 6, 7, 6, 5], {
        disableEnvelope: true,
        bitWidth: 3
    });
    expect(buf).toEqual(bytes([0x05, 0x88, 0xc6, 0xfa, 0x2e, 0x00, 0x00]));
});
test('ParquetCodec::RLE#should decode bitpacked values', () => {
    const cursor = {
        buffer: bytes([0x05, 0x88, 0xc6, 0xfa, 0x2e, 0x00, 0x00]),
        offset: 0
    };
    const vals = PARQUET_CODECS.RLE.decodeValues('INT32', cursor, 10, {
        disableEnvelope: true,
        bitWidth: 3
    });
    expect(vals).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 6, 5]);
    expect(cursor.offset, 'consumes padding from the complete run').toBe(cursor.buffer.length);
});
test('ParquetCodec::RLE#decodes wide bitpacked values', () => {
    const vals = PARQUET_CODECS.RLE.decodeValues('INT32', {
        buffer: bytes([0x03, 0xbc, 0x3a, 0x12, 0xff, 0x0f, 0x00, 0x01, 0x20, 0x00, 0x03, 0x40, 0x00]),
        offset: 0
    }, 8, {
        disableEnvelope: true,
        bitWidth: 12
    });
    expect(vals).toEqual([0xabc, 0x123, 0xfff, 0, 1, 2, 3, 4]);
});
test('ParquetCodec::RLE#decodes every reservoir width', () => {
    for (const bitWidth of [0, 1, 7, 8, 9, 16, 24, 25, 32, 45, 46, 53, 64]) {
        const divisor = bitWidth === 0 ? 1 : 2 ** Math.min(bitWidth, 52);
        const values = [0, 1, 2, 3, 7, 15, 31, divisor - 1].map(value => value % divisor);
        const decoded = PARQUET_CODECS.RLE.decodeValues('INT64', { buffer: encodeBitPackedRun(values, bitWidth), offset: 0 }, values.length, { disableEnvelope: true, bitWidth });
        expect(decoded, `decodes bit width ${bitWidth}`).toEqual(values);
    }
});
test('ParquetCodec::RLE#should encode repeated values', () => {
    const buf = PARQUET_CODECS.RLE.encodeValues('INT32', [42, 42, 42, 42, 42, 42, 42, 42], {
        disableEnvelope: true,
        bitWidth: 6
    });
    expect(buf).toEqual(bytes([0x10, 0x2a]));
});
test('ParquetCodec::RLE#should decode repeated values', () => {
    const vals = PARQUET_CODECS.RLE.decodeValues('INT32', {
        buffer: bytes([0x10, 0x2a]),
        offset: 0,
    }, 8, {
        disableEnvelope: true,
        bitWidth: 3
    });
    expect(vals).toEqual([42, 42, 42, 42, 42, 42, 42, 42]);
});
test('ParquetCodec::RLE#decodes multi-byte repeated values as little endian', () => {
    const vals = PARQUET_CODECS.RLE.decodeValues('INT32', {
        buffer: bytes([0x10, 0xbc, 0x0a]),
        offset: 0
    }, 8, {
        disableEnvelope: true,
        bitWidth: 12
    });
    expect(vals).toEqual(new Array(8).fill(0xabc));
});
test('ParquetCodec::RLE#zero-fills malformed dictionary runs', () => {
    expect(PARQUET_CODECS.RLE.decodeValues('INT32', { buffer: bytes([0x03, 0x88]), offset: 0 }, 8, { disableEnvelope: true, bitWidth: 3 }), 'preserves compatibility with legacy files that omit trailing dictionary bytes').toEqual([0, 1, 2, 0, 0, 0, 0, 0]);
});
test('ParquetCodec::RLE#should encode mixed runs', () => {
    const buf = PARQUET_CODECS.RLE.encodeValues('INT32', [0, 1, 2, 3, 4, 5, 6, 7, 4, 4, 4, 4, 4, 4, 4, 4, 0, 1, 2, 3, 4, 5, 6, 7], {
        disableEnvelope: true,
        bitWidth: 3
    });
    expect(buf).toEqual(bytes([0x03, 0x88, 0xc6, 0xfa, 0x10, 0x04, 0x03, 0x88, 0xc6, 0xfa]));
});
test('ParquetCodec::RLE#should decode mixed runs', () => {
    const vals = PARQUET_CODECS.RLE.decodeValues('INT32', {
        buffer: bytes([0x03, 0x88, 0xc6, 0xfa, 0x10, 0x04, 0x03, 0x88, 0xc6, 0xfa]),
        offset: 0,
    }, 24, {
        disableEnvelope: true,
        bitWidth: 3
    });
    expect(vals).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 4, 4, 4, 4, 4, 4, 4, 4, 0, 1, 2, 3, 4, 5, 6, 7]);
});

test('ParquetCodec::RLE#covers envelopes, booleans, empty values, and wide repeats', () => {
    expect(PARQUET_CODECS.RLE.encodeValues('BOOLEAN', [], { bitWidth: 1 })).toEqual(bytes([0, 0, 0, 0]));
    const encoded = PARQUET_CODECS.RLE.encodeValues('BOOLEAN', [1, 0, 1, 0, 1, 0, 1, 0], { bitWidth: 1 });
    expect(PARQUET_CODECS.RLE.decodeValues('BOOLEAN', { buffer: encoded, offset: 0 }, 8, { bitWidth: 1 })).toEqual([1, 0, 1, 0, 1, 0, 1, 0]);

    const repeated64 = bytes([0x10, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01]);
    expect(PARQUET_CODECS.RLE.decodeValues('INT64', { buffer: repeated64, offset: 0 }, 8, { disableEnvelope: true, bitWidth: 56 })).toEqual(new Array(8).fill(562949953421311));
});

test('ParquetCodec::BIT_PACKED round-trips envelopes and destination offsets', () => {
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const encoded = PARQUET_CODECS.BIT_PACKED.encodeValues('INT32', values, { bitWidth: 4 });
    const output = new Int32Array(values.length + 2).fill(-1);
    const cursor = { buffer: encoded, offset: 0 };
    expect(PARQUET_CODECS.BIT_PACKED.decodeValues('INT32', cursor, values.length, { bitWidth: 4, output, outputOffset: 1 })).toBe(output);
    expect(output).toEqual(new Int32Array([-1, ...values, -1]));
    expect(cursor.offset).toBe(encoded.length);
});

test('ParquetCodec::RLE resolves generic-width dictionaries and rejects corrupt indices', () => {
    const dictionary = Array.from({ length: 32 }, (_, index) => `value-${index}`);
    const values = [0, 1, 2, 3, 4, 5, 30, 31];
    const encoded = PARQUET_CODECS.RLE.encodeValues('INT32', values, { disableEnvelope: true, bitWidth: 5 });
    expect(PARQUET_CODECS.RLE.decodeValues('INT32', { buffer: encoded, offset: 0 }, values.length, { disableEnvelope: true, bitWidth: 5, dictionary })).toEqual(values.map(value => dictionary[value]));
    expect(() => PARQUET_CODECS.RLE.decodeValues('INT32', { buffer: bytes([0x03, 0x1f]), offset: 0 }, 1, { disableEnvelope: true, bitWidth: 5, dictionary: ['zero'] })).toThrow('Invalid Parquet dictionary index');
});

test('ParquetCodec::RLE validates malformed options, runs, envelopes, and headers', () => {
    expect(() => PARQUET_CODECS.RLE.encodeValues('INT32', [1], {})).toThrow('bitWidth is required');
    expect(() => PARQUET_CODECS.RLE.encodeValues('FLOAT', [1], { bitWidth: 1 })).toThrow('unsupported type');
    expect(() => PARQUET_CODECS.RLE.decodeValues('INT32', { buffer: bytes([]), offset: 0 }, 1, {})).toThrow('bitWidth is required');
    for (const bitWidth of [-1, 1.5, 65]) {
        expect(() => PARQUET_CODECS.RLE.decodeValues('INT32', { buffer: bytes([]), offset: 0 }, 0, { bitWidth, disableEnvelope: true })).toThrow('invalid bit width');
    }
    expect(() => PARQUET_CODECS.RLE.decodeValues('INT32', { buffer: bytes([]), offset: 0 }, -1, { bitWidth: 1, disableEnvelope: true })).toThrow('invalid value count');
    expect(() => PARQUET_CODECS.RLE.decodeValues('INT32', { buffer: bytes([1]), offset: 0 }, 1, { bitWidth: 1, disableEnvelope: true })).toThrow('invalid RLE bit-packed run length');
    expect(() => PARQUET_CODECS.RLE.decodeValues('INT32', { buffer: bytes([0]), offset: 0 }, 1, { bitWidth: 1, disableEnvelope: true })).toThrow('invalid RLE repeated run length');
    expect(() => PARQUET_CODECS.RLE.decodeValues('INT32', { buffer: bytes(new Array(10).fill(0x80)), offset: 0 }, 1, { bitWidth: 1, disableEnvelope: true })).toThrow('invalid RLE run header');

    expect(() => PARQUET_CODECS.BIT_PACKED.encodeValues('INT32', [1], {})).toThrow('bitWidth is required');
    expect(() => PARQUET_CODECS.BIT_PACKED.encodeValues('FLOAT', [1], { bitWidth: 1 })).toThrow('unsupported type');
    expect(() => PARQUET_CODECS.BIT_PACKED.encodeValues('INT32', [1], { bitWidth: 33 })).toThrow('invalid bit width');
    expect(() => PARQUET_CODECS.BIT_PACKED.decodeValues('INT32', { buffer: bytes([]), offset: 0 }, 1, {})).toThrow('bitWidth is required');
    expect(() => PARQUET_CODECS.BIT_PACKED.decodeValues('INT32', { buffer: bytes([]), offset: 0 }, -1, { bitWidth: 1, disableEnvelope: true })).toThrow('invalid value count');
    expect(() => PARQUET_CODECS.BIT_PACKED.decodeValues('INT32', { buffer: bytes([0xff, 0xff, 0xff, 0xff]), offset: 0 }, 0, { bitWidth: 1 })).toThrow('invalid BIT_PACKED length');
    expect(() => PARQUET_CODECS.BIT_PACKED.decodeValues('INT32', { buffer: bytes([1, 0, 0, 0]), offset: 0 }, 8, { bitWidth: 1 })).toThrow('unexpected end');
});
