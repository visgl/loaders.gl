// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useState} from 'react';

import {Bench, type LogEntry} from '@probe.gl/bench';
import {BenchResults} from '@probe.gl/react-bench';
import {parse} from '@loaders.gl/core';
import {ParquetJSLoader, ParquetLoader} from '@loaders.gl/parquet/bundled';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {parquetReadObjects} from 'hyparquet';
import {compressors} from 'hyparquet-compressors';

const PARQUET_FIXTURE_ROOT =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/parquet/test/data';
const GEOPARQUET_URL = `${PARQUET_FIXTURE_ROOT}/geoparquet/airports.parquet`;
const LZ4_PARQUET_URL = `${PARQUET_FIXTURE_ROOT}/apache/good/lz4_raw_compressed_larger.parquet`;
const DELTA_BYTE_ARRAY_PARQUET_URL = `${PARQUET_FIXTURE_ROOT}/apache/good/delta_byte_array.parquet`;
const BENCHMARK_OPTIONS = {minIterations: 3, unit: 'rows'};

type BenchmarkResultRow = {
  /** Stable benchmark or group label. */
  id: React.ReactNode;
  /** Numeric throughput used by the result renderer. */
  value?: number;
  /** Human-readable throughput. */
  formattedValue?: string;
  /** Human-readable measurement error. */
  formattedError?: string;
};

type BenchmarkStatus = 'loading' | 'running' | 'complete' | 'failed';

type ParquetBenchmarkImplementationId = 'typescript' | 'wasm' | 'hyparquet';

type ParquetBenchmarkScenario = {
  /** Human-readable fixture and feature label. */
  name: string;
  /** Complete fixture bytes held outside the timed callback. */
  arrayBuffer: ArrayBuffer;
  /** Implementations that currently support the fixture features. */
  implementationIds: ParquetBenchmarkImplementationId[];
};

type ParquetBenchmarkImplementation = {
  /** Stable implementation identifier used for scenario selection. */
  id: ParquetBenchmarkImplementationId;
  /** Human-readable implementation label. */
  name: string;
  /** Hot object-row decode operation returning the output row count. */
  decode: (scenario: ParquetBenchmarkScenario) => Promise<number>;
};

/** Renders live comparative Parquet decode benchmarks in the visitor's browser. */
export default function ParquetBenchmarksApp(): JSX.Element {
  const [rows, setRows] = useState<BenchmarkResultRow[]>([]);
  const [status, setStatus] = useState<BenchmarkStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setRows([]);
    setStatus('loading');
    setErrorMessage(null);

    /** Appends one probe.gl log entry to the rendered table state. */
    const appendLogEntry = (entry: LogEntry): void => {
      if (!isMounted) {
        return;
      }
      const row = createBenchmarkResultRow(entry);
      if (row) {
        setRows(previousRows => [...previousRows, row]);
      }
    };

    /** Loads the fixtures, validates each scenario, and runs the browser suite. */
    const runBenchmarks = async (): Promise<void> => {
      try {
        const scenarios = await createParquetBenchmarkScenarios();
        const implementations = createParquetBenchmarkImplementations();
        const bench = new Bench({
          id: 'loaders-gl-parquet-website-benchmarks',
          log: appendLogEntry
        });
        await addParquetBenchmarksToSuite(bench, scenarios, implementations);
        if (isMounted) {
          setStatus('running');
        }
        await bench.calibrate().run();
        if (isMounted) {
          setStatus('complete');
        }
      } catch (error) {
        if (isMounted) {
          setStatus('failed');
          setErrorMessage(error instanceof Error ? error.message : String(error));
        }
      }
    };

    runBenchmarks();

    return () => {
      isMounted = false;
    };
  }, [runId]);

  /** Starts a fresh browser benchmark run. */
  const restartBenchmarks = (): void => {
    setRunId(previousRunId => previousRunId + 1);
  };

  const isRunning = status === 'loading' || status === 'running';
  const canRestart = status === 'complete' || status === 'failed';

  return (
    <div className="benchmark-page">
      <p>Live Parquet object-row decode throughput. Keep this tab focused while it runs.</p>
      <div className="benchmark-status-row" aria-live="polite">
        {isRunning ? <span className="benchmark-spinner" aria-hidden="true" /> : null}
        <p className="benchmark-status">Status: {status}</p>
        {canRestart ? (
          <button className="benchmark-restart-button" type="button" onClick={restartBenchmarks}>
            Restart
          </button>
        ) : null}
      </div>
      {errorMessage ? <pre className="benchmark-error">{errorMessage}</pre> : null}
      <div className="benchmark-results">
        <BenchResults log={rows} />
      </div>
    </div>
  );
}

/** Fetches the representative fixtures used by the live benchmark suite. */
async function createParquetBenchmarkScenarios(): Promise<ParquetBenchmarkScenario[]> {
  const [geoParquetArrayBuffer, lz4ArrayBuffer, deltaByteArrayBuffer] = await Promise.all([
    fetchParquetFixture(GEOPARQUET_URL),
    fetchParquetFixture(LZ4_PARQUET_URL),
    fetchParquetFixture(DELTA_BYTE_ARRAY_PARQUET_URL)
  ]);
  return [
    {
      name: 'GeoParquet object rows',
      arrayBuffer: geoParquetArrayBuffer,
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'LZ4_RAW object rows',
      arrayBuffer: lz4ArrayBuffer,
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'DELTA_BYTE_ARRAY object rows',
      arrayBuffer: deltaByteArrayBuffer,
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    }
  ];
}

/** Fetches and validates one Parquet fixture response. */
async function fetchParquetFixture(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Parquet benchmark fixture: ${response.status}`);
  }
  return await response.arrayBuffer();
}

/** Creates equivalent object-row decode cases for browser-capable implementations. */
function createParquetBenchmarkImplementations(): ParquetBenchmarkImplementation[] {
  return [
    {id: 'typescript', name: 'loaders.gl TypeScript', decode: decodeWithLoadersGlTypeScript},
    {id: 'wasm', name: 'loaders.gl / parquet-wasm', decode: decodeWithLoadersGlWasm},
    {id: 'hyparquet', name: 'hyparquet', decode: decodeWithHyparquet}
  ];
}

/** Adds validated scenarios to the browser benchmark suite. */
async function addParquetBenchmarksToSuite(
  bench: Bench,
  scenarios: ParquetBenchmarkScenario[],
  implementations: ParquetBenchmarkImplementation[]
): Promise<void> {
  for (const scenario of scenarios) {
    const scenarioImplementations = implementations.filter(implementation =>
      scenario.implementationIds.includes(implementation.id)
    );
    const rowCount = await validateParquetBenchmarkScenario(scenario, scenarioImplementations);
    bench.group(`Parquet decode - ${scenario.name}`);
    for (const implementation of scenarioImplementations) {
      bench.addAsync(
        implementation.name,
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
}

/** Warms each implementation and verifies a common output row count. */
async function validateParquetBenchmarkScenario(
  scenario: ParquetBenchmarkScenario,
  implementations: ParquetBenchmarkImplementation[]
): Promise<number> {
  const rowCounts = await Promise.all(
    implementations.map(implementation => implementation.decode(scenario))
  );
  const expectedRowCount = rowCounts[0];
  for (let index = 1; index < rowCounts.length; index++) {
    if (rowCounts[index] !== expectedRowCount) {
      throw new Error(
        `${implementations[index].name} decoded ${rowCounts[index]} rows from ${scenario.name}; expected ${expectedRowCount}`
      );
    }
  }
  return expectedRowCount;
}

/** Decodes object rows with the loaders.gl TypeScript backend. */
async function decodeWithLoadersGlTypeScript(
  scenario: ParquetBenchmarkScenario
): Promise<number> {
  const table = (await parse(scenario.arrayBuffer, ParquetJSLoader, {
    core: {worker: false},
    parquet: {backend: 'typescript'}
  })) as ObjectRowTable;
  return table.data.length;
}

/** Decodes object rows with the loaders.gl parquet-wasm backend. */
async function decodeWithLoadersGlWasm(scenario: ParquetBenchmarkScenario): Promise<number> {
  const table = (await parse(scenario.arrayBuffer, ParquetLoader, {
    core: {worker: false},
    parquet: {backend: 'wasm'}
  })) as ObjectRowTable;
  return table.data.length;
}

/** Decodes object rows with hyparquet and the official compressor add-on. */
async function decodeWithHyparquet(scenario: ParquetBenchmarkScenario): Promise<number> {
  const rows = await parquetReadObjects({file: scenario.arrayBuffer, compressors});
  return rows.length;
}

/** Converts one probe.gl log entry into a result table row. */
function createBenchmarkResultRow(entry: LogEntry): BenchmarkResultRow | null {
  switch (entry.type) {
    case 'group':
      return {id: entry.id};
    case 'test':
      return {
        id: entry.id,
        value: Number.parseFloat(entry.itersPerSecond),
        formattedValue: entry.itersPerSecond,
        formattedError: `${(entry.error * 100).toFixed(2)}%`
      };
    case 'complete':
      return null;
    default:
      return null;
  }
}
