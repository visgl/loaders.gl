// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useState} from 'react';

import {Bench, type LogEntry} from '@probe.gl/bench';
import {BrotliLoadersGLDecompressor} from '@loaders.gl/compression/brotli-loaders-gl-decompressor';
import {DeflateFflateCompressor} from '@loaders.gl/compression/deflate-fflate-compressor';
import {DeflateFflateDecompressor} from '@loaders.gl/compression/deflate-fflate-decompressor';
import {GZipFflateDecompressor} from '@loaders.gl/compression/gzip-fflate-decompressor';
import {DeflatePakoDecompressor} from '@loaders.gl/compression/deflate-pako-decompressor';
import {GZipPakoDecompressor} from '@loaders.gl/compression/gzip-pako-decompressor';
import {LZ4JSCompression} from '@loaders.gl/compression/lz4-lz4js';
import {SnappyJSCompression} from '@loaders.gl/compression/snappy-snappyjs';
import {ZstdFzstdDecompressor} from '@loaders.gl/compression/zstd-fzstd';
import {ZstdCodecCompression} from '@loaders.gl/compression/zstd-zstd-codec';
import {BrotliCompressUtilsDecompressor} from '@loaders.gl/compression/brotli-compress-utils-decompressor';
import {BZip2CompressUtilsDecompressor} from '@loaders.gl/compression/bzip2-compress-utils-decompressor';
import {DeflateCompressUtilsDecompressor} from '@loaders.gl/compression/deflate-compress-utils-decompressor';
import {GZipCompressUtilsDecompressor} from '@loaders.gl/compression/gzip-compress-utils-decompressor';
import {LZ4CompressUtilsDecompressor} from '@loaders.gl/compression/lz4-compress-utils-decompressor';
import {SnappyCompressUtilsDecompressor} from '@loaders.gl/compression/snappy-compress-utils-decompressor';
import {XZCompressUtilsDecompressor} from '@loaders.gl/compression/xz-compress-utils-decompressor';
import {ZstdCompressUtilsDecompressor} from '@loaders.gl/compression/zstd-compress-utils-decompressor';
import {decompressWithNativeDecompressionStream} from '@loaders.gl/compression/native-decompression';

type BenchmarkStatus = 'loading' | 'running' | 'complete' | 'failed';

type CompressionBenchmarkCase = {
  /** Human-readable format and fixture label. */
  name: string;
  /** Compressed bytes held outside the timed callback. */
  compressedData: ArrayBuffer;
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
  dependencyVersion?: string;
  dependencySize?: string;
  dependencyUrl?: string;
  dependencyNpmUrl?: string;
  throughput?: number;
  formattedValue?: string;
  formattedError?: string;
};

/** Renders live native-versus-external decompression benchmarks. */
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
        Live decompression throughput for built-in streams versus compact or injected codecs.
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
        <CompressionBenchmarkResults rows={rows} />
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
      <p>Dependency sizes are approximate browser module, package, or fallback source sizes, not emitted bundle sizes.</p>
      <table>
        <thead>
          <tr>
            <th>Implementation</th>
            <th>Dependency</th>
            <th>Version</th>
            <th>Bundle size</th>
            <th>Bytes/s</th>
            <th>Relative band</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter(row => row.isGroup).flatMap(groupRow => {
            const groupResults = rows.filter(row => row.groupId === groupRow.id);
            return [
              <tr key={`${groupRow.id}-heading`}>
                <th colSpan={6}>
                  {groupRow.id} · {formatByteCount(groupRow.uncompressedByteLength || 0)} uncompressed
                </th>
              </tr>,
              ...groupResults.map((row, index) => {
                if (row.unavailable) {
                  return (
                    <tr key={`${groupRow.id}-${row.id}-${index}`}>
                      <td><strong>{row.id}</strong></td>
                      <td>
                        {row.dependencyNpmUrl ? (
                          <a href={row.dependencyNpmUrl} target="_blank" rel="noreferrer">
                            {row.dependency}
                          </a>
                        ) : row.dependency}
                      </td>
                      <td>{row.dependencyVersion}</td>
                      <td>{row.dependencySize}</td>
                      <td>N/A</td>
                      <td>N/A</td>
                    </tr>
                  );
                }
                const band = getCompressionBenchmarkBand(row.throughput || 0);
                const barWidth = Math.min(((row.throughput || 0) / 1e9) * 100, 100);
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
                    <td>
                      {row.dependencyNpmUrl ? (
                        <a href={row.dependencyNpmUrl} target="_blank" rel="noreferrer">
                          {row.dependency}
                        </a>
                      ) : row.dependency}
                    </td>
                    <td>{row.dependencyVersion}</td>
                    <td>{row.dependencySize}</td>
                    <td className="compression-benchmark-value">{row.formattedValue}</td>
                    <td>
                      <div className={`compression-benchmark-bar ${band}`}>
                        <div style={{width: `${barWidth}%`}} />
                      </div>
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
      const displayName = implementationName === 'native' ? 'built-in' : implementationName;
      const groupId = entry.id.slice(0, entry.id.lastIndexOf(' · '));
      return {
        id: displayName,
        groupId,
        uncompressedByteLength: benchmarkByteLengths.get(groupId),
        ...getCompressionDependencyInfo(implementationName, groupId),
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
function getCompressionDependencyInfo(implementationName: string, groupId: string): Pick<BenchmarkResultRow, 'dependency' | 'dependencyVersion' | 'dependencySize' | 'dependencyUrl' | 'dependencyNpmUrl'> {
  const dependencyInfo: Record<string, Pick<BenchmarkResultRow, 'dependency' | 'dependencyVersion' | 'dependencySize' | 'dependencyUrl' | 'dependencyNpmUrl'>> = {
    native: {
      dependency: 'DecompressionStream',
      dependencyVersion: 'built-in',
      dependencySize: 'N/A',
      dependencyUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream'
    },
    fflate: {
      dependency: 'fflate',
      dependencyVersion: '0.7.4',
      dependencySize: '~85 KB browser module',
      dependencyUrl: 'https://github.com/101arrowz/fflate',
      dependencyNpmUrl: 'https://www.npmjs.com/package/fflate'
    },
    pako: {
      dependency: 'pako',
      dependencyVersion: '2.2.0',
      dependencySize: '~23 KB minified inflate module',
      dependencyUrl: 'https://github.com/nodeca/pako',
      dependencyNpmUrl: 'https://www.npmjs.com/package/pako'
    },
    BrotliDecode: {
      dependency: '@loaders.gl/compression',
      dependencyVersion: 'internal',
      dependencySize: '~210 KB source',
      dependencyUrl: 'https://github.com/visgl/loaders.gl/tree/master/modules/compression/src/brotli',
      dependencyNpmUrl: 'https://www.npmjs.com/package/@loaders.gl/compression'
    },
    snappyjs: {
      dependency: 'snappyjs',
      dependencyVersion: '0.6.1',
      dependencySize: '~15 KB browser source',
      dependencyUrl: 'https://github.com/zishuo/snappyjs',
      dependencyNpmUrl: 'https://www.npmjs.com/package/snappyjs'
    },
    lz4js: {
      dependency: 'lz4js',
      dependencyVersion: '0.2.0',
      dependencySize: '~25 KB browser source',
      dependencyUrl: 'https://github.com/Benzinga/lz4js',
      dependencyNpmUrl: 'https://www.npmjs.com/package/lz4js'
    },
    'compress-utils': {
      dependency: 'compress-utils',
      dependencyVersion: '0.8.0',
      dependencySize: getCompressUtilsSize(groupId),
      dependencyUrl: 'https://github.com/dupontcyborg/compress-utils',
      dependencyNpmUrl: 'https://www.npmjs.com/package/compress-utils'
    },
    fzstd: {
      dependency: 'fzstd',
      dependencyVersion: '0.1.1',
      dependencySize: '~80 KB package',
      dependencyUrl: 'https://github.com/101arrowz/fzstd',
      dependencyNpmUrl: 'https://www.npmjs.com/package/fzstd'
    },
    'zstd-codec': {
      dependency: 'zstd-codec',
      dependencyVersion: '0.1.5',
      dependencySize: '~2.0 MB package',
      dependencyUrl: 'https://github.com/yoshihitoh/zstd-codec',
      dependencyNpmUrl: 'https://www.npmjs.com/package/zstd-codec'
    }
  };
  return dependencyInfo[implementationName] || {
    dependency: 'unknown',
    dependencyVersion: 'unknown',
    dependencySize: 'unknown'
  };
}

/** Returns the raw focused decoder size for one compress-utils format. */
function getCompressUtilsSize(groupId: string): string {
  const format = groupId.split(' · ')[0].toLowerCase();
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
  const sampleUrl = new URL('../../../modules/compression/test/data/sample.csv', import.meta.url);
  const gzipUrl = new URL('../../../modules/compression/test/data/sample.csv.gz', import.meta.url);
  const brotliUrl = new URL('../../../modules/compression/test/data/sample.csv.br', import.meta.url);
  const [sampleData, gzipData, brotliData] = await Promise.all([
    fetch(sampleUrl).then(response => response.arrayBuffer()),
    fetch(gzipUrl).then(response => response.arrayBuffer()),
    fetch(brotliUrl).then(response => response.arrayBuffer())
  ]);

  const deflateData = await new DeflateFflateCompressor().compress(sampleData);
  const snappyData = await new SnappyJSCompression().compress(sampleData);
  const lz4Data = await new LZ4JSCompression().compress(sampleData);
  const zstdData = await compressWithZstdCodec(sampleData);
  const smallSampleData = new TextEncoder().encode('loaders.gl compression benchmark row,42\n'.repeat(80));
  const bzip2Data = decodeBase64(
    'QlpoOTFBWSZTWSCc1c0AA5fZgAAQQAUUAD7v2IAwANgFABiNNNGhQAYjTTRoFKqAZDR6RppzCahMBMBNwm4TuEzCbBNgngJmE4BNAnoJgJuEwE1CeQnIJ9CfAmwTQE2CfQmQT8EyCYCbhPYTATIJ0CaBOITuE/i7kinChIEE5q5o'
  );
  const xzData = decodeBase64(
    '/Td6WFoAAATm1rRGAgAhARYAAAB0L+Wj4Ax/AD9dADYbyEcWT0GrAEwLeI5uAoYEx0DxeYUGGKhiHAE1pMSIvfv3GnSc+dGcvFTvGEzb4re0wG905P4u4pn0Zto4AAAAxUd97PmWmK8AAVuAGQAAAG6E6zmxxGf7AgAAAAAEWVo='
  );

  return [
    {
      name: 'GZIP · sample.csv',
      compressedData: gzipData,
      uncompressedByteLength: sampleData.byteLength,
      nativeFormat: 'gzip',
      externalCompressions: [
        {
          name: 'fflate',
          decompress: input => new GZipFflateDecompressor().decompress(input)
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
      name: 'DEFLATE · sample.csv',
      compressedData: deflateData,
      uncompressedByteLength: sampleData.byteLength,
      nativeFormat: 'deflate',
      externalCompressions: [
        {
          name: 'fflate',
          decompress: input => new DeflateFflateDecompressor().decompress(input)
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
      name: 'Brotli · sample.csv',
      compressedData: brotliData,
      uncompressedByteLength: sampleData.byteLength,
      nativeFormat: 'brotli',
      externalCompressions: [
        {
          name: 'BrotliDecode',
          decompress: input => new BrotliLoadersGLDecompressor().decompress(input)
        },
        {
          name: 'compress-utils',
          decompress: input => new BrotliCompressUtilsDecompressor().decompress(input)
        }
      ]
    },
    {
      name: 'Zstandard · sample.csv',
      compressedData: zstdData,
      uncompressedByteLength: sampleData.byteLength,
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
      name: 'Snappy · sample.csv',
      compressedData: snappyData,
      uncompressedByteLength: sampleData.byteLength,
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
      name: 'LZ4 · sample.csv',
      compressedData: lz4Data,
      uncompressedByteLength: sampleData.byteLength,
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
      name: 'bzip2 · small sample',
      compressedData: bzip2Data,
      uncompressedByteLength: smallSampleData.byteLength,
      nativeFormat: null,
      externalCompressions: [{
        name: 'compress-utils',
        decompress: input => new BZip2CompressUtilsDecompressor().decompress(input)
      }]
    },
    {
      name: 'XZ · small sample',
      compressedData: xzData,
      uncompressedByteLength: smallSampleData.byteLength,
      nativeFormat: null,
      externalCompressions: [{
        name: 'compress-utils',
        decompress: input => new XZCompressUtilsDecompressor().decompress(input)
      }]
    }
  ];
}

/** Decodes a base64-encoded compressed benchmark fixture. */
function decodeBase64(value: string): ArrayBuffer {
  const binary = atob(value);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) output[index] = binary.charCodeAt(index);
  return output.buffer;
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
        validateOutput(benchmarkCase, output, 'native');
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
        validateOutput(benchmarkCase, output, externalCompression.name);
      }
    );
  }
}

/** Validates a benchmark warm-up and each timed decode. */
function validateOutput(
  benchmarkCase: CompressionBenchmarkCase,
  output: ArrayBuffer,
  implementation: string
): void {
  if (output.byteLength !== benchmarkCase.uncompressedByteLength) {
    throw new Error(
      `${benchmarkCase.name} ${implementation} output ${output.byteLength} bytes; ` +
        `expected ${benchmarkCase.uncompressedByteLength}`
    );
  }
}

/** Creates a Zstandard fixture using the optional high-performance codec. */
async function compressWithZstdCodec(input: ArrayBuffer): Promise<ArrayBuffer> {
  return await new ZstdCodecCompression().compress(input);
}
