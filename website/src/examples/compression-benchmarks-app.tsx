// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {gunzipSync, unzlibSync, gzipSync, zlibSync} from 'fflate';

import React, {useEffect, useState} from 'react';
import {createCompressionBenchmarkData} from './compression-benchmark-data';

import {Bench, type LogEntry} from '@probe.gl/bench';
import {BrotliShimDecompressor} from '@loaders.gl/compression/brotli-decompressor-shim';
import {DeflateFflateCompressor} from '@loaders.gl/compression/deflate-compressor-fflate';
import {DeflateFflateDecompressor} from '@loaders.gl/compression/deflate-decompressor-fflate';
import {GZipFflateCompressor} from '@loaders.gl/compression/gzip-compressor-fflate';
import {GZipFflateDecompressor} from '@loaders.gl/compression/gzip-decompressor-fflate';
import {DeflatePakoCompressor} from '@loaders.gl/compression/deflate-compressor-pako';
import {DeflatePakoDecompressor} from '@loaders.gl/compression/deflate-decompressor-pako';
import {GZipPakoCompressor} from '@loaders.gl/compression/gzip-compressor-pako';
import {GZipPakoDecompressor} from '@loaders.gl/compression/gzip-decompressor-pako';
import {LZ4JSCompression} from '@loaders.gl/compression/lz4-lz4js';
import {SnappyJSCompression} from '@loaders.gl/compression/snappy-snappyjs';
import {ZstdFzstdDecompressor} from '@loaders.gl/compression/zstd-decompressor-fzstd';
import {ZstdCodecCompression} from '@loaders.gl/compression/zstd-zstd-codec';
import {BrotliCompressUtilsCompressor} from '@loaders.gl/compression/brotli-compressor-compress-utils';
import {BrotliCompressUtilsDecompressor} from '@loaders.gl/compression/brotli-decompressor-compress-utils';
import {BZip2CompressUtilsCompressor} from '@loaders.gl/compression/bzip2-compressor-compress-utils';
import {BZip2CompressUtilsDecompressor} from '@loaders.gl/compression/bzip2-decompressor-compress-utils';
import {DeflateCompressUtilsCompressor} from '@loaders.gl/compression/deflate-compressor-compress-utils';
import {DeflateCompressUtilsDecompressor} from '@loaders.gl/compression/deflate-decompressor-compress-utils';
import {GZipCompressUtilsCompressor} from '@loaders.gl/compression/gzip-compressor-compress-utils';
import {GZipCompressUtilsDecompressor} from '@loaders.gl/compression/gzip-decompressor-compress-utils';
import {LZ4CompressUtilsCompressor} from '@loaders.gl/compression/lz4-compressor-compress-utils';
import {LZ4CompressUtilsDecompressor} from '@loaders.gl/compression/lz4-decompressor-compress-utils';
import {SnappyCompressUtilsCompressor} from '@loaders.gl/compression/snappy-compressor-compress-utils';
import {SnappyCompressUtilsDecompressor} from '@loaders.gl/compression/snappy-decompressor-compress-utils';
import {XZCompressUtilsCompressor} from '@loaders.gl/compression/xz-compressor-compress-utils';
import {XZCompressUtilsDecompressor} from '@loaders.gl/compression/xz-decompressor-compress-utils';
import {ZstdCompressUtilsCompressor} from '@loaders.gl/compression/zstd-compressor-compress-utils';
import {ZstdCompressUtilsDecompressor} from '@loaders.gl/compression/zstd-decompressor-compress-utils';
import {compressWithNativeCompressionStream} from '@loaders.gl/compression/native-compression';
import {decompressWithNativeDecompressionStream} from '@loaders.gl/compression/native-decompression';

type BenchmarkStatus = 'loading' | 'running' | 'complete' | 'failed';

type CompressionBenchmarkCase = {
  /** Human-readable format and fixture label. */
  name: string;
  /** Compressed bytes held outside the timed callback. */
  compressedData: ArrayBuffer;
  /** Expected bytes used for verification before timing. */
  expectedData: Uint8Array;
  /** Expected decompressed byte count. */
  uncompressedByteLength: number;
  /** Native stream format to probe. */
  nativeFormat: 'deflate' | 'gzip' | 'brotli' | 'zstd' | null;
  /** Compact or injected external implementations. */
  externalCompressions: Array<{
    name: string;
    decompress(input: ArrayBuffer): Promise<ArrayBuffer>;
  }>;
};

type BenchmarkResultRow = {
  id: string;
  groupId?: string;
  isGroup?: boolean;
  unavailable?: boolean;
  uncompressedByteLength?: number;
  dependency?: string;
  dependencySize?: string;
  dependencyUrl?: string;
  dependencyNpmUrl?: string;
  throughput?: number;
  formattedValue?: string;
  formattedError?: string;
};

/** Renders live native-versus-external encoding and decoding benchmarks. */
export default function CompressionBenchmarksApp(): JSX.Element {
  const [rows, setRows] = useState<BenchmarkResultRow[]>([]);
  const [status, setStatus] = useState<BenchmarkStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setRows([]);
    setWarnings([]);
    setStatus('loading');
    setErrorMessage(null);

    /** Receives benchmark log entries for the live results table. */
    const benchmarkByteLengths = new Map<string, number>();
    const appendLogEntry = (entry: LogEntry): void => {
      if (!isMounted) return;
      const row = createBenchmarkResultRow(entry, benchmarkByteLengths);
      if (row) setRows(previousRows => [...previousRows, row]);
    };

    /** Loads fixtures, probes native codecs, and runs the benchmark suite. */
    const runBenchmarks = async (): Promise<void> => {
      try {
      const benchmarkCases = await createCompressionBenchmarkCases();
        for (const benchmarkCase of benchmarkCases) {
          benchmarkByteLengths.set(benchmarkCase.name, benchmarkCase.uncompressedByteLength);
        }
        const bench = new Bench({
          id: 'loaders-gl-compression-website-benchmarks',
          log: appendLogEntry
        });

        for (const benchmarkCase of benchmarkCases) {
          await addCompressionBenchmarks(
            bench,
            benchmarkCase,
            warning => {
              if (isMounted) setWarnings(previousWarnings => [...previousWarnings, warning]);
            },
            () => {
              if (isMounted) {
                setRows(previousRows => [
                  ...previousRows,
                  {
                    id: 'built-in',
                    groupId: benchmarkCase.name,
                    unavailable: true,
                    uncompressedByteLength: benchmarkCase.uncompressedByteLength,
                    ...getCompressionDependencyInfo('native', benchmarkCase.name)
                  }
                ]);
              }
            }
          );
        }

        for (const benchmarkCase of benchmarkCases) {
          const encodingCase = {...benchmarkCase, name: `Compression: ${benchmarkCase.name}`};
          benchmarkByteLengths.set(encodingCase.name, encodingCase.uncompressedByteLength);
          await addEncodingBenchmarks(bench, encodingCase, warning => {
            if (isMounted) setWarnings(previousWarnings => [...previousWarnings, warning]);
          }, () => {
            if (isMounted) setRows(previousRows => [...previousRows, {
              id: 'built-in', groupId: encodingCase.name, unavailable: true,
              ...getCompressionDependencyInfo('native', encodingCase.name)
            }]);
          });
        }

        if (isMounted) setStatus('running');
        await bench.calibrate().run();
        if (isMounted) setStatus('complete');
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

  /** Starts a fresh benchmark run. */
  const restartBenchmarks = (): void => setRunId(previousRunId => previousRunId + 1);
  const isRunning = status === 'loading' || status === 'running';
  const canRestart = status === 'complete' || status === 'failed';

  return (
    <div className="benchmark-page">
      <p>
        Live compression and decompression throughput for built-in streams versus compact or injected codecs.
        Keep this tab focused while it runs.
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
      <div className="benchmark-results" aria-live="polite">
        <h3>Decompression</h3>
        <CompressionBenchmarkResults rows={rows.filter(row => !(row.groupId || row.id).startsWith('Compression: '))} />
        <h3>Compression</h3>
        <CompressionBenchmarkResults rows={rows.filter(row => (row.groupId || row.id).startsWith('Compression: '))} />
      </div>
      {warnings.length > 0 ? (
        <aside>
          <strong>Benchmark diagnostics</strong>
          <ul>
            {warnings.map(warning => <li key={warning}>{warning}</li>)}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}

/** Renders compression results with thresholds appropriate for bytes per second. */
function CompressionBenchmarkResults({rows}: {rows: BenchmarkResultRow[]}): JSX.Element {
  return (
    <div>
      <p>
        Throughput bands: <strong className="compression-benchmark-green">≥ 1 GB/s</strong>,{' '}
        <strong className="compression-benchmark-yellow">500 MB/s–1 GB/s</strong>,{' '}
        <strong className="compression-benchmark-red">&lt; 500 MB/s</strong>.
      </p>
      <p>Sizes are approximate browser payload indicators. The loaders.gl GZIP/DEFLATE size measures the six whole-buffer engine functions, excluding streaming classes and adapters; other rows use module, package, or fallback source sizes.</p>
      <p>Columns show uncompressed bytes processed per second. Both columns use seeded CSV generation with shuffled records, varied numbers and timestamps, random tokens, and categorical text. The payloads contain exactly 70,937 bytes and 16 MiB. Data generation and fixture compression happen before timing; rates are measured bytes processed per second.</p>
      <table>
        <thead>
          <tr>
            <th>Implementation</th>
            <th>Bundle size</th>
            <th>70 KB</th>
            <th>16 MB</th>
            <th>16 MB band</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter(row => row.isGroup && !row.id.includes(' (16 MiB)')).flatMap(groupRow => {
            const groupResults = rows
              .filter(row => row.groupId === groupRow.id)
              .sort((firstRow, secondRow) => {
                const firstPriority = firstRow.id === 'built-in' ? 0 : firstRow.id.startsWith('compress-utils ') ? 1 : 2;
                const secondPriority = secondRow.id === 'built-in' ? 0 : secondRow.id.startsWith('compress-utils ') ? 1 : 2;
                return firstPriority - secondPriority;
              });
            return [
              <tr key={`${groupRow.id}-heading`}>
                <th colSpan={5}>
                  {groupRow.id.replace('Compression: ', '')} · {formatByteCount(groupRow.uncompressedByteLength || 0)} uncompressed
                </th>
              </tr>,
              ...groupResults.map((row, index) => {
                const formatName = groupRow.id.split(' · ')[0];
                const largeRow = rows.find(candidate =>
                  candidate.id === row.id && candidate.groupId === `${formatName} · generated.csv (16 MiB)`
                );
                if (row.unavailable) {
                  return (
                    <tr key={`${groupRow.id}-${row.id}-${index}`}>
                      <td><strong>{row.id}</strong></td>
                      <td colSpan={4}>N/A</td>
                    </tr>
                  );
                }
                const band = getCompressionBenchmarkBand(largeRow?.throughput || 0);
                const barWidth = Math.min(((largeRow?.throughput || 0) / 1e9) * 100, 100);
                return (
                  <tr key={`${groupRow.id}-${row.id}-${index}`}>
                    <td>
                      <strong>
                        {row.dependencyUrl ? (
                          <a href={row.dependencyUrl} target="_blank" rel="noreferrer">
                            {row.id}
                          </a>
                        ) : row.id}
                      </strong>
                    </td>
                    <td>{row.dependencySize}</td>
                    <td className="compression-benchmark-value">{row.formattedValue}</td>
                    <td className="compression-benchmark-value">{largeRow?.formattedValue || 'N/A'}</td>
                    <td>
                      {largeRow?.throughput ? (
                        <div className={`compression-benchmark-bar ${band}`}>
                          <div style={{width: `${barWidth}%`}} />
                        </div>
                      ) : 'N/A'}
                    </td>
                  </tr>
                );
              })
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Selects the display band for a byte-throughput result. */
function getCompressionBenchmarkBand(throughput: number): 'compression-benchmark-green' | 'compression-benchmark-yellow' | 'compression-benchmark-red' {
  if (throughput >= 1e9) return 'compression-benchmark-green';
  if (throughput >= 500e6) return 'compression-benchmark-yellow';
  return 'compression-benchmark-red';
}

/** Converts a probe.gl log entry to the row shape expected by the results table. */
function createBenchmarkResultRow(entry: LogEntry, benchmarkByteLengths: Map<string, number>): BenchmarkResultRow | null {
  switch (entry.type) {
    case 'group':
      return {
        id: entry.id,
        isGroup: true,
        uncompressedByteLength: benchmarkByteLengths.get(entry.id)
      };
    case 'test': {
      const implementationName = entry.id.split(' · ').at(-1) || entry.id;
      const groupId = entry.id.slice(0, entry.id.lastIndexOf(' · '));
      const dependencyInfo = getCompressionDependencyInfo(implementationName, groupId);
      const displayName = implementationName === 'native'
        ? 'built-in'
        : implementationName === 'internal fflate' || implementationName === 'Brotli shim'
          ? 'loaders.gl'
          : dependencyInfo.dependency || implementationName;
      return {
        id: displayName,
        groupId,
        uncompressedByteLength: benchmarkByteLengths.get(groupId),
        ...dependencyInfo,
        throughput: parseSIValue(entry.itersPerSecond),
        formattedValue: formatByteRate(entry.itersPerSecond),
        formattedError: `${(entry.error * 100).toFixed(2)}%`
      };
    }
    case 'complete':
      return null;
    default:
      return null;
  }
}

/** Returns dependency metadata shown with one benchmark implementation. */
function getCompressionDependencyInfo(implementationName: string, groupId: string): Pick<BenchmarkResultRow, 'dependency' | 'dependencySize' | 'dependencyUrl' | 'dependencyNpmUrl'> {
  const dependencyInfo: Record<string, Pick<BenchmarkResultRow, 'dependency' | 'dependencySize' | 'dependencyUrl' | 'dependencyNpmUrl'>> = {
    native: {
      dependency: 'DecompressionStream',
      dependencySize: 'N/A',
      dependencyUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream'
    },
    'internal fflate': {
      dependency: 'loaders.gl',
      dependencySize: '~9.2 KB minified / 4.6 KB gzip',
      dependencyUrl: 'https://github.com/visgl/loaders.gl/tree/master/modules/compression/src/lib/fflate'
    },
    fflate: {
      dependency: 'fflate 0.7.4',
      dependencySize: '~85 KB browser module',
      dependencyUrl: 'https://github.com/101arrowz/fflate',
      dependencyNpmUrl: 'https://www.npmjs.com/package/fflate'
    },
    pako: {
      dependency: 'pako 2.2.0',
      dependencySize: '~23 KB minified inflate module',
      dependencyUrl: 'https://github.com/nodeca/pako',
      dependencyNpmUrl: 'https://www.npmjs.com/package/pako'
    },
    'Brotli shim': {
      dependency: 'loaders.gl',
      dependencySize: '~210 KB source',
      dependencyUrl: 'https://github.com/visgl/loaders.gl/tree/master/modules/compression/src/brotli',
      dependencyNpmUrl: 'https://www.npmjs.com/package/@loaders.gl/compression'
    },
    snappyjs: {
      dependency: 'snappyjs 0.6.1',
      dependencySize: '~15 KB browser source',
      dependencyUrl: 'https://github.com/zishuo/snappyjs',
      dependencyNpmUrl: 'https://www.npmjs.com/package/snappyjs'
    },
    lz4js: {
      dependency: 'lz4js 0.2.0',
      dependencySize: '~25 KB browser source',
      dependencyUrl: 'https://github.com/Benzinga/lz4js',
      dependencyNpmUrl: 'https://www.npmjs.com/package/lz4js'
    },
    'compress-utils': {
      dependency: 'compress-utils 0.8.0',
      dependencySize: getCompressUtilsSize(groupId),
      dependencyUrl: 'https://github.com/dupontcyborg/compress-utils',
      dependencyNpmUrl: 'https://www.npmjs.com/package/compress-utils'
    },
    fzstd: {
      dependency: 'fzstd 0.1.1',
      dependencySize: '~80 KB package',
      dependencyUrl: 'https://github.com/101arrowz/fzstd',
      dependencyNpmUrl: 'https://www.npmjs.com/package/fzstd'
    },
    'zstd-codec': {
      dependency: 'zstd-codec 0.1.5',
      dependencySize: '~2.0 MB package',
      dependencyUrl: 'https://github.com/yoshihitoh/zstd-codec',
      dependencyNpmUrl: 'https://www.npmjs.com/package/zstd-codec'
    }
  };
  if (groupId.startsWith('Compression: ')) {
    if (implementationName === 'native') dependencyInfo.native.dependencyUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream';
    if (implementationName === 'pako') dependencyInfo.pako.dependencySize = '~28 KB minified deflate module';
  }
  return dependencyInfo[implementationName] || {
    dependency: 'unknown',
    dependencySize: 'unknown'
  };
}

/** Returns the raw focused decoder size for one compress-utils format. */
function getCompressUtilsSize(groupId: string): string {
  const format = groupId.replace('Compression: ', '').split(' · ')[0].toLowerCase();
  if (groupId.startsWith('Compression: ')) {
    const encoderSizes: Record<string, string> = {
      gzip: '~62 KB encoder WASM', deflate: '~62 KB encoder WASM',
      brotli: '~456 KB encoder WASM', zstandard: '~347 KB encoder WASM',
      snappy: '~25 KB encoder WASM', lz4: '~95 KB encoder WASM',
      bzip2: '~66 KB encoder WASM', xz: '~107 KB encoder WASM'
    };
    return encoderSizes[format] || 'encoder WASM chunk';
  }
  const sizes: Record<string, string> = {
    gzip: '~51 KB focused WASM',
    deflate: '~51 KB focused WASM',
    brotli: '~189 KB focused WASM',
    zstandard: '~93 KB focused WASM',
    snappy: '~27 KB focused WASM',
    lz4: '~37 KB focused WASM',
    bzip2: '~53 KB focused WASM',
    xz: '~86 KB focused WASM'
  };
  return sizes[format] || 'focused WASM chunk';
}

/** Parses a probe.gl SI-formatted throughput value. */
function parseSIValue(value: string): number {
  const match = value.trim().match(/^([+-]?\d+(?:\.\d+)?)([KMGTPEemn]|\u00b5|e[+-]?\d+)?$/);
  if (!match) return Number.parseFloat(value);
  const coefficient = Number.parseFloat(match[1]);
  const suffix = match[2] || '';
  const multipliers: Record<string, number> = {
    K: 1e3,
    M: 1e6,
    G: 1e9,
    T: 1e12,
    P: 1e15,
    E: 1e18,
    m: 1e-3,
    n: 1e-9,
    e: 1,
    µ: 1e-6
  };
  return coefficient * (suffix.startsWith('e') ? 10 ** Number.parseInt(suffix.slice(1), 10) : multipliers[suffix] || 1);
}

/** Formats a fixture byte count for the benchmark group heading. */
function formatByteCount(byteLength: number): string {
  return `${byteLength.toLocaleString('en-US')} bytes`;
}

/** Formats a probe.gl byte-rate value with a readable, non-breaking unit. */
function formatByteRate(value: string): string {
  const match = value.trim().match(/^(.+?)([KMGTPE])?$/);
  if (!match) return `${value} B/s`;
  const unit = match[2] ? `${match[2]}B/s` : 'B/s';
  return `${match[1]} ${unit}`;
}

/** Creates representative compressed CSV fixtures before timing begins. */
async function createCompressionBenchmarkCases(): Promise<CompressionBenchmarkCase[]> {
  const sampleData = createCompressionBenchmarkData(70937).buffer;
  const gzipData = await new GZipFflateCompressor().compress(sampleData);
  const brotliData = await new BrotliCompressUtilsCompressor({compressUtils: {level: 4}}).compress(sampleData);

  const deflateData = await new DeflateFflateCompressor().compress(sampleData);
  const snappyData = await new SnappyJSCompression().compress(sampleData);
  const lz4Data = await new LZ4JSCompression().compress(sampleData);
  const zstdData = await compressWithZstdCodec(sampleData);
  const bzip2Data = await new BZip2CompressUtilsCompressor().compress(sampleData);
  const xzData = await new XZCompressUtilsCompressor().compress(sampleData);

  const benchmarkCases: CompressionBenchmarkCase[] = [
    {
      name: 'GZIP · generated.csv',
      compressedData: gzipData,
      uncompressedByteLength: sampleData.byteLength,
      expectedData: new Uint8Array(sampleData),
      nativeFormat: 'gzip',
      externalCompressions: [
        {
          name: 'internal fflate',
          decompress: input => new GZipFflateDecompressor().decompress(input)
        },
        {
          name: 'fflate',
          decompress: async input => gunzipSync(new Uint8Array(input)).buffer as ArrayBuffer
        },
        {
          name: 'pako',
          decompress: input => new GZipPakoDecompressor().decompress(input)
        },
        {
          name: 'compress-utils',
          decompress: input => new GZipCompressUtilsDecompressor().decompress(input)
        }
      ]
    },
    {
      name: 'DEFLATE · generated.csv',
      compressedData: deflateData,
      uncompressedByteLength: sampleData.byteLength,
      expectedData: new Uint8Array(sampleData),
      nativeFormat: 'deflate',
      externalCompressions: [
        {
          name: 'internal fflate',
          decompress: input => new DeflateFflateDecompressor().decompress(input)
        },
        {
          name: 'fflate',
          decompress: async input => unzlibSync(new Uint8Array(input)).buffer as ArrayBuffer
        },
        {
          name: 'pako',
          decompress: input => new DeflatePakoDecompressor().decompress(input)
        },
        {
          name: 'compress-utils',
          decompress: input => new DeflateCompressUtilsDecompressor().decompress(input)
        }
      ]
    },
    {
      name: 'Brotli · generated.csv',
      compressedData: brotliData,
      uncompressedByteLength: sampleData.byteLength,
      expectedData: new Uint8Array(sampleData),
      nativeFormat: 'brotli',
      externalCompressions: [
        {
          name: 'Brotli shim',
          decompress: input => new BrotliShimDecompressor().decompress(input)
        },
        {
          name: 'compress-utils',
          decompress: input => new BrotliCompressUtilsDecompressor().decompress(input)
        }
      ]
    },
    {
      name: 'Zstandard · generated.csv',
      compressedData: zstdData,
      uncompressedByteLength: sampleData.byteLength,
      expectedData: new Uint8Array(sampleData),
      nativeFormat: 'zstd',
      externalCompressions: [
        {
          name: 'fzstd',
          decompress: input => new ZstdFzstdDecompressor().decompress(input)
        },
        {
          name: 'zstd-codec',
          decompress: input => new ZstdCodecCompression().decompress(input)
        },
        {
          name: 'compress-utils',
          decompress: input => new ZstdCompressUtilsDecompressor().decompress(input)
        }
      ]
    },
    {
      name: 'Snappy · generated.csv',
      compressedData: snappyData,
      uncompressedByteLength: sampleData.byteLength,
      expectedData: new Uint8Array(sampleData),
      nativeFormat: null,
      externalCompressions: [
        {
          name: 'snappyjs',
          decompress: input => new SnappyJSCompression().decompress(input)
        },
        {
          name: 'compress-utils',
          decompress: input => new SnappyCompressUtilsDecompressor().decompress(input)
        }
      ]
    },
    {
      name: 'LZ4 · generated.csv',
      compressedData: lz4Data,
      uncompressedByteLength: sampleData.byteLength,
      expectedData: new Uint8Array(sampleData),
      nativeFormat: null,
      externalCompressions: [
        {
          name: 'lz4js',
          decompress: input => new LZ4JSCompression().decompress(input)
        },
        {
          name: 'compress-utils',
          decompress: input => new LZ4CompressUtilsDecompressor().decompress(input)
        }
      ]
    },
    {
      name: 'bzip2 · generated.csv',
      compressedData: bzip2Data,
      uncompressedByteLength: sampleData.byteLength,
      expectedData: new Uint8Array(sampleData),
      nativeFormat: null,
      externalCompressions: [{
        name: 'compress-utils',
        decompress: input => new BZip2CompressUtilsDecompressor().decompress(input)
      }]
    },
    {
      name: 'XZ · generated.csv',
      compressedData: xzData,
      uncompressedByteLength: sampleData.byteLength,
      expectedData: new Uint8Array(sampleData),
      nativeFormat: null,
      externalCompressions: [{
        name: 'compress-utils',
        decompress: input => new XZCompressUtilsDecompressor().decompress(input)
      }]
    }
  ];

  const largeSampleData = createCompressionBenchmarkData(16 * 1024 * 1024);
  const largeCompressedData = [
    await new GZipFflateCompressor().compress(largeSampleData.buffer),
    await new DeflateFflateCompressor().compress(largeSampleData.buffer),
    await new BrotliCompressUtilsCompressor({compressUtils: {level: 4}}).compress(largeSampleData.buffer),
    await new ZstdCompressUtilsCompressor().compress(largeSampleData.buffer),
    await new SnappyCompressUtilsCompressor().compress(largeSampleData.buffer),
    await new LZ4CompressUtilsCompressor().compress(largeSampleData.buffer),
    await new BZip2CompressUtilsCompressor().compress(largeSampleData.buffer),
    await new XZCompressUtilsCompressor().compress(largeSampleData.buffer)
  ];
  for (let index = 0; index < largeCompressedData.length; index++) {
    benchmarkCases.push({
      ...benchmarkCases[index],
      name: `${benchmarkCases[index].name.split(' · ')[0]} · generated.csv (16 MiB)`,
      compressedData: largeCompressedData[index],
      expectedData: largeSampleData,
      uncompressedByteLength: largeSampleData.byteLength
    });
  }
  return benchmarkCases;
}

/** Adds native and external decompression tests for one format. */
async function addCompressionBenchmarks(
  bench: Bench,
  benchmarkCase: CompressionBenchmarkCase,
  onWarning: (warning: string) => void,
  onNativeUnavailable: () => void
): Promise<void> {
  bench.group(benchmarkCase.name);
  const nativeOutput = benchmarkCase.nativeFormat
    ? await decompressWithNativeDecompressionStream(
        benchmarkCase.compressedData,
        benchmarkCase.nativeFormat
      )
    : null;
  if (nativeOutput) {
    validateOutput(benchmarkCase, nativeOutput, 'native');
    bench.addAsync(
      `${benchmarkCase.name} · native`,
      {minIterations: 3, unit: 'B', multiplier: benchmarkCase.uncompressedByteLength},
      async () => {
        const output = await decompressWithNativeDecompressionStream(
          benchmarkCase.compressedData,
          benchmarkCase.nativeFormat
        );
        if (!output) throw new Error('native codec became unavailable');
        validateOutput(benchmarkCase, output, 'native', false);
      }
    );
  } else {
    onWarning(`${benchmarkCase.name}: native decompression is unavailable`);
    onNativeUnavailable();
  }

  for (const externalCompression of benchmarkCase.externalCompressions) {
    const externalOutput = await externalCompression.decompress(benchmarkCase.compressedData);
    validateOutput(benchmarkCase, externalOutput, externalCompression.name);
    bench.addAsync(
      `${benchmarkCase.name} · ${externalCompression.name}`,
      {minIterations: 3, unit: 'B', multiplier: benchmarkCase.uncompressedByteLength},
      async () => {
        const output = await externalCompression.decompress(
          benchmarkCase.compressedData
        );
        validateOutput(benchmarkCase, output, externalCompression.name, false);
      }
    );
  }
}

/** Registers encoders, checking one round trip before timing encoding alone. */
async function addEncodingBenchmarks(
  bench: Bench,
  benchmarkCase: CompressionBenchmarkCase,
  onWarning: (warning: string) => void,
  onNativeUnavailable: () => void
): Promise<void> {
  bench.group(benchmarkCase.name);
  const input = benchmarkCase.expectedData.slice().buffer;
  const format = benchmarkCase.name.replace('Compression: ', '').split(' · ')[0];
  const encoders: Record<string, Record<string, (input: ArrayBuffer) => Promise<ArrayBuffer>>> = {
    GZIP: {
      'internal fflate': input => new GZipFflateCompressor({gzip: {mtime: 0}}).compress(input),
      fflate: async input => gzipSync(new Uint8Array(input), {mtime: 0}).slice().buffer,
      pako: input => new GZipPakoCompressor().compress(input),
      'compress-utils': input => new GZipCompressUtilsCompressor().compress(input)
    },
    DEFLATE: {
      'internal fflate': input => new DeflateFflateCompressor().compress(input),
      fflate: async input => zlibSync(new Uint8Array(input)).slice().buffer,
      pako: input => new DeflatePakoCompressor().compress(input),
      'compress-utils': input => new DeflateCompressUtilsCompressor().compress(input)
    },
    Brotli: {
      'compress-utils': input => new BrotliCompressUtilsCompressor({compressUtils: {level: 4}}).compress(input)
    },
    Zstandard: {
      ...(input.byteLength < 16 * 1024 * 1024 ? {
        'zstd-codec': (input: ArrayBuffer) => new ZstdCodecCompression().compress(input)
      } : {}),
      'compress-utils': input => new ZstdCompressUtilsCompressor().compress(input)
    },
    Snappy: {
      snappyjs: input => new SnappyJSCompression().compress(input),
      'compress-utils': input => new SnappyCompressUtilsCompressor().compress(input)
    },
    LZ4: {
      lz4js: input => new LZ4JSCompression().compress(input),
      'compress-utils': input => new LZ4CompressUtilsCompressor().compress(input)
    },
    bzip2: {'compress-utils': input => new BZip2CompressUtilsCompressor().compress(input)},
    XZ: {'compress-utils': input => new XZCompressUtilsCompressor().compress(input)}
  };
  if (format === 'Zstandard' && input.byteLength >= 16 * 1024 * 1024) {
    onWarning(`${benchmarkCase.name}: zstd-codec 0.1.5 whole-buffer encoding exceeds its WASM heap; 16 MB encoding is unavailable`);
  }
  const nativeOutput = benchmarkCase.nativeFormat
    ? await compressWithNativeCompressionStream(input, benchmarkCase.nativeFormat)
    : null;
  if (nativeOutput) {
    const decoded = await decompressWithNativeDecompressionStream(nativeOutput, benchmarkCase.nativeFormat!);
    if (!decoded) throw new Error('Native round-trip decoder unavailable');
    validateOutput(benchmarkCase, decoded, 'native encoder');
    bench.addAsync(`${benchmarkCase.name} · native`,
      {minIterations: 3, unit: 'B', multiplier: input.byteLength, _throughput: input.byteLength >= 16 * 1024 * 1024 ? 1 : undefined}, async () => {
        const output = await compressWithNativeCompressionStream(input, benchmarkCase.nativeFormat!);
        if (!output?.byteLength) throw new Error('Native encoder produced no output');
      });
  } else {
    onWarning(`${benchmarkCase.name}: native compression is unavailable`);
    onNativeUnavailable();
  }
  for (const [name, encode] of Object.entries(encoders[format])) {
    const decoder = benchmarkCase.externalCompressions.find(candidate => candidate.name === name)!;
    const encoded = await encode(input);
    validateOutput(benchmarkCase, await decoder.decompress(encoded), `${name} encoder`);
    bench.addAsync(`${benchmarkCase.name} · ${name}`,
      {minIterations: 3, unit: 'B', multiplier: input.byteLength, _throughput: input.byteLength >= 16 * 1024 * 1024 ? 1 : undefined}, async () => {
        const output = await encode(input);
        if (!output.byteLength) throw new Error(`${name} encoder produced no output`);
      });
  }
}

/** Validates a benchmark warm-up and each timed decode. */
function validateOutput(
  benchmarkCase: CompressionBenchmarkCase,
  output: ArrayBuffer,
  implementation: string,
  verifyBytes = true
): void {
  if (output.byteLength !== benchmarkCase.uncompressedByteLength) {
    throw new Error(
      `${benchmarkCase.name} ${implementation} output ${output.byteLength} bytes; ` +
        `expected ${benchmarkCase.uncompressedByteLength}`
    );
  }
  if (verifyBytes && new Uint8Array(output).some((value, index) => value !== benchmarkCase.expectedData[index])) {
    throw new Error(`${benchmarkCase.name} ${implementation}: output bytes differ`);
  }
}

/** Creates a Zstandard fixture using the optional high-performance codec. */
async function compressWithZstdCodec(input: ArrayBuffer): Promise<ArrayBuffer> {
  return await new ZstdCodecCompression().compress(input);
}
