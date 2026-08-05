// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import * as arrow from 'apache-arrow';

import {convertArrowToSchema, convertSchemaToArrow} from '@loaders.gl/schema-utils';

test('convertArrowSchema handles FixedSizeBinary fields', t => {
  const arrowSchema = new arrow.Schema([
    new arrow.Field('id', new arrow.Int32(), false),
    new arrow.Field('hash', new arrow.FixedSizeBinary(16), true)
  ]);

  const schema = convertArrowToSchema(arrowSchema);

  t.deepEqual(
    schema.fields[1].type,
    {type: 'fixed-size-binary', byteWidth: 16},
    'serializes fixed-size binary fields'
  );

  const roundTrippedSchema = convertSchemaToArrow(schema);
  t.equal(
    roundTrippedSchema.fields[1].type.constructor,
    arrow.FixedSizeBinary,
    'deserializes fixed-size binary fields'
  );
  t.equal(
    (roundTrippedSchema.fields[1].type as arrow.FixedSizeBinary).byteWidth,
    16,
    'preserves byte width'
  );
  t.end();
});
