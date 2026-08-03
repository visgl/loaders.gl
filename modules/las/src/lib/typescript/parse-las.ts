// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshArrowTable, MeshAttributes} from '@loaders.gl/schema';
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';
import {
  BinaryChunkReader,
  createLAZChunkDecoderCursor,
  decodeLAZChunk,
  decodeLAZChunkTable,
  getLAZChunkByteLength,
  NeedsMoreData
} from '@loaders.gl/loader-utils';
import type {LAZChunkMetadata, LAZPointDataTarget} from '@loaders.gl/loader-utils';
import type {LASLoaderOptions} from '../../las-loader';
import {getLASSchema} from '../get-las-schema';
import type {LASHeader} from '../las-types';

/** Arrow table returned by the TypeScript LAS parser with LAS loader metadata attached. */
export type LASArrowTable = MeshArrowTable & {
  /** Loader identifier preserved for mesh compatibility conversion. */
  loader: 'las';
  /** Parsed LAS header and metadata for the batch. */
  loaderData: LASHeader;
  /** Batch parse progress in the range [0, 1]. */
  progress?: number;
};

type LASDecodedChunk = {
  arrayBuffer: ArrayBufferLike;
  header: LASHeader;
};

const DEFAULT_BATCH_SIZE = 1000 * 100;
const LASF_SIGNATURE = 0x4653414c;
const LAS_14_HEADER_LENGTH = 375;
const COMPRESSED_POINT_FORMAT_MASK = 0x80;
const POINT_FORMAT_MASK = 0x3f;
const LASZIP_USER_ID = 'laszip encoded';
const LASZIP_RECORD_ID = 22204;
const VARIABLE_CHUNK_SIZE = 0xffffffff;
const LAZ_CHUNK_TABLE_POINTER_LENGTH = 8;
const LEGACY_LAZ_MIN_DECODE_RETRY_BYTE_LENGTH = 16 * 1024;

type LASZipVLR = {
  compressor: number;
  chunkSize: number;
  variableChunks: boolean;
  point14ItemVersion: 2 | 3 | 4 | null;
  rgb14ItemVersion: 2 | 3 | 4 | null;
  wavePacket13ItemVersion: 1 | null;
  wavePacketItemVersion: 3 | 4 | null;
  byte14ItemVersion: 2 | 3 | 4 | null;
};

/** Build chunk metadata with the item versions declared by the LASzip VLR. */
function createLAZChunkMetadata(
  header: LASHeader,
  laszip: LASZipVLR,
  pointCount: number
): LAZChunkMetadata {
  return {
    pointDataRecordFormat: header.pointsFormatId,
    pointDataRecordLength: header.pointsStructSize,
    pointCount,
    point14ItemVersion: laszip.point14ItemVersion ?? undefined,
    rgb14ItemVersion: laszip.rgb14ItemVersion ?? undefined,
    wavePacketItemVersion: laszip.wavePacketItemVersion ?? undefined,
    byte14ItemVersion: laszip.byte14ItemVersion ?? undefined
  };
}

type RawPointBatchState = {
  rawBatch: Uint8Array;
  batchPointCount: number;
  totalRead: number;
  rawBatchAllocations: number;
  stats?: LAZStreamingDecodeStats;
};

type PointDataBatchState = {
  positions: Float32Array | Float64Array;
  colors: Uint8Array | null;
  rawColors: Uint16Array | null;
  intensities: Uint16Array;
  classifications: Uint8Array;
  target: LAZPointDataTarget;
  batchPointCount: number;
  totalRead: number;
};

type LAZStreamingDecodeStats = {
  copiedBytes: number;
  chunkConcatenations: number;
  rawBatchAllocations: number;
  decodedChunkAllocations: number;
};

type LAZChunkByteLengthMetadata = {
  pointDataRecordFormat: number;
  pointDataRecordLength: number;
  pointCount: number;
};

/** Parse LAS data with the TypeScript backend. */
export function parseLAS(arrayBuffer: ArrayBuffer, options: LASLoaderOptions = {}): LASArrowTable {
  const header = parseLASHeader(arrayBuffer);
  if (header.isCompressed) {
    const rawPointData = decodeLAZFileToRawPointData(arrayBuffer, header);
    const totalPointCount = header.pointsCount;
    return parseLASArrowTableBatch(
      rawPointData,
      {
        ...header,
        pointsOffset: 0,
        pointsCount: totalPointCount,
        totalToRead: totalPointCount,
        totalRead: totalPointCount
      },
      options
    );
  }

  const totalPointCount = header.pointsCount;
  return parseLASArrowTableBatch(
    arrayBuffer,
    {...header, totalToRead: totalPointCount, totalRead: totalPointCount},
    options
  );
}

/** Parse LAS data from an incoming byte iterator into point batches. */
export async function* parseLASInBatches(
  arrayBufferIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options: LASLoaderOptions = {}
): AsyncIterable<LASArrowTable> {
  const batchSize = getBatchSize(options);
  const inputIterator = toAsyncIterator(arrayBufferIterator);
  let pending: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  let absoluteOffset = 0;
  let header: LASHeader | null = null;
  let sourcePointIndex = 0;
  let totalRead = 0;

  while (true) {
    const next = await inputIterator.next();
    if (next.done) {
      break;
    }
    const chunk = next.value;
    pending = concatenateUint8Arrays(pending, toUint8Array(chunk));
    if (!header) {
      header = tryParseHeader(pending, absoluteOffset);
      if (header) {
        header.totalToRead = header.pointsCount;
      }
    }
    if (!header) {
      continue;
    }
    if (header.isCompressed) {
      yield* parseLAZInBatches(pending, inputIterator, header, options);
      return;
    }

    for (const batch of readAvailablePointBatches(
      pending,
      absoluteOffset,
      header,
      sourcePointIndex,
      totalRead,
      batchSize
    )) {
      sourcePointIndex = batch.sourcePointIndex;
      totalRead = batch.totalRead;
      pending = batch.pending;
      absoluteOffset = batch.absoluteOffset;
      yield parseLASArrowTableBatch(batch.arrayBuffer, batch.header, options);
    }
  }

  if (!header) {
    throw new Error('LASLoader: incomplete LAS header');
  }
  if (totalRead < header.totalToRead) {
    throw new Error('LASLoader: truncated LAS point data');
  }
}

/** Decode LAS data into raw point chunks. */
export function* parseLASChunkedIterator(
  arrayBuffer: ArrayBuffer,
  batchSize: number = DEFAULT_BATCH_SIZE
): Iterable<LASDecodedChunk> {
  const header = parseLASHeader(arrayBuffer);
  if (header.isCompressed) {
    yield* parseLAZChunkedIterator(arrayBuffer, header, batchSize);
    return;
  }

  const totalToRead = header.pointsCount;
  let sourcePointIndex = 0;
  let totalRead = 0;

  while (sourcePointIndex < header.pointsCount && totalRead < totalToRead) {
    const batchPointCount = Math.min(batchSize, header.pointsCount - sourcePointIndex);
    const start = header.pointsOffset + sourcePointIndex * header.pointsStructSize;
    const end = start + batchPointCount * header.pointsStructSize;
    sourcePointIndex += batchPointCount;
    totalRead += batchPointCount;
    const batchHeader = {
      ...header,
      pointsOffset: 0,
      pointsCount: batchPointCount,
      totalToRead,
      totalRead
    };
    yield {
      arrayBuffer: arrayBuffer.slice(start, end),
      header: batchHeader
    };
  }
}

/** Decode compressed LAZ file data from an incoming byte iterator into raw point chunks. */
export async function* decodeLAZFileInBatches(
  arrayBufferIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options: LASLoaderOptions = {}
): AsyncIterable<LASDecodedChunk> {
  const inputIterator = toAsyncIterator(arrayBufferIterator);
  let pending: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  let header: LASHeader | null = null;

  while (!header) {
    const next = await inputIterator.next();
    if (next.done) {
      throw new Error('LASLoader: incomplete LAS header');
    }
    pending = concatenateUint8Arrays(pending, toUint8Array(next.value));
    header = tryParseHeader(pending, 0);
  }
  if (!header.isCompressed) {
    throw new Error('LASLoader: decodeLAZFileInBatches requires compressed LAZ input');
  }

  yield* decodePendingLAZFileInBatches(pending, inputIterator, header, options);
}

async function* decodePendingLAZFileInBatches(
  initialPending: Uint8Array<ArrayBufferLike>,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader,
  options: LASLoaderOptions = {}
): AsyncIterable<LASDecodedChunk> {
  const {pending, laszip} = await readLASZipVLRFromInput(initialPending, inputIterator, header);
  validateTypeScriptLAZSupport(header, laszip);

  yield* decodeLAZFileWithParsedVLRInBatches(pending, inputIterator, header, laszip, options);
}

async function* decodeLAZFileWithParsedVLRInBatches(
  initialPending: Uint8Array<ArrayBufferLike>,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader,
  laszip: LASZipVLR,
  options: LASLoaderOptions
): AsyncIterable<LASDecodedChunk> {
  if (laszip.variableChunks) {
    const bytes = await collectRemainingInputBytes(initialPending, inputIterator);
    yield* decodeLAZFileFromCompleteBytes(bytes, header, laszip, options);
    return;
  }

  if (header.pointsFormatId <= 5) {
    yield* decodePendingFixedLegacyLAZFileInBatches(
      initialPending,
      inputIterator,
      header,
      laszip,
      options
    );
    return;
  }

  const outputHeader = {...header, totalToRead: header.pointsCount};
  const batchSize = getBatchSize(options);
  const state = createRawPointBatchState(
    batchSize,
    header.pointsStructSize,
    getLAZStreamingDecodeStats(options)
  );
  let sourcePointIndex = 0;
  const reader = new BinaryChunkReader();
  reader.write(initialPending);

  await readUntilAvailable(
    reader,
    inputIterator,
    header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH,
    'LASLoader: incomplete compressed LAZ point data'
  );
  reader.skip(header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH);

  while (sourcePointIndex < header.pointsCount) {
    const chunkPointCount = Math.min(laszip.chunkSize, header.pointsCount - sourcePointIndex);
    const metadata = createLAZChunkMetadata(header, laszip, chunkPointCount);
    const chunkByteLength = await readLAZChunkByteLengthFromReader(reader, inputIterator, metadata);
    recordReadBytesStats(reader, chunkByteLength, state.stats);
    const compressedChunk = reader.readBytes(chunkByteLength);
    for (const batch of appendDecodedLAZChunk(compressedChunk, metadata, outputHeader, state)) {
      yield batch;
    }

    sourcePointIndex += chunkPointCount;
  }

  const finalBatch = flushRawPointBatch(outputHeader, state);
  if (finalBatch) {
    yield finalBatch;
  }
}

async function* decodePendingFixedLegacyLAZFileInBatches(
  initialPending: Uint8Array<ArrayBufferLike>,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader,
  laszip: LASZipVLR,
  options: LASLoaderOptions = {}
): AsyncIterable<LASDecodedChunk> {
  const outputHeader = {...header, totalToRead: header.pointsCount};
  const batchSize = getBatchSize(options);
  const state = createRawPointBatchState(
    batchSize,
    header.pointsStructSize,
    getLAZStreamingDecodeStats(options)
  );
  const reader = new BinaryChunkReader();
  reader.write(initialPending);

  await readUntilAvailable(
    reader,
    inputIterator,
    header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH,
    'LASLoader: incomplete compressed LAZ point data'
  );
  reader.skip(header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH);

  let sourcePointIndex = 0;
  while (sourcePointIndex < header.pointsCount) {
    const chunkPointCount = Math.min(laszip.chunkSize, header.pointsCount - sourcePointIndex);
    const metadata = createLAZChunkMetadata(header, laszip, chunkPointCount);
    let nextDecodeAttemptByteLength = 0;
    let inputDone = false;
    // Arithmetic state cannot be rolled back after a partial point. Retry from the chunk start at
    // geometric byte thresholds, replaying emitted points into one scratch record.
    let emittedPointCount = 0;
    const replayPoint = new Uint8Array(header.pointsStructSize);

    while (true) {
      const availableByteLength = reader.getAvailableByteLength();
      if (!inputDone && availableByteLength < nextDecodeAttemptByteLength) {
        const next = await inputIterator.next();
        if (next.done) {
          inputDone = true;
        } else {
          reader.write(next.value);
        }
        continue;
      }

      const checkpoint = reader.checkpoint();
      let decodedPointCount = 0;
      try {
        if (availableByteLength === 0) {
          throw new NeedsMoreData();
        }
        recordReadBytesStats(reader, availableByteLength, state.stats);
        const compressedCandidate = reader.readBytes(availableByteLength);
        const cursor = createLAZChunkDecoderCursor(compressedCandidate, metadata);

        while (decodedPointCount < chunkPointCount) {
          const replayingEmittedPoint = decodedPointCount < emittedPointCount;
          const output = replayingEmittedPoint ? replayPoint : state.rawBatch;
          const outputOffset = replayingEmittedPoint
            ? 0
            : state.batchPointCount * header.pointsStructSize;
          cursor.decodeInto(output, outputOffset, 1);
          decodedPointCount++;

          if (!replayingEmittedPoint) {
            emittedPointCount++;
            state.batchPointCount++;
            if (state.batchPointCount === batchSize) {
              const batch = flushRawPointBatch(outputHeader, state);
              if (batch) {
                yield batch;
              }
            }
          }
        }

        reader.restore(checkpoint);
        reader.skip(cursor.compressedByteOffset);
        break;
      } catch (error) {
        reader.restore(checkpoint);
        if (!(error instanceof NeedsMoreData)) {
          throw error;
        }
        if (decodedPointCount < emittedPointCount) {
          throw new Error(
            `LASLoader: legacy LAZ replay reached ${decodedPointCount} points after previously emitting ${emittedPointCount}`
          );
        }
        if (inputDone) {
          throw new NeedsMoreData(
            `LASLoader: truncated legacy LAZ chunk after ${decodedPointCount} of ${chunkPointCount} points with ${availableByteLength} bytes available`
          );
        }
        nextDecodeAttemptByteLength =
          availableByteLength +
          Math.max(availableByteLength, LEGACY_LAZ_MIN_DECODE_RETRY_BYTE_LENGTH);
      }

      const next = await inputIterator.next();
      if (next.done) {
        inputDone = true;
      } else {
        reader.write(next.value);
      }
    }

    sourcePointIndex += chunkPointCount;
  }

  const finalBatch = flushRawPointBatch(outputHeader, state);
  if (finalBatch) {
    yield finalBatch;
  }
}

async function* parseLAZInBatches(
  initialPending: Uint8Array<ArrayBufferLike>,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader,
  options: LASLoaderOptions
): AsyncIterable<LASArrowTable> {
  const {pending, laszip} = await readLASZipVLRFromInput(initialPending, inputIterator, header);
  validateTypeScriptLAZSupport(header, laszip);
  if (!laszip.variableChunks && header.pointsFormatId >= 6 && header.pointsFormatId <= 10) {
    yield* parsePendingLAZFileInArrowBatches(pending, inputIterator, header, laszip, options);
    return;
  }

  for await (const batch of decodeLAZFileWithParsedVLRInBatches(
    pending,
    inputIterator,
    header,
    laszip,
    options
  )) {
    yield parseLASArrowTableBatch(batch.arrayBuffer, batch.header, options);
  }
}

async function* parsePendingLAZFileInArrowBatches(
  initialPending: Uint8Array<ArrayBufferLike>,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader,
  laszip: LASZipVLR,
  options: LASLoaderOptions
): AsyncIterable<LASArrowTable> {
  const outputHeader = {...header, totalToRead: header.pointsCount};
  const state = createPointDataBatchState(getBatchSize(options), header, options);
  let sourcePointIndex = 0;
  const reader = new BinaryChunkReader();
  reader.write(initialPending);

  await readUntilAvailable(
    reader,
    inputIterator,
    header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH,
    'LASLoader: incomplete compressed LAZ point data'
  );
  reader.skip(header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH);

  while (sourcePointIndex < header.pointsCount) {
    const chunkPointCount = Math.min(laszip.chunkSize, header.pointsCount - sourcePointIndex);
    const metadata = createLAZChunkMetadata(header, laszip, chunkPointCount);
    const chunkByteLength = await readLAZChunkByteLengthFromReader(reader, inputIterator, metadata);
    const compressedChunk = reader.readBytes(chunkByteLength);

    for (const batch of appendDecodedLAZChunkToPointDataBatches(
      compressedChunk,
      metadata,
      outputHeader,
      state,
      options
    )) {
      yield batch;
    }

    sourcePointIndex += chunkPointCount;
  }

  const finalBatch = flushPointDataBatch(outputHeader, state, options);
  if (finalBatch) {
    yield finalBatch;
  }
}

function* parseLAZChunkedIterator(
  arrayBuffer: ArrayBuffer,
  header: LASHeader,
  batchSize: number
): Iterable<LASDecodedChunk> {
  const laszip = parseLASZipVLR(new Uint8Array(arrayBuffer), header);
  validateTypeScriptLAZSupport(header, laszip);

  if (header.pointsFormatId <= 5 || laszip.variableChunks) {
    yield* decodeLAZFileFromCompleteBytes(new Uint8Array(arrayBuffer), header, laszip, {
      batchSize,
      las: {}
    });
    return;
  }

  const outputHeader = {...header, totalToRead: header.pointsCount};
  const state = createRawPointBatchState(batchSize, header.pointsStructSize);
  const bytes = new Uint8Array(arrayBuffer);
  let sourcePointIndex = 0;
  let byteOffset = header.pointsOffset + 8;

  while (sourcePointIndex < header.pointsCount) {
    const chunkPointCount = Math.min(laszip.chunkSize, header.pointsCount - sourcePointIndex);
    const metadata = createLAZChunkMetadata(header, laszip, chunkPointCount);
    const compressed = bytes.subarray(byteOffset);
    const chunkByteLength = getLAZChunkByteLength(compressed, metadata);
    for (const batch of appendDecodedLAZChunk(
      compressed.subarray(0, chunkByteLength),
      metadata,
      outputHeader,
      state
    )) {
      yield batch;
    }

    sourcePointIndex += chunkPointCount;
    byteOffset += chunkByteLength;
  }

  const finalBatch = flushRawPointBatch(outputHeader, state);
  if (finalBatch) {
    yield finalBatch;
  }
}

function* decodeLAZFileFromCompleteBytes(
  bytes: Uint8Array,
  header: LASHeader,
  laszip: LASZipVLR,
  options: LASLoaderOptions = {}
): Iterable<LASDecodedChunk> {
  const batchSize = getBatchSize(options);
  const outputHeader = {...header, totalToRead: header.pointsCount};
  const state = createRawPointBatchState(
    batchSize,
    header.pointsStructSize,
    getLAZStreamingDecodeStats(options)
  );
  const chunkTableOffset = readUint64(
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    header.pointsOffset
  );
  const chunkTable = readLAZChunkTable(bytes, header, laszip, chunkTableOffset);
  let byteOffset = header.pointsOffset + 8;

  for (const chunk of chunkTable) {
    const compressedChunk = bytes.subarray(byteOffset, byteOffset + chunk.byteLength);
    if (compressedChunk.byteLength < chunk.byteLength) {
      throw new NeedsMoreData('LASLoader: truncated legacy LAZ chunk');
    }
    const metadata = createLAZChunkMetadata(header, laszip, chunk.pointCount);
    const rawChunk = decodeLAZChunk(compressedChunk, metadata);
    recordDecodedChunkAllocation(rawChunk.byteLength, state.stats);
    for (const batch of appendRawPointChunk(rawChunk, outputHeader, state)) {
      yield batch;
    }
    byteOffset += chunk.byteLength;
  }

  const finalBatch = flushRawPointBatch(outputHeader, state);
  if (finalBatch) {
    yield finalBatch;
  }
}

function decodeLAZFileToRawPointData(arrayBuffer: ArrayBuffer, header: LASHeader): Uint8Array {
  const totalPointCount = header.pointsCount;
  const rawPointData = new Uint8Array(totalPointCount * header.pointsStructSize);
  let byteOffset = 0;

  for (const batch of parseLAZChunkedIterator(arrayBuffer, header, DEFAULT_BATCH_SIZE)) {
    const source = new Uint8Array(batch.arrayBuffer);
    rawPointData.set(source, byteOffset);
    byteOffset += source.byteLength;
  }

  return rawPointData;
}

/** Parse the public LAS header block. */
export function parseLASHeader(arrayBuffer: ArrayBufferLike): LASHeader {
  const dataView = new DataView(arrayBuffer);
  if (arrayBuffer.byteLength < 227 || dataView.getUint32(0, true) !== LASF_SIGNATURE) {
    throw new Error('LASLoader: invalid LAS header');
  }

  const versionMajor = dataView.getUint8(24);
  const versionMinor = dataView.getUint8(25);
  const headerSize = dataView.getUint16(94, true);
  const vlrCount = dataView.getUint32(100, true);
  const pointFormatByte = dataView.getUint8(104);
  const pointsFormatId = pointFormatByte & POINT_FORMAT_MASK;
  const isCompressed = Boolean(pointFormatByte & COMPRESSED_POINT_FORMAT_MASK);
  const legacyPointCount = dataView.getUint32(107, true);
  const extendedPointCount =
    versionMajor > 1 || versionMinor >= 4 ? readUint64(dataView, 247) : legacyPointCount;
  const pointsCount = extendedPointCount || legacyPointCount;
  const pointsOffset = dataView.getUint32(96, true);
  const pointsStructSize = dataView.getUint16(105, true);
  const scale: [number, number, number] = [
    dataView.getFloat64(131, true),
    dataView.getFloat64(139, true),
    dataView.getFloat64(147, true)
  ];
  const offset: [number, number, number] = [
    dataView.getFloat64(155, true),
    dataView.getFloat64(163, true),
    dataView.getFloat64(171, true)
  ];
  const maxs = [
    dataView.getFloat64(179, true),
    dataView.getFloat64(195, true),
    dataView.getFloat64(211, true)
  ];
  const mins = [
    dataView.getFloat64(187, true),
    dataView.getFloat64(203, true),
    dataView.getFloat64(219, true)
  ];

  return {
    pointsOffset,
    pointsFormatId,
    pointsStructSize,
    pointsCount,
    scale,
    offset,
    maxs,
    mins,
    totalToRead: pointsCount,
    totalRead: 0,
    hasColor: hasPointColor(pointsFormatId),
    versionAsString: `${versionMajor}.${versionMinor}`,
    isCompressed,
    headerSize,
    vlrCount
  };
}

/**
 * Parse raw LAS point records into a MeshArrowTable batch.
 * @param arrayBuffer Raw point record data or a complete LAS file buffer.
 * @param lasHeader LAS header describing the point record layout.
 * @param options LAS loader options.
 * @returns Arrow table batch populated directly from LAS point records.
 */
function parseLASArrowTableBatch(
  arrayBuffer: ArrayBufferLike | ArrayBufferView,
  lasHeader: LASHeader,
  options: LASLoaderOptions = {}
): LASArrowTable {
  const batchSize = lasHeader.pointsCount;
  const PositionsType = options.las?.fp64 ? Float64Array : Float32Array;
  const positions = new PositionsType(batchSize * 3);
  const colors = lasHeader.hasColor ? new Uint8Array(batchSize * 4) : null;
  const intensities = new Uint16Array(batchSize);
  const classifications = new Uint8Array(batchSize);

  populateLASAttributesFromDataView(makeDataView(arrayBuffer), lasHeader, options, {
    positions,
    colors,
    intensities,
    classifications,
    pointOffset: 0,
    sourcePointIndex: 0,
    pointCount: batchSize
  });

  return makeLASArrowTableFromAttributes(
    lasHeader,
    positions,
    colors,
    intensities,
    classifications
  );
}

function makeLASArrowTableFromAttributes(
  lasHeader: LASHeader,
  positions: Float32Array | Float64Array,
  colors: Uint8Array | null,
  intensities: Uint16Array,
  classifications: Uint8Array
): LASArrowTable {
  const attributes: MeshAttributes = {
    POSITION: {value: positions, size: 3},
    intensity: {value: intensities, size: 1},
    classification: {value: classifications, size: 1}
  };
  if (colors) {
    attributes.COLOR_0 = {value: colors, size: 4};
  }

  const schema = getLASSchema(lasHeader, attributes);
  return {
    ...makeMeshArrowTable(attributes, {
      schema,
      topology: 'point-list',
      mode: 0,
      boundingBox: getHeaderBoundingBox(lasHeader)
    }),
    loader: 'las',
    loaderData: lasHeader,
    progress: lasHeader.totalRead / lasHeader.totalToRead
  };
}

/** Create a DataView with exact offsets for ArrayBufferView inputs. */
function makeDataView(arrayBuffer: ArrayBufferLike | ArrayBufferView): DataView {
  if (ArrayBuffer.isView(arrayBuffer)) {
    return new DataView(arrayBuffer.buffer, arrayBuffer.byteOffset, arrayBuffer.byteLength);
  }
  return new DataView(arrayBuffer);
}

function populateLASAttributesFromDataView(
  dataView: DataView,
  lasHeader: LASHeader,
  options: LASLoaderOptions,
  target: {
    positions: Float32Array | Float64Array;
    colors: Uint8Array | null;
    intensities: Uint16Array;
    classifications: Uint8Array;
    pointOffset: number;
    sourcePointIndex: number;
    pointCount: number;
  }
): void {
  const {
    scale: [scaleX, scaleY, scaleZ],
    offset: [offsetX, offsetY, offsetZ]
  } = lasHeader;
  const pointsFormatId = lasHeader.pointsFormatId;
  const pointRecordLength = lasHeader.pointsStructSize;
  const colorOffset = getColorOffset(pointsFormatId);
  const twoByteColor = detectTwoByteColors(
    dataView,
    lasHeader,
    target.sourcePointIndex,
    target.pointCount,
    options.las?.colorDepth
  );

  for (let pointIndex = 0; pointIndex < target.pointCount; pointIndex++) {
    const sourcePointIndex = target.sourcePointIndex + pointIndex;
    const pointOffset = lasHeader.pointsOffset + sourcePointIndex * pointRecordLength;
    const targetPointIndex = target.pointOffset + pointIndex;
    target.positions[targetPointIndex * 3] =
      dataView.getInt32(pointOffset, true) * scaleX + offsetX;
    target.positions[targetPointIndex * 3 + 1] =
      dataView.getInt32(pointOffset + 4, true) * scaleY + offsetY;
    target.positions[targetPointIndex * 3 + 2] =
      dataView.getInt32(pointOffset + 8, true) * scaleZ + offsetZ;
    target.intensities[targetPointIndex] = dataView.getUint16(pointOffset + 12, true);
    target.classifications[targetPointIndex] = readClassification(
      dataView,
      pointOffset,
      pointsFormatId
    );

    if (colorOffset >= 0 && target.colors) {
      const red = dataView.getUint16(pointOffset + colorOffset, true);
      const green = dataView.getUint16(pointOffset + colorOffset + 2, true);
      const blue = dataView.getUint16(pointOffset + colorOffset + 4, true);
      target.colors[targetPointIndex * 4] = twoByteColor ? red / 256 : red;
      target.colors[targetPointIndex * 4 + 1] = twoByteColor ? green / 256 : green;
      target.colors[targetPointIndex * 4 + 2] = twoByteColor ? blue / 256 : blue;
      target.colors[targetPointIndex * 4 + 3] = 255;
    }
  }
}

function readClassification(
  dataView: DataView,
  pointOffset: number,
  pointsFormatId: number
): number {
  return pointsFormatId <= 5
    ? dataView.getUint8(pointOffset + 15) & 0x1f
    : dataView.getUint8(pointOffset + 16);
}

function hasPointColor(pointsFormatId: number): boolean {
  return getColorOffset(pointsFormatId) >= 0;
}

function getColorOffset(pointsFormatId: number): number {
  switch (pointsFormatId) {
    case 2:
      return 20;
    case 3:
      return 28;
    case 5:
      return 28;
    case 7:
    case 8:
    case 10:
      return 30;
    default:
      return -1;
  }
}

function detectTwoByteColors(
  dataView: DataView,
  lasHeader: LASHeader,
  sourcePointIndex: number,
  batchSize: number,
  colorDepth?: number | string
): boolean {
  if (colorDepth === 8) {
    return false;
  }
  if (colorDepth === 16) {
    return true;
  }
  if (colorDepth !== 'auto') {
    return false;
  }
  const colorOffset = getColorOffset(lasHeader.pointsFormatId);
  if (colorOffset < 0) {
    return false;
  }
  for (let pointIndex = 0; pointIndex < batchSize; pointIndex++) {
    const pointOffset =
      lasHeader.pointsOffset + (sourcePointIndex + pointIndex) * lasHeader.pointsStructSize;
    if (
      dataView.getUint16(pointOffset + colorOffset, true) > 255 ||
      dataView.getUint16(pointOffset + colorOffset + 2, true) > 255 ||
      dataView.getUint16(pointOffset + colorOffset + 4, true) > 255
    ) {
      return true;
    }
  }
  return false;
}

function getBatchSize(options: LASLoaderOptions): number {
  const batchSize = options.batchSize ?? options.core?.batchSize;
  return typeof batchSize === 'number' ? batchSize : DEFAULT_BATCH_SIZE;
}

function parseLASZipVLR(bytes: Uint8Array, header: LASHeader): LASZipVLR {
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = header.headerSize || LAS_14_HEADER_LENGTH;
  const vlrCount = header.vlrCount || 0;

  for (let index = 0; index < vlrCount; index++) {
    if (offset + 54 > bytes.byteLength) {
      throw new NeedsMoreData('LASLoader: incomplete VLR header');
    }
    const userId = readNullTerminatedAscii(bytes, offset + 2, 16);
    const recordId = dataView.getUint16(offset + 18, true);
    const recordLength = dataView.getUint16(offset + 20, true);
    const dataOffset = offset + 54;

    if (dataOffset + recordLength > bytes.byteLength) {
      throw new NeedsMoreData('LASLoader: incomplete VLR data');
    }
    if (userId === LASZIP_USER_ID && recordId === LASZIP_RECORD_ID) {
      if (recordLength < 34) {
        throw new Error('LASLoader: malformed LASzip VLR');
      }
      const chunkSize = dataView.getUint32(dataOffset + 12, true);
      const itemCount = dataView.getUint16(dataOffset + 32, true);
      const itemDataByteLength = 34 + itemCount * 6;
      if (itemDataByteLength > recordLength) {
        throw new Error('LASLoader: malformed LASzip VLR item table');
      }
      let point14ItemVersion: 2 | 3 | 4 | null = null;
      let rgb14ItemVersion: 2 | 3 | 4 | null = null;
      let wavePacket13ItemVersion: 1 | null = null;
      let wavePacketItemVersion: 3 | 4 | null = null;
      let byte14ItemVersion: 2 | 3 | 4 | null = null;
      for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
        const itemOffset = dataOffset + 34 + itemIndex * 6;
        const itemType = dataView.getUint16(itemOffset, true);
        const itemVersion = dataView.getUint16(itemOffset + 4, true);
        if (itemType === 9) {
          if (itemVersion !== 1) {
            throw new Error(`LASLoader: unsupported WavePacket13 item version ${itemVersion}`);
          }
          wavePacket13ItemVersion = itemVersion;
        } else if ([10, 11, 12, 14].includes(itemType)) {
          if (itemVersion !== 2 && itemVersion !== 3 && itemVersion !== 4) {
            throw new Error(
              `LASLoader: unsupported LAS 1.4 item type ${itemType} version ${itemVersion}`
            );
          }
          if (itemType === 10) {
            point14ItemVersion = itemVersion;
          } else if (itemType === 11 || itemType === 12) {
            rgb14ItemVersion = itemVersion;
          } else {
            byte14ItemVersion = itemVersion;
          }
        } else if (itemType === 13) {
          if (itemVersion !== 3 && itemVersion !== 4) {
            throw new Error(`LASLoader: unsupported WavePacket14 item version ${itemVersion}`);
          }
          wavePacketItemVersion = itemVersion;
        }
      }
      return {
        compressor: dataView.getUint16(dataOffset, true),
        chunkSize,
        variableChunks: chunkSize === 0 || chunkSize === VARIABLE_CHUNK_SIZE,
        point14ItemVersion,
        rgb14ItemVersion,
        wavePacket13ItemVersion,
        wavePacketItemVersion,
        byte14ItemVersion
      };
    }
    offset = dataOffset + recordLength;
  }

  throw new Error('LASLoader: compressed LAZ file does not contain a LASzip VLR');
}

function validateTypeScriptLAZSupport(header: LASHeader, laszip: LASZipVLR): void {
  if (![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(header.pointsFormatId)) {
    throw new Error(
      `LASLoader: TypeScript LAZ streaming only supports point formats 0-10; received ${header.pointsFormatId}`
    );
  }
  if (header.pointsFormatId <= 5 && laszip.compressor !== 2) {
    throw new Error(
      `LASLoader: legacy TypeScript LAZ decoding requires LASzip compressor 2; received ${laszip.compressor}`
    );
  }
  if (header.pointsFormatId >= 6 && laszip.compressor !== 3) {
    throw new Error(
      `LASLoader: LAS 1.4 TypeScript LAZ decoding requires LASzip compressor 3; received ${laszip.compressor}`
    );
  }
  if (header.pointsFormatId >= 6 && !laszip.point14ItemVersion) {
    throw new Error(
      `LASLoader: point format ${header.pointsFormatId} requires a Point14 LASzip item`
    );
  }
  if (
    (header.pointsFormatId === 4 || header.pointsFormatId === 5) &&
    !laszip.wavePacket13ItemVersion
  ) {
    throw new Error(
      `LASLoader: point format ${header.pointsFormatId} requires a WavePacket13 LASzip item`
    );
  }
  if (
    (header.pointsFormatId === 7 || header.pointsFormatId === 8 || header.pointsFormatId === 10) &&
    !laszip.rgb14ItemVersion
  ) {
    throw new Error(
      `LASLoader: point format ${header.pointsFormatId} requires an RGB14 or RGBNIR14 LASzip item`
    );
  }
  if (
    header.pointsFormatId >= 6 &&
    header.pointsStructSize > getLAZPointDataRecordBaseLength(header.pointsFormatId) &&
    !laszip.byte14ItemVersion
  ) {
    throw new Error(
      `LASLoader: point format ${header.pointsFormatId} with Extra Bytes requires a Byte14 LASzip item`
    );
  }
  if (
    (header.pointsFormatId === 9 || header.pointsFormatId === 10) &&
    !laszip.wavePacketItemVersion
  ) {
    throw new Error(
      `LASLoader: point format ${header.pointsFormatId} requires a WavePacket14 LASzip item`
    );
  }
}

/** Read enough input to parse the LASzip VLR without assuming VLR alignment. */
async function readLASZipVLRFromInput(
  initialPending: Uint8Array<ArrayBufferLike>,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader
): Promise<{pending: Uint8Array<ArrayBufferLike>; laszip: LASZipVLR}> {
  let pending = initialPending;
  while (true) {
    try {
      return {pending, laszip: parseLASZipVLR(pending, header)};
    } catch (error) {
      if (!(error instanceof NeedsMoreData)) {
        throw error;
      }
    }

    const next = await inputIterator.next();
    if (next.done) {
      throw new NeedsMoreData('LASLoader: incomplete LASzip VLR');
    }
    pending = concatenateUint8Arrays(pending, toUint8Array(next.value));
  }
}

/** Collect a forward-only input once when metadata at EOF is required before decoding. */
async function collectRemainingInputBytes(
  initialPending: Uint8Array<ArrayBufferLike>,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>
): Promise<Uint8Array<ArrayBufferLike>> {
  const chunks: Uint8Array<ArrayBufferLike>[] = [initialPending];
  let totalByteLength = initialPending.byteLength;

  while (true) {
    const next = await inputIterator.next();
    if (next.done) {
      break;
    }
    const chunk = toUint8Array(next.value);
    chunks.push(chunk);
    totalByteLength += chunk.byteLength;
  }

  if (chunks.length === 1) {
    return initialPending;
  }
  const bytes = new Uint8Array(totalByteLength);
  let byteOffset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, byteOffset);
    byteOffset += chunk.byteLength;
  }
  return bytes;
}

async function readUntilAvailable(
  reader: BinaryChunkReader,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  byteLength: number,
  errorMessage: string
): Promise<void> {
  while (!reader.hasAvailableBytes(byteLength)) {
    const next = await inputIterator.next();
    if (next.done) {
      throw new NeedsMoreData(errorMessage);
    }
    reader.write(next.value);
  }
}

async function readLAZChunkByteLengthFromReader(
  reader: BinaryChunkReader,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  metadata: LAZChunkByteLengthMetadata
): Promise<number> {
  while (true) {
    const checkpoint = reader.checkpoint();
    let chunkByteLength: number | null;
    try {
      chunkByteLength = tryReadLAZChunkByteLengthFromReader(reader, metadata);
    } finally {
      reader.restore(checkpoint);
    }

    if (chunkByteLength !== null) {
      await readUntilAvailable(
        reader,
        inputIterator,
        chunkByteLength,
        'LASLoader: truncated LAZ chunk'
      );
      return chunkByteLength;
    }

    const next = await inputIterator.next();
    if (next.done) {
      throw new NeedsMoreData('LASLoader: truncated LAZ chunk');
    }
    reader.write(next.value);
  }
}

function tryReadLAZChunkByteLengthFromReader(
  reader: BinaryChunkReader,
  metadata: LAZChunkByteLengthMetadata
): number | null {
  if (metadata.pointDataRecordFormat < 6 || metadata.pointDataRecordFormat > 10) {
    return null;
  }

  const extraByteCount =
    metadata.pointDataRecordLength -
    getLAZPointDataRecordBaseLength(metadata.pointDataRecordFormat);
  if (extraByteCount < 0) {
    throw new Error(`Invalid point record length ${metadata.pointDataRecordLength}`);
  }
  const sizeHeaderCount =
    getLAZChunkSizeHeaderBaseCount(metadata.pointDataRecordFormat) + extraByteCount;
  const sizeHeaderOffset = metadata.pointDataRecordLength + 4;
  const sizeHeaderByteLength = sizeHeaderCount * 4;
  const minimumByteLength = sizeHeaderOffset + sizeHeaderByteLength;
  if (!reader.hasAvailableBytes(minimumByteLength)) {
    return null;
  }

  reader.skip(sizeHeaderOffset);
  let chunkByteLength = minimumByteLength;
  for (let index = 0; index < sizeHeaderCount; index++) {
    chunkByteLength += reader.readUint32LE();
  }
  return chunkByteLength;
}

function getLAZPointDataRecordBaseLength(pointDataRecordFormat: number): number {
  switch (pointDataRecordFormat) {
    case 6:
      return 30;
    case 7:
      return 36;
    case 8:
      return 38;
    case 9:
      return 59;
    case 10:
      return 67;
    default:
      throw new Error(`Unsupported LAS 1.4 point format ${pointDataRecordFormat}`);
  }
}

function getLAZChunkSizeHeaderBaseCount(pointDataRecordFormat: number): number {
  switch (pointDataRecordFormat) {
    case 6:
      return 9;
    case 7:
      return 10;
    case 8:
      return 11;
    case 9:
      return 10;
    case 10:
      return 12;
    default:
      throw new Error(`Unsupported LAS 1.4 point format ${pointDataRecordFormat}`);
  }
}

function readLAZChunkTable(
  bytes: Uint8Array,
  header: LASHeader,
  laszip: LASZipVLR,
  chunkTableOffset: number
) {
  if (
    !Number.isSafeInteger(chunkTableOffset) ||
    chunkTableOffset < 0 ||
    chunkTableOffset + 8 > bytes.byteLength
  ) {
    throw new NeedsMoreData('LASLoader: incomplete LAZ chunk table');
  }
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const version = dataView.getUint32(chunkTableOffset, true);
  const chunkCount = dataView.getUint32(chunkTableOffset + 4, true);
  if (version !== 0) {
    throw new Error(`LASLoader: unsupported LAZ chunk table version ${version}`);
  }
  if (chunkCount === 0) {
    if (header.pointsCount !== 0) {
      throw new Error('LASLoader: missing LAZ chunk table');
    }
    return [];
  }
  const chunks = decodeLAZChunkTable(bytes.subarray(chunkTableOffset + 8), {
    chunkCount,
    pointCount: header.pointsCount,
    chunkSize: laszip.chunkSize,
    variable: laszip.variableChunks
  });
  let decodedPointCount = 0;
  let decodedByteLength = 0;
  for (const chunk of chunks) {
    if (chunk.pointCount === 0 || chunk.byteLength === 0) {
      throw new Error('LASLoader: invalid empty LAZ chunk-table entry');
    }
    decodedPointCount += chunk.pointCount;
    decodedByteLength += chunk.byteLength;
  }
  if (decodedPointCount !== header.pointsCount) {
    throw new Error(
      `LASLoader: LAZ chunk table contains ${decodedPointCount} points; expected ${header.pointsCount}`
    );
  }
  if (header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH + decodedByteLength > chunkTableOffset) {
    throw new Error('LASLoader: LAZ chunk table byte lengths overlap the chunk table');
  }
  return chunks;
}

function createRawPointBatchState(
  batchSize: number,
  pointRecordLength: number,
  stats?: LAZStreamingDecodeStats
): RawPointBatchState {
  if (stats) {
    stats.rawBatchAllocations++;
  }
  return {
    rawBatch: new Uint8Array(batchSize * pointRecordLength),
    batchPointCount: 0,
    totalRead: 0,
    rawBatchAllocations: 1,
    stats
  };
}

function createPointDataBatchState(
  batchSize: number,
  header: LASHeader,
  options: LASLoaderOptions
): PointDataBatchState {
  const PositionsType = options.las?.fp64 ? Float64Array : Float32Array;
  const positions = new PositionsType(batchSize * 3);
  const useRawColors =
    header.hasColor && (options.las?.colorDepth === 16 || options.las?.colorDepth === 'auto');
  const colors = header.hasColor && !useRawColors ? new Uint8Array(batchSize * 4) : null;
  const rawColors = useRawColors ? new Uint16Array(batchSize * 3) : null;
  const intensities = new Uint16Array(batchSize);
  const classifications = new Uint8Array(batchSize);
  return {
    positions,
    colors,
    rawColors,
    intensities,
    classifications,
    target: {
      positions,
      intensities,
      classifications,
      colors,
      rawColors,
      pointOffset: 0,
      scale: header.scale,
      offset: header.offset
    },
    batchPointCount: 0,
    totalRead: 0
  };
}

function getLAZStreamingDecodeStats(
  options: LASLoaderOptions
): LAZStreamingDecodeStats | undefined {
  return (options.las as {lazStreamingStats?: LAZStreamingDecodeStats} | undefined)
    ?.lazStreamingStats;
}

function recordReadBytesStats(
  reader: BinaryChunkReader,
  byteLength: number,
  stats?: LAZStreamingDecodeStats
): void {
  if (!stats) {
    return;
  }
  const bufferOffsets = reader.findBufferOffsets(byteLength);
  if (bufferOffsets && bufferOffsets.length > 1) {
    stats.copiedBytes += byteLength;
    stats.chunkConcatenations++;
  }
}

function recordDecodedChunkAllocation(byteLength: number, stats?: LAZStreamingDecodeStats): void {
  if (stats) {
    stats.copiedBytes += byteLength;
    stats.decodedChunkAllocations++;
  }
}

function* appendDecodedLAZChunk(
  compressedChunk: Uint8Array,
  metadata: LAZChunkByteLengthMetadata,
  header: LASHeader,
  state: RawPointBatchState
): Iterable<LASDecodedChunk> {
  const pointRecordLength = header.pointsStructSize;
  const decoder = createLAZChunkDecoderCursor(compressedChunk, metadata);

  while (decoder.remainingPointCount > 0) {
    const batchCapacity = state.rawBatch.byteLength / pointRecordLength;
    const batchRemainingPointCount = batchCapacity - state.batchPointCount;
    const pointsDecoded = decoder.decodeInto(
      state.rawBatch,
      state.batchPointCount * pointRecordLength,
      batchRemainingPointCount
    );
    state.batchPointCount += pointsDecoded;

    if (state.batchPointCount === batchCapacity) {
      const batch = flushRawPointBatch(header, state);
      if (batch) {
        yield batch;
      }
    }
  }
}

function* appendDecodedLAZChunkToPointDataBatches(
  compressedChunk: Uint8Array,
  metadata: LAZChunkByteLengthMetadata,
  header: LASHeader,
  state: PointDataBatchState,
  options: LASLoaderOptions
): Iterable<LASArrowTable> {
  const decoder = createLAZChunkDecoderCursor(compressedChunk, metadata);

  while (decoder.remainingPointCount > 0) {
    const batchCapacity = state.intensities.length;
    const batchRemainingPointCount = batchCapacity - state.batchPointCount;
    state.target.pointOffset = state.batchPointCount;
    const pointsDecoded = decoder.decodeIntoPointData(state.target, batchRemainingPointCount);
    state.batchPointCount += pointsDecoded;

    if (state.batchPointCount === batchCapacity) {
      const batch = flushPointDataBatch(header, state, options);
      if (batch) {
        yield batch;
      }
    }
  }
}

function* appendRawPointChunk(
  rawChunk: Uint8Array,
  header: LASHeader,
  state: RawPointBatchState
): Iterable<LASDecodedChunk> {
  const pointRecordLength = header.pointsStructSize;
  const chunkPointCount = rawChunk.byteLength / pointRecordLength;

  for (let chunkPointIndex = 0; chunkPointIndex < chunkPointCount; chunkPointIndex++) {
    const sourceOffset = chunkPointIndex * pointRecordLength;
    const targetOffset = state.batchPointCount * pointRecordLength;
    state.rawBatch.set(
      rawChunk.subarray(sourceOffset, sourceOffset + pointRecordLength),
      targetOffset
    );
    state.batchPointCount++;

    if (state.batchPointCount === state.rawBatch.byteLength / pointRecordLength) {
      const batch = flushRawPointBatch(header, state);
      if (batch) {
        yield batch;
      }
    }
  }
}

function flushRawPointBatch(header: LASHeader, state: RawPointBatchState): LASDecodedChunk | null {
  if (state.batchPointCount === 0) {
    return null;
  }

  const byteLength = state.batchPointCount * header.pointsStructSize;
  const fullBatch = byteLength === state.rawBatch.byteLength;
  const arrayBuffer = fullBatch
    ? state.rawBatch.buffer
    : state.rawBatch.buffer.slice(0, byteLength);
  state.totalRead += state.batchPointCount;
  const batchHeader = {
    ...header,
    pointsOffset: 0,
    pointsCount: state.batchPointCount,
    totalRead: state.totalRead
  };
  state.batchPointCount = 0;
  if (fullBatch) {
    state.rawBatch = new Uint8Array(state.rawBatch.byteLength);
    state.rawBatchAllocations++;
    if (state.stats) {
      state.stats.rawBatchAllocations++;
    }
  }
  return {arrayBuffer, header: batchHeader};
}

function flushPointDataBatch(
  header: LASHeader,
  state: PointDataBatchState,
  options: LASLoaderOptions
): LASArrowTable | null {
  if (state.batchPointCount === 0) {
    return null;
  }

  state.totalRead += state.batchPointCount;
  const batchHeader = {
    ...header,
    pointsOffset: 0,
    pointsCount: state.batchPointCount,
    totalRead: state.totalRead
  };
  const batchPointCount = state.batchPointCount;
  const fullBatch = batchPointCount === state.intensities.length;
  const positions = fullBatch ? state.positions : state.positions.subarray(0, batchPointCount * 3);
  const intensities = fullBatch
    ? state.intensities
    : state.intensities.subarray(0, batchPointCount);
  const classifications = fullBatch
    ? state.classifications
    : state.classifications.subarray(0, batchPointCount);
  const colors = state.colors
    ? fullBatch
      ? state.colors
      : state.colors.subarray(0, batchPointCount * 4)
    : state.rawColors
      ? convertRawColorsToUint8(state.rawColors, batchPointCount, options)
      : null;
  const table = makeLASArrowTableFromAttributes(
    batchHeader,
    positions,
    colors,
    intensities,
    classifications
  );

  state.batchPointCount = 0;
  if (fullBatch) {
    const PositionsType = options.las?.fp64 ? Float64Array : Float32Array;
    state.positions = new PositionsType(state.positions.length);
    state.colors = state.colors ? new Uint8Array(state.colors.length) : null;
    state.rawColors = state.rawColors ? new Uint16Array(state.rawColors.length) : null;
    state.intensities = new Uint16Array(state.intensities.length);
    state.classifications = new Uint8Array(state.classifications.length);
    state.target.positions = state.positions;
    state.target.colors = state.colors;
    state.target.rawColors = state.rawColors;
    state.target.intensities = state.intensities;
    state.target.classifications = state.classifications;
  }
  return table;
}

function convertRawColorsToUint8(
  rawColors: Uint16Array,
  pointCount: number,
  options: LASLoaderOptions
): Uint8Array {
  const colors = new Uint8Array(pointCount * 4);
  const packedColors = new Uint32Array(colors.buffer);
  const twoByteColor = detectTwoByteRawColors(rawColors, pointCount, options.las?.colorDepth);
  if (twoByteColor) {
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      const sourceOffset = pointIndex * 3;
      const red = (rawColors[sourceOffset] >> 8) & 0xff;
      const green = (rawColors[sourceOffset + 1] >> 8) & 0xff;
      const blue = (rawColors[sourceOffset + 2] >> 8) & 0xff;
      packedColors[pointIndex] = 0xff000000 | (blue << 16) | (green << 8) | red;
    }
  } else {
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      const sourceOffset = pointIndex * 3;
      const red = rawColors[sourceOffset] & 0xff;
      const green = rawColors[sourceOffset + 1] & 0xff;
      const blue = rawColors[sourceOffset + 2] & 0xff;
      packedColors[pointIndex] = 0xff000000 | (blue << 16) | (green << 8) | red;
    }
  }
  return colors;
}

function detectTwoByteRawColors(
  rawColors: Uint16Array,
  pointCount: number,
  colorDepth?: number | string
): boolean {
  if (colorDepth === 8) {
    return false;
  }
  if (colorDepth === 16) {
    return true;
  }
  if (colorDepth !== 'auto') {
    return false;
  }
  for (let index = 0; index < pointCount * 3; index++) {
    if (rawColors[index] > 255) {
      return true;
    }
  }
  return false;
}

function readNullTerminatedAscii(bytes: Uint8Array, offset: number, length: number): string {
  let end = offset;
  const maxEnd = offset + length;
  while (end < maxEnd && bytes[end] !== 0) {
    end++;
  }
  return String.fromCharCode(...bytes.subarray(offset, end));
}

function getHeaderBoundingBox(
  header: LASHeader
): [[number, number, number], [number, number, number]] {
  const minimum = header.mins || [0, 0, 0];
  const maximum = header.maxs || [0, 0, 0];
  return [
    [minimum[0], minimum[1], minimum[2]],
    [maximum[0], maximum[1], maximum[2]]
  ];
}

function* readAvailablePointBatches(
  pending: Uint8Array,
  absoluteOffset: number,
  header: LASHeader,
  sourcePointIndex: number,
  totalRead: number,
  batchSize: number
): Iterable<{
  arrayBuffer: ArrayBufferLike;
  header: LASHeader;
  pending: Uint8Array;
  absoluteOffset: number;
  sourcePointIndex: number;
  totalRead: number;
}> {
  while (sourcePointIndex < header.pointsCount && totalRead < header.totalToRead) {
    const batch = readAvailableContiguousPointBatch(
      pending,
      absoluteOffset,
      header,
      sourcePointIndex,
      totalRead,
      batchSize
    );
    if (!batch) {
      return;
    }
    pending = batch.pending;
    absoluteOffset = batch.absoluteOffset;
    sourcePointIndex = batch.sourcePointIndex;
    totalRead = batch.totalRead;
    yield batch;
  }
}

function readAvailableContiguousPointBatch(
  pending: Uint8Array,
  absoluteOffset: number,
  header: LASHeader,
  sourcePointIndex: number,
  totalRead: number,
  batchSize: number
): {
  arrayBuffer: ArrayBufferLike;
  header: LASHeader;
  pending: Uint8Array;
  absoluteOffset: number;
  sourcePointIndex: number;
  totalRead: number;
} | null {
  const pointRecordLength = header.pointsStructSize;
  const pointAbsoluteOffset = header.pointsOffset + sourcePointIndex * pointRecordLength;
  const pointPendingOffset = pointAbsoluteOffset - absoluteOffset;
  if (pointPendingOffset < 0) {
    throw new Error('LASLoader: invalid streaming point offset');
  }
  if (pointPendingOffset + pointRecordLength > pending.byteLength) {
    return null;
  }

  const availablePointCount = Math.floor(
    (pending.byteLength - pointPendingOffset) / pointRecordLength
  );
  const batchPointCount = Math.min(
    batchSize,
    availablePointCount,
    header.pointsCount - sourcePointIndex,
    header.totalToRead - totalRead
  );
  if (batchPointCount <= 0) {
    return null;
  }

  sourcePointIndex += batchPointCount;
  totalRead += batchPointCount;
  const batchHeader = {
    ...header,
    pointsOffset: pending.byteOffset + pointPendingOffset,
    pointsCount: batchPointCount,
    totalRead
  };
  const nextPointOffset = header.pointsOffset + sourcePointIndex * pointRecordLength;
  const discardByteCount = Math.max(
    0,
    Math.min(pending.byteLength, nextPointOffset - absoluteOffset)
  );

  return {
    arrayBuffer: pending.buffer,
    header: batchHeader,
    pending: pending.subarray(discardByteCount),
    absoluteOffset: absoluteOffset + discardByteCount,
    sourcePointIndex,
    totalRead
  };
}

function tryParseHeader(pending: Uint8Array, absoluteOffset: number): LASHeader | null {
  if (absoluteOffset !== 0 || pending.byteLength < 227) {
    return null;
  }
  const dataView = new DataView(pending.buffer, pending.byteOffset, pending.byteLength);
  if (dataView.getUint32(0, true) !== LASF_SIGNATURE) {
    throw new Error('LASLoader: invalid LAS header');
  }
  const headerLength = dataView.getUint32(96, true);
  if (pending.byteLength < Math.max(headerLength, 255)) {
    return null;
  }
  const header = parseLASHeader(
    pending.buffer.slice(pending.byteOffset, pending.byteOffset + pending.byteLength)
  );
  return header;
}

function concatenateUint8Arrays(
  first: Uint8Array<ArrayBufferLike>,
  second: Uint8Array<ArrayBufferLike>
): Uint8Array<ArrayBufferLike> {
  if (first.byteLength === 0) {
    return second;
  }
  const result = new Uint8Array(first.byteLength + second.byteLength);
  result.set(first);
  result.set(second, first.byteLength);
  return result;
}

function toUint8Array(data: ArrayBufferLike | ArrayBufferView): Uint8Array<ArrayBuffer> {
  const source = ArrayBuffer.isView(data)
    ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    : new Uint8Array(data);
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return copy;
}

function toAsyncIterator(
  data:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>
): AsyncIterator<ArrayBufferLike | ArrayBufferView> {
  if (Symbol.asyncIterator in data) {
    return data[Symbol.asyncIterator]();
  }
  const iterator = data[Symbol.iterator]();
  return {
    async next() {
      return iterator.next();
    }
  };
}

function readUint64(dataView: DataView, byteOffset: number): number {
  if (dataView.byteLength < byteOffset + 8) {
    return 0;
  }
  const low = dataView.getUint32(byteOffset, true);
  const high = dataView.getUint32(byteOffset + 4, true);
  return high * 2 ** 32 + low;
}

export const LAS_1_4_HEADER_LENGTH = LAS_14_HEADER_LENGTH;
