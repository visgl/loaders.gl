// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parseNPY} from '../src/lib/parsers/parse-npy';

/** Creates a compact NPY buffer for one descriptor and shape. */
function createNPYBuffer(
  descriptor: string,
  shape: number[],
  values: ArrayBuffer,
  majorVersion = 1
): ArrayBuffer {
  const headerText = `{'descr': '${descriptor}', 'fortran_order': False, 'shape': (${shape.join(',')}), }`;
  const header = new TextEncoder().encode(headerText);
  const lengthBytes = majorVersion >= 2 ? 4 : 2;
  const output = new Uint8Array(8 + lengthBytes + header.length + values.byteLength);
  output.set([0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59, majorVersion, 0]);
  const view = new DataView(output.buffer);
  if (majorVersion >= 2) view.setUint32(8, header.length, true);
  else view.setUint16(8, header.length, true);
  output.set(header, 8 + lengthBytes);
  output.set(new Uint8Array(values), 8 + lengthBytes + header.length);
  return output.buffer;
}

describe('parseNPY', () => {
  test.each([
    ['|u1', new Uint8Array([1, 2])],
    ['|i1', new Int8Array([-1, 2])],
    ['<u2', new Uint16Array([1, 500])],
    ['<i2', new Int16Array([-2, 500])],
    ['<u4', new Uint32Array([1, 100_000])],
    ['<i4', new Int32Array([-3, 100_000])],
    ['<f4', new Float32Array([1.5, -2.5])],
    ['<f8', new Float64Array([Math.PI, -1])]
  ])('decodes %s arrays', (descriptor, values) => {
    const result = parseNPY(createNPYBuffer(descriptor, [2], values.buffer));
    expect(result.header).toMatchObject({descr: descriptor, shape: [2]});
    expect(Array.from(result.data)).toEqual(Array.from(values));
  });

  test('supports v2 and v3 header lengths', () => {
    const values = new Uint8Array([7]);
    expect(parseNPY(createNPYBuffer('|u1', [1], values.buffer, 2)).data[0]).toBe(7);
    expect(parseNPY(createNPYBuffer('|u1', [1], values.buffer, 3)).data[0]).toBe(7);
  });

  test('reports unsupported types, truncated data, and incompatible endianness', () => {
    expect(() => parseNPY(createNPYBuffer('<c8', [1], new ArrayBuffer(8)))).toThrow(
      'Unimplemented type <c8'
    );
    expect(() => parseNPY(createNPYBuffer('<u4', [2], new ArrayBuffer(4)))).toThrow(
      'Buffer overflow'
    );
    expect(() => parseNPY(createNPYBuffer('>u2', [1], new Uint16Array([1]).buffer))).toThrow(
      'Incorrect endianness'
    );
  });
});
