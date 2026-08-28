// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
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
});
