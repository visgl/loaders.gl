// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useState} from 'react';

import {Bench, type LogEntry} from '@probe.gl/bench';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/schema';

type BenchmarkResultRow = {
  /** Human-readable fixture and feature label. */
  scenario: string;
  /** Loader variant that produced the result. */
  implementationId: ParquetBenchmarkImplementationId;
  /** Human-readable throughput. */
  formattedValue: string;
  /** Numeric throughput reconstructed from the displayed SI value. */
  throughput: number;
};

type BenchmarkStatus = 'loading' | 'running' | 'complete' | 'failed';

type ParquetBenchmarkImplementationId = 'typescript' | 'wasm' | 'hyparquet';
type ParquetBenchmarkShape = 'arrow-table' | 'object-row-table';

type ParquetBenchmarkScenario = {
  /** Human-readable fixture and feature label. */
  name: string;
  /** Complete fixture bytes held outside the timed callback. */
  arrayBuffer: ArrayBuffer;
  /** Optional top-level columns decoded by every loader variant. */
  columns?: string[];
  /** Table shape materialized by every loader variant. */
  shape: ParquetBenchmarkShape;
  /** Implementations that currently support the fixture features. */
  implementationIds: ParquetBenchmarkImplementationId[];
};

type ParquetBenchmarkScenarioSummary = {
  /** Human-readable fixture and feature label. */
  name: string;
  /** Implementations selected for this scenario. */
  implementationIds: ParquetBenchmarkImplementationId[];
};

type ParquetBenchmarkImplementation = {
  /** Stable implementation identifier used for scenario selection. */
  id: ParquetBenchmarkImplementationId;
  /** Human-readable implementation label. */
  name: string;
  /** Hot decode operation returning the output row count. */
  decode: (scenario: ParquetBenchmarkScenario) => Promise<number>;
};

type ValidatedParquetBenchmarkImplementation = {
  /** Implementation that completed the scenario warm-up. */
  implementation: ParquetBenchmarkImplementation;
  /** Row count produced during warm-up. */
  rowCount: number;
};

type HyparquetColumnChunk = {
  /** Top-level column name. */
  columnName: string;
  /** Values decoded for this chunk. */
  columnData: ArrayLike<unknown>;
  /** First row represented by the chunk. */
  rowStart: number;
  /** Exclusive last row represented by the chunk. */
  rowEnd: number;
};

type ParquetBenchmarkImplementationHeader = {
  /** Package or loader name displayed in the benchmark table. */
  name: string;
  /** Exact external package version used by this benchmark. */
  version?: string;
};

/** Exact parquet-wasm package version pinned by @loaders.gl/parquet. */
const PARQUET_WASM_VERSION = '0.7.2';

/** Exact hyparquet package version pinned by the website benchmark. */
const HYPARQUET_VERSION = '1.28.2';

const PARQUET_BENCHMARK_IMPLEMENTATION_LABELS: Record<
  ParquetBenchmarkImplementationId,
  string
> = {
  typescript: 'ParquetLoader',
  wasm: `parquet-wasm v${PARQUET_WASM_VERSION}`,
  hyparquet: `hyparquet v${HYPARQUET_VERSION}`
};

const PARQUET_BENCHMARK_IMPLEMENTATION_HEADERS: Record<
  ParquetBenchmarkImplementationId,
  ParquetBenchmarkImplementationHeader
> = {
  typescript: {name: 'ParquetLoader'},
  wasm: {name: 'parquet-wasm', version: `v${PARQUET_WASM_VERSION}`},
  hyparquet: {name: 'hyparquet', version: `v${HYPARQUET_VERSION}`}
};

const PARQUET_BENCHMARK_IMPLEMENTATION_IDS: ParquetBenchmarkImplementationId[] = [
  'typescript',
  'wasm',
  'hyparquet'
];

/** Renders live comparative Parquet decode benchmarks in the visitor's browser. */
export default function ParquetBenchmarksApp(): JSX.Element {
  const [rows, setRows] = useState<BenchmarkResultRow[]>([]);
  const [scenarios, setScenarios] = useState<ParquetBenchmarkScenarioSummary[]>([]);
  const [failedCellKeys, setFailedCellKeys] = useState<Set<string>>(new Set());
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<BenchmarkStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setRows([]);
    setScenarios([]);
    setFailedCellKeys(new Set());
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

    /** Marks one selected implementation/scenario pair as a failed benchmark cell. */
    const markCellFailed = (
      scenario: string,
      implementationId: ParquetBenchmarkImplementationId
    ): void => {
      if (isMounted) {
        setFailedCellKeys(previousKeys => {
          const nextKeys = new Set(previousKeys);
          nextKeys.add(getBenchmarkCellKey(scenario, implementationId));
          return nextKeys;
        });
      }
    };

    /** Loads the fixtures, validates each scenario, and runs the browser suite. */
    const runBenchmarks = async (): Promise<void> => {
      try {
        const scenarios = await runBenchmarkPhase(
          'Fixture setup failed',
          createParquetBenchmarkScenarios
        );
        if (isMounted) {
          setScenarios(
            scenarios.map(({name, implementationIds}) => ({name, implementationIds}))
          );
        }
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
          await addParquetBenchmarksToSuite(
            bench,
            scenarios,
            implementations,
            appendWarning,
            markCellFailed
          );
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
      <p>
        Live Parquet decode throughput, primarily to Arrow with one object-row control. Keep this tab
        focused while it runs.
      </p>
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
          <strong>Failed benchmark cases</strong>
          <ul>
            {warnings.map(warning => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </aside>
      ) : null}
      <div className="parquet-benchmark-results" aria-live="polite">
        <table className="parquet-benchmark-table">
          <thead>
            <tr>
              <th scope="col">Test</th>
              {PARQUET_BENCHMARK_IMPLEMENTATION_IDS.map(implementationId => {
                const header = PARQUET_BENCHMARK_IMPLEMENTATION_HEADERS[implementationId];
                return (
                  <th
                    key={implementationId}
                    scope="col"
                    className="parquet-benchmark-number"
                  >
                    <span className="parquet-benchmark-loader-name">{header.name}</span>
                    {header.version ? (
                      <span className="parquet-benchmark-loader-version">{header.version}</span>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {scenarios.map(scenario => {
              const scenarioRows = rows.filter(row => row.scenario === scenario.name);
              const bestThroughput = Math.max(
                ...scenarioRows.map(row => row.throughput),
                Number.NEGATIVE_INFINITY
              );
              const isScenarioComplete = scenario.implementationIds.every(implementationId => {
                const cellKey = getBenchmarkCellKey(scenario.name, implementationId);
                return (
                  scenarioRows.some(row => row.implementationId === implementationId) ||
                  failedCellKeys.has(cellKey)
                );
              });
              return (
                <tr key={scenario.name}>
                  <th scope="row">{scenario.name}</th>
                  {PARQUET_BENCHMARK_IMPLEMENTATION_IDS.map(implementationId => {
                    const result = rows.find(
                      row =>
                        row.scenario === scenario.name && row.implementationId === implementationId
                    );
                    const cellKey = getBenchmarkCellKey(scenario.name, implementationId);
                    const isApplicable = scenario.implementationIds.includes(implementationId);
                    const isBestResult =
                      isScenarioComplete && result?.throughput === bestThroughput;
                    return (
                      <td
                        key={implementationId}
                        className="parquet-benchmark-number"
                        aria-label={`${PARQUET_BENCHMARK_IMPLEMENTATION_LABELS[implementationId]} throughput`}
                      >
                        {result ? (
                          <>
                            {isBestResult ? <span aria-label="Best throughput">🟢 </span> : null}
                            <strong>{result.formattedValue}</strong> rows/s
                          </>
                        ) : failedCellKeys.has(cellKey) ? (
                          <span className="parquet-benchmark-failed">Failed</span>
                        ) : !isApplicable ? (
                          <span className="parquet-benchmark-not-applicable">N/A</span>
                        ) : (
                          <span
                            className="parquet-benchmark-pending"
                            aria-label="Benchmark pending"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="parquet-benchmark-empty">Results appear here as each case completes.</p>
        ) : null}
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
  const legacyLz4Url = new URL(
    '../../../modules/parquet/test/data/apache/good/hadoop_lz4_compressed_larger.parquet',
    import.meta.url
  ).toString();
  const deltaByteArrayUrl = new URL(
    '../../../modules/parquet/test/data/apache/good/delta_byte_array.parquet',
    import.meta.url
  ).toString();
  const deltaBinaryPackedUrl = new URL(
    '../../../modules/parquet/test/data/apache/good/delta_binary_packed.parquet',
    import.meta.url
  ).toString();
  const dictionaryUrl = new URL(
    '../../../modules/parquet/test/data/benchmark-dictionary.parquet',
    import.meta.url
  ).toString();
  const fruitsUrl = new URL(
    '../../../modules/parquet/test/data/fruits.parquet',
    import.meta.url
  ).toString();
  const [
    geoParquetArrayBuffer,
    lz4ArrayBuffer,
    legacyLz4ArrayBuffer,
    deltaByteArrayBuffer,
    deltaBinaryPackedArrayBuffer,
    dictionaryArrayBuffer,
    fruitsArrayBuffer
  ] = await Promise.all([
    fetchParquetFixture(geoParquetUrl),
    fetchParquetFixture(lz4Url),
    fetchParquetFixture(legacyLz4Url),
    fetchParquetFixture(deltaByteArrayUrl),
    fetchParquetFixture(deltaBinaryPackedUrl),
    fetchParquetFixture(dictionaryUrl),
    fetchParquetFixture(fruitsUrl)
  ]);
  const compressedDictionaryFixtures = await createCompressedBenchmarkFixtures(
    dictionaryArrayBuffer
  );
  return [
    {
      name: 'GeoParquet SNAPPY · 1K rows × 4 cols → Arrow',
      arrayBuffer: geoParquetArrayBuffer,
      shape: 'arrow-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'PLAIN mixed projection · 40K rows × 8 cols → Arrow',
      arrayBuffer: fruitsArrayBuffer,
      columns: ['name', 'quantity', 'price', 'date', 'day', 'finger', 'stock', 'colour'],
      shape: 'arrow-table',
      // parquet-wasm 0.7.2 retains the unprojected INTERVAL field in its IPC schema.
      implementationIds: ['typescript', 'hyparquet']
    },
    {
      name: 'PLAIN nullable primitives · 40K rows × 6 cols → Arrow',
      arrayBuffer: fruitsArrayBuffer,
      columns: ['name', 'quantity', 'price', 'date', 'day', 'finger'],
      shape: 'arrow-table',
      // parquet-wasm 0.7.2 retains the unprojected INTERVAL field in its IPC schema.
      implementationIds: ['typescript', 'hyparquet']
    },
    {
      name: 'PLAIN nested/repeated · 40K rows × 2 cols → Arrow',
      arrayBuffer: fruitsArrayBuffer,
      columns: ['stock', 'colour'],
      shape: 'arrow-table',
      // parquet-wasm 0.7.2 retains the unprojected INTERVAL field in its IPC schema.
      implementationIds: ['typescript', 'hyparquet']
    },
    {
      name: 'RLE_DICTIONARY mixed table · 20K rows × 5 cols → Arrow',
      arrayBuffer: dictionaryArrayBuffer,
      shape: 'arrow-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'RLE_DICTIONARY + GZIP · 20K rows × 5 cols → Arrow',
      arrayBuffer: compressedDictionaryFixtures.gzip,
      shape: 'arrow-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'RLE_DICTIONARY + ZSTD · 20K rows × 5 cols → Arrow',
      arrayBuffer: compressedDictionaryFixtures.zstd,
      shape: 'arrow-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'DELTA_BINARY_PACKED wide integers · 200 rows × 66 cols → Arrow',
      arrayBuffer: deltaBinaryPackedArrayBuffer,
      shape: 'arrow-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'LZ4_RAW · 10K rows × 1 col → Arrow',
      arrayBuffer: lz4ArrayBuffer,
      shape: 'arrow-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'LZ4 legacy framing · 10K rows × 1 col → Arrow',
      arrayBuffer: legacyLz4ArrayBuffer,
      shape: 'arrow-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'DELTA_BYTE_ARRAY strings · 1K rows × 9 cols → Arrow',
      arrayBuffer: deltaByteArrayBuffer,
      shape: 'arrow-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    },
    {
      name: 'DELTA_BYTE_ARRAY projection · 1K rows × 2 cols → Arrow',
      arrayBuffer: deltaByteArrayBuffer,
      columns: ['c_customer_id', 'c_email_address'],
      shape: 'arrow-table',
      // parquet-wasm 0.7.2 returns mismatched IPC schema/vector counts for this projection.
      implementationIds: ['typescript', 'hyparquet']
    },
    {
      name: 'DELTA_BYTE_ARRAY control · 1K rows × 9 cols → object rows',
      arrayBuffer: deltaByteArrayBuffer,
      shape: 'object-row-table',
      implementationIds: ['typescript', 'wasm', 'hyparquet']
    }
  ];
}

/** Re-encodes the shared scale fixture with additional compression codecs before timing starts. */
async function createCompressedBenchmarkFixtures(
  arrayBuffer: ArrayBuffer
): Promise<{gzip: ArrayBuffer; zstd: ArrayBuffer}> {
  const {loadWasm} = await import('../../../modules/parquet/src/lib/utils/load-wasm');
  const parquetWasm = await loadWasm();
  const gzipTable = parquetWasm.readParquet(new Uint8Array(arrayBuffer));
  const zstdTable = parquetWasm.readParquet(new Uint8Array(arrayBuffer));
  const gzipProperties = new parquetWasm.WriterPropertiesBuilder()
    .setCompression(parquetWasm.Compression.GZIP)
    .setMaxRowGroupSize(4000)
    .build();
  const zstdProperties = new parquetWasm.WriterPropertiesBuilder()
    .setCompression(parquetWasm.Compression.ZSTD)
    .setMaxRowGroupSize(4000)
    .build();
  return {
    gzip: copyUint8ArrayToArrayBuffer(parquetWasm.writeParquet(gzipTable, gzipProperties)),
    zstd: copyUint8ArrayToArrayBuffer(parquetWasm.writeParquet(zstdTable, zstdProperties))
  };
}

/** Copies a typed-array view into an exact standalone ArrayBuffer. */
function copyUint8ArrayToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

/** Fetches and validates one Parquet fixture response. */
async function fetchParquetFixture(url: string): Promise<ArrayBuffer> {
  const response = await globalThis.fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Parquet benchmark fixture: ${response.status}`);
  }
  return await response.arrayBuffer();
}

/** Loads browser implementations and creates equivalent Arrow-table decode cases. */
async function createParquetBenchmarkImplementations(): Promise<
  ParquetBenchmarkImplementation[]
> {
  const [
    loadersGlLoaderUtils,
    loadersGlTypeScript,
    loadersGlWasm,
    loadersGlTableConverters,
    loadersGlSchemaUtils,
    hyparquet,
    hyparquetCompressors,
    zstdCodec
  ] = await Promise.all([
    import('@loaders.gl/loader-utils'),
    import('../../../modules/parquet/src/parquet-js-loader'),
    import('../../../modules/parquet/src/lib/parsers/parse-parquet-to-arrow'),
    import('../../../modules/parquet/src/lib/parsers/convert-parquet-tables'),
    import('@loaders.gl/schema-utils'),
    import('hyparquet'),
    import('hyparquet-compressors'),
    import('zstd-codec')
  ]);
  return [
    {
      id: 'typescript',
      name: PARQUET_BENCHMARK_IMPLEMENTATION_LABELS.typescript,
      decode: async scenario => {
        const table = (await loadersGlTypeScript.ParquetJSLoaderWithParser.parse(
          scenario.arrayBuffer,
          {
            core: {worker: false},
            parquet: {columns: scenario.columns, shape: scenario.shape},
            modules: {'zstd-codec': zstdCodec.ZstdCodec}
          }
        )) as ArrowTable | ObjectRowTable;
        return getBenchmarkTableRowCount(table);
      }
    },
    {
      id: 'wasm',
      name: PARQUET_BENCHMARK_IMPLEMENTATION_LABELS.wasm,
      decode: async scenario => {
        const arrowTable = await loadersGlWasm.parseParquetFileToArrow(
          new loadersGlLoaderUtils.BlobFile(scenario.arrayBuffer),
          {columns: scenario.columns}
        );
        if (scenario.shape === 'arrow-table') {
          return arrowTable.data.numRows;
        }
        const objectRowTable = loadersGlTableConverters.convertArrowTableToObjectRows(arrowTable);
        return objectRowTable.data.length;
      }
    },
    {
      id: 'hyparquet',
      name: PARQUET_BENCHMARK_IMPLEMENTATION_LABELS.hyparquet,
      decode: async scenario => {
        if (scenario.shape === 'object-row-table') {
          const rows = await hyparquet.parquetReadObjects({
            file: scenario.arrayBuffer,
            columns: scenario.columns,
            compressors: hyparquetCompressors.compressors
          });
          return rows.length;
        }

        const columns: Record<string, unknown[]> = {};
        await hyparquet.parquetRead({
          file: scenario.arrayBuffer,
          columns: scenario.columns,
          onChunk: (chunk: HyparquetColumnChunk) => appendHyparquetColumnChunk(columns, chunk),
          compressors: hyparquetCompressors.compressors
        });
        const columnarTable = loadersGlSchemaUtils.makeTableFromData(columns);
        const arrowTable = loadersGlSchemaUtils.convertTable(columnarTable, 'arrow-table');
        return arrowTable.data.numRows;
      }
    }
  ];
}

/** Returns the materialized row count for either benchmark table shape. */
function getBenchmarkTableRowCount(table: ArrowTable | ObjectRowTable): number {
  return table.shape === 'arrow-table' ? table.data.numRows : table.data.length;
}

/** Copies one hyparquet output chunk into a contiguous top-level column. */
function appendHyparquetColumnChunk(
  columns: Record<string, unknown[]>,
  chunk: HyparquetColumnChunk
): void {
  const column = columns[chunk.columnName] || [];
  column.length = Math.max(column.length, chunk.rowEnd);
  for (let valueIndex = 0; valueIndex < chunk.columnData.length; valueIndex++) {
    column[chunk.rowStart + valueIndex] = chunk.columnData[valueIndex];
  }
  columns[chunk.columnName] = column;
}

/** Adds validated scenarios to the browser benchmark suite. */
async function addParquetBenchmarksToSuite(
  bench: Bench,
  scenarios: ParquetBenchmarkScenario[],
  implementations: ParquetBenchmarkImplementation[],
  onWarning: (warning: string) => void,
  onCellFailed: (
    scenario: string,
    implementationId: ParquetBenchmarkImplementationId
  ) => void
): Promise<void> {
  for (const scenario of scenarios) {
    try {
      const scenarioImplementations = implementations.filter(implementation =>
        scenario.implementationIds.includes(implementation.id)
      );
      const validatedImplementations = await validateParquetBenchmarkScenario(
        scenario,
        scenarioImplementations,
        onWarning,
        onCellFailed
      );
      const rowCount = validatedImplementations[0]?.rowCount;
      if (rowCount === undefined) {
        onWarning(`${scenario.name}: no implementation completed warm-up`);
        continue;
      }
      bench.group(`Parquet decode - ${scenario.name}`);
      for (const {implementation} of validatedImplementations) {
        bench.addAsync(
          `${scenario.name} :: ${implementation.id}`,
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
      for (const implementationId of scenario.implementationIds) {
        onCellFailed(scenario.name, implementationId);
      }
    }
  }
}

/** Warms implementations independently and returns those with a common row count. */
async function validateParquetBenchmarkScenario(
  scenario: ParquetBenchmarkScenario,
  implementations: ParquetBenchmarkImplementation[],
  onWarning: (warning: string) => void,
  onCellFailed: (
    scenario: string,
    implementationId: ParquetBenchmarkImplementationId
  ) => void
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
      onCellFailed(scenario.name, implementation.id);
    }
  }
  const expectedRowCount = validatedImplementations[0]?.rowCount;
  return validatedImplementations.filter(({implementation, rowCount}) => {
    if (rowCount !== expectedRowCount) {
      onWarning(
        `${scenario.name} / ${implementation.name}: decoded ${rowCount} rows; expected ${expectedRowCount}`
      );
      onCellFailed(scenario.name, implementation.id);
      return false;
    }
    return true;
  });
}

/** Converts one probe.gl log entry into a result table row. */
function createBenchmarkResultRow(entry: LogEntry): BenchmarkResultRow | null {
  switch (entry.type) {
    case 'test': {
      const separatorIndex = entry.id.lastIndexOf(' :: ');
      const implementationId = entry.id.slice(
        separatorIndex + 4
      ) as ParquetBenchmarkImplementationId;
      if (
        separatorIndex < 0 ||
        !PARQUET_BENCHMARK_IMPLEMENTATION_IDS.includes(implementationId)
      ) {
        return null;
      }
      return {
        scenario: entry.id.slice(0, separatorIndex),
        implementationId,
        formattedValue: entry.itersPerSecond,
        throughput: parseFormattedThroughput(entry.itersPerSecond)
      };
    }
    case 'complete':
      return null;
    default:
      return null;
  }
}

/** Creates a stable state key for one scenario/implementation table cell. */
function getBenchmarkCellKey(
  scenario: string,
  implementationId: ParquetBenchmarkImplementationId
): string {
  return `${scenario}::${implementationId}`;
}

/** Converts probe.gl's formatted SI throughput back to a comparable numeric value. */
function parseFormattedThroughput(formattedValue: string): number {
  const match = /^([+-]?\d+(?:\.\d+)?)([KMGTPE]|m|µ|n|e[+-]?\d+)?$/.exec(formattedValue);
  if (!match) {
    return Number.NaN;
  }
  const suffixPowers: Record<string, number> = {
    '': 0,
    K: 3,
    M: 6,
    G: 9,
    T: 12,
    P: 15,
    E: 18,
    m: -3,
    µ: -6,
    n: -9
  };
  const suffix = match[2] || '';
  const exponent = suffix.startsWith('e') ? Number(suffix.slice(1)) : suffixPowers[suffix];
  return Number(match[1]) * 10 ** exponent;
}
