// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';

import {ArrowTableSource} from '@loaders.gl/arrow';
import {CSVTableSource} from '@loaders.gl/csv';
import {NDJSONTableSource} from '@loaders.gl/json';
import {ParquetJSWriter} from '@loaders.gl/parquet';
import {ParquetSource} from '@loaders.gl/parquet/parquet-source-loader';

import {describeTableScanSourceConformance} from './common/table-scan-source-conformance';

const CSV_TEXT = 'name,score\none,1\ntwo,2\nthree,3\n';
const NDJSON_TEXT = [
  '{"name":"one","score":1}',
  '{"name":"two","score":2}',
  '{"name":"three","score":3}'
].join('\n');
const CONFORMANCE_SOURCE_NAMES = ['Arrow IPC', 'CSV', 'NDJSON', 'Parquet'];

test('portable scan conformance covers every supported linear source family', () => {
  expect(CONFORMANCE_SOURCE_NAMES).toEqual(['Arrow IPC', 'CSV', 'NDJSON', 'Parquet']);
});

describeTableScanSourceConformance({
  name: CONFORMANCE_SOURCE_NAMES[0],
  createFixture: () => ({
    source: new ArrowTableSource(
      new Blob([
        arrow.tableToIPC(arrow.tableFromArrays({name: ['one', 'two', 'three'], score: [1, 2, 3]}))
      ])
    )
  })
});

describeTableScanSourceConformance({
  name: CONFORMANCE_SOURCE_NAMES[1],
  createFixture: () => ({
    source: new CSVTableSource(new Blob([CSV_TEXT]), {csv: {batchSize: 1}})
  })
});

describeTableScanSourceConformance({
  name: CONFORMANCE_SOURCE_NAMES[2],
  createFixture: () => ({
    source: new NDJSONTableSource(new Blob([NDJSON_TEXT]), {ndjson: {batchSize: 1}})
  })
});

describeTableScanSourceConformance({
  name: CONFORMANCE_SOURCE_NAMES[3],
  createFixture: async () => {
    const bytes = await ParquetJSWriter.encode({
      shape: 'object-row-table',
      schema: {
        fields: [
          {name: 'name', type: 'utf8', nullable: false},
          {name: 'score', type: 'int32', nullable: false}
        ],
        metadata: {}
      },
      data: [
        {name: 'one', score: 1},
        {name: 'two', score: 2},
        {name: 'three', score: 3}
      ]
    });
    const source = new ParquetSource(new Blob([bytes]), {core: {worker: false}});
    return {source, close: () => source.close()};
  }
});
