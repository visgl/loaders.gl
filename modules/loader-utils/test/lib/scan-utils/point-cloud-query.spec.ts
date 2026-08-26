// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {validatePointCloudQueryOptions} from '../../../src';

describe('validatePointCloudQueryOptions', () => {
  test('accepts table semantics with spatial and hierarchy constraints', () => {
    expect(() =>
      validatePointCloudQueryOptions(['X', 'Y', 'Z', 'Intensity'], {
        columns: ['X', 'Y', 'Z'],
        predicate: {op: '>=', args: [{property: 'Intensity'}, 10]},
        limit: 1000,
        bounds: {minimum: [0, 1, 2], maximum: [3, 4, 5]},
        minimumLevel: 2,
        maximumLevel: 8,
        targetSpacing: 0.5
      })
    ).not.toThrow();
  });

  test.each([
    [{bounds: {minimum: [2, 0, 0], maximum: [1, 1, 1]}}, /minimum cannot exceed/],
    [{minimumLevel: -1}, /minimumLevel/],
    [{minimumLevel: 3, maximumLevel: 2}, /cannot exceed/],
    [{targetSpacing: 0}, /positive finite/]
  ] as const)('rejects invalid point-cloud options', (options, expectedMessage) => {
    expect(() => validatePointCloudQueryOptions(['X'], options)).toThrow(expectedMessage);
  });
});
