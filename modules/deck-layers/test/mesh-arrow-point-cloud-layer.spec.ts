// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  getBatchIndexFromLayerId,
  getSerializableArrowValue,
  isArrowTable,
  isArrowTableBatch,
  isAsyncIterable
} from '../src/mesh-arrow-point-cloud-layer-utils';

test('mesh-arrow-point-cloud-layer-utils decodes async batch layer ids', t => {
  t.equal(getBatchIndexFromLayerId('root-points-7'), 7, 'decodes batch index suffix');
  t.equal(getBatchIndexFromLayerId('root-points'), 0, 'defaults unbatched layer to zero');
  t.equal(getBatchIndexFromLayerId(undefined), 0, 'defaults missing layer id to zero');
  t.end();
});

test('mesh-arrow-point-cloud-layer-utils serializes Arrow-like values', t => {
  t.deepEqual(
    getSerializableArrowValue(new Uint8Array([1, 2, 3])),
    [1, 2, 3],
    'serializes typed arrays'
  );
  t.deepEqual(
    getSerializableArrowValue(new DataView(new Uint8Array([4, 5]).buffer)),
    [4, 5],
    'serializes DataView values'
  );
  t.deepEqual(
    getSerializableArrowValue([[new Uint8Array([6, 7])]]),
    [[[6, 7]]],
    'recursively serializes nested arrays'
  );
  t.end();
});

test('mesh-arrow-point-cloud-layer-utils identifies supported data shapes', t => {
  const asyncIterable = {
    async *[Symbol.asyncIterator](): AsyncIterator<unknown> {
      yield null;
    }
  };
  const arrowTable = {
    getChild(): null {
      return null;
    }
  };

  t.ok(isAsyncIterable(asyncIterable), 'identifies async iterable data');
  t.ok(isArrowTable(arrowTable), 'identifies Arrow table-like data');
  t.ok(
    isArrowTableBatch({shape: 'arrow-table', batchType: 'data', data: arrowTable}),
    'identifies Arrow table batches'
  );
  t.notOk(
    isArrowTableBatch({shape: 'object-row-table', batchType: 'data', data: arrowTable}),
    'rejects non-Arrow batches'
  );
  t.end();
});
