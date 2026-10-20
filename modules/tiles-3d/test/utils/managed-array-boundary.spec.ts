// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {ManagedArray} from '../../src/utils/managed-array';

describe('ManagedArray boundary behavior', () => {
  test('grows logical and reserved storage independently', () => {
    const managedArray = new ManagedArray(2);

    expect(managedArray.length).toBe(2);
    expect(managedArray.values).toHaveLength(2);
    managedArray.reserve(6);
    expect(managedArray.length).toBe(2);
    expect(managedArray.values).toHaveLength(6);

    managedArray.resize(4);
    expect(managedArray.length).toBe(4);
    managedArray.trim();
    expect(managedArray.values).toHaveLength(4);
    managedArray.trim(1);
    expect(managedArray.values).toHaveLength(1);
  });

  test('sets, replaces, and locates values', () => {
    const managedArray = new ManagedArray();
    const first = {id: 1};
    const replacement = {id: 2};

    managedArray.set(2, first);
    expect(managedArray.length).toBe(3);
    expect(managedArray.get(2)).toBe(first);
    expect(managedArray.find(first)).toBe(true);

    managedArray.set(2, replacement);
    expect(managedArray.find(first)).toBe(false);
    expect(managedArray.find(replacement)).toBe(true);
    expect(managedArray.get(2)).toBe(replacement);
  });

  test('keeps pushes unique and supports stack operations', () => {
    const managedArray = new ManagedArray();
    managedArray.push('first');
    managedArray.push('second');
    managedArray.push('first');

    expect(managedArray.length).toBe(2);
    expect(managedArray.peek()).toBe('second');
    expect(managedArray.pop()).toBe('second');
    expect(managedArray.peek()).toBe('first');
    expect(managedArray.find('second')).toBe(false);
  });

  test('deletes present values and ignores missing values', () => {
    const managedArray = new ManagedArray();
    managedArray.push('first');
    managedArray.push('second');
    managedArray.delete('first');
    managedArray.delete('missing');

    expect(managedArray.length).toBe(1);
    expect(managedArray.values[0]).toBe('second');
    expect(managedArray.find('first')).toBe(false);
  });

  test('resets state and validates indices and sizes', () => {
    const managedArray = new ManagedArray();
    managedArray.push('value');
    managedArray.reset();

    expect(managedArray.length).toBe(0);
    expect(managedArray.values).toEqual([]);
    expect(managedArray.find('value')).toBe(false);
    expect(() => managedArray.set(-1, 'value')).toThrow();
    expect(() => managedArray.reserve(-1)).toThrow();
    expect(() => managedArray.resize(-1)).toThrow();
    expect(() => managedArray.get(1)).toThrow();
  });
});
