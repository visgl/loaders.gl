// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {convertArrowToSchema, convertSchemaToArrow} from '@loaders.gl/schema-utils';
import {expect, test} from 'vitest';

test('decimal schema conversion preserves precision, scale, and bit width', () => {
  const serializedSchema = {
    fields: [
      {
        name: 'amount',
        type: {type: 'decimal' as const, bitWidth: 256, precision: 40, scale: 9},
        nullable: false
      }
    ],
    metadata: {}
  };

  const arrowSchema = convertSchemaToArrow(serializedSchema);
  expect(arrowSchema.fields[0].type).toBeInstanceOf(arrow.Decimal);
  expect(arrowSchema.fields[0].type).toMatchObject({bitWidth: 256, precision: 40, scale: 9});
  expect(convertArrowToSchema(arrowSchema).fields[0].type).toEqual(serializedSchema.fields[0].type);
});
