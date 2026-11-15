// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {isNativeArrowRecordBatch} from '@loaders.gl/core/schema-utils';
import {
  getBatchIndexFromLayerId,
  getSerializableArrowValue,
  isAsyncIterable
} from '../src/mesh-arrow-point-cloud-layer-utils';
test('mesh-arrow-point-cloud-layer-utils decodes async batch layer ids', () => {
  expect(getBatchIndexFromLayerId('root-points-7'), 'decodes batch index suffix').toBe(7);
  expect(getBatchIndexFromLayerId('root-points'), 'defaults unbatched layer to zero').toBe(0);
  expect(getBatchIndexFromLayerId(undefined), 'defaults missing layer id to zero').toBe(0);
});
test('mesh-arrow-point-cloud-layer-utils serializes Arrow-like values', () => {
  expect(getSerializableArrowValue(new Uint8Array([1, 2, 3])), 'serializes typed arrays').toEqual([
    1, 2, 3
  ]);
  expect(
    getSerializableArrowValue(new DataView(new Uint8Array([4, 5]).buffer)),
    'serializes DataView values'
  ).toEqual([4, 5]);
  expect(
    getSerializableArrowValue([[new Uint8Array([6, 7])]]),
    'recursively serializes nested arrays'
  ).toEqual([[[6, 7]]]);
});
test('mesh-arrow-point-cloud-layer-utils identifies supported data shapes', () => {
  const asyncIterable = {
    async *[Symbol.asyncIterator](): AsyncIterator<unknown> {
      yield null;
    }
  };
  const arrowTable = tableFromArrays({value: [1]});
  expect(isAsyncIterable(asyncIterable), 'identifies async iterable data').toBeTruthy();
  expect(
    isNativeArrowRecordBatch(arrowTable.batches[0]),
    'identifies Arrow table batches'
  ).toBeTruthy();
  expect(isNativeArrowRecordBatch(arrowTable), 'rejects non-Arrow batches').toBeFalsy();
});
