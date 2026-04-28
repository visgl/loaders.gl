// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useState} from 'react';

import {Bench, type BenchProps, type LogEntry, type LogFunction} from '@probe.gl/bench';
import {BenchResults} from '@probe.gl/react-bench';
import {fetchFile} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/bundled';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {autoType, csvParse, tsvParse} from 'd3-dsv';
import PapaParseNPM from 'papaparse';
import {inferSchema, initParser} from 'udsv';

const SAMPLE_CSV_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/csv/test/data/sample-very-long.csv';
const ROW_COUNT = 2000;
const WIDE_COLUMN_COUNT = 40;
const BENCHMARK_OPTIONS = {minIterations: 3, unit: 'rows'};

const SI_MULTIPLIERS: Record<string, number> = {
  K: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
  m: 1e-3,
  '\u00b5': 1e-6,
  n: 1e-9
};

type SortedBenchState = {
  emitLog: LogFunction;
  currentGroupId: string | null;
  bufferedEntries: LogEntry[];
};

type BenchmarkResultRow = {
  id: React.ReactNode;
  value?: number;
  formattedValue?: string;
  formattedError?: string;
};

type BenchmarkStatus = 'loading' | 'running' | 'complete' | 'failed';

type BenchmarkScenario = {
  name: string;
  description: string;
  text: string;
  delimiter: ',' | '\t';
  rowCount: number;
};

type LoaderBenchmark = {
  name: string;
  loader: LoaderWithParser<any, any, any>;
  options: any;
};

const SORTED_GROUPS = new WeakMap<SortedBench, Set<string>>();
const SORTED_BENCH_STATES = new WeakMap<SortedBench, SortedBenchState>();

/**
 * Probe benchmark suite with presentation-level sorting for selected result groups.
 */
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
   * Adds a benchmark group whose test rows should be emitted from fastest to slowest.
   * @param id Benchmark group id.
   * @returns This benchmark suite.
   */
  groupSorted(id: string): this {
    super.group(id);
    getSortedGroups(this).add(id);
    return this;
  }

  /**
   * Keeps probe.gl's detached benchmark completion callback bound when subclassed.
   * @param params Completed benchmark statistics.
   */
  override onBenchmarkComplete(params: Parameters<Bench['onBenchmarkComplete']>[0]): void {
    super.onBenchmarkComplete(params);
  }
}

/**
 * Renders live CSV competitive benchmarks in the visitor's browser.
 */
export default function BenchmarksApp(): JSX.Element {
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

    /** Runs the benchmark suite once the browser-only component is mounted. */
    const runBenchmarks = async (): Promise<void> => {
      try {
        const bench = new SortedBench({
          id: 'loaders-gl-csv-website-benchmarks',
          log: appendLogEntry
        });
        await addCSVBenchmarksToSuite(bench);
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
      <p>Live CSV performance in this browser. Keep this tab focused while the run completes.</p>
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
      <div className="benchmark-legend" aria-label="Benchmark color legend">
        <span className="benchmark-legend-item benchmark-legend-red">&lt; 1M rows/s</span>
        <span className="benchmark-legend-item benchmark-legend-orange">1M - 10M rows/s</span>
        <span className="benchmark-legend-item benchmark-legend-green">&gt; 10M rows/s</span>
        <span className="benchmark-legend-item benchmark-legend-green">50M rows/s</span>
      </div>
      <div className="benchmark-results">
        <BenchResults log={rows} />
      </div>
    </div>
  );
}

/**
 * Adds the browser-safe CSV competitive benchmark subset to a sorted benchmark suite.
 * @param bench Target sorted benchmark suite.
 */
async function addCSVBenchmarksToSuite(bench: SortedBench): Promise<void> {
  const scenarios = await createBenchmarkScenarios();

  for (const scenario of scenarios) {
    for (const dynamicTyping of [false, true]) {
      addCSVParseBenchmarks(bench, scenario, dynamicTyping);
    }
  }
}

/**
 * Adds CSV parsing benchmarks across browser-compatible CSV parsers.
 * @param bench Target sorted benchmark suite.
 * @param scenario CSV benchmark scenario.
 * @param dynamicTyping Whether numeric and boolean values should be typed.
 */
function addCSVParseBenchmarks(
  bench: SortedBench,
  scenario: BenchmarkScenario,
  dynamicTyping: boolean
): void {
  bench.groupSorted(getCSVParseGroupTitle(scenario, dynamicTyping));

  addUDSVParseBenchmark(bench, scenario, dynamicTyping);
  addD3ParseBenchmark(bench, scenario, dynamicTyping);
  addPapaParseNPMBenchmark(bench, scenario, dynamicTyping);

  for (const loaderBenchmark of getCSVLoaderBenchmarks(scenario, dynamicTyping)) {
    addLoaderParseBenchmark(bench, scenario, loaderBenchmark);
  }
}

/**
 * Handles one probe.gl log entry and buffers sorted group rows until the group ends.
 * @param bench Sorted benchmark suite.
 * @param entry Probe log entry.
 */
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

/**
 * Emits buffered rows for the current sorted group from fastest to slowest.
 * @param bench Sorted benchmark suite.
 */
function flushSortedGroup(bench: SortedBench): void {
  const state = getSortedBenchState(bench);
  if (!state.bufferedEntries.length) {
    return;
  }

  const sortedEntries = [...state.bufferedEntries].sort(
    (leftEntry, rightEntry) =>
      getLogEntryThroughput(rightEntry) - getLogEntryThroughput(leftEntry)
  );
  state.bufferedEntries = [];

  for (const entry of sortedEntries) {
    state.emitLog(entry);
  }
}

/**
 * Returns the sorted group ids for a sorted benchmark suite.
 * @param bench Sorted benchmark suite.
 * @returns Sorted group ids.
 */
function getSortedGroups(bench: SortedBench): Set<string> {
  const sortedGroups = SORTED_GROUPS.get(bench);
  if (!sortedGroups) {
    throw new Error('SortedBench was not initialized.');
  }
  return sortedGroups;
}

/**
 * Returns the log state for a sorted benchmark suite.
 * @param bench Sorted benchmark suite.
 * @returns Sorted benchmark state.
 */
function getSortedBenchState(bench: SortedBench): SortedBenchState {
  const state = SORTED_BENCH_STATES.get(bench);
  if (!state) {
    throw new Error('SortedBench was not initialized.');
  }
  return state;
}

/**
 * Creates a table row from one probe.gl log entry.
 * @param entry Probe log entry.
 * @returns Benchmark result row or null for completion entries.
 */
function createBenchmarkResultRow(entry: LogEntry): BenchmarkResultRow | null {
  switch (entry.type) {
    case 'group':
      return {id: entry.id};
    case 'test': {
      const displayName = getBenchmarkDisplayName(entry.id);
      return {
        id: isLoadersGLBenchmarkName(displayName) ? <strong>{displayName}</strong> : displayName,
        value: getLogEntryThroughput(entry),
        formattedValue: entry.itersPerSecond,
        formattedError: `${(entry.error * 100).toFixed(2)}%`
      };
    }
    case 'complete':
      return null;
    default:
      return null;
  }
}

/**
 * Reads a numeric throughput value from a probe.gl test log entry.
 * @param entry Probe log entry.
 * @returns Numeric throughput.
 */
function getLogEntryThroughput(entry: LogEntry): number {
  return entry.type === 'test' ? parseSIValue(entry.itersPerSecond) : 0;
}

/**
 * Parses a probe.gl SI-formatted throughput string.
 * @param value SI-formatted value.
 * @returns Numeric value.
 */
function parseSIValue(value: string): number {
  const match = value.trim().match(/^([+-]?\d+(?:\.\d+)?)([KMGTPEemn]|\u00b5|e[+-]?\d+)?$/);
  if (!match) {
    return Number.parseFloat(value) || 0;
  }

  const [, baseString, suffix = ''] = match;
  const base = Number.parseFloat(baseString);
  if (suffix.startsWith('e')) {
    return base * 10 ** Number.parseInt(suffix.slice(1), 10);
  }
  return base * (SI_MULTIPLIERS[suffix] || 1);
}

/**
 * Fetches the public CSV fixture and creates browser benchmark scenarios.
 * @returns CSV benchmark scenarios.
 */
async function createBenchmarkScenarios(): Promise<BenchmarkScenario[]> {
  const response = await fetchFile(SAMPLE_CSV_URL);
  const fixtureText = await response.text();

  return [
    createBenchmarkScenario(
      'unquoted fast-mode',
      'unquoted cells',
      createUnquotedCSV(),
      ',',
      ROW_COUNT
    ),
    createBenchmarkScenario('quoted', 'quoted cells with embedded commas and quotes', createQuotedCSV()),
    createBenchmarkScenario('tsv', 'tab delimiter', createTSV(), '\t', ROW_COUNT),
    createBenchmarkScenario('wide rows', `${WIDE_COLUMN_COUNT} columns`, createWideCSV(), ',', ROW_COUNT),
    createBenchmarkScenario('utf8 non-ascii', 'UTF-8 text cells', createUtf8CSV(), ',', ROW_COUNT),
    createBenchmarkScenario('fixture', 'sample-very-long.csv fixture', fixtureText)
  ];
}

/**
 * Creates one CSV benchmark scenario.
 * @param name Scenario name.
 * @param description Scenario description.
 * @param text CSV text.
 * @param delimiter Scenario delimiter.
 * @param rowCount Number of data rows.
 * @returns CSV benchmark scenario.
 */
function createBenchmarkScenario(
  name: string,
  description: string,
  text: string,
  delimiter: ',' | '\t' = ',',
  rowCount: number = countDataRows(text)
): BenchmarkScenario {
  return {name, description, text, delimiter, rowCount};
}

/**
 * Counts data rows in a CSV string.
 * @param text CSV text.
 * @returns Number of data rows.
 */
function countDataRows(text: string): number {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return 0;
  }
  return Math.max(trimmedText.split(/\r?\n/).length - 1, 0);
}

/**
 * Returns loaders.gl CSV loader benchmark definitions.
 * @param scenario CSV benchmark scenario.
 * @param dynamicTyping Whether numeric and boolean values should be typed.
 * @returns Loader benchmark definitions.
 */
function getCSVLoaderBenchmarks(
  scenario: BenchmarkScenario,
  dynamicTyping: boolean
): LoaderBenchmark[] {
  const arrowOptions = {
    csv: {
      header: true as const,
      delimiter: scenario.delimiter,
      dynamicTyping,
      shape: 'arrow-table' as const
    }
  };
  const csvOptions = {
    csv: {
      header: true as const,
      delimiter: scenario.delimiter,
      shape: 'array-row-table' as const,
      dynamicTyping
    }
  };
  return [
    {name: 'CSVLoader (arrow-table)', loader: CSVLoader, options: arrowOptions},
    {name: 'CSVLoader', loader: CSVLoader, options: csvOptions}
  ];
}

/**
 * Adds one CSV loader parse benchmark.
 * @param bench Target benchmark suite.
 * @param scenario CSV benchmark scenario.
 * @param loaderBenchmark Loader benchmark definition.
 */
function addLoaderParseBenchmark(
  bench: Bench,
  scenario: BenchmarkScenario,
  loaderBenchmark: LoaderBenchmark
): void {
  const parseText = loaderBenchmark.loader.parseText;
  if (!parseText) {
    throw new Error(`${loaderBenchmark.name} benchmark requires a parser-bearing loader`);
  }

  bench.addAsync(
    createBenchmarkId(loaderBenchmark.name, {
      dynamicTyping: loaderBenchmark.options.csv.dynamicTyping,
      operation: 'parseText',
      scenario: scenario.name
    }),
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount},
    async () => await parseText(scenario.text, loaderBenchmark.options)
  );
}

/**
 * Adds a d3-dsv CSV parse benchmark.
 * @param bench Target benchmark suite.
 * @param scenario CSV benchmark scenario.
 * @param dynamicTyping Whether numeric and boolean values should be typed.
 */
function addD3ParseBenchmark(
  bench: Bench,
  scenario: BenchmarkScenario,
  dynamicTyping: boolean
): void {
  bench.addAsync(
    createBenchmarkId('d3-dsv', {
      dynamicTyping,
      operation: 'parseText',
      scenario: scenario.name
    }),
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount},
    async () =>
      scenario.delimiter === '\t'
        ? tsvParse(scenario.text, dynamicTyping ? autoType : undefined)
        : csvParse(scenario.text, dynamicTyping ? autoType : undefined)
  );
}

/**
 * Adds an npm PapaParse CSV parse benchmark.
 * @param bench Target benchmark suite.
 * @param scenario CSV benchmark scenario.
 * @param dynamicTyping Whether numeric and boolean values should be typed.
 */
function addPapaParseNPMBenchmark(
  bench: Bench,
  scenario: BenchmarkScenario,
  dynamicTyping: boolean
): void {
  bench.addAsync(
    createBenchmarkId('PapaParse npm', {
      dynamicTyping,
      operation: 'parseText',
      scenario: scenario.name
    }),
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount},
    async () =>
      PapaParseNPM.parse(scenario.text, {
        header: true,
        dynamicTyping,
        delimiter: scenario.delimiter
      }).data
  );
}

/**
 * Adds a uDSV CSV parse benchmark.
 * @param bench Target benchmark suite.
 * @param scenario CSV benchmark scenario.
 * @param dynamicTyping Whether numeric and boolean values should be typed.
 */
function addUDSVParseBenchmark(
  bench: Bench,
  scenario: BenchmarkScenario,
  dynamicTyping: boolean
): void {
  bench.addAsync(
    createBenchmarkId('uDSV', {
      dynamicTyping,
      operation: 'parseText',
      scenario: scenario.name
    }),
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount},
    async () => {
      const schema = inferSchema(scenario.text, {col: scenario.delimiter});
      const parser = initParser(schema);
      return dynamicTyping ? parser.typedObjs(scenario.text) : parser.stringObjs(scenario.text);
    }
  );
}

/**
 * Creates a unique benchmark id that can be stripped back to a display name.
 * @param displayName Name to render in the benchmark table.
 * @param parameters Hidden parameters that keep probe.gl test ids unique.
 * @returns Unique benchmark id.
 */
function createBenchmarkId(
  displayName: string,
  parameters: {dynamicTyping: boolean; operation: string; scenario: string}
): string {
  const typingLabel = getDynamicTypingLabel(parameters.dynamicTyping);
  return `${displayName} [${parameters.operation}, ${typingLabel}, ${parameters.scenario}]`;
}

/**
 * Returns the row label users should see for a benchmark id.
 * @param benchmarkId Unique benchmark id.
 * @returns Display name.
 */
function getBenchmarkDisplayName(benchmarkId: string): string {
  return benchmarkId.replace(/ \[[^\]]+\]$/, '');
}

/**
 * Returns true when a benchmark row belongs to loaders.gl.
 * @param displayName Benchmark display name.
 * @returns Whether the row is a loaders.gl benchmark.
 */
function isLoadersGLBenchmarkName(displayName: string): boolean {
  return displayName === 'CSVLoader (arrow-table)' || displayName === 'CSVLoader';
}

/**
 * Creates a parse group title that carries the CSV settings being compared.
 * @param scenario CSV benchmark scenario.
 * @param dynamicTyping Whether numeric and boolean values should be typed.
 * @returns CSV parse group title.
 */
function getCSVParseGroupTitle(scenario: BenchmarkScenario, dynamicTyping: boolean): string {
  return `CSV Parse - ${scenario.description} - ${getTypingParameterLabel(dynamicTyping)} delimiter=${getDelimiterLabel(scenario.delimiter)} ${scenario.rowCount.toLocaleString()} rows`;
}

/**
 * Returns a readable delimiter label for group headings.
 * @param delimiter Scenario delimiter.
 * @returns Delimiter label.
 */
function getDelimiterLabel(delimiter: ',' | '\t'): string {
  return delimiter === '\t' ? '\\t' : delimiter;
}

/**
 * Returns the dynamic typing parameter text for group headings.
 * @param dynamicTyping Whether numeric and boolean values should be typed.
 * @returns Dynamic typing parameter text.
 */
function getTypingParameterLabel(dynamicTyping: boolean): string {
  return `dynamicTyping=${dynamicTyping ? '\u2705' : '\u274c'}`;
}

/**
 * Returns a compact dynamic typing label for group titles and ids.
 * @param dynamicTyping Whether numeric and boolean values should be typed.
 * @returns Typing mode label.
 */
function getDynamicTypingLabel(dynamicTyping: boolean): string {
  return dynamicTyping ? 'Typed' : 'Untyped';
}

/**
 * Creates unquoted CSV data for fast-mode parser paths.
 * @returns CSV text.
 */
function createUnquotedCSV(): string {
  const rows = ['id,value,name'];
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    rows.push(`${rowIndex},${rowIndex * 2},name-${rowIndex}`);
  }
  return `${rows.join('\n')}\n`;
}

/**
 * Creates quoted CSV data with escaped quotes and embedded commas.
 * @returns CSV text.
 */
function createQuotedCSV(): string {
  const rows = ['id,description,category'];
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    rows.push(`${rowIndex},"quoted, value ${rowIndex} with ""escape""","line ${rowIndex}"`);
  }
  return `${rows.join('\n')}\n`;
}

/**
 * Creates tab-separated data.
 * @returns TSV text.
 */
function createTSV(): string {
  const rows = ['id\tvalue\tname'];
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    rows.push(`${rowIndex}\t${rowIndex * 2}\tname-${rowIndex}`);
  }
  return `${rows.join('\n')}\n`;
}

/**
 * Creates wide CSV data with many columns.
 * @returns CSV text.
 */
function createWideCSV(): string {
  const headerRow: string[] = [];
  for (let columnIndex = 0; columnIndex < WIDE_COLUMN_COUNT; columnIndex++) {
    headerRow.push(`column${columnIndex}`);
  }

  const rows = [headerRow.join(',')];
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    const row: string[] = [];
    for (let columnIndex = 0; columnIndex < WIDE_COLUMN_COUNT; columnIndex++) {
      row.push(`${rowIndex + columnIndex}`);
    }
    rows.push(row.join(','));
  }
  return `${rows.join('\n')}\n`;
}

/**
 * Creates UTF-8 CSV data with non-ASCII text cells.
 * @returns CSV text.
 */
function createUtf8CSV(): string {
  const rows = ['id,city,label'];
  const cities = [
    'Z\u00fcrich',
    'M\u00fcnchen',
    'S\u00e3o Paulo',
    '\u6771\u4eac',
    'Montr\u00e9al',
    'Krak\u00f3w'
  ];
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    rows.push(`${rowIndex},${cities[rowIndex % cities.length]},caf\u00e9-${rowIndex}`);
  }
  return `${rows.join('\n')}\n`;
}
