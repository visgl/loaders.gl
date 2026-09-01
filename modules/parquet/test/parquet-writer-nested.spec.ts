// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encode, load} from '@loaders.gl/core';
import {ParquetJSLoader, ParquetJSWriter} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {expect, test} from 'vitest';

test('ParquetJSWriter round-trips nested structs, lists, maps, and nulls', async () => {
  const table: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {
          name: 'profile',
          type: {
            type: 'struct',
            children: [
              {name: 'city', type: 'utf8', nullable: false},
              {name: 'score', type: 'int32', nullable: true}
            ]
          },
          nullable: true
        },
        {
          name: 'tags',
          type: {type: 'list', children: [{name: 'item', type: 'int32', nullable: false}]},
          nullable: false
        },
        {
          name: 'labels',
          type: {
            type: 'map',
            children: [
              {name: 'key', type: 'utf8', nullable: false},
              {name: 'value', type: 'utf8', nullable: true}
            ]
          },
          nullable: false
        }
      ],
      metadata: {}
    },
    data: [
      {
        profile: {city: 'Paris', score: 10},
        tags: [1, 2],
        labels: new Map([
          ['language', 'fr'],
          ['optional', null]
        ])
      },
      {profile: null, tags: [], labels: {language: 'en'}}
    ]
  };

  const parquetBuffer = await encode(table, ParquetJSWriter, {worker: false});
  const output = await load(parquetBuffer, ParquetJSLoader, {core: {worker: false}});

  expect(output.shape).toBe('object-row-table');
  if (output.shape === 'object-row-table') {
    expect(output.data).toEqual([
      {
        profile: {city: 'Paris', score: 10},
        tags: {list: [{element: 1}, {element: 2}]},
        labels: {
          key_value: [
            {key: 'language', value: 'fr'},
            {key: 'optional'}
          ]
        }
      },
      {tags: {}, labels: {key_value: [{key: 'language', value: 'en'}]}}
    ]);
  }
});

test('ParquetJSWriter rejects invalid nested table schemas before writing', async () => {
  const invalidList: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [{name: 'values', type: {type: 'list', children: []}, nullable: false}],
      metadata: {}
    },
    data: [{values: []}]
  };
  await expect(encode(invalidList, ParquetJSWriter, {worker: false})).rejects.toThrow(
    'List field "values" has no value child'
  );

  const invalidMap: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {
          name: 'values',
          type: {
            type: 'map',
            children: [{name: 'key', type: 'utf8', nullable: true}]
          },
          nullable: false
        }
      ],
      metadata: {}
    },
    data: [{values: {key: 'value'}}]
  };
  await expect(encode(invalidMap, ParquetJSWriter, {worker: false})).rejects.toThrow(
    'Map field "values" needs key and value children'
  );
});
