// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {AvroSchemaLoaderWithParser} from '@loaders.gl/parquet/avro-schema-loader';

test('AvroSchemaLoader#parse validates standalone schemas', async t => {
  const schema = await AvroSchemaLoaderWithParser.parse(
    new TextEncoder().encode(
      JSON.stringify({
        type: 'record',
        name: 'Example',
        fields: [
          {name: 'id', type: 'long'},
          {name: 'label', type: ['null', 'string']}
        ]
      })
    ).buffer
  );
  t.equal((schema as {name: string}).name, 'Example');
  await t.rejects(
    () =>
      AvroSchemaLoaderWithParser.parse(
        new TextEncoder().encode(JSON.stringify({type: 'record', name: 'Broken', fields: []})).buffer
      ),
    /Invalid Avro schema/
  );
  t.end();
});

test('AvroSchemaLoader#parse validates defaults against field schemas', async t => {
  const valid = await AvroSchemaLoaderWithParser.parse(
    new TextEncoder().encode(
      JSON.stringify({
        type: 'record',
        name: 'Defaults',
        fields: [
          {name: 'value', type: ['null', 'string'], default: null},
          {name: 'items', type: {type: 'array', items: 'int'}, default: []},
          {name: 'kind', type: {type: 'enum', name: 'Kind', symbols: ['A', 'B']}, default: 'A'}
        ]
      })
    ).buffer
  );
  t.equal((valid as {name: string}).name, 'Defaults');
  await t.rejects(
    () =>
      AvroSchemaLoaderWithParser.parse(
        new TextEncoder().encode(
          JSON.stringify({
            type: 'record',
            name: 'InvalidDefaults',
            fields: [{name: 'value', type: ['null', 'string'], default: 'not-null'}]
          })
        ).buffer
      ),
    /default.*expected null/
  );
  t.end();
});
