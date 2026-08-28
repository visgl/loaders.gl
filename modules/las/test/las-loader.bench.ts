// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encodeSync, fetchFile, parse, parseInBatches} from '@loaders.gl/core';
import {LASLoader, LASWriter, LAZPerfLoader, LAZRsLoader} from '@loaders.gl/las';
import type {LASLoaderOptions} from '@loaders.gl/las';
import {
  createLAZChunkDecoderCursor,
  decodeLAZChunk,
  getLAZChunkByteLength
} from '@loaders.gl/loader-utils';
import type {LAZPointDataTarget} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {parseLASHeader} from '../src/lib/typescript/parse-las';

const LAZ_1_2_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';
const LAZ_1_4_BINARY_URL = '@loaders.gl/las/test/data/ellipsoid-1.4.laz';
const LAZ_1_2_PDRF_3 = 3;
const LAZ_1_4_PDRF_7 = 7;
const BATCH_SIZE = 25_000;
const STREAMING_LAZ_CHUNK_SIZE = 64 * 1024;
const RENDER_COLUMNS = ['POSITION', 'COLOR_0'] as const;
const COMPETITIVE_COLUMNS = ['POSITION', 'COLOR_0', 'intensity', 'classification'] as const;
const COMPETITIVE_ARROW_FIELDS = [
  ['POSITION', 'FixedSizeList[3]<Float32>'],
  ['intensity', 'Uint16'],
  ['classification', 'Uint8'],
  ['COLOR_0', 'FixedSizeList[4]<Uint8>']
] as const;
const LAZ_1_2_LOADER_VARIANTS = [
  {name: 'loaders.gl (TypeScript)', loader: LASLoader},
  {name: 'laz-perf (C++ to JS) 0.0.7', loader: LAZPerfLoader},
  {name: 'laz-rs (Rust to WASM) 0.1.0', loader: LAZRsLoader}
] as const;
const LAZ_1_4_LOADER_VARIANTS = [
  {name: 'loaders.gl (TypeScript)', loader: LASLoader},
  {name: 'laz-rs (Rust to WASM) 0.1.0', loader: LAZRsLoader}
] as const;

/**
 * Adds LAS loader variant parse benchmarks.
 * @param bench Benchmark suite
 * @returns Benchmark suite with LAS cases added
 */
export default async function lasLoaderBench(bench) {
  const response = await fetchFile(LAZ_1_2_BINARY_URL);
  const lazArrayBuffer = await response.arrayBuffer();
  assertLAZ12PDRF3BenchmarkFixture(lazArrayBuffer);
  const laz14Response = await fetchFile(LAZ_1_4_BINARY_URL);
  const laz14ArrayBuffer = await laz14Response.arrayBuffer();
  assertLAZ14PDRF7BenchmarkFixture(laz14ArrayBuffer);
  const laz14Header = parseLASHeader(laz14ArrayBuffer);
  const lazChunks = createBenchmarkArrayBufferChunks(lazArrayBuffer, STREAMING_LAZ_CHUNK_SIZE);
  const laz14Chunks = createBenchmarkArrayBufferChunks(laz14ArrayBuffer, STREAMING_LAZ_CHUNK_SIZE);
  const laz14FirstChunk = getFirstLAZ14Chunk(laz14ArrayBuffer);
  const lazStreamingStats = await collectTypeScriptLAZStreamingStats(lazChunks);
  const laz14StreamingStats = await collectTypeScriptLAZStreamingStats(laz14Chunks);
  const table = await createBenchmarkArrowTable(lazArrayBuffer);
  const laz14Table = await createBenchmarkLAZ14ArrowTable(laz14ArrayBuffer);
  await assertCompetitiveLoaderVariants(lazArrayBuffer, LAZ_1_2_LOADER_VARIANTS);
  await assertCompetitiveLoaderVariants(laz14ArrayBuffer, LAZ_1_4_LOADER_VARIANTS);
  const pointCount = table.data.numRows;
  const benchmarkOptions = {multiplier: pointCount, unit: 'output points', minIterations: 3};
  const laz14BenchmarkOptions = {
    multiplier: laz14Table.data.numRows,
    unit: 'output points',
    minIterations: 3
  };

  bench.groupSorted('LASLoader parse LAZ 1.2 PDRF 3 common columns');

  for (const {name, loader} of LAZ_1_2_LOADER_VARIANTS) {
    bench.addAsync(`parse LAZ 1.2 PDRF 3 backend=${name}`, benchmarkOptions, async () => {
      await parse(lazArrayBuffer, loader, {
        core: {worker: false},
        las: {shape: 'arrow-table', columns: COMPETITIVE_COLUMNS}
      });
    });
  }

  bench.groupSorted('LASLoader TypeScript path LAZ 1.2 PDRF 3 comprehensive output');

  bench.addAsync(
    'parse complete LAZ 1.2 PDRF 3 columns=all backend=loaders.gl (TypeScript)',
    benchmarkOptions,
    async () => {
      await parse(lazArrayBuffer, LASLoader, {
        core: {worker: false},
        las: {shape: 'arrow-table'}
      });
    }
  );

  bench.addAsync(
    `parseInBatches streaming LAZ 1.2 PDRF 3 backend=loaders.gl (TypeScript) ${formatStreamingStats(lazStreamingStats)}`,
    benchmarkOptions,
    async () => {
      const batches = await parseInBatches(lazChunks, LASLoader, {
        batchSize: BATCH_SIZE,
        core: {worker: false},
        las: {shape: 'arrow-table'}
      });
      for await (const _batch of batches) {
        _batch;
      }
    }
  );

  bench.groupSorted('LASLoader parse LAZ 1.4 PDRF 7 common columns');

  for (const {name, loader} of LAZ_1_4_LOADER_VARIANTS) {
    bench.addAsync(`parse LAZ 1.4 PDRF 7 backend=${name}`, laz14BenchmarkOptions, async () => {
      await parse(laz14ArrayBuffer, loader, {
        core: {worker: false},
        las: {shape: 'arrow-table', columns: COMPETITIVE_COLUMNS}
      });
    });
  }

  bench.groupSorted('LASLoader TypeScript path LAZ 1.4 PDRF 7 common columns');

  bench.addAsync(
    'parse complete LAZ 1.4 PDRF 7 columns=common backend=loaders.gl (TypeScript)',
    laz14BenchmarkOptions,
    async () => {
      await parse(laz14ArrayBuffer, LASLoader, {
        core: {worker: false},
        las: {shape: 'arrow-table', columns: COMPETITIVE_COLUMNS}
      });
    }
  );

  bench.addAsync(
    'parseInBatches streaming LAZ 1.4 PDRF 7 columns=common backend=loaders.gl (TypeScript)',
    laz14BenchmarkOptions,
    async () => {
      const batches = await parseInBatches(laz14Chunks, LASLoader, {
        batchSize: BATCH_SIZE,
        core: {worker: false},
        las: {shape: 'arrow-table', columns: COMPETITIVE_COLUMNS}
      });
      for await (const _batch of batches) {
        _batch;
      }
    }
  );

  bench.groupSorted('LASLoader TypeScript path LAZ 1.4 PDRF 7 comprehensive output');

  bench.addAsync(
    'parse complete LAZ 1.4 PDRF 7 columns=all backend=loaders.gl (TypeScript)',
    laz14BenchmarkOptions,
    async () => {
      await parse(laz14ArrayBuffer, LASLoader, {
        core: {worker: false},
        las: {shape: 'arrow-table'}
      });
    }
  );

  bench.addAsync(
    `parseInBatches streaming LAZ 1.4 PDRF 7 backend=loaders.gl (TypeScript) ${formatStreamingStats(laz14StreamingStats)}`,
    laz14BenchmarkOptions,
    async () => {
      const batches = await parseInBatches(laz14Chunks, LASLoader, {
        batchSize: BATCH_SIZE,
        core: {worker: false},
        las: {shape: 'arrow-table'}
      });
      for await (const _batch of batches) {
        _batch;
      }
    }
  );

  bench.groupSorted('LASLoader TypeScript path LAZ 1.4 PDRF 7 render columns');

  bench.addAsync(
    'parse LAZ 1.4 PDRF 7 columns=POSITION,COLOR_0 backend=loaders.gl (TypeScript)',
    laz14BenchmarkOptions,
    async () => {
      await parse(laz14ArrayBuffer, LASLoader, {
        core: {worker: false},
        las: {shape: 'arrow-table', columns: RENDER_COLUMNS}
      });
    }
  );

  bench.addAsync(
    'parseInBatches streaming LAZ 1.4 PDRF 7 columns=POSITION,COLOR_0 backend=loaders.gl (TypeScript)',
    laz14BenchmarkOptions,
    async () => {
      const batches = await parseInBatches(laz14Chunks, LASLoader, {
        batchSize: BATCH_SIZE,
        core: {worker: false},
        las: {shape: 'arrow-table', columns: RENDER_COLUMNS}
      });
      for await (const _batch of batches) {
        _batch;
      }
    }
  );

  bench.groupSorted('TypeScript LAZ raw chunk decode');

  bench.add(
    'decodeLAZChunk LAZ 1.4 PDRF 7 backend=loaders.gl (TypeScript)',
    {
      multiplier: laz14FirstChunk.metadata.pointCount,
      unit: 'output points',
      minIterations: 3
    },
    () => {
      decodeLAZChunk(laz14FirstChunk.compressed, laz14FirstChunk.metadata);
    }
  );

  bench.add(
    'decodeLAZChunk cursor batches LAZ 1.4 PDRF 7 backend=loaders.gl (TypeScript)',
    {
      multiplier: laz14FirstChunk.metadata.pointCount,
      unit: 'output points',
      minIterations: 3
    },
    () => {
      const pointByteLength = laz14FirstChunk.metadata.pointDataRecordLength;
      const output = new Uint8Array(BATCH_SIZE * pointByteLength);
      const cursor = createLAZChunkDecoderCursor(
        laz14FirstChunk.compressed,
        laz14FirstChunk.metadata
      );
      while (cursor.remainingPointCount > 0) {
        cursor.decodeInto(output, 0, Math.min(BATCH_SIZE, cursor.remainingPointCount));
      }
    }
  );

  bench.add(
    'decodeLAZChunk cursor point-data LAZ 1.4 PDRF 7 backend=loaders.gl (TypeScript)',
    {
      multiplier: laz14FirstChunk.metadata.pointCount,
      unit: 'output points',
      minIterations: 3
    },
    () => {
      const target = createLAZPointDataBenchmarkTarget(
        laz14FirstChunk.metadata.pointCount,
        laz14Header
      );
      const cursor = createLAZChunkDecoderCursor(
        laz14FirstChunk.compressed,
        laz14FirstChunk.metadata
      );
      while (cursor.remainingPointCount > 0) {
        const targetPointOffset = laz14FirstChunk.metadata.pointCount - cursor.remainingPointCount;
        target.pointOffset = targetPointOffset;
        cursor.decodeIntoPointData(target, Math.min(BATCH_SIZE, cursor.remainingPointCount));
      }
    }
  );

  bench.add(
    'decodeLAZChunk cursor render-data LAZ 1.4 PDRF 7 backend=loaders.gl (TypeScript)',
    {
      multiplier: laz14FirstChunk.metadata.pointCount,
      unit: 'output points',
      minIterations: 3
    },
    () => {
      const target = createLAZRenderDataBenchmarkTarget(
        laz14FirstChunk.metadata.pointCount,
        laz14Header
      );
      const cursor = createLAZChunkDecoderCursor(
        laz14FirstChunk.compressed,
        laz14FirstChunk.metadata
      );
      while (cursor.remainingPointCount > 0) {
        const targetPointOffset = laz14FirstChunk.metadata.pointCount - cursor.remainingPointCount;
        target.pointOffset = targetPointOffset;
        cursor.decodeIntoPointData(target, Math.min(BATCH_SIZE, cursor.remainingPointCount));
      }
    }
  );

  bench.groupSorted('LASWriter');

  bench.add('LASWriter LAS 1.2 backend=loaders.gl (TypeScript)', benchmarkOptions, () => {
    encodeBenchmarkLASArrayBuffer(table, '1.2');
  });
  bench.add('LASWriter LAS 1.4 backend=loaders.gl (TypeScript)', benchmarkOptions, () => {
    encodeBenchmarkLASArrayBuffer(table, '1.4');
  });

  return bench;
}

/** Verify every competitive loader materializes the exact shared Arrow projection. */
async function assertCompetitiveLoaderVariants(
  lazArrayBuffer: ArrayBuffer,
  variants: readonly {name: string; loader: (typeof LAZ_1_2_LOADER_VARIANTS)[number]['loader']}[]
): Promise<void> {
  let expectedPointCount = -1;
  for (const {name, loader} of variants) {
    const table = (await parse(lazArrayBuffer, loader, {
      core: {worker: false},
      las: {shape: 'arrow-table', columns: COMPETITIVE_COLUMNS}
    })) as MeshArrowTable;
    const actualFields = table.data.schema.fields.map(
      field => [field.name, field.type.toString()] as const
    );
    if (JSON.stringify(actualFields) !== JSON.stringify(COMPETITIVE_ARROW_FIELDS)) {
      throw new Error(
        `LAS benchmark variant ${name} returned ${JSON.stringify(actualFields)}; expected ${JSON.stringify(COMPETITIVE_ARROW_FIELDS)}`
      );
    }
    if (expectedPointCount < 0) {
      expectedPointCount = table.data.numRows;
    } else if (table.data.numRows !== expectedPointCount) {
      throw new Error(
        `LAS benchmark variant ${name} returned ${table.data.numRows} points; expected ${expectedPointCount}`
      );
    }
  }
}

/**
 * Collects one set of internal copy/allocation counters outside benchmark timing.
 * @param chunks Pre-split LAZ file chunks
 * @returns TypeScript LAZ streaming copy/allocation counters
 */
async function collectTypeScriptLAZStreamingStats(chunks: ArrayBuffer[]): Promise<{
  copiedBytes: number;
  chunkConcatenations: number;
  rawBatchAllocations: number;
  decodedChunkAllocations: number;
}> {
  const lazStreamingStats = {
    copiedBytes: 0,
    chunkConcatenations: 0,
    rawBatchAllocations: 0,
    decodedChunkAllocations: 0
  };
  const batches = await parseInBatches(chunks, LASLoader, {
    batchSize: BATCH_SIZE,
    core: {worker: false},
    las: {
      shape: 'arrow-table',
      lazStreamingStats
    } as LASLoaderOptions['las'] & {
      lazStreamingStats: typeof lazStreamingStats;
    }
  });
  for await (const _batch of batches) {
    _batch;
  }
  return lazStreamingStats;
}

/**
 * Formats internal streaming counters for benchmark labels.
 * @param stats TypeScript LAZ streaming counters
 * @returns Compact benchmark label suffix
 */
function formatStreamingStats(stats: {
  copiedBytes: number;
  chunkConcatenations: number;
  rawBatchAllocations: number;
  decodedChunkAllocations: number;
}): string {
  return `copied=${stats.copiedBytes}B concat=${stats.chunkConcatenations} rawBatches=${stats.rawBatchAllocations} decodedChunks=${stats.decodedChunkAllocations}`;
}

/**
 * Confirms the LAS 1.2 benchmark fixture stays on the PDRF 3 path used by the demo data.
 * @param arrayBuffer Complete LAS 1.2 LAZ fixture bytes
 */
function assertLAZ12PDRF3BenchmarkFixture(arrayBuffer: ArrayBuffer): void {
  const header = parseLASHeader(arrayBuffer);
  if (header.pointsFormatId !== LAZ_1_2_PDRF_3) {
    throw new Error(
      `LAS benchmark fixture ${LAZ_1_2_BINARY_URL} must use PDRF 3; received PDRF ${header.pointsFormatId}`
    );
  }
}

/**
 * Confirms the LAS 1.4 benchmark fixture stays on the PDRF 7 path being optimized.
 * @param arrayBuffer Complete LAS 1.4 LAZ fixture bytes
 */
function assertLAZ14PDRF7BenchmarkFixture(arrayBuffer: ArrayBuffer): void {
  const header = parseLASHeader(arrayBuffer);
  if (header.pointsFormatId !== LAZ_1_4_PDRF_7) {
    throw new Error(
      `LAS benchmark fixture ${LAZ_1_4_BINARY_URL} must use PDRF 7; received PDRF ${header.pointsFormatId}`
    );
  }
}

/**
 * Extracts the first fixed-size LAS 1.4 LAZ chunk for raw decoder benchmarks.
 * @param arrayBuffer Complete LAS 1.4 LAZ file bytes
 * @returns Compressed chunk bytes and decoder metadata
 */
function getFirstLAZ14Chunk(arrayBuffer: ArrayBuffer): {
  compressed: Uint8Array;
  metadata: {pointDataRecordFormat: number; pointDataRecordLength: number; pointCount: number};
} {
  const bytes = new Uint8Array(arrayBuffer);
  const header = parseLASHeader(arrayBuffer);
  const chunkSize = getLASZipChunkSize(bytes, header.headerSize || 375, header.vlrCount || 0);
  const metadata = {
    pointDataRecordFormat: header.pointsFormatId,
    pointDataRecordLength: header.pointsStructSize,
    pointCount: Math.min(chunkSize, header.pointsCount)
  };
  const compressed = bytes.subarray(header.pointsOffset + 8);
  const chunkByteLength = getLAZChunkByteLength(compressed, metadata);
  return {compressed: compressed.subarray(0, chunkByteLength), metadata};
}

/**
 * Creates typed-array output targets for direct LAZ point-data decode benchmarks.
 * @param pointCount Number of points to decode.
 * @param header LAS header with scale and offset metadata.
 * @returns Direct decode point-data target.
 */
function createLAZPointDataBenchmarkTarget(
  pointCount: number,
  header: ReturnType<typeof parseLASHeader>
): LAZPointDataTarget {
  return {
    positions: new Float32Array(pointCount * 3),
    intensities: new Uint16Array(pointCount),
    classifications: new Uint8Array(pointCount),
    rawColors: new Uint16Array(pointCount * 3),
    pointOffset: 0,
    scale: header.scale,
    offset: header.offset
  };
}

/**
 * Creates the positions and RGB target used by the COPC rendering path.
 * @param pointCount Number of points to decode.
 * @param header LAS header with scale and offset metadata.
 * @returns Direct render-data decode target.
 */
function createLAZRenderDataBenchmarkTarget(
  pointCount: number,
  header: ReturnType<typeof parseLASHeader>
): LAZPointDataTarget {
  return {
    positions: new Float64Array(pointCount * 3),
    rawColors: new Uint16Array(pointCount * 3),
    pointOffset: 0,
    scale: header.scale,
    offset: header.offset
  };
}

/**
 * Reads the fixed LASzip chunk size from the LASzip VLR.
 * @param bytes Complete LAS/LAZ file bytes
 * @param headerSize LAS public header size
 * @param vlrCount Number of VLRs in the file
 * @returns LASzip fixed chunk point count
 */
function getLASZipChunkSize(bytes: Uint8Array, headerSize: number, vlrCount: number): number {
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = headerSize;

  for (let index = 0; index < vlrCount; index++) {
    const userId = readNullTerminatedAscii(bytes, offset + 2, 16);
    const recordId = dataView.getUint16(offset + 18, true);
    const recordLength = dataView.getUint16(offset + 20, true);
    const dataOffset = offset + 54;
    if (userId === 'laszip encoded' && recordId === 22204) {
      return dataView.getUint32(dataOffset + 12, true);
    }
    offset = dataOffset + recordLength;
  }

  throw new Error('LASzip VLR not found');
}

/**
 * Reads an ASCII string that may be padded with null bytes.
 * @param bytes Source bytes
 * @param offset String offset
 * @param length Fixed field length
 * @returns String without trailing null bytes
 */
function readNullTerminatedAscii(bytes: Uint8Array, offset: number, length: number): string {
  let end = offset;
  const maxEnd = offset + length;
  while (end < maxEnd && bytes[end] !== 0) {
    end++;
  }
  return String.fromCharCode(...bytes.subarray(offset, end));
}

/**
 * Creates one Arrow table source used by all LAS benchmarks.
 * @param lazArrayBuffer Source LAZ fixture bytes
 * @returns Decoded benchmark Arrow table
 */
async function createBenchmarkArrowTable(lazArrayBuffer: ArrayBuffer): Promise<MeshArrowTable> {
  return (await parse(lazArrayBuffer, LAZRsLoader, {
    core: {worker: false},
    las: {shape: 'arrow-table'}
  })) as MeshArrowTable;
}

/**
 * Creates one LAZ 1.4 Arrow table source used to size streaming LAZ benchmarks.
 * @param lazArrayBuffer Source LAZ 1.4 fixture bytes
 * @returns Decoded benchmark Arrow table
 */
async function createBenchmarkLAZ14ArrowTable(
  lazArrayBuffer: ArrayBuffer
): Promise<MeshArrowTable> {
  return (await parse(lazArrayBuffer, LAZRsLoader, {
    core: {worker: false},
    las: {shape: 'arrow-table'}
  })) as MeshArrowTable;
}

/**
 * Copies one ArrayBuffer into fixed-size chunks outside the benchmark loop.
 * @param arrayBuffer Source bytes
 * @param chunkByteLength Maximum chunk byte length
 * @returns ArrayBuffer chunks
 */
function createBenchmarkArrayBufferChunks(
  arrayBuffer: ArrayBuffer,
  chunkByteLength: number
): ArrayBuffer[] {
  const bytes = new Uint8Array(arrayBuffer);
  const chunks: ArrayBuffer[] = [];
  for (let offset = 0; offset < bytes.byteLength; offset += chunkByteLength) {
    chunks.push(bytes.slice(offset, Math.min(offset + chunkByteLength, bytes.byteLength)).buffer);
  }
  return chunks;
}

/**
 * Encodes the shared benchmark Arrow table as uncompressed LAS.
 * @param table Benchmark Arrow table
 * @param version LAS output version
 * @returns LAS bytes
 */
function encodeBenchmarkLASArrayBuffer(table: MeshArrowTable, version: '1.2' | '1.4'): ArrayBuffer {
  return encodeSync(table, LASWriter, {
    las: {
      version,
      pointDataRecordFormat:
        version === '1.4'
          ? hasArrowColumn(table, 'COLOR_0')
            ? 7
            : 6
          : hasArrowColumn(table, 'COLOR_0')
            ? 2
            : 0
    }
  });
}

/**
 * Returns true when an Arrow table contains a named column.
 * @param table Benchmark Arrow table
 * @param name Column name
 * @returns Whether the column is present
 */
function hasArrowColumn(table: MeshArrowTable, name: string): boolean {
  return Boolean(table.data.getChild(name));
}
