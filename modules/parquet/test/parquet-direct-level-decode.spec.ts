// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {fetchFile} from '@loaders.gl/core';
import {ArrayBufferFile} from '@loaders.gl/loader-utils';

import {ParquetReader} from '../src/parquetjs/parser/parquet-reader';

const TEST_CASES = [
  {
    name: 'data page v1',
    url: '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet',
    columnKey: 'string_col',
    rlevels: [0, 0, 0, 0, 0, 0, 0, 0],
    dlevels: [1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'data page v2',
    url: '@loaders.gl/parquet/test/data/apache/good/datapage_v2.snappy.parquet',
    columnKey: 'e,list,element',
    rlevels: [0, 1, 1, 0, 0, 0, 1, 1, 0, 1],
    dlevels: [2, 2, 2, 0, 0, 2, 2, 2, 2, 2]
  }
] as const;

describe('Parquet direct level decoding', () => {
  test.each(TEST_CASES)(
    'decodes $name levels into column buffers',
    async ({url, columnKey, rlevels, dlevels}) => {
      const response = await fetchFile(url);
      const arrayBuffer = await response.arrayBuffer();
      const reader = new ParquetReader(new ArrayBufferFile(arrayBuffer));
      const rowGroup = (await reader.rowGroupIterator().next()).value;

      expect(rowGroup).toBeDefined();
      if (!rowGroup) {
        throw new Error('Expected one Parquet row group');
      }
      expect(rowGroup.columnData[columnKey].rlevels).toEqual(rlevels);
      expect(rowGroup.columnData[columnKey].dlevels).toEqual(dlevels);

      reader.close();
    }
  );
});
