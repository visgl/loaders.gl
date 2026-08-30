// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  createLASTypedExtraBytesValue,
  createLASTypedExtraBytesAttributes,
  parseLASExtraBytes,
  populateLASTypedExtraBytes
} from '@loaders.gl/las';

describe('LAS Extra Bytes utilities', () => {
  test('parses offset views and decodes scaled vector attributes', () => {
    const storage = new Uint8Array(197);
    const payload = storage.subarray(5);
    const descriptorView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    payload[2] = 23;
    payload[3] = 0x18;
    new TextEncoder().encodeInto('surface normal', payload.subarray(4, 36));
    descriptorView.setFloat64(112, 2, true);
    descriptorView.setFloat64(120, 3, true);
    descriptorView.setFloat64(128, 4, true);
    descriptorView.setFloat64(136, 10, true);
    descriptorView.setFloat64(144, 20, true);
    descriptorView.setFloat64(152, 30, true);

    const descriptors = parseLASExtraBytes(payload);
    const attributes = createLASTypedExtraBytesAttributes(2, descriptors, 6);
    const rawValues = new Uint8Array(12);
    const rawView = new DataView(rawValues.buffer);
    [1, 2, 3, 4, 5, 6].forEach((value, index) => rawView.setUint16(index * 2, value, true));
    populateLASTypedExtraBytes(rawValues, 2, 6, attributes);

    expect(descriptors[0]?.name).toBe('surface normal');
    expect(attributes[0]?.name).toBe('EXTRA_BYTES_surface_normal');
    expect(attributes[0]?.size).toBe(3);
    expect(attributes[0]?.value).toBeInstanceOf(Float64Array);
    expect(Array.from(attributes[0]?.value || [])).toEqual([12, 26, 42, 18, 35, 54]);
  });

  test('rejects truncated descriptors and packed point data', () => {
    expect(() => parseLASExtraBytes(new Uint8Array(191))).toThrow(/multiple of 192/);

    const descriptor = new Uint8Array(192);
    descriptor[2] = 1;
    const attributes = createLASTypedExtraBytesAttributes(2, parseLASExtraBytes(descriptor), 1);
    expect(() => populateLASTypedExtraBytes(new Uint8Array(1), 2, 1, attributes)).toThrow(
      /truncated/
    );
  });

  test.each([
    [1, Uint8Array],
    [2, Int8Array],
    [3, Uint16Array],
    [4, Int16Array],
    [5, Uint32Array],
    [6, Int32Array],
    [9, Float32Array],
    [10, Float64Array]
  ] as const)('allocates scalar data type %i with its native typed array', (dataType, ArrayType) => {
    expect(createLASTypedExtraBytesValue(dataType, 3, false)).toBeInstanceOf(ArrayType);
  });

  test('allocates transformed integer attributes as Float64 and validates scalar types', () => {
    expect(createLASTypedExtraBytesValue(5, 2, true)).toBeInstanceOf(Float64Array);
    expect(createLASTypedExtraBytesValue(10, 2, true)).toBeInstanceOf(Float64Array);
    expect(() => createLASTypedExtraBytesValue(0, 1, false)).toThrow(/scalar data type 0/);
  });

  test('decodes every supported scalar representation', () => {
    const descriptors = [1, 2, 3, 4, 5, 6, 9, 10].flatMap((dataType, descriptorIndex) => {
      const descriptor = new Uint8Array(192);
      descriptor[2] = dataType;
      new TextEncoder().encodeInto(`value ${descriptorIndex}`, descriptor.subarray(4, 36));
      return [...descriptor];
    });
    const parsedDescriptors = parseLASExtraBytes(new Uint8Array(descriptors));
    const scalarByteLengths = [1, 1, 2, 2, 4, 4, 4, 8];
    const extraByteCount = scalarByteLengths.reduce((sum, byteLength) => sum + byteLength, 0);
    const rawValues = new Uint8Array(extraByteCount);
    const dataView = new DataView(rawValues.buffer);
    let byteOffset = 0;
    dataView.setUint8(byteOffset, 250);
    byteOffset += 1;
    dataView.setInt8(byteOffset, -12);
    byteOffset += 1;
    dataView.setUint16(byteOffset, 60_000, true);
    byteOffset += 2;
    dataView.setInt16(byteOffset, -12_345, true);
    byteOffset += 2;
    dataView.setUint32(byteOffset, 4_000_000_000, true);
    byteOffset += 4;
    dataView.setInt32(byteOffset, -2_000_000_000, true);
    byteOffset += 4;
    dataView.setFloat32(byteOffset, 1.25, true);
    byteOffset += 4;
    dataView.setFloat64(byteOffset, -2.5, true);

    const attributes = createLASTypedExtraBytesAttributes(1, parsedDescriptors, extraByteCount);
    populateLASTypedExtraBytes(rawValues, 1, extraByteCount, attributes);

    expect(attributes.map(attribute => attribute.name)).toEqual(
      parsedDescriptors.map((_, index) => `EXTRA_BYTES_value_${index}`)
    );
    expect(attributes.map(attribute => attribute.value[0])).toEqual([
      250, -12, 60_000, -12_345, 4_000_000_000, -2_000_000_000, 1.25, -2.5
    ]);
  });

  test('creates vector attributes, unique fallback names and default transforms', () => {
    const payload = new Uint8Array(192 * 4);
    const descriptorTypes = [11, 21, 12, 22];
    for (let index = 0; index < descriptorTypes.length; index++) {
      payload[index * 192 + 2] = descriptorTypes[index];
      if (index > 1) {
        new TextEncoder().encodeInto(
          'duplicate!',
          payload.subarray(index * 192 + 4, index * 192 + 36)
        );
      }
    }
    const attributes = createLASTypedExtraBytesAttributes(
      1,
      parseLASExtraBytes(payload),
      2 + 3 + 2 + 3
    );

    expect(attributes.map(attribute => attribute.size)).toEqual([2, 3, 2, 3]);
    expect(attributes.map(attribute => attribute.name)).toEqual([
      'EXTRA_BYTES_0',
      'EXTRA_BYTES_1',
      'EXTRA_BYTES_duplicate_',
      'EXTRA_BYTES_duplicate__1'
    ]);
    expect(attributes.every(attribute => attribute.scales.every(scale => scale === 1))).toBe(true);
    expect(attributes.every(attribute => attribute.offsets.every(offset => offset === 0))).toBe(
      true
    );
  });

  test.each([0, 7, 8, 17, 18, 27, 28, 31])('rejects unsupported typed descriptor %i', dataType => {
    const payload = new Uint8Array(192);
    payload[2] = dataType;
    expect(() => createLASTypedExtraBytesAttributes(1, parseLASExtraBytes(payload), 0)).toThrow(
      dataType === 7 ||
        dataType === 8 ||
        dataType === 17 ||
        dataType === 18 ||
        dataType === 27 ||
        dataType === 28
        ? /BigInt output/
        : /Unsupported typed/
    );
  });

  test('rejects descriptor layouts that do not match packed records', () => {
    const payload = new Uint8Array(192);
    payload[2] = 1;
    expect(() => createLASTypedExtraBytesAttributes(1, parseLASExtraBytes(payload), 2)).toThrow(
      /descriptors use 1 bytes/
    );
  });
});
