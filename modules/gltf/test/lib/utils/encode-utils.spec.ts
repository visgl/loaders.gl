// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {copyPaddedStringToDataView} from '@loaders.gl/loader-utils';
test('encode-utils', () => {
  const STRING = 'abcdef';
  const byteLength = copyPaddedStringToDataView(null, 0, STRING, 4);
  expect(byteLength).toBe(8); // padded
  const arrayBuffer = new ArrayBuffer(byteLength);
  const dataView = new DataView(arrayBuffer);
  const finalLength = copyPaddedStringToDataView(dataView, 0, STRING, 4);
  expect(finalLength).toBe(8);
});
