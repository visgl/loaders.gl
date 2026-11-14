// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {ArrowTableBuilder} from '@loaders.gl/core/schema-utils';

test('ArrowTableBuilder keeps buffered and emitted rows intact across flushes', () => {
  const builder = new ArrowTableBuilder({
    fields: [{name: 'value', type: 'float32', nullable: true, metadata: {}}],
    metadata: {}
  });
  for (let value = 0; value < 150; value++) builder.addArrayRow([value]);
  expect(builder.firstBatch()).toBeNull();
  const first = builder.flushBatch()!;
  builder.addObjectRow({value: 200});
  builder.addObjectRow({});
  const second = builder.flushBatch()!;
  expect(Array.from(first.getChild('value')!)).toEqual(
    Array.from({length: 150}, (_, index) => index)
  );
  expect(Array.from(second.getChild('value')!)).toEqual([200, null]);
  expect(builder.flushBatch()).toBeNull();
});
