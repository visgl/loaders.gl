// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GeoParquetLoader, ParquetJSLoader, ParquetLoader} from '@loaders.gl/parquet';
import {fetchFile, load, parse, preload} from '@loaders.gl/core';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {ParquetReader} from '@dsnp/parquetjs';
import {parquetReadObjects} from 'hyparquet';
import {compressors} from 'hyparquet-compressors';

const PARQUET_URL = '@loaders.gl/parquet/test/data/fruits.parquet';
const LZ4_PARQUET_URL =
  '@loaders.gl/parquet/test/data/apache/good/lz4_raw_compressed_larger.parquet';
const HADOOP_LZ4_PARQUET_URL =
  '@loaders.gl/parquet/test/data/apache/good/hadoop_lz4_compressed_larger.parquet';
const DELTA_BYTE_ARRAY_PARQUET_URL =
  '@loaders.gl/parquet/test/data/apache/good/delta_byte_array.parquet';
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
  /** Implementations included when a backend cannot correctly execute the scenario. */
  implementationIds?: ParquetBenchmarkImplementationId[];
};

type ParquetBenchmarkImplementationId = 'typescript' | 'wasm' | 'hyparquet' | 'parquetjs';

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
    parquetResponse,
    lz4ParquetResponse,
    hadoopLz4ParquetResponse,
    deltaByteArrayParquetResponse,
    geoParquetResponse
  ] = await Promise.all([
    fetchFile(PARQUET_URL),
    fetchFile(LZ4_PARQUET_URL),
    fetchFile(HADOOP_LZ4_PARQUET_URL),
    fetchFile(DELTA_BYTE_ARRAY_PARQUET_URL),
    fetchFile(GEO_PARQUET_URL)
  ]);
  const [arrayBuffer, lz4ArrayBuffer, hadoopLz4ArrayBuffer, deltaByteArrayBuffer, geoArrayBuffer] =
    await Promise.all([
      parquetResponse.arrayBuffer(),
      lz4ParquetResponse.arrayBuffer(),
      hadoopLz4ParquetResponse.arrayBuffer(),
      deltaByteArrayParquetResponse.arrayBuffer(),
      geoParquetResponse.arrayBuffer()
    ]);
  const [typescriptLoader, wasmLoader] = await Promise.all([
    preload(ParquetJSLoader, {core: {worker: false}}),
    preload(ParquetLoader, {core: {worker: false}, parquet: {backend: 'wasm'}})
  ]);
  const implementations = createParquetBenchmarkImplementations(typescriptLoader, wasmLoader);
  const scenarios: ParquetBenchmarkScenario[] = [
    {name: 'GeoParquet object rows', arrayBuffer: geoArrayBuffer},
    {
      name: 'LZ4_RAW full table',
      arrayBuffer: lz4ArrayBuffer,
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'Hadoop LZ4 full table',
      arrayBuffer: hadoopLz4ArrayBuffer,
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'DELTA_BYTE_ARRAY full table',
      arrayBuffer: deltaByteArrayBuffer,
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'DELTA_BYTE_ARRAY projected columns',
      arrayBuffer: deltaByteArrayBuffer,
      columns: ['c_customer_id', 'c_email_address'],
      // parquet-wasm 0.7.2 currently returns mismatched IPC schema/vector counts for this projection.
      implementationIds: ['typescript', 'hyparquet']
    }
  ];

  for (const scenario of scenarios) {
    const scenarioImplementations = scenario.implementationIds
      ? implementations.filter(implementation =>
          scenario.implementationIds?.includes(implementation.id)
        )
      : implementations;
    const rowCount = await validateParquetBenchmarkScenario(scenario, scenarioImplementations);
    suite = suite.groupSorted(`Parquet object-row decode - ${scenario.name}`);

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

  suite = suite.group('ParquetLoader Arrow');

  suite.addAsync(
    "load(ParquetLoader, shape: 'arrow-table') - Parquet load",
    {multiplier: 40000, unit: 'rows'},
    async () => {
      await load(arrayBuffer, ParquetLoader, {
        core: {worker: false},
        parquet: {shape: 'arrow-table'}
      });
    }
  );

  suite.addAsync(
    "load(ParquetLoader, shape: 'arrow-table') - GeoParquet load",
    {multiplier: 40000, unit: 'rows'},
    async () => {
      await load(geoArrayBuffer, ParquetLoader, {
        core: {worker: false},
        parquet: {shape: 'arrow-table'}
      });
    }
  );

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

/** Creates equivalent object-row decode cases for the maintained Parquet implementations. */
function createParquetBenchmarkImplementations(
  typescriptLoader: LoaderWithParser,
  wasmLoader: LoaderWithParser
): ParquetBenchmarkImplementation[] {
  return [
    {
      id: 'typescript',
      name: 'loaders.gl TypeScript',
      decode: scenario => decodeWithLoadersGl(scenario, typescriptLoader, 'typescript')
    },
    {
      id: 'wasm',
      name: 'loaders.gl parquet-wasm',
      decode: scenario => decodeWithLoadersGl(scenario, wasmLoader, 'wasm')
    },
    {
      id: 'hyparquet',
      name: 'hyparquet',
      decode: decodeWithHyparquet
    },
    {
      id: 'parquetjs',
      name: '@dsnp/parquetjs',
      decode: decodeWithParquetJs
    }
  ];
}

/** Decodes one scenario through a preloaded loaders.gl implementation. */
async function decodeWithLoadersGl(
  scenario: ParquetBenchmarkScenario,
  loader: LoaderWithParser,
  backend: 'typescript' | 'wasm'
): Promise<number> {
  const table = (await parse(scenario.arrayBuffer, loader, {
    core: {worker: false},
    parquet: {backend, columns: scenario.columns}
  })) as ObjectRowTable;
  return table.data.length;
}

/** Decodes one scenario through the latest pinned hyparquet implementation. */
async function decodeWithHyparquet(scenario: ParquetBenchmarkScenario): Promise<number> {
  const rows = await parquetReadObjects({
    file: scenario.arrayBuffer,
    columns: scenario.columns,
    compressors
  });
  return rows.length;
}

/** Decodes one scenario through the maintained parquetjs implementation. */
async function decodeWithParquetJs(scenario: ParquetBenchmarkScenario): Promise<number> {
  const reader = await ParquetReader.openBuffer(Buffer.from(scenario.arrayBuffer));
  try {
    const columnList = scenario.columns?.map(column => [column]);
    const cursor = reader.getCursor(columnList);
    let rowCount = 0;
    while (await cursor.next()) {
      rowCount++;
    }
    return rowCount;
  } finally {
    await reader.close();
  }
}

/** Warms every implementation and verifies that benchmark throughput uses a common row count. */
async function validateParquetBenchmarkScenario(
  scenario: ParquetBenchmarkScenario,
  implementations: ParquetBenchmarkImplementation[]
): Promise<number> {
  const rowCounts: number[] = [];
  for (const implementation of implementations) {
    let rowCount = 0;
    for (let iteration = 0; iteration < BENCHMARK_WARMUP_ITERATIONS; iteration++) {
      rowCount = await implementation.decode(scenario);
    }
    rowCounts.push(rowCount);
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
