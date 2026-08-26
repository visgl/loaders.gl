// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {
  ArrowTableBuilder,
  convertArrowToSchema,
  convertSchemaToArrow,
  getArrowViewTypeSupport
} from '@loaders.gl/schema-utils';

test('convert-arrow-schema#FixedSizeBinary round-trip', () => {
  const arrowSchema = new arrow.Schema([
    new arrow.Field('uuid', new arrow.FixedSizeBinary(16), false)
  ]);

  const schema = convertArrowToSchema(arrowSchema);
  expect(schema.fields[0].type, 'serializes FixedSizeBinary').toEqual({
    type: 'fixed-size-binary',
    byteWidth: 16
  });

  const roundTripSchema = convertSchemaToArrow(schema);
  const roundTripField = roundTripSchema.fields[0];
  expect(
    roundTripField.type instanceof arrow.FixedSizeBinary,
    'deserializes FixedSizeBinary'
  ).toBeTruthy();
  expect((roundTripField.type as arrow.FixedSizeBinary).byteWidth, 'preserves byte width').toBe(16);
});

test('convert-arrow-schema#view types are opt-in', () => {
  const schema = {
    fields: [
      {name: 'text', type: 'utf8' as const, nullable: true},
      {name: 'bytes', type: 'binary' as const, nullable: true}
    ],
    metadata: {}
  };

  const defaultArrowSchema = convertSchemaToArrow(schema);
  expect(
    defaultArrowSchema.fields[0].type instanceof arrow.Utf8,
    'uses Utf8 by default'
  ).toBeTruthy();
  expect(
    defaultArrowSchema.fields[1].type instanceof arrow.Binary,
    'uses Binary by default'
  ).toBeTruthy();

  const support = getArrowViewTypeSupport();
  expect(support.utf8View, 'detects Utf8View support').toBeTruthy();
  expect(support.binaryView, 'detects BinaryView support').toBeTruthy();

  const viewArrowSchema = convertSchemaToArrow(schema, {viewTypes: 'prefer'});
  expect(viewArrowSchema.fields[0].type.constructor.name, 'prefers Utf8View').toBe('Utf8View');
  expect(viewArrowSchema.fields[1].type.constructor.name, 'prefers BinaryView').toBe('BinaryView');
  expect(
    convertArrowToSchema(viewArrowSchema).fields.map(field => field.type),
    'serializes view types'
  ).toEqual(['utf8-view', 'binary-view']);
});

test('ArrowTableBuilder#view types round-trip through IPC', () => {
  const builder = new ArrowTableBuilder(
    {
      fields: [
        {name: 'text', type: 'utf8', nullable: true},
        {name: 'bytes', type: 'binary', nullable: true}
      ],
      metadata: {}
    },
    {viewTypes: 'require'}
  );

  builder.addObjectRow({text: 'short', bytes: new Uint8Array([1, 2, 3])});
  builder.addObjectRow({
    text: 'a string longer than twelve bytes',
    bytes: new Uint8Array([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
  });

  const table = builder.finishTable();
  const roundTripTable = arrow.tableFromIPC(arrow.tableToIPC(table.data));
  expect(
    table.schema.fields.map(field => field.type),
    'reports the effective view schema'
  ).toEqual(['utf8-view', 'binary-view']);
  expect(roundTripTable.schema.fields[0].type.constructor.name).toBe('Utf8View');
  expect(roundTripTable.schema.fields[1].type.constructor.name).toBe('BinaryView');
  expect(roundTripTable.getChild('text')?.get(0)).toBe('short');
  expect(Array.from(roundTripTable.getChild('bytes')?.get(1) || [])).toEqual([
    4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
  ]);
});
