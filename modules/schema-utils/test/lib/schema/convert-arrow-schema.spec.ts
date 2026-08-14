// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import * as arrow from 'apache-arrow';
import {
  ArrowTableBuilder,
  convertArrowToSchema,
  convertSchemaToArrow,
  getArrowViewTypeSupport
} from '@loaders.gl/schema-utils';

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

test('convert-arrow-schema#view types are opt-in', t => {
  const schema = {
    fields: [
      {name: 'text', type: 'utf8' as const, nullable: true},
      {name: 'bytes', type: 'binary' as const, nullable: true}
    ],
    metadata: {}
  };

  const defaultArrowSchema = convertSchemaToArrow(schema);
  t.ok(defaultArrowSchema.fields[0].type instanceof arrow.Utf8, 'uses Utf8 by default');
  t.ok(defaultArrowSchema.fields[1].type instanceof arrow.Binary, 'uses Binary by default');

  const support = getArrowViewTypeSupport();
  t.ok(support.utf8View, 'detects Utf8View support');
  t.ok(support.binaryView, 'detects BinaryView support');

  const viewArrowSchema = convertSchemaToArrow(schema, {viewTypes: 'prefer'});
  t.equal(viewArrowSchema.fields[0].type.constructor.name, 'Utf8View', 'prefers Utf8View');
  t.equal(viewArrowSchema.fields[1].type.constructor.name, 'BinaryView', 'prefers BinaryView');
  t.deepEqual(
    convertArrowToSchema(viewArrowSchema).fields.map(field => field.type),
    ['utf8-view', 'binary-view'],
    'serializes view types'
  );
  t.end();
});

test('ArrowTableBuilder#view types round-trip through IPC', t => {
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
  t.deepEqual(
    table.schema.fields.map(field => field.type),
    ['utf8-view', 'binary-view'],
    'reports the effective view schema'
  );
  t.equal(roundTripTable.schema.fields[0].type.constructor.name, 'Utf8View');
  t.equal(roundTripTable.schema.fields[1].type.constructor.name, 'BinaryView');
  t.equal(roundTripTable.getChild('text')?.get(0), 'short');
  t.deepEqual(
    Array.from(roundTripTable.getChild('bytes')?.get(1) || []),
    [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  );
  t.end();
});
