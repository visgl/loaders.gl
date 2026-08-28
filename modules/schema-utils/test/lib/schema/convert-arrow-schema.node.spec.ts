// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {convertArrowToSchema, convertSchemaToArrow} from '@loaders.gl/schema-utils';
test('convertArrowSchema handles FixedSizeBinary fields', () => {
  const arrowSchema = new arrow.Schema([
    new arrow.Field('id', new arrow.Int32(), false),
    new arrow.Field('hash', new arrow.FixedSizeBinary(16), true)
  ]);
  const schema = convertArrowToSchema(arrowSchema);
  expect(schema.fields[1].type, 'serializes fixed-size binary fields').toEqual({
    type: 'fixed-size-binary',
    byteWidth: 16
  });
  const roundTrippedSchema = convertSchemaToArrow(schema);
  expect(
    roundTrippedSchema.fields[1].type.constructor,
    'deserializes fixed-size binary fields'
  ).toBe(arrow.FixedSizeBinary);
  expect(
    (roundTrippedSchema.fields[1].type as arrow.FixedSizeBinary).byteWidth,
    'preserves byte width'
  ).toBe(16);
});
