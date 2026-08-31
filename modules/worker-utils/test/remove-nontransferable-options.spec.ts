// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {removeNontransferableOptions} from '../src/lib/worker-utils/remove-nontransferable-options';

test('removeNontransferableOptions recursively sanitizes worker options', () => {
  const typedArray = new Uint8Array([1, 2]);
  const options = {
    callback: () => 1,
    expression: /tiles/,
    nested: {value: 7, callback: () => 2, deeper: {expression: /deep/}},
    typedArray,
    scalar: 'kept'
  };

  expect(removeNontransferableOptions(options)).toEqual({
    callback: {},
    expression: {},
    nested: {value: 7, callback: {}, deeper: {expression: {}}},
    typedArray,
    scalar: 'kept'
  });
  expect(removeNontransferableOptions(null)).toEqual({});
  expect(options.callback()).toBe(1);
});
