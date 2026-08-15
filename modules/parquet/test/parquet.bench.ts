// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GeoParquetLoader, ParquetJSLoader, ParquetLoader} from '@loaders.gl/parquet';
import {fetchFile, load, parse, preload} from '@loaders.gl/core';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/schema';
import {convertTable, makeTableFromData} from '@loaders.gl/schema-utils';
import {parquetRead, parquetReadObjects, type ColumnData} from 'hyparquet';
import {compressors} from 'hyparquet-compressors';

const LZ4_PARQUET_URL =
  '@loaders.gl/parquet/test/data/apache/good/lz4_raw_compressed_larger.parquet';
const HADOOP_LZ4_PARQUET_URL =
  '@loaders.gl/parquet/test/data/apache/good/hadoop_lz4_compressed_larger.parquet';
const DELTA_BYTE_ARRAY_PARQUET_URL =
  '@loaders.gl/parquet/test/data/apache/good/delta_byte_array.parquet';
const DELTA_BINARY_PACKED_PARQUET_URL =
  '@loaders.gl/parquet/test/data/apache/good/delta_binary_packed.parquet';
const DICTIONARY_PARQUET_URL =
  '@loaders.gl/parquet/test/data/apache/good/alltypes_dictionary.parquet';
const FRUITS_PARQUET_URL = '@loaders.gl/parquet/test/data/fruits.parquet';
const GEO_PARQUET_URL = '@loaders.gl/parquet/test/data/geoparquet/airports.parquet';
const BENCHMARK_OPTIONS = {minIterations: 5, unit: 'rows'};
const BENCHMARK_WARMUP_ITERATIONS = 2;

type ParquetBenchmarkScenario = {
  /** Human-readable fixture and projection label. */
  name: string;
  /** Complete Parquet object held outside the timed benchmark callback. */
  arrayBuffer: ArrayBuffer;
  /** Optional top-level Parquet columns decoded by every included implementation. */
  columns?: string[];
  /** Table shape materialized by every included implementation. */
  shape: 'arrow-table' | 'object-row-table';
  /** Implementations included when a backend cannot correctly execute the scenario. */
  implementationIds?: ParquetBenchmarkImplementationId[];
};

type ParquetBenchmarkImplementationId = 'typescript' | 'wasm' | 'hyparquet';

type ParquetBenchmarkImplementation = {
  /** Stable implementation identifier used for scenario selection. */
  id: ParquetBenchmarkImplementationId;
  /** Human-readable implementation and version label. */
  name: string;
  /** Hot decode operation returning the validated output row count. */
  decode: (scenario: ParquetBenchmarkScenario) => Promise<number>;
};

export async function parquetBench(suite) {
  const [
    lz4ParquetResponse,
    hadoopLz4ParquetResponse,
    deltaByteArrayParquetResponse,
    deltaBinaryPackedParquetResponse,
    dictionaryParquetResponse,
    fruitsParquetResponse,
    geoParquetResponse
  ] = await Promise.all([
    fetchFile(LZ4_PARQUET_URL),
    fetchFile(HADOOP_LZ4_PARQUET_URL),
    fetchFile(DELTA_BYTE_ARRAY_PARQUET_URL),
    fetchFile(DELTA_BINARY_PACKED_PARQUET_URL),
    fetchFile(DICTIONARY_PARQUET_URL),
    fetchFile(FRUITS_PARQUET_URL),
    fetchFile(GEO_PARQUET_URL)
  ]);
  const [
    lz4ArrayBuffer,
    hadoopLz4ArrayBuffer,
    deltaByteArrayBuffer,
    deltaBinaryPackedArrayBuffer,
    dictionaryArrayBuffer,
    fruitsArrayBuffer,
    geoArrayBuffer
  ] = await Promise.all([
      lz4ParquetResponse.arrayBuffer(),
      hadoopLz4ParquetResponse.arrayBuffer(),
      deltaByteArrayParquetResponse.arrayBuffer(),
      deltaBinaryPackedParquetResponse.arrayBuffer(),
      dictionaryParquetResponse.arrayBuffer(),
      fruitsParquetResponse.arrayBuffer(),
      geoParquetResponse.arrayBuffer()
    ]);
  const [typescriptLoader, wasmLoader] = await Promise.all([
    preload(ParquetJSLoader, {core: {worker: false}}),
    preload(ParquetLoader, {core: {worker: false}})
  ]);
  const implementations = createParquetBenchmarkImplementations(typescriptLoader, wasmLoader);
  const scenarios: ParquetBenchmarkScenario[] = [
    {name: 'GeoParquet → Arrow', arrayBuffer: geoArrayBuffer, shape: 'arrow-table'},
    {
      name: 'PLAIN nullable primitive projection → Arrow',
      arrayBuffer: fruitsArrayBuffer,
      columns: ['name', 'quantity', 'price', 'date', 'day', 'finger'],
      shape: 'arrow-table',
      // parquet-wasm 0.7.2 retains the unprojected INTERVAL field in its IPC schema.
      implementationIds: ['typescript', 'hyparquet']
    },
    {
      name: 'PLAIN nested and repeated projection → Arrow',
      arrayBuffer: fruitsArrayBuffer,
      columns: ['stock', 'colour'],
      shape: 'arrow-table',
      // parquet-wasm 0.7.2 retains the unprojected INTERVAL field in its IPC schema.
      implementationIds: ['typescript', 'hyparquet']
    },
    {
      name: 'RLE_DICTIONARY small-file latency → Arrow',
      arrayBuffer: dictionaryArrayBuffer,
      shape: 'arrow-table'
    },
    {
      name: 'DELTA_BINARY_PACKED integer table → Arrow',
      arrayBuffer: deltaBinaryPackedArrayBuffer,
      shape: 'arrow-table'
    },
    {
      name: 'LZ4_RAW full table → Arrow',
      arrayBuffer: lz4ArrayBuffer,
      shape: 'arrow-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'Hadoop LZ4 full table → Arrow',
      arrayBuffer: hadoopLz4ArrayBuffer,
      shape: 'arrow-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'DELTA_BYTE_ARRAY full table → Arrow',
      arrayBuffer: deltaByteArrayBuffer,
      shape: 'arrow-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'DELTA_BYTE_ARRAY projected columns → Arrow',
      arrayBuffer: deltaByteArrayBuffer,
      columns: ['c_customer_id', 'c_email_address'],
      shape: 'arrow-table',
      // parquet-wasm 0.7.2 currently returns mismatched IPC schema/vector counts for this projection.
      implementationIds: ['typescript', 'hyparquet']
    },
    {
      name: 'DELTA_BYTE_ARRAY full table → object rows',
      arrayBuffer: deltaByteArrayBuffer,
      shape: 'object-row-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    }
  ];

  for (const scenario of scenarios) {
    const scenarioImplementations = scenario.implementationIds
      ? implementations.filter(implementation =>
          scenario.implementationIds?.includes(implementation.id)
        )
      : implementations;
    const rowCount = await validateParquetBenchmarkScenario(scenario, scenarioImplementations);
    suite = suite.groupSorted(`Parquet decode - ${scenario.name}`);

    for (const implementation of scenarioImplementations) {
      suite.addAsync(
        `${implementation.name} - ${scenario.name}`,
        {...BENCHMARK_OPTIONS, multiplier: rowCount},
        async () => {
          const decodedRowCount = await implementation.decode(scenario);
          if (decodedRowCount !== rowCount) {
            throw new Error(
              `${implementation.name} decoded ${decodedRowCount} rows; expected ${rowCount}`
            );
          }
        }
      );
    }
  }

  suite = suite.group('GeoParquetLoader');

  suite.addAsync(
    'load arrow-table geoarrow.wkb',
    {multiplier: 40000, unit: 'rows'},
    async () => {
      await load(geoArrayBuffer.slice(0), GeoParquetLoader, {
        core: {worker: false},
        parquet: {shape: 'arrow-table'}
      });
    }
  );

  suite.addAsync(
    'load geojson-table',
    {multiplier: 40000, unit: 'rows'},
    async () => {
      await load(geoArrayBuffer.slice(0), GeoParquetLoader, {
        core: {worker: false}
      });
    }
  );

  // suite.addAsync('load(ParquetColumnarLoader) - GeoParquet load', {multiplier: 40000, unit: 'rows'}, async () => {
  //   await load(geoArrayBuffer, ParquetColumnarLoader, {
  //     core: {worker: false}
  //   });
  // });
}

/** Creates equivalent Arrow-table decode cases for the maintained Parquet implementations. */
function createParquetBenchmarkImplementations(
  typescriptLoader: LoaderWithParser,
  wasmLoader: LoaderWithParser
): ParquetBenchmarkImplementation[] {
  return [
    {
      id: 'typescript',
      name: 'ParquetJSLoader',
      decode: scenario => decodeWithLoadersGl(scenario, typescriptLoader)
    },
    {
      id: 'wasm',
      name: 'ParquetLoader',
      decode: scenario => decodeWithLoadersGl(scenario, wasmLoader)
    },
    {
      id: 'hyparquet',
      name: 'hyparquet',
      decode: decodeWithHyparquet
    }
  ];
}

/** Decodes one scenario through a preloaded loaders.gl implementation. */
async function decodeWithLoadersGl(
  scenario: ParquetBenchmarkScenario,
  loader: LoaderWithParser
): Promise<number> {
  const table = (await parse(scenario.arrayBuffer, loader, {
    core: {worker: false},
    parquet: {columns: scenario.columns, shape: scenario.shape}
  })) as ArrowTable | ObjectRowTable;
  return table.shape === 'arrow-table' ? table.data.numRows : table.data.length;
}

/** Decodes one scenario through the latest pinned hyparquet implementation. */
async function decodeWithHyparquet(scenario: ParquetBenchmarkScenario): Promise<number> {
  if (scenario.shape === 'object-row-table') {
    const rows = await parquetReadObjects({
      file: scenario.arrayBuffer,
      columns: scenario.columns,
      compressors
    });
    return rows.length;
  }

  const columns: Record<string, unknown[]> = {};
  await parquetRead({
    file: scenario.arrayBuffer,
    columns: scenario.columns,
    onChunk: chunk => appendHyparquetColumnChunk(columns, chunk),
    compressors
  });
  const columnarTable = makeTableFromData(columns);
  const arrowTable = convertTable(columnarTable, 'arrow-table');
  return arrowTable.data.numRows;
}

/** Copies one hyparquet output chunk into a contiguous top-level column. */
function appendHyparquetColumnChunk(
  columns: Record<string, unknown[]>,
  chunk: ColumnData
): void {
  const column = columns[chunk.columnName] || [];
  column.length = Math.max(column.length, chunk.rowEnd);
  for (let valueIndex = 0; valueIndex < chunk.columnData.length; valueIndex++) {
    column[chunk.rowStart + valueIndex] = chunk.columnData[valueIndex];
  }
  columns[chunk.columnName] = column;
}

/** Warms every implementation and verifies that benchmark throughput uses a common row count. */
async function validateParquetBenchmarkScenario(
  scenario: ParquetBenchmarkScenario,
  implementations: ParquetBenchmarkImplementation[]
): Promise<number> {
  const rowCounts: number[] = [];
  for (const implementation of implementations) {
    try {
      let rowCount = 0;
      for (let iteration = 0; iteration < BENCHMARK_WARMUP_ITERATIONS; iteration++) {
        rowCount = await implementation.decode(scenario);
      }
      rowCounts.push(rowCount);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${scenario.name} / ${implementation.name}: ${message}`, {cause: error});
    }
  }

  const expectedRowCount = rowCounts[0];
  for (
    let implementationIndex = 1;
    implementationIndex < implementations.length;
    implementationIndex++
  ) {
    if (rowCounts[implementationIndex] !== expectedRowCount) {
      throw new Error(
        `${implementations[implementationIndex].name} decoded ${rowCounts[implementationIndex]} rows from ${scenario.name}; expected ${expectedRowCount}`
      );
    }
  }
  return expectedRowCount;
}
