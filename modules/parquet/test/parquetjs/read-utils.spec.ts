// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {fieldIndexOf} from '../../src/parquetjs/utils/read-utils';

describe('fieldIndexOf', () => {
  test('matches selected parents and exact leaf paths', () => {
    expect(fieldIndexOf([['stock']], ['stock', 'quantity'])).toBe(0);
    expect(fieldIndexOf([['colour']], ['stock', 'quantity'])).toBe(-1);
    expect(fieldIndexOf([['stock', 'quantity']], ['stock', 'quantity'])).toBe(0);
    expect(fieldIndexOf([['stock', 'quantity']], ['stock'])).toBe(-1);
  });

  test('matches MQTT-style path wildcards', () => {
    expect(fieldIndexOf([['stock', '+']], ['stock', 'quantity'])).toBe(0);
    expect(fieldIndexOf([['stock', '+']], ['stock', 'quantity', 'unit'])).toBe(0);
    expect(fieldIndexOf([['stock', '#']], ['stock', 'quantity', 'unit'])).toBe(0);
    expect(fieldIndexOf([['+', 'quantity']], ['stock', 'quantity'])).toBe(0);
  });
});
