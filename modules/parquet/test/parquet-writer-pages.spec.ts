// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encode, load} from '@loaders.gl/core';
import {BlobFile} from '@loaders.gl/loader-utils';
import {ParquetJSLoader, ParquetJSWriter, ParquetReader} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {expect, test} from 'vitest';

const INPUT: ObjectRowTable = {
  shape: 'object-row-table',
  schema: {
    fields: [{name: 'value', type: 'int32', nullable: false}],
    metadata: {}
  },
  data: [{value: 10}, {value: 20}, {value: 30}, {value: 40}, {value: 50}]
};

test.each([false, true])(
  'ParquetJSWriter emits multiple row-aligned pages with Data Page V2=%s',
  async useDataPageV2 => {
    const parquetBuffer = await encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {pageSize: 2, useDataPageV2}
    });
    const output = await load(parquetBuffer, ParquetJSLoader, {core: {worker: false}});
    expect(output).toMatchObject({shape: 'object-row-table', data: INPUT.data});

    const reader = new ParquetReader(new BlobFile(parquetBuffer));
    const metadata = await reader.getFileMetadata();
    const rowGroup = await reader.readRowGroup(
      await reader.getSchema(),
      metadata.row_groups[0],
      []
    );
    const pageHeaders = rowGroup.columnData.value.pageHeaders;
    expect(pageHeaders).toHaveLength(3);
    if (useDataPageV2) {
      expect(pageHeaders.map(page => page.data_page_header_v2?.num_rows)).toEqual([2, 2, 1]);
    }
  }
);
