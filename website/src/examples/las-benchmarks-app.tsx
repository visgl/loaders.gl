// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useState} from 'react';

import {Bench, type BenchProps, type LogEntry, type LogFunction} from '@probe.gl/bench';
import {BenchResults} from '@probe.gl/react-bench';
import {parse, parseInBatches} from '@loaders.gl/core';
import {LASLoaderWithParser as LASLoader} from '@loaders.gl/las/las-loader';
import {LAZPerfLoaderWithParser as LAZPerfLoader} from '@loaders.gl/las/lazperf-loader';
import {LASCOPCLoaderWithParser as LASCOPCLoader} from '@loaders.gl/las/las-copc-loader';
import {LAZRsLoaderWithParser as LAZRsLoader} from '@loaders.gl/las/laz-rs-loader';
import type {MeshArrowTable} from '@loaders.gl/schema';

// @probe.gl/bench reads this process-wide configuration without guarding its existence.
globalThis.probe ||= {};

const FIXTURE_BASE_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/las/test/data';
const LAZ_1_2_PDRF_3_URL = `${FIXTURE_BASE_URL}/indoor.laz`;
const LAZ_1_4_PDRF_7_URL = `${FIXTURE_BASE_URL}/ellipsoid-1.4.laz`;
const LAZ_1_2_PDRF_3 = 3;
const LAZ_1_4_PDRF_7 = 7;
const STREAM_CHUNK_BYTE_LENGTH = 64 * 1024;
const BATCH_SIZE = 25_000;
const RENDER_COLUMNS = ['POSITION', 'COLOR_0'] as const;
const COMPETITIVE_COLUMNS = ['POSITION', 'COLOR_0', 'intensity', 'classification'] as const;

type BenchmarkStatus = 'loading' | 'running' | 'complete' | 'failed';

type BenchmarkResultRow = {
  /** Benchmark group or test label. */
  id: React.ReactNode;
  /** Numeric throughput used by the result visualization. */
  value?: number;
  /** Formatted points-per-second value. */
  formattedValue?: string;
  /** Formatted relative error. */
  formattedError?: string;
};

type LoaderVariant = {
  /** Variant label shown in benchmark output. */
  name: string;
  /** Parser-bearing LAS loader. */
  loader: typeof LASLoader | typeof LAZPerfLoader | typeof LASCOPCLoader | typeof LAZRsLoader;
  /** Point data record formats accepted by this variant. */
  pointDataRecordFormats: readonly number[];
};

type BenchmarkFixture = {
  /** Benchmark group label. */
  label: string;
  /** Complete compressed file bytes. */
  arrayBuffer: ArrayBuffer;
  /** Point data record format asserted from the LAS header. */
  pointDataRecordFormat: number;
  /** Number of output rows returned by compatible variants. */
  pointCount: number;
};

type SortedBenchState = {
  /** Original benchmark logger. */
  emitLog: LogFunction;
  /** Active benchmark group id. */
  currentGroupId: string | null;
  /** Test rows waiting to be sorted. */
  bufferedEntries: LogEntry[];
};

const LOADER_VARIANTS: LoaderVariant[] = [
  {
    name: 'TypeScript (JavaScript)',
    loader: LASLoader,
    pointDataRecordFormats: [LAZ_1_2_PDRF_3, LAZ_1_4_PDRF_7]
  },
  {
    name: 'laz-perf (WASM)',
    loader: LAZPerfLoader,
    pointDataRecordFormats: [LAZ_1_2_PDRF_3]
  },
  {
    name: 'COPC package (laz-perf)',
    loader: LASCOPCLoader,
    pointDataRecordFormats: [LAZ_1_2_PDRF_3, LAZ_1_4_PDRF_7]
  },
  {
    name: 'laz-rs (WASM)',
    loader: LAZRsLoader,
    pointDataRecordFormats: [LAZ_1_2_PDRF_3, LAZ_1_4_PDRF_7]
  }
];
const SORTED_GROUPS = new WeakMap<SortedBench, Set<string>>();
const SORTED_BENCH_STATES = new WeakMap<SortedBench, SortedBenchState>();

/** Probe benchmark suite that presents each marked group from fastest to slowest. */
class SortedBench extends Bench {
  /**
   * Creates a sorted benchmark suite.
   * @param props Probe benchmark options.
   */
  constructor(props: BenchProps = {}) {
    let sortedBench: SortedBench | null = null;
    const emitLog = props.log || (() => {});
    const sortedLog: LogFunction = entry => {
      if (sortedBench) {
        handleSortedBenchLog(sortedBench, entry);
      } else {
        emitLog(entry);
      }
    };

    super({...props, log: sortedLog});

    sortedBench = this;
    SORTED_GROUPS.set(this, new Set());
    SORTED_BENCH_STATES.set(this, {
      emitLog,
      currentGroupId: null,
      bufferedEntries: []
    });
  }

  /**
   * Adds a benchmark group whose rows are emitted from fastest to slowest.
   * @param id Benchmark group id.
   * @returns This benchmark suite.
   */
  groupSorted(id: string): this {
    super.group(id);
    getSortedGroups(this).add(id);
    return this;
  }

  /** Keeps probe.gl's detached completion callback bound when subclassed. */
  override onBenchmarkComplete(params: Parameters<Bench['onBenchmarkComplete']>[0]): void {
    super.onBenchmarkComplete(params);
  }
}

/** Renders live compressed LAS 1.4/PDRF 7 parser benchmarks in the visitor's browser. */
export default function LASBenchmarksApp(): JSX.Element {
  const [rows, setRows] = useState<BenchmarkResultRow[]>([]);
  const [status, setStatus] = useState<BenchmarkStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setRows([]);
    setStatus('loading');
    setErrorMessage(null);

    /** Appends one probe.gl log entry to the rendered table. */
    const appendLogEntry = (entry: LogEntry): void => {
      if (!isMounted) {
        return;
      }
      const row = createBenchmarkResultRow(entry);
      if (row) {
        setRows(previousRows => [...previousRows, row]);
      }
    };

    /** Loads and warms the fixture before running the timed benchmark callbacks. */
    const runBenchmarks = async (): Promise<void> => {
      try {
        const fixtures = await loadBenchmarkFixtures();
        const laz14Fixture = fixtures.find(
          fixture => fixture.pointDataRecordFormat === LAZ_1_4_PDRF_7
        );
        if (!laz14Fixture) {
          throw new Error('Missing LAS 1.4/PDRF 7 benchmark fixture');
        }
        const laz14Chunks = createArrayBufferChunks(
          laz14Fixture.arrayBuffer,
          STREAM_CHUNK_BYTE_LENGTH
        );
        await consumeStreamingParse(laz14Chunks, undefined);
        await consumeStreamingParse(laz14Chunks, COMPETITIVE_COLUMNS);
        await consumeStreamingParse(laz14Chunks, RENDER_COLUMNS);

        const bench = new SortedBench({
          id: 'loaders-gl-las-website-benchmarks',
          log: appendLogEntry
        });
        addLASBenchmarks(bench, fixtures, laz14Chunks);
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

    void runBenchmarks();
    return () => {
      isMounted = false;
    };
  }, [runId]);

  /** Starts a fresh benchmark run. */
  const restartBenchmarks = (): void => {
    setRunId(previousRunId => previousRunId + 1);
  };

  const isRunning = status === 'loading' || status === 'running';
  const canRestart = status === 'complete' || status === 'failed';

  return (
    <div className="benchmark-page">
      <p>
        Live compressed LAZ Arrow-table throughput in this browser. Competitive groups run every
        compatible loader variant on identical input and output columns. Keep this tab focused
        while the run completes.
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
      <div className="benchmark-results">
        <BenchResults log={rows} />
      </div>
    </div>
  );
}

/**
 * Adds complete, streaming, and render-column LAS benchmarks.
 * @param bench Target sorted benchmark suite.
 * @param fixtures Loaded and warmed competitive fixtures.
 * @param laz14Chunks Preallocated streaming PDRF 7 input chunks.
 */
function addLASBenchmarks(
  bench: SortedBench,
  fixtures: BenchmarkFixture[],
  laz14Chunks: ArrayBuffer[]
): void {
  for (const fixture of fixtures) {
    const benchmarkOptions = {
      multiplier: fixture.pointCount,
      unit: 'output points',
      minIterations: 3
    };
    bench.groupSorted(`${fixture.label} - complete parse, common point-cloud columns`);
    for (const {name, loader, pointDataRecordFormats} of LOADER_VARIANTS) {
      if (!pointDataRecordFormats.includes(fixture.pointDataRecordFormat)) {
        continue;
      }
      bench.addAsync(`${name} - PDRF ${fixture.pointDataRecordFormat}`, benchmarkOptions, async () => {
        await parse(fixture.arrayBuffer, loader, {
          core: {worker: false},
          las: {shape: 'arrow-table', columns: COMPETITIVE_COLUMNS}
        });
      });
    }
  }

  const laz14Fixture = fixtures.find(
    fixture => fixture.pointDataRecordFormat === LAZ_1_4_PDRF_7
  )!;
  const benchmarkOptions = {
    multiplier: laz14Fixture.pointCount,
    unit: 'output points',
    minIterations: 3
  };
  bench.groupSorted('TypeScript LAZ 1.4 / PDRF 7 - streaming and column selection');
  bench.addAsync('Complete - all columns', benchmarkOptions, async () => {
    await parse(laz14Fixture.arrayBuffer, LASLoader, {
      core: {worker: false},
      las: {shape: 'arrow-table'}
    });
  });
  bench.addAsync(
    'Streaming - all columns',
    benchmarkOptions,
    async () => consumeStreamingParse(laz14Chunks, undefined)
  );
  bench.addAsync(
    'Complete - common point-cloud columns',
    benchmarkOptions,
    async () => {
      await parse(laz14Fixture.arrayBuffer, LASLoader, {
        core: {worker: false},
        las: {shape: 'arrow-table', columns: COMPETITIVE_COLUMNS}
      });
    }
  );
  bench.addAsync(
    'Streaming - common point-cloud columns',
    benchmarkOptions,
    async () => consumeStreamingParse(laz14Chunks, COMPETITIVE_COLUMNS)
  );
  bench.addAsync(
    'Complete - POSITION + COLOR_0 only',
    benchmarkOptions,
    async () => {
      await parse(laz14Fixture.arrayBuffer, LASLoader, {
        core: {worker: false},
        las: {shape: 'arrow-table', columns: RENDER_COLUMNS}
      });
    }
  );
  bench.addAsync(
    'Streaming - POSITION + COLOR_0 only',
    benchmarkOptions,
    async () => consumeStreamingParse(laz14Chunks, RENDER_COLUMNS)
  );
}

/**
 * Loads, validates, and warms every competitive LAS fixture.
 * @returns Loaded benchmark fixture state.
 */
async function loadBenchmarkFixtures(): Promise<BenchmarkFixture[]> {
  const fixtureDefinitions = [
    {label: 'LAZ 1.2 / PDRF 3', url: LAZ_1_2_PDRF_3_URL, pointDataRecordFormat: LAZ_1_2_PDRF_3},
    {label: 'LAZ 1.4 / PDRF 7', url: LAZ_1_4_PDRF_7_URL, pointDataRecordFormat: LAZ_1_4_PDRF_7}
  ];
  const fixtures: BenchmarkFixture[] = [];
  for (const definition of fixtureDefinitions) {
    const response = await fetch(definition.url);
    if (!response.ok) {
      throw new Error(`Unable to load ${definition.label} benchmark fixture: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    assertPointDataRecordFormat(arrayBuffer, definition.pointDataRecordFormat);
    fixtures.push({
      ...definition,
      arrayBuffer,
      pointCount: await warmLoaderVariants(arrayBuffer, definition.pointDataRecordFormat)
    });
  }
  return fixtures;
}

/** Warm compatible parser variants and verify that they agree on row count. */
async function warmLoaderVariants(
  lazArrayBuffer: ArrayBuffer,
  pointDataRecordFormat: number
): Promise<number> {
  let pointCount = -1;
  for (const {name, loader, pointDataRecordFormats} of LOADER_VARIANTS) {
    if (!pointDataRecordFormats.includes(pointDataRecordFormat)) {
      continue;
    }
    const table = (await parse(lazArrayBuffer, loader, {
      core: {worker: false},
      las: {shape: 'arrow-table', columns: COMPETITIVE_COLUMNS}
    })) as MeshArrowTable;
    if (pointCount < 0) {
      pointCount = table.data.numRows;
    } else if (table.data.numRows !== pointCount) {
      throw new Error(
        `LAS benchmark variant ${name} returned ${table.data.numRows} points; expected ${pointCount}`
      );
    }
  }
  return pointCount;
}

/**
 * Consumes one TypeScript streaming parse without allocating input chunks in the timed callback.
 * @param lazChunks Preallocated source chunks.
 * @param columns Optional selective Arrow columns.
 */
async function consumeStreamingParse(
  lazChunks: ArrayBuffer[],
  columns: typeof COMPETITIVE_COLUMNS | typeof RENDER_COLUMNS | undefined
): Promise<void> {
  const batches = await parseInBatches(lazChunks, LASLoader, {
    batchSize: BATCH_SIZE,
    core: {worker: false},
    las: {shape: 'arrow-table', columns}
  });
  for await (const _batch of batches) {
    _batch;
  }
}

/**
 * Copies a complete file into stable chunks before benchmark timing starts.
 * @param arrayBuffer Complete fixture bytes.
 * @param chunkByteLength Maximum source chunk byte length.
 * @returns Preallocated input chunks.
 */
function createArrayBufferChunks(arrayBuffer: ArrayBuffer, chunkByteLength: number): ArrayBuffer[] {
  const bytes = new Uint8Array(arrayBuffer);
  const chunks: ArrayBuffer[] = [];
  for (let offset = 0; offset < bytes.byteLength; offset += chunkByteLength) {
    chunks.push(bytes.slice(offset, Math.min(offset + chunkByteLength, bytes.byteLength)).buffer);
  }
  return chunks;
}

/**
 * Confirms that a public benchmark fixture still exercises its declared PDRF.
 * @param arrayBuffer Complete LAS file bytes.
 * @param expectedPointDataRecordFormat Expected PDRF identifier.
 */
function assertPointDataRecordFormat(
  arrayBuffer: ArrayBuffer,
  expectedPointDataRecordFormat: number
): void {
  const pointDataRecordFormat = new Uint8Array(arrayBuffer, 104, 1)[0] & 0x3f;
  if (pointDataRecordFormat !== expectedPointDataRecordFormat) {
    throw new Error(
      `LAS benchmark fixture must use PDRF ${expectedPointDataRecordFormat}; received PDRF ${pointDataRecordFormat}`
    );
  }
}

/** Handles one benchmark log entry and buffers marked group rows for sorting. */
function handleSortedBenchLog(bench: SortedBench, entry: LogEntry): void {
  const state = getSortedBenchState(bench);
  switch (entry.type) {
    case 'group':
      flushSortedGroup(bench);
      state.currentGroupId = entry.id;
      state.emitLog(entry);
      break;
    case 'test':
      if (state.currentGroupId && getSortedGroups(bench).has(state.currentGroupId)) {
        state.bufferedEntries.push(entry);
      } else {
        state.emitLog(entry);
      }
      break;
    case 'complete':
      flushSortedGroup(bench);
      state.currentGroupId = null;
      state.emitLog(entry);
      break;
    default:
      state.emitLog(entry);
  }
}

/** Emits buffered rows for the current group from fastest to slowest. */
function flushSortedGroup(bench: SortedBench): void {
  const state = getSortedBenchState(bench);
  const sortedEntries = state.bufferedEntries.toSorted(
    (leftEntry, rightEntry) => getLogEntryThroughput(rightEntry) - getLogEntryThroughput(leftEntry)
  );
  state.bufferedEntries = [];
  for (const entry of sortedEntries) {
    state.emitLog(entry);
  }
}

/** Returns the group registry for a sorted benchmark suite. */
function getSortedGroups(bench: SortedBench): Set<string> {
  const groups = SORTED_GROUPS.get(bench);
  if (!groups) {
    throw new Error('SortedBench was not initialized.');
  }
  return groups;
}

/** Returns the log state for a sorted benchmark suite. */
function getSortedBenchState(bench: SortedBench): SortedBenchState {
  const state = SORTED_BENCH_STATES.get(bench);
  if (!state) {
    throw new Error('SortedBench was not initialized.');
  }
  return state;
}

/** Converts one probe.gl entry to a row accepted by BenchResults. */
function createBenchmarkResultRow(entry: LogEntry): BenchmarkResultRow | null {
  switch (entry.type) {
    case 'group':
      return {id: entry.id};
    case 'test':
      return {
        id: entry.id,
        value: getLogEntryThroughput(entry),
        formattedValue: entry.itersPerSecond,
        formattedError: `${(entry.error * 100).toFixed(2)}%`
      };
    default:
      return null;
  }
}

/** Returns numeric points per second from one SI-formatted benchmark result. */
function getLogEntryThroughput(entry: LogEntry): number {
  if (entry.type !== 'test') {
    return 0;
  }
  const match = entry.itersPerSecond.trim().match(/^([+-]?\d+(?:\.\d+)?)([kKMGT]?)$/);
  if (!match) {
    return Number.parseFloat(entry.itersPerSecond) || 0;
  }
  const multipliers: Record<string, number> = {k: 1e3, K: 1e3, M: 1e6, G: 1e9, T: 1e12};
  return Number.parseFloat(match[1]) * (multipliers[match[2]] || 1);
}
