<<<<<<< Updated upstream
import {encodeTableAsText, fetchFile, parse} from '@loaders.gl/core';
=======
import {encodeTableAsText, fetchFile, parse, parseInBatches, preload} from '@loaders.gl/core';
>>>>>>> Stashed changes
import {CSVArrowLoader, CSVArrowWriter, CSVLoader, CSVWriter} from '@loaders.gl/csv';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable, Table} from '@loaders.gl/schema';
import PapaParseNPM from 'papaparse';
import {inferSchema, initParser} from 'udsv';
import Papa from '../src/papaparse/papaparse';

const SAMPLE_CSV_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';

// Comparison loader based on D3
import {autoType, csvFormat, csvParse, tsvFormat, tsvParse} from 'd3-dsv';

const D3CSVLoaderUntyped = {
  name: 'D3 CSV untyped',
  extensions: ['csv'],
  testText: null,
  text: true,
  parseTextSync: text => csvParse(text)
};

const D3TSVLoaderUntyped = {
  name: 'D3 TSV untyped',
  extensions: ['tsv'],
  testText: null,
  text: true,
  parseTextSync: text => tsvParse(text)
};

const D3CSVLoaderTyped = {
  name: 'D3 CSV typed',
  extensions: ['csv'],
  testText: null,
  text: true,
  parseTextSync: text => csvParse(text, autoType)
};

const D3TSVLoaderTyped = {
  name: 'D3 TSV typed',
  extensions: ['tsv'],
  testText: null,
  text: true,
  parseTextSync: text => tsvParse(text, autoType)
};

const ROW_COUNT = 2000;
const WIDE_COLUMN_COUNT = 40;
const STREAM_CHUNK_SIZE = 4096;
const STREAM_CHUNK_SIZES = [1024, STREAM_CHUNK_SIZE, 64 * 1024, 1024 * 1024];
const BENCHMARK_OPTIONS = {minIterations: 3};

export default async function csvBench(bench) {
  const response = await fetchFile(SAMPLE_CSV_URL);
  const sample = await response.text();
  const scenarios = createBenchmarkScenarios(sample);
  const standardScenarios = getStandardBenchmarkScenarios(scenarios);
  await addBenchmarkScenarioTables(standardScenarios);

  for (const scenario of standardScenarios) {
    const arrowOptions = {csv: {header: true as const, dynamicTyping: false}};
    const csvOptions = {
      csv: {
        header: true as const,
        shape: 'object-row-table' as const,
        dynamicTyping: false
      }
    };
    const loaderBenchmarks = [
      {
        name: 'CSVArrowLoader#parse({header:true, dynamicTyping: false})',
        loader: CSVArrowLoader,
        options: arrowOptions
      },
      {
        name: "CSVLoader#parse({header:true, shape: 'object-row-table', dynamicTyping: false})",
        loader: CSVLoader,
        options: csvOptions
      }
    ];

    let decodeBench = bench.group(`CSV Decode - Untyped - ${scenario.name}`);
    decodeBench = addUDSVParseBenchmark(decodeBench, scenario, false);
    decodeBench = addD3ParseBenchmark(decodeBench, scenario, false);
    decodeBench = addExternalParserBenchmarks(decodeBench, scenario, false);
    decodeBench = addLoaderBenchmarks(decodeBench, scenario, loaderBenchmarks, {
      operation: 'parse'
    });
  }

  for (const scenario of standardScenarios) {
    const arrowOptions = {csv: {header: true as const, dynamicTyping: true}};
    const csvOptions = {
      csv: {
        header: true as const,
        shape: 'object-row-table' as const,
        dynamicTyping: true
      }
    };
    const loaderBenchmarks = [
      {
        name: 'CSVArrowLoader#parse({header:true, dynamicTyping: true})',
        loader: CSVArrowLoader,
        options: arrowOptions
      },
      {
        name: "CSVLoader#parse({header:true, shape: 'object-row-table', dynamicTyping: true})",
        loader: CSVLoader,
        options: csvOptions
      }
    ];

    let decodeBench = bench.group(`CSV Decode - Typed - ${scenario.name}`);
    decodeBench = addUDSVParseBenchmark(decodeBench, scenario, true);
    decodeBench = addD3ParseBenchmark(decodeBench, scenario, true);
    decodeBench = addExternalParserBenchmarks(decodeBench, scenario, true);
    decodeBench = addLoaderBenchmarks(decodeBench, scenario, loaderBenchmarks, {
      operation: 'parse'
    });
  }

  for (const scenario of standardScenarios) {
    let encodeBench = bench.group(`CSV Encode - Untyped - ${scenario.name}`);
    encodeBench = addD3FormatBenchmark(encodeBench, scenario, false);
    encodeBench = addWriterBenchmarks(encodeBench, scenario, false);
  }

  for (const scenario of standardScenarios) {
    let encodeBench = bench.group(`CSV Encode - Typed - ${scenario.name}`);
    encodeBench = addD3FormatBenchmark(encodeBench, scenario, true);
    encodeBench = addWriterBenchmarks(encodeBench, scenario, true);
  }

  // csvDebugBench includes generated scenarios, parser/tokenizer diagnostics and is
  // intentionally excluded from standard benchmark runs. Uncomment when investigating CSV internals.
  // await addBenchmarkScenarioTables(scenarios);
  // bench = csvDebugBench(bench, scenarios);

  return bench;
}

function addD3ParseBenchmark(bench, scenario: BenchmarkScenario, dynamicTyping: boolean) {
  const format = scenario.name === 'tsv' ? 'tsv' : 'csv';
  const rowTransform = dynamicTyping ? 'autoType' : 'none';
  return bench.addAsync(
    `d3-dsv format=${format} header=first-row rowType=object rowTransform=${rowTransform}#parse`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () => {
      // @ts-ignore
      return await parse(scenario.text, getD3Loader(scenario.name === 'tsv', dynamicTyping));
    }
  );
}

function getD3Loader(isTSV: boolean, dynamicTyping: boolean) {
  if (isTSV) {
    return dynamicTyping ? D3TSVLoaderTyped : D3TSVLoaderUntyped;
  }
  return dynamicTyping ? D3CSVLoaderTyped : D3CSVLoaderUntyped;
}

/** Adds non-loaders.gl parser baselines with matching dynamic typing semantics where available. */
function addExternalParserBenchmarks(bench, scenario: BenchmarkScenario, dynamicTyping: boolean) {
  if (!dynamicTyping && typeof window === 'undefined') {
    bench = addCSVParserParseBenchmark(bench, scenario);
  }
  bench = addPapaParseNPMBenchmark(bench, scenario, dynamicTyping);
  return bench;
}

/** Adds the latest npm PapaParse package as an external parser baseline. */
function addPapaParseNPMBenchmark(bench, scenario: BenchmarkScenario, dynamicTyping: boolean) {
  const delimiter = scenario.name === 'tsv' ? '\\t' : 'auto';
  return bench.addAsync(
    `PapaParse npm header=true rowType=object delimiter=${delimiter} dynamicTyping=${dynamicTyping}#parse`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () =>
      PapaParseNPM.parse(scenario.text, {
        header: true,
        dynamicTyping,
        delimiter: scenario.name === 'tsv' ? '\t' : ''
      }).data
  );
}

/** Adds a uDSV parse benchmark for either string-object or typed-object output. */
function addUDSVParseBenchmark(bench, scenario: BenchmarkScenario, dynamicTyping: boolean) {
  const delimiter = scenario.name === 'tsv' ? '\\t' : ',';
  const mode = dynamicTyping ? 'typedObjs' : 'stringObjs';
  return bench.addAsync(
    `uDSV header=true rowType=object delimiter=${delimiter} mode=${mode}#parse`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () => {
      const schema = inferSchema(scenario.text, {
        col: scenario.name === 'tsv' ? '\t' : ','
      });
      const parser = initParser(schema);
      return dynamicTyping ? parser.typedObjs(scenario.text) : parser.stringObjs(scenario.text);
    }
  );
}

/** Adds a csv-parser streaming benchmark for untyped object-row output. */
function addCSVParserParseBenchmark(bench, scenario: BenchmarkScenario) {
  const delimiter = scenario.name === 'tsv' ? '\\t' : ',';
  return bench.addAsync(
    `csv-parser header=true rowType=object delimiter=${delimiter}#parse`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () => parseWithCSVParser(scenario.text, scenario.name === 'tsv')
  );
}

/** Parses a CSV or TSV string with the csv-parser stream API. */
function parseWithCSVParser(text: string, isTSV: boolean): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Promise.all([import('node:stream'), import('csv-parser')])
      .then(([{Readable}, {default: csvParser}]) => {
        const rows: any[] = [];
        Readable.from([text])
          .pipe(csvParser({separator: isTSV ? '\t' : ','}))
          .on('data', row => rows.push(row))
          .on('error', reject)
          .on('end', () => resolve(rows));
      })
      .catch(reject);
  });
}

type LoaderBenchmark = {
  name: string;
  loader: LoaderWithParser<any, any, any>;
  options: any;
};

/** Adds all CSV loader operations grouped by loader name. */
function addLoaderBenchmarks(
  bench,
  scenario: BenchmarkScenario,
  loaderBenchmarks: LoaderBenchmark[],
  options: {operation: 'parseInBatches' | 'parseText' | 'parse'}
) {
  for (const loaderBenchmark of loaderBenchmarks) {
    bench = addLoaderOperationBenchmark(bench, scenario, options.operation, loaderBenchmark);
  }

  return bench;
}

/** Adds one operation benchmark for a loaders.gl CSV loader. */
function addLoaderOperationBenchmark(
  bench,
  scenario: BenchmarkScenario,
  operation: 'parseInBatches' | 'parseText' | 'parse',
  loaderBenchmark: LoaderBenchmark
) {
  return bench.addAsync(
    loaderBenchmark.name,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () => {
      switch (operation) {
        case 'parseInBatches':
          return await consumeBatches(
            loaderBenchmark.loader.parseInBatches?.(scenario.chunks, loaderBenchmark.options)
          );
        case 'parseText':
          return await loaderBenchmark.loader.parseText?.(scenario.text, loaderBenchmark.options);
        case 'parse':
          return await loaderBenchmark.loader.parse?.(
            scenario.arrayBuffer,
            loaderBenchmark.options
          );
        default:
          throw new Error(operation);
      }
    }
  );
}

type BenchmarkScenario = {
  name: string;
  text: string;
  arrayBuffer: ArrayBuffer;
  chunks: Uint8Array[];
  byteLength: number;
  rowCount: number;
  d3UntypedRows?: any[];
  d3TypedRows?: any[];
  untypedCSVTable?: Table;
  typedCSVTable?: Table;
  untypedArrowTable?: ArrowTable;
  typedArrowTable?: ArrowTable;
};

function createBenchmarkScenarios(sample: string): BenchmarkScenario[] {
  return [
    createBenchmarkScenario('full capability', createFullCapabilityCSV(), ROW_COUNT),
    createBenchmarkScenario('unquoted fast-mode', createUnquotedCSV(), ROW_COUNT),
    createBenchmarkScenario('quoted', createQuotedCSV(), ROW_COUNT),
    createBenchmarkScenario('tsv', createTSV(), ROW_COUNT),
    createBenchmarkScenario('wide rows', createWideCSV(), ROW_COUNT),
    createBenchmarkScenario('utf8 non-ascii', createUtf8CSV(), ROW_COUNT),
    createBenchmarkScenario('fixture', sample)
  ];
}

/**
 * Returns the representative scenarios that should appear in regular benchmark output.
 * @param scenarios All CSV benchmark scenarios.
 * @returns Public fixture-backed scenarios for the standard CSV benchmark run.
 */
function getStandardBenchmarkScenarios(scenarios: BenchmarkScenario[]): BenchmarkScenario[] {
  return scenarios.filter(scenario => scenario.name === 'fixture');
}

function createBenchmarkScenario(
  name: string,
  text: string,
  rowCount: number = countDataRows(text)
): BenchmarkScenario {
  const bytes = new TextEncoder().encode(text);
  return {
    name,
    text,
    arrayBuffer: bytes.buffer,
    chunks: createChunks(bytes, STREAM_CHUNK_SIZE),
    byteLength: bytes.byteLength,
    rowCount
  };
}

async function addBenchmarkScenarioTables(scenarios: BenchmarkScenario[]): Promise<void> {
  for (const scenario of scenarios) {
    const isTSV = scenario.name === 'tsv';
    scenario.d3UntypedRows = isTSV ? tsvParse(scenario.text) : csvParse(scenario.text);
    scenario.d3TypedRows = isTSV
      ? tsvParse(scenario.text, autoType)
      : csvParse(scenario.text, autoType);
    scenario.untypedCSVTable = await CSVLoader.parseText(scenario.text, {
      csv: {
        header: true,
        shape: 'array-row-table',
        dynamicTyping: false
      }
    });
    scenario.typedCSVTable = await CSVLoader.parseText(scenario.text, {
      csv: {
        header: true,
        shape: 'array-row-table',
        dynamicTyping: true
      }
    });
    scenario.untypedArrowTable = await CSVArrowLoader.parse(scenario.arrayBuffer, {
      csv: {
        header: true,
        dynamicTyping: false
      }
    });
    scenario.typedArrowTable = await CSVArrowLoader.parse(scenario.arrayBuffer, {
      csv: {
        header: true,
        dynamicTyping: true
      }
    });
  }
}

function addD3FormatBenchmark(bench, scenario: BenchmarkScenario, dynamicTyping: boolean) {
  const format = scenario.name === 'tsv' ? 'tsv' : 'csv';
  const inputRows = dynamicTyping ? 'typed' : 'untyped';
  return bench.addAsync(
    `d3-dsv format=${format} rowType=object inputRows=${inputRows}#format`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () => {
      const rows = dynamicTyping ? scenario.d3TypedRows : scenario.d3UntypedRows;
      return scenario.name === 'tsv' ? tsvFormat(rows || []) : csvFormat(rows || []);
    }
  );
}

function addWriterBenchmarks(bench, scenario: BenchmarkScenario, dynamicTyping: boolean) {
  const csvTable = dynamicTyping ? scenario.typedCSVTable : scenario.untypedCSVTable;
  const arrowTable = dynamicTyping ? scenario.typedArrowTable : scenario.untypedArrowTable;
  const inputRows = dynamicTyping ? 'typed' : 'untyped';

  bench = bench.addAsync(
    `CSVWriter rowType=object format=csv inputRows=${inputRows}#encodeText`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () => {
      return await encodeTableAsText(csvTable!, CSVWriter);
    }
  );

  bench = bench.addAsync(
    `CSVArrowWriter rowType=arrow-table format=csv inputRows=${inputRows}#encodeText`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () => {
      return await encodeTableAsText(arrowTable!, CSVArrowWriter);
    }
  );

  return bench;
}

/**
 * Adds detailed CSV internals diagnostics for parser development.
 * @param bench Benchmark suite.
 * @param scenarios CSV benchmark scenarios.
 * @returns Benchmark suite with CSV debug diagnostics added.
 */
export function csvDebugBench(bench, scenarios: BenchmarkScenario[]) {
  const diagnosticScenarios = [
    scenarios.find(scenario => scenario.name === 'unquoted fast-mode'),
    scenarios.find(scenario => scenario.name === 'quoted'),
    scenarios.find(scenario => scenario.name === 'wide rows'),
    scenarios.find(scenario => scenario.name === 'utf8 non-ascii')
  ].filter(Boolean) as BenchmarkScenario[];

  let diagnosticBench = bench.group('CSV Diagnostics');

  for (const scenario of diagnosticScenarios) {
    diagnosticBench = addTokenizerBenchmarks(diagnosticBench, scenario);
    diagnosticBench = addCSVLoaderOptionBenchmarks(diagnosticBench, scenario);
  }

  const streamingScenario = scenarios.find(scenario => scenario.name === 'fixture') || scenarios[0];
<<<<<<< Updated upstream
  diagnosticBench = addStreamingChunkSizeBenchmarks(diagnosticBench, streamingScenario);
=======
  diagnosticBench = addStreamingChunkSizeBenchmarks(
    diagnosticBench,
    streamingScenario,
    csvLoaderWithParser
  );
>>>>>>> Stashed changes

  return bench;
}

function addTokenizerBenchmarks(bench, scenario: BenchmarkScenario) {
  const parserConfig = {delimiter: scenario.name === 'tsv' ? '\t' : ',', newline: '\n'};

  bench = bench.addAsync(
    `Tokenizer ${scenario.name}#TextDecoder.decode`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.byteLength, unit: 'bytes'},
    async () => {
      return new TextDecoder().decode(scenario.arrayBuffer);
    }
  );

  bench = bench.addAsync(
    `Tokenizer ${scenario.name}#split rows`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () => {
      return scenario.text.split('\n');
    }
  );

  bench = bench.addAsync(
    `Tokenizer ${scenario.name}#split rows+cells`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () => {
      return scenario.text.split('\n').map(row => row.split(parserConfig.delimiter));
    }
  );

  bench = bench.addAsync(
    `Tokenizer ${scenario.name}#Papa.Parser core`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () => {
      const parser = new Papa.Parser(parserConfig);
      return parser.parse(scenario.text);
    }
  );

  bench = bench.addAsync(
    `Tokenizer ${scenario.name}#Papa.parse arrays`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
    async () => {
      return Papa.parse(scenario.text, {
        ...parserConfig,
        header: false,
        dynamicTyping: false,
        skipEmptyLines: false
      });
    }
  );

  return bench;
}

function addCSVLoaderOptionBenchmarks(bench, scenario: BenchmarkScenario) {
  const delimiter = scenario.name === 'tsv' ? '\t' : ',';
  const baseCSVOptions = {
    header: true as const,
    delimiter,
    skipEmptyLines: false
  };

  for (const shape of ['array-row-table', 'object-row-table'] as const) {
    for (const dynamicTyping of [false, true]) {
      bench = bench.addAsync(
        `CSVLoader options ${scenario.name}#${shape} dynamicTyping=${dynamicTyping}`,
        {...BENCHMARK_OPTIONS, multiplier: scenario.rowCount, unit: 'rows'},
        async () => {
          return await CSVLoader.parseText(scenario.text, {
            csv: {
              ...baseCSVOptions,
              shape,
              dynamicTyping
            }
          });
        }
      );
    }
  }

  return bench;
}

<<<<<<< Updated upstream
function addStreamingChunkSizeBenchmarks(bench, scenario: BenchmarkScenario) {
=======
function addStreamingChunkSizeBenchmarks(
  bench,
  scenario: BenchmarkScenario,
  csvLoaderWithParser: Loader
) {
>>>>>>> Stashed changes
  const options = {
    csv: {
      header: true as const,
      shape: 'array-row-table' as const,
      dynamicTyping: false,
      skipEmptyLines: false
    }
  };

  for (const chunkSize of STREAM_CHUNK_SIZES) {
    const chunks = createChunks(new Uint8Array(scenario.arrayBuffer), chunkSize);
    bench = bench.addAsync(
      `Streaming ${scenario.name}#parseInBatches chunkSize=${chunkSize}`,
      {...BENCHMARK_OPTIONS, multiplier: scenario.byteLength, unit: 'bytes'},
      async () => {
<<<<<<< Updated upstream
        return await consumeBatches(CSVLoader.parseInBatches(chunks, options));
=======
        return await consumeBatches(await parseInBatches(chunks, csvLoaderWithParser, options));
>>>>>>> Stashed changes
      }
    );
  }

  bench = bench.addAsync(
    `Streaming ${scenario.name}#parseInBatches chunkSize=whole`,
    {...BENCHMARK_OPTIONS, multiplier: scenario.byteLength, unit: 'bytes'},
    async () => {
<<<<<<< Updated upstream
      return await consumeBatches(CSVLoader.parseInBatches([scenario.arrayBuffer], options));
=======
      return await consumeBatches(
        await parseInBatches([scenario.arrayBuffer], csvLoaderWithParser, options)
      );
>>>>>>> Stashed changes
    }
  );

  return bench;
}

function countDataRows(text: string): number {
  return Math.max(0, text.trimEnd().split('\n').length - 1);
}

function createChunks(bytes: Uint8Array, chunkSize: number): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let start = 0; start < bytes.byteLength; start += chunkSize) {
    chunks.push(bytes.subarray(start, start + chunkSize));
  }
  return chunks;
}

async function consumeBatches(asyncIterable?: AsyncIterable<{length?: number}>): Promise<number> {
  let rowCount = 0;
  if (!asyncIterable) {
    return rowCount;
  }
  for await (const batch of asyncIterable) {
    rowCount += batch.length || 0;
  }
  return rowCount;
}

function createUnquotedCSV(): string {
  const rows = ['id,value,name'];
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    rows.push(`${rowIndex},${rowIndex * 2},name-${rowIndex}`);
  }
  return `${rows.join('\n')}\n`;
}

function createFullCapabilityCSV(): string {
  const rows = ['id,name,description,city,amount'];
  const cities = ['Zürich', 'München', 'São Paulo', '東京', 'Montréal', 'Kraków'];
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    const description =
      rowIndex % 25 === 0
        ? `"line ${rowIndex}\nwith ""quotes"", comma, and café"`
        : `"quoted, value ${rowIndex} with ""escape"""`;
    rows.push(
      `${rowIndex},"name-${rowIndex}",${description},${cities[rowIndex % cities.length]},${
        rowIndex * 2
      }`
    );
  }
  return `${rows.join('\n')}\n`;
}

function createQuotedCSV(): string {
  const rows = ['id,description,category'];
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    rows.push(`${rowIndex},"quoted, value ${rowIndex}","line ${rowIndex}"`);
  }
  return `${rows.join('\n')}\n`;
}

function createTSV(): string {
  const rows = ['id\tvalue\tname'];
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    rows.push(`${rowIndex}\t${rowIndex * 2}\tname-${rowIndex}`);
  }
  return `${rows.join('\n')}\n`;
}

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

function createUtf8CSV(): string {
  const rows = ['id,city,label'];
  const cities = ['Zürich', 'München', 'São Paulo', '東京', 'Montréal', 'Kraków'];
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    rows.push(`${rowIndex},${cities[rowIndex % cities.length]},café-${rowIndex}`);
  }
  return `${rows.join('\n')}\n`;
}
