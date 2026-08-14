// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useState} from 'react';

import {Bench, type LogEntry} from '@probe.gl/bench';
import {BenchResults} from '@probe.gl/react-bench';
import type {ObjectRowTable} from '@loaders.gl/schema';

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

type ValidatedParquetBenchmarkImplementation = {
  /** Implementation that completed the scenario warm-up. */
  implementation: ParquetBenchmarkImplementation;
  /** Row count produced during warm-up. */
  rowCount: number;
};

/** Renders live comparative Parquet decode benchmarks in the visitor's browser. */
export default function ParquetBenchmarksApp(): JSX.Element {
  const [rows, setRows] = useState<BenchmarkResultRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<BenchmarkStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setRows([]);
    setWarnings([]);
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

    /** Records an implementation/scenario pair skipped during warm-up. */
    const appendWarning = (warning: string): void => {
      if (isMounted) {
        setWarnings(previousWarnings => [...previousWarnings, warning]);
      }
    };

    /** Loads the fixtures, validates each scenario, and runs the browser suite. */
    const runBenchmarks = async (): Promise<void> => {
      try {
        const scenarios = await runBenchmarkPhase(
          'Fixture setup failed',
          createParquetBenchmarkScenarios
        );
        const implementations = await runBenchmarkPhase(
          'Implementation setup failed',
          createParquetBenchmarkImplementations
        );
        const bench = await runBenchmarkPhase(
          'Benchmark initialization failed',
          async () =>
            new Bench({
              id: 'loaders-gl-parquet-website-benchmarks',
              log: appendLogEntry
            })
        );
        await runBenchmarkPhase('Benchmark warm-up failed', async () => {
          await addParquetBenchmarksToSuite(bench, scenarios, implementations, appendWarning);
        });
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
      {warnings.length > 0 ? (
        <aside>
          <strong>Skipped benchmark cases</strong>
          <ul>
            {warnings.map(warning => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </aside>
      ) : null}
      <div className="benchmark-results">
        <BenchResults log={rows} />
      </div>
    </div>
  );
}

/** Adds a stable phase label to browser benchmark setup failures. */
async function runBenchmarkPhase<Result>(
  label: string,
  operation: () => Promise<Result>
): Promise<Result> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label}: ${message}`);
  }
}

/** Fetches the representative fixtures used by the live benchmark suite. */
async function createParquetBenchmarkScenarios(): Promise<ParquetBenchmarkScenario[]> {
  const geoParquetUrl = new URL(
    '../../../modules/parquet/test/data/geoparquet/airports.parquet',
    import.meta.url
  ).toString();
  const lz4Url = new URL(
    '../../../modules/parquet/test/data/apache/good/lz4_raw_compressed_larger.parquet',
    import.meta.url
  ).toString();
  const deltaByteArrayUrl = new URL(
    '../../../modules/parquet/test/data/apache/good/delta_byte_array.parquet',
    import.meta.url
  ).toString();
  const geoParquetArrayBuffer = await fetchParquetFixture(geoParquetUrl);
  const lz4ArrayBuffer = await fetchParquetFixture(lz4Url);
  const deltaByteArrayBuffer = await fetchParquetFixture(deltaByteArrayUrl);
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
  const response = await globalThis.fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Parquet benchmark fixture: ${response.status}`);
  }
  return await response.arrayBuffer();
}

/** Loads browser implementations and creates equivalent object-row decode cases. */
async function createParquetBenchmarkImplementations(): Promise<
  ParquetBenchmarkImplementation[]
> {
  const [
    loadersGlLoaderUtils,
    loadersGlTypeScript,
    loadersGlWasm,
    loadersGlTableConverters,
    hyparquet,
    hyparquetCompressors
  ] = await Promise.all([
    import('@loaders.gl/loader-utils'),
    import('../../../modules/parquet/src/parquet-loader-with-parser'),
    import('../../../modules/parquet/src/lib/parsers/parse-parquet-to-arrow'),
    import('../../../modules/parquet/src/lib/parsers/convert-parquet-tables'),
    import('hyparquet'),
    import('hyparquet-compressors')
  ]);
  return [
    {
      id: 'typescript',
      name: 'loaders.gl TypeScript',
      decode: async scenario => {
        const table = (await loadersGlTypeScript.ParquetLoaderWithParser.parse(
          scenario.arrayBuffer,
          {
            core: {worker: false},
            parquet: {backend: 'typescript'}
          }
        )) as ObjectRowTable;
        return table.data.length;
      }
    },
    {
      id: 'wasm',
      name: 'loaders.gl / parquet-wasm',
      decode: async scenario => {
        const arrowTable = await loadersGlWasm.parseParquetFileToArrow(
          new loadersGlLoaderUtils.BlobFile(scenario.arrayBuffer)
        );
        const table = loadersGlTableConverters.convertArrowTableToObjectRows(arrowTable);
        return table.data.length;
      }
    },
    {
      id: 'hyparquet',
      name: 'hyparquet',
      decode: async scenario => {
        const rows = await hyparquet.parquetReadObjects({
          file: scenario.arrayBuffer,
          compressors: hyparquetCompressors.compressors
        });
        return rows.length;
      }
    }
  ];
}

/** Adds validated scenarios to the browser benchmark suite. */
async function addParquetBenchmarksToSuite(
  bench: Bench,
  scenarios: ParquetBenchmarkScenario[],
  implementations: ParquetBenchmarkImplementation[],
  onWarning: (warning: string) => void
): Promise<void> {
  for (const scenario of scenarios) {
    try {
      const scenarioImplementations = implementations.filter(implementation =>
        scenario.implementationIds.includes(implementation.id)
      );
      const validatedImplementations = await validateParquetBenchmarkScenario(
        scenario,
        scenarioImplementations,
        onWarning
      );
      const rowCount = validatedImplementations[0]?.rowCount;
      if (rowCount === undefined) {
        onWarning(`${scenario.name}: no implementation completed warm-up`);
        continue;
      }
      bench.group(`Parquet decode - ${scenario.name}`);
      for (const {implementation} of validatedImplementations) {
        bench.addAsync(
          `${scenario.name} :: ${implementation.name}`,
          {minIterations: 3, unit: 'rows', multiplier: rowCount},
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onWarning(`${scenario.name}: ${message}`);
    }
  }
}

/** Warms implementations independently and returns those with a common row count. */
async function validateParquetBenchmarkScenario(
  scenario: ParquetBenchmarkScenario,
  implementations: ParquetBenchmarkImplementation[],
  onWarning: (warning: string) => void
): Promise<ValidatedParquetBenchmarkImplementation[]> {
  const validatedImplementations: ValidatedParquetBenchmarkImplementation[] = [];
  for (const implementation of implementations) {
    try {
      validatedImplementations.push({
        implementation,
        rowCount: await implementation.decode(scenario)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onWarning(`${scenario.name} / ${implementation.name}: ${message}`);
    }
  }
  const expectedRowCount = validatedImplementations[0]?.rowCount;
  return validatedImplementations.filter(({implementation, rowCount}) => {
    if (rowCount !== expectedRowCount) {
      onWarning(
        `${scenario.name} / ${implementation.name}: decoded ${rowCount} rows; expected ${expectedRowCount}`
      );
      return false;
    }
    return true;
  });
}

/** Converts one probe.gl log entry into a result table row. */
function createBenchmarkResultRow(entry: LogEntry): BenchmarkResultRow | null {
  switch (entry.type) {
    case 'group':
      return {id: entry.id};
    case 'test':
      return {
        id: entry.id.slice(entry.id.lastIndexOf(' :: ') + 4),
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
