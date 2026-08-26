// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  GL,
  GLType,
  concatTypedArrays,
  emod,
  isGeometry,
  makeAttributeIterator,
  makePrimitiveIterator
} from '@loaders.gl/math';

describe('geometry utility functions', () => {
  test('iterates typed-array attributes in fixed-size groups', () => {
    const values = new Float32Array([1, 2, 3, 4, 5, 6]);

    const attributes = [];
    for (const value of makeAttributeIterator(values, 3)) {
      attributes.push([...value]);
    }

    expect(attributes).toEqual([
      [1, 2, 3],
      [4, 5, 6]
    ]);
  });

  test('iterates indexed triangle primitives', () => {
    const primitives = [
      ...makePrimitiveIterator({values: new Uint16Array([2, 0, 1])}, {}, GL.TRIANGLES)
    ];

    expect(primitives).toHaveLength(1);
    expect(primitives[0]).toMatchObject({i1: 2, i2: 0, i3: 1, type: GL.TRIANGLES});
  });

  test('iterates non-indexed points and lines', () => {
    const points = [];
    for (const primitive of makePrimitiveIterator(undefined, {}, GL.POINTS, 2, 4)) {
      points.push(primitive.i1);
    }
    expect(points).toEqual([2, 3]);

    const lines = [];
    for (const primitive of makePrimitiveIterator(undefined, {}, GL.LINES, 1, 5)) {
      lines.push([primitive.i1, primitive.i2]);
    }
    expect(lines).toEqual([
      [1, 2],
      [3, 4]
    ]);
  });

  test('recognizes geometry objects', () => {
    expect(isGeometry({mode: GL.TRIANGLES, attributes: {positions: {}}})).toBeTruthy();
    expect(isGeometry({mode: GL.TRIANGLES})).toBeFalsy();
    expect(isGeometry(null)).toBeFalsy();
  });

  test('concatenates typed arrays and computes modular coordinates', () => {
    expect(concatTypedArrays([new Uint8Array([1, 2]), new Uint8Array([3])])).toEqual(
      new Uint8Array([1, 2, 3])
    );
    expect(emod(1.25)).toBeCloseTo(0.25);
    expect(emod(-0.25)).toBeCloseTo(0.75);
  });
});

describe('GLType', () => {
  test('maps typed arrays and names to GL types', () => {
    expect(GLType.fromTypedArray(new Uint8Array())).toBe(String(GL.UNSIGNED_BYTE));
    expect(GLType.fromTypedArray(Float32Array)).toBe(String(GL.FLOAT));
    expect(GLType.fromName('UNSIGNED_SHORT')).toBe(GL.UNSIGNED_SHORT);
  });

  test('creates typed views and reports byte sizes', () => {
    const buffer = new ArrayBuffer(8);
    const view = GLType.createTypedArray(GL.UNSIGNED_SHORT, buffer);

    expect(view).toBeInstanceOf(Uint16Array);
    expect(view.length).toBe(4);
    expect(GLType.getByteSize(GL.FLOAT)).toBe(4);
    expect(GLType.getArrayType(GL.UNSIGNED_SHORT)).toBe(Uint16Array);
    expect(GLType.validate(GL.FLOAT)).toBe(true);
  });

  test('rejects unknown GL types', () => {
    expect(() => GLType.fromName('UNKNOWN')).toThrow('Failed to convert GL type');
    expect(() => GLType.fromTypedArray(Array)).toThrow('Failed to convert GL type');
    expect(() => GLType.getArrayType(0)).toThrow('Failed to convert GL type');
  });
});
