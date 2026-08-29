// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';

import {ArrowTableSource} from '@loaders.gl/arrow';
import {CSVTableSource} from '@loaders.gl/csv';
import {NDJSONTableSource} from '@loaders.gl/json';
import {DataSourceManager, type ScanExecutionTelemetry} from '@loaders.gl/loader-utils';
import {ParquetJSWriter} from '@loaders.gl/parquet';
import {DeltaTableSource} from '../src/delta';
import {IcebergTableSource} from '../src/iceberg';
import {ParquetSource} from '@loaders.gl/parquet/parquet-source-loader';
import type {Schema} from '@loaders.gl/schema';
import {parseSQLPredicate} from '@loaders.gl/sql';

import {FederatedTableScanSource} from '../src/federated-table-scan-source';

const OUTPUT_SCHEMA: Schema = {
  fields: [
    {name: 'id', type: 'float64', nullable: true},
    {name: 'label', type: 'utf8', nullable: true},
    {name: 'format', type: 'utf8', nullable: true}
  ],
  metadata: {}
};

test('exposes incubating table-format entry points without extending the scan root', () => {
  expect(IcebergTableSource).toBeDefined();
  expect(DeltaTableSource).toBeDefined();
});

test('federates actual CSV, NDJSON, Arrow IPC, and Parquet sources', async () => {
  const parquetBytes = await ParquetJSWriter.encode({
    shape: 'object-row-table',
    schema: OUTPUT_SCHEMA,
    data: [
      {id: 7, label: 'golf', format: 'parquet'},
      {id: 8, label: 'hotel', format: 'parquet'}
    ]
  });
  const sources = {
    csv: new CSVTableSource(new Blob(['id,label,format\n1,alpha,csv\n2,bravo,csv\n']), {
      csv: {batchSize: 1}
    }),
    ndjson: new NDJSONTableSource(
      new Blob([
        '{"id":3,"label":"charlie","format":"ndjson"}\n',
        '{"id":4,"label":"delta","format":"ndjson"}\n'
      ]),
      {ndjson: {batchSize: 1}}
    ),
    arrow: new ArrowTableSource(
      new Blob([
        arrow.tableToIPC(
          arrow.tableFromArrays({
            id: [5, 6],
            label: ['echo', 'foxtrot'],
            format: ['arrow', 'arrow']
          })
        )
      ])
    ),
    parquet: new ParquetSource(new Blob([parquetBytes]), {core: {worker: false}})
  };
  const dataSourceManager = new DataSourceManager();
  for (const [dataSourceId, dataSource] of Object.entries(sources)) {
    dataSourceManager.add({dataSourceId, dataSource});
  }

  const discovered = await dataSourceManager.discoverDataSources({queryType: 'table'});
  expect(discovered.map(source => [source.dataSourceId, source.compatible])).toEqual([
    ['csv', true],
    ['ndjson', true],
    ['arrow', true],
    ['parquet', true]
  ]);

  const source = new FederatedTableScanSource(dataSourceManager, {
    name: 'heterogeneous-history',
    schemaPolicy: 'strict',
    outputSchema: OUTPUT_SCHEMA,
    sources: Object.keys(sources).map(dataSourceId => ({dataSourceId}))
  });
  const explanation = await source.explain({
    predicate: parseSQLPredicate('id >= 2'),
    columns: ['id', 'label'],
    limit: 7
  });
  expect(explanation.sources.map(entry => entry.sourceType)).toEqual([
    'csv',
    'ndjson',
    'arrow',
    'parquet'
  ]);

  const provenance: string[] = [];
  const rows: Record<string, unknown>[] = [];
  let telemetry: ScanExecutionTelemetry | undefined;
  for await (const batch of source.read({
    predicate: parseSQLPredicate('id >= 2'),
    columns: ['id', 'label'],
    limit: 7,
    onTelemetry: value => {
      telemetry = value;
    }
  })) {
    provenance.push(batch.sourceId);
    rows.push(...batch.data.toArray().map(row => row.toJSON()));
  }

  expect(rows).toEqual([
    {id: 2, label: 'bravo'},
    {id: 3, label: 'charlie'},
    {id: 4, label: 'delta'},
    {id: 5, label: 'echo'},
    {id: 6, label: 'foxtrot'},
    {id: 7, label: 'golf'},
    {id: 8, label: 'hotel'}
  ]);
  expect(provenance).toEqual(['csv', 'ndjson', 'ndjson', 'arrow', 'parquet']);
  expect(telemetry).toMatchObject({
    status: 'completed',
    sourcesPlanned: 4,
    sourcesRead: 4,
    rowsReturned: 7,
    sources: [
      {sourceId: 'csv', sourceType: 'csv'},
      {sourceId: 'ndjson', sourceType: 'ndjson'},
      {sourceId: 'arrow', sourceType: 'arrow'},
      {sourceId: 'parquet', sourceType: 'parquet'}
    ]
  });
  await sources.parquet.close();
});

test('federates an actual Delta snapshot with another table source', async () => {
  const parquetBytes = await ParquetJSWriter.encode({
    shape: 'object-row-table',
    schema: OUTPUT_SCHEMA,
    data: [
      {id: 9, label: 'india', format: 'delta'},
      {id: 10, label: 'juliet', format: 'delta'}
    ]
  });
  const dataUrl = 'https://example.com/history/part-0.parquet';
  const delta = new DeltaTableSource(
    new Blob([
      JSON.stringify({
        add: {
          path: 'part-0.parquet',
          size: parquetBytes.byteLength,
          stats: {numRecords: 2}
        }
      })
    ]),
    {
      delta: {baseUrl: 'https://example.com/history/'},
      core: {
        worker: false,
        loadOptions: {core: {fetch: createRangeFetch(dataUrl, parquetBytes)}}
      }
    }
  );
  const arrowSource = new ArrowTableSource(
    new Blob([
      arrow.tableToIPC(arrow.tableFromArrays({id: [11], label: ['kilo'], format: ['arrow']}))
    ])
  );
  const dataSourceManager = new DataSourceManager();
  dataSourceManager.add({dataSourceId: 'delta', dataSource: delta});
  dataSourceManager.add({dataSourceId: 'live', dataSource: arrowSource});
  const source = new FederatedTableScanSource(dataSourceManager, {
    outputSchema: OUTPUT_SCHEMA,
    sources: [{dataSourceId: 'delta'}, {dataSourceId: 'live'}]
  });

  const rows: Record<string, unknown>[] = [];
  for await (const batch of source.read()) {
    rows.push(...batch.data.toArray().map(row => row.toJSON()));
  }
  expect(rows).toEqual([
    {id: 9, label: 'india', format: 'delta'},
    {id: 10, label: 'juliet', format: 'delta'},
    {id: 11, label: 'kilo', format: 'arrow'}
  ]);
  expect((await source.explain()).sources.map(entry => entry.sourceType)).toEqual([
    'delta',
    'arrow'
  ]);
});

/** Creates a strict byte-range fetch implementation for one in-memory object. */
function createRangeFetch(
  expectedUrl: string,
  bytes: ArrayBuffer
): (url: string, options?: RequestInit) => Promise<Response> {
  return async (url, options) => {
    if (url !== expectedUrl) return new Response(null, {status: 404});
    const range = new Headers(options?.headers).get('range');
    if (!range) {
      return new Response(bytes, {
        headers: {'Accept-Ranges': 'bytes', 'Content-Length': String(bytes.byteLength)}
      });
    }
    const match = /^bytes=(\d+)-(\d+)$/.exec(range);
    if (!match) return new Response(null, {status: 416});
    const start = Number(match[1]);
    const end = Math.min(Number(match[2]), bytes.byteLength - 1);
    return new Response(bytes.slice(start, end + 1), {
      status: 206,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${start}-${end}/${bytes.byteLength}`
      }
    });
  };
}
