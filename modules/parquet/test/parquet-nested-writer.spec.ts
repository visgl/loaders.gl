// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encode, load} from '@loaders.gl/core';
import {BlobFile} from '@loaders.gl/loader-utils';
import {ParquetJSLoader, ParquetJSWriter} from '@loaders.gl/parquet';
import {ParquetSource} from '@loaders.gl/parquet/parquet-source-loader';
import type {ObjectRowTable} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';
import {ParquetReader} from '../src/parquetjs/parser/parquet-reader';
import {expect, test} from 'vitest';

test('ParquetJSWriter writes standard nested LIST and MAP fields', async () => {
  const input: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {name: 'id', type: 'int32', nullable: false},
        {
          name: 'tags',
          type: {type: 'list', children: [{name: 'element', type: 'utf8', nullable: false}]},
          nullable: true
        },
        {
          name: 'nestedTags',
          type: {
            type: 'list',
            children: [
              {
                name: 'element',
                type: {
                  type: 'list',
                  children: [{name: 'element', type: 'utf8', nullable: false}]
                },
                nullable: false
              }
            ]
          },
          nullable: true
        },
        {
          name: 'attributes',
          type: {
            type: 'map',
            keysSorted: false,
            children: [
              {
                name: 'entries',
                type: {
                  type: 'struct',
                  children: [
                    {name: 'key', type: 'utf8', nullable: false},
                    {name: 'value', type: 'int32', nullable: true}
                  ]
                },
                nullable: false
              }
            ]
          },
          nullable: true
        },
        {
          name: 'properties',
          type: {
            type: 'struct',
            children: [{name: 'label', type: 'utf8', nullable: true}]
          },
          nullable: true
        }
      ],
      metadata: {}
    },
    data: [
      {
        id: 1,
        tags: ['one', 'two'],
        nestedTags: [['a', 'b'], ['c']],
        attributes: new Map([['count', 2]]),
        properties: {label: 'first'}
      },
      {id: 2, tags: [], nestedTags: [], attributes: {score: 7}, properties: {label: null}}
    ]
  };

  const parquetBuffer = await encode(input, ParquetJSWriter, {
    worker: false,
    parquet: {pageIndex: true, pageSize: 1}
  });
  const metadata = await new ParquetReader(new BlobFile(parquetBuffer)).getFileMetadata();
  for (const column of metadata.row_groups?.[0]?.columns || []) {
    if (column.meta_data?.path_in_schema?.some(path => path === 'tags' || path === 'attributes')) {
      expect(Number(column.offset_index_offset)).toBeGreaterThan(0);
      expect(Number(column.column_index_offset)).toBeGreaterThan(0);
    }
  }
  const source = new ParquetSource(new Blob([parquetBuffer]), {core: {worker: false}});
  const scanPlan = await source.getScanPlan({
    columns: ['id', 'tags'],
    predicate: {op: '=', args: [{property: ['properties', 'label']}, 'first']}
  });
  expect(scanPlan.pages.selected).toBeLessThan(scanPlan.pages.total);
  await source.close();
  const output = await load(parquetBuffer, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table'}
  });
  const objectOutput = await load(parquetBuffer, ParquetJSLoader, {core: {worker: false}});
  expect(objectOutput.shape).toBe('object-row-table');
  if (objectOutput.shape === 'object-row-table') {
    expect(objectOutput.data[0]).toMatchObject({id: 1});
    expect(objectOutput.data[0].tags).toEqual({list: [{element: 'one'}, {element: 'two'}]});
  }

  expect(output.shape).toBe('arrow-table');
  if (output.shape !== 'arrow-table') return;
  expect(output.data.getChild('id')?.toArray()).toEqual(new Int32Array([1, 2]));
  expect(output.data.getChild('tags')?.get(0)?.toArray()).toEqual(['one', 'two']);
  expect(output.data.getChild('tags')?.get(1)?.toArray()).toEqual([]);
  expect(output.data.getChild('nestedTags')?.type).toBeInstanceOf(arrow.List);
  expect(output.data.getChild('attributes')?.get(0)?.toJSON?.()).toEqual({count: 2});
  expect(output.data.getChild('tags')?.type).toBeInstanceOf(arrow.List);
  expect(output.data.getChild('attributes')?.type).toBeInstanceOf(arrow.Map_);
  expect(output.data.getChild('properties')?.type).toBeInstanceOf(arrow.Struct);
});
