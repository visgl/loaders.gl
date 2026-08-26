// SPDX-License-Identifier: MIT

import {describe, expect, test, vi} from 'vitest';

import {num2bytes, num2str, readType, str2num, TYPES} from '../../src/netcdfjs/read-type';

function createBuffer() {
  return {
    readBytes: vi.fn(size => new Uint8Array(size)),
    readChars: vi.fn(() => 'value\0'),
    readInt16: vi.fn(() => -16),
    readInt32: vi.fn(() => -32),
    readFloat32: vi.fn(() => 32.5),
    readFloat64: vi.fn(() => 64.5)
  } as any;
}

describe('NetCDF type helpers', () => {
  test.each([
    [TYPES.BYTE, 'byte', 1],
    [TYPES.CHAR, 'char', 1],
    [TYPES.SHORT, 'short', 2],
    [TYPES.INT, 'int', 4],
    [TYPES.FLOAT, 'float', 4],
    [TYPES.DOUBLE, 'double', 8]
  ])('maps type %s', (type, name, bytes) => {
    expect(num2str(type)).toBe(name);
    expect(num2bytes(type)).toBe(bytes);
    expect(str2num(name)).toBe(type);
  });

  test('reads byte arrays and trims null-terminated chars', () => {
    const buffer = createBuffer();

    expect(readType(buffer, TYPES.BYTE, 3)).toEqual(new Uint8Array(3));
    expect(readType(buffer, TYPES.CHAR, 4)).toBe('value');
    expect(buffer.readBytes).toHaveBeenCalledWith(3);
    expect(buffer.readChars).toHaveBeenCalledWith(4);
  });

  test.each([
    [TYPES.SHORT, -16],
    [TYPES.INT, -32],
    [TYPES.FLOAT, 32.5],
    [TYPES.DOUBLE, 64.5]
  ])('reads one numeric %s value', (type, value) => {
    expect(readType(createBuffer(), type, 1)).toBe(value);
  });

  test('reads multiple numeric values', () => {
    const buffer = createBuffer();

    expect(readType(buffer, TYPES.INT, 3)).toEqual([-32, -32, -32]);
    expect(buffer.readInt32).toHaveBeenCalledTimes(3);
  });

  test('handles unknown type identifiers', () => {
    const buffer = createBuffer();

    expect(() => readType(buffer, 99, 1)).toThrow('non valid type 99');
    expect(num2str(99)).toBe('undefined');
    expect(num2bytes(99)).toBe(-1);
    expect(str2num('unknown')).toBe(-1);
  });
});
