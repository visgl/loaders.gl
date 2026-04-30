// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import * as arrow from 'apache-arrow';
import {convertArrowToSchema, convertSchemaToArrow} from '@loaders.gl/schema-utils';

test('convert-arrow-schema#FixedSizeBinary round-trip', t => {
  const arrowSchema = new arrow.Schema([
    new arrow.Field('uuid', new arrow.FixedSizeBinary(16), false)
  ]);

  const schema = convertArrowToSchema(arrowSchema);
  t.deepEqual(
    schema.fields[0].type,
    {type: 'fixed-size-binary', byteWidth: 16},
    'serializes FixedSizeBinary'
  );

  const roundTripSchema = convertSchemaToArrow(schema);
  const roundTripField = roundTripSchema.fields[0];
  t.ok(roundTripField.type instanceof arrow.FixedSizeBinary, 'deserializes FixedSizeBinary');
  t.equal((roundTripField.type as arrow.FixedSizeBinary).byteWidth, 16, 'preserves byte width');
  t.end();
});
