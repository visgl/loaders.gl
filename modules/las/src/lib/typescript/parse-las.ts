// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshArrowTable, MeshAttributes} from '@loaders.gl/schema';
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';
import {
  BinaryChunkReader,
  createLAZChunkDecoder,
  createLAZChunkDecoderCursor,
  decodeLAZChunk,
  decodeLAZChunkTable,
  getLAZChunkDeclaredByteLength,
  getLAZChunkHeaderByteLength,
  NeedsMoreData
} from '@loaders.gl/loader-utils';
import type {
  LAZChunkMetadata,
  LAZChunkTableEntry,
  LAZPointDataTarget
} from '@loaders.gl/loader-utils';
import type {LASLoaderOptions} from '../../las-loader-types';
import {getLASSchema} from '../get-las-schema';
import {
  createLASTypedExtraBytesAttributes,
  createLASTypedExtraBytesValue,
  parseLASExtraBytes,
  type LASTypedExtraBytesAttribute
} from '../las-extra-bytes';
import type {
  LASExtendedVariableLengthRecord,
  LASGeoTIFFKey,
  LASHeader,
  LASMetadata,
  LASVariableLengthRecord,
  LASWaveformPacketDescriptor
} from '../las-types';

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

/** Metadata needed to decode one standalone LAZ chunk into LAS Arrow columns. */
export type LAZChunkArrowTableMetadata = LAZChunkMetadata & {
  /** LAS coordinate scales applied to encoded XYZ integers. */
  scale: [number, number, number];
  /** LAS coordinate offsets applied to encoded XYZ integers. */
  offset: [number, number, number];
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
/** Read-ahead block that amortizes legacy cursor feeds while keeping retained input bounded. */
const LEGACY_LAZ_FEED_BLOCK_SIZE = 64 * 1024;

/** One compressed field item declared by the LASzip VLR. */
type LASZipItem = {
  /** LASzip item type identifier. */
  type: number;
  /** Uncompressed item width in bytes. */
  size: number;
  /** LASzip codec version for this item. */
  version: number;
};

type LASZipVLR = {
  compressor: number;
  /** Entropy coder identifier declared by LASzip. */
  coder: number;
  chunkSize: number;
  variableChunks: boolean;
  /** Ordered compressed field descriptors. */
  items: LASZipItem[];
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
  batchCapacity: number;
  positions: Float32Array | Float64Array;
  colors: Uint8Array | null;
  rawColors: Uint16Array | null;
  intensities: Uint16Array | null;
  classifications: Uint8Array | null;
  syntheticFlags: Uint8Array | null;
  keyPointFlags: Uint8Array | null;
  withheldFlags: Uint8Array | null;
  overlapFlags: Uint8Array | null;
  gpsTimes: Float64Array | null;
  nir: Uint16Array | null;
  scanAngles: Int16Array | null;
  userData: Uint8Array | null;
  pointSourceIds: Uint16Array | null;
  returnNumbers: Uint8Array | null;
  numberOfReturns: Uint8Array | null;
  scannerChannels: Uint8Array | null;
  scanDirectionFlags: Uint8Array | null;
  edgeOfFlightLines: Uint8Array | null;
  waveforms: Uint8Array | null;
  extraBytes: Uint8Array | null;
  typedExtraBytes: LASTypedExtraBytesAttribute[] | null;
  /** Packed raw source used to project selected typed Extra Bytes without raw point records. */
  typedExtraBytesSource: Uint8Array | null;
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

/** Parse LAS data with the TypeScript loader variant. */
export function parseLAS(arrayBuffer: ArrayBuffer, options: LASLoaderOptions = {}): LASArrowTable {
  const header = parseLASHeader(arrayBuffer);
  if (header.isCompressed) {
    const bytes = new Uint8Array(arrayBuffer);
    const laszip = parseLASZipVLR(bytes, header);
    validateTypeScriptLAZSupport(header, laszip);
    if (header.pointsFormatId <= 5 || (header.pointsFormatId >= 6 && header.pointsFormatId <= 10)) {
      return parseCompleteLAZFileToArrowTable(bytes, header, laszip, options);
    }
    const rawPointData = decodeLAZFileToRawPointData(arrayBuffer, header, laszip);
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

/** Decode one complete modern LAZ chunk directly into selected Arrow columns. */
export function decodeLAZChunkToArrowTable(
  compressed: ArrayBuffer | ArrayBufferView,
  metadata: LAZChunkArrowTableMetadata,
  options: LASLoaderOptions
): LASArrowTable {
  if (metadata.pointDataRecordFormat < 6 || metadata.pointDataRecordFormat > 8) {
    throw new Error(
      `LASLoader: standalone Arrow chunk decode supports PDRF 6-8; received ${metadata.pointDataRecordFormat}`
    );
  }
  const pointCount = metadata.pointCount;
  const header: LASHeader = {
    pointsOffset: 0,
    pointsFormatId: metadata.pointDataRecordFormat,
    pointsStructSize: metadata.pointDataRecordLength,
    pointsCount: pointCount,
    scale: metadata.scale,
    offset: metadata.offset,
    maxs: [0, 0, 0],
    mins: [0, 0, 0],
    totalToRead: pointCount,
    totalRead: pointCount,
    hasColor: hasPointColor(metadata.pointDataRecordFormat),
    versionAsString: '1.4',
    isCompressed: true,
    headerSize: LAS_14_HEADER_LENGTH,
    vlrCount: 0
  };
  const state = createPointDataBatchState(pointCount, header, options);
  if (state.waveforms || state.extraBytes || state.typedExtraBytes) {
    throw new Error('LASLoader: standalone Arrow chunk decode only supports direct LAZ columns');
  }
  const cursor = createLAZChunkDecoderCursor(compressed, metadata);
  const decodedPointCount = cursor.decodeIntoPointData(state.target, pointCount);
  if (decodedPointCount !== pointCount) {
    throw new Error(
      `LASLoader: standalone LAZ chunk produced ${decodedPointCount} points; expected ${pointCount}`
    );
  }
  return makePointDataStateArrowTable(header, state, pointCount, options, true);
}

/** Decode one complete supported LAZ file directly into its represented Arrow columns. */
function parseCompleteLAZFileToArrowTable(
  bytes: Uint8Array,
  header: LASHeader,
  laszip: LASZipVLR,
  options: LASLoaderOptions
): LASArrowTable {
  const pointCount = header.pointsCount;
  const state = createPointDataBatchState(pointCount, header, options);
  const chunkTableOffset = readLAZChunkTableOffset(
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    header.pointsOffset
  );
  const chunkTable = readLAZChunkTable(bytes, header, laszip, chunkTableOffset);
  let decodedPointCount = 0;
  let byteOffset = header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH;

  for (const chunk of chunkTable) {
    decodeCompleteLAZChunkToPointData(
      bytes,
      byteOffset,
      chunk.byteLength,
      chunk.pointCount,
      header,
      laszip,
      state,
      decodedPointCount
    );
    byteOffset += chunk.byteLength;
    decodedPointCount += chunk.pointCount;
  }

  if (decodedPointCount !== pointCount) {
    throw new Error(`LASLoader: decoded ${decodedPointCount} LAZ points; expected ${pointCount}`);
  }
  return makePointDataStateArrowTable(header, state, pointCount, options);
}

/** Convert one fully populated point-data state into its Arrow table. */
function makePointDataStateArrowTable(
  header: LASHeader,
  state: PointDataBatchState,
  pointCount: number,
  options: LASLoaderOptions,
  preserveRawColors: boolean = false
): LASArrowTable {
  const colors =
    preserveRawColors && state.rawColors
      ? state.rawColors
      : state.colors
        ? state.colors
        : state.rawColors
          ? convertRawColorsToUint8(state.rawColors, pointCount, options)
          : null;
  return makeLASArrowTableFromAttributes(
    {...header, pointsOffset: 0, pointsCount: pointCount, totalRead: pointCount},
    state.positions,
    colors,
    state.intensities,
    state.classifications,
    state.syntheticFlags,
    state.keyPointFlags,
    state.withheldFlags,
    state.overlapFlags,
    state.gpsTimes,
    state.nir,
    state.scanAngles,
    state.userData,
    state.pointSourceIds,
    state.returnNumbers,
    state.numberOfReturns,
    state.scannerChannels,
    state.scanDirectionFlags,
    state.edgeOfFlightLines,
    state.waveforms,
    state.extraBytes,
    state.typedExtraBytes
  );
}

/** Decode one complete supported LAZ chunk into preallocated Arrow column buffers. */
function decodeCompleteLAZChunkToPointData(
  bytes: Uint8Array,
  byteOffset: number,
  byteLength: number,
  pointCount: number,
  header: LASHeader,
  laszip: LASZipVLR,
  state: PointDataBatchState,
  targetPointOffset: number
): void {
  const compressed = bytes.subarray(byteOffset, byteOffset + byteLength);
  if (compressed.byteLength !== byteLength) {
    throw new NeedsMoreData('LASLoader: truncated LAZ chunk');
  }
  const cursor = createLAZChunkDecoderCursor(
    compressed,
    createLAZChunkMetadata(header, laszip, pointCount)
  );
  state.target.pointOffset = targetPointOffset;
  const decodedPointCount = cursor.decodeIntoPointData(state.target, pointCount);
  if (decodedPointCount !== pointCount) {
    throw new Error(
      `LASLoader: decoded ${decodedPointCount} points from a ${pointCount}-point LAZ chunk`
    );
  }
  populateDecodedTypedExtraBytes(state, targetPointOffset, pointCount);
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
  const chunkByteLengths: number[] = [];
  const reader = new BinaryChunkReader();
  reader.write(initialPending);

  await readUntilAvailable(
    reader,
    inputIterator,
    header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH,
    'LASLoader: incomplete compressed LAZ point data'
  );
  reader.skip(header.pointsOffset);
  const chunkTableOffset = readStreamedLAZChunkTableOffset(
    reader.getDataView(LAZ_CHUNK_TABLE_POINTER_LENGTH)!
  );

  while (sourcePointIndex < header.pointsCount) {
    const chunkPointCount = Math.min(laszip.chunkSize, header.pointsCount - sourcePointIndex);
    const metadata = createLAZChunkMetadata(header, laszip, chunkPointCount);
    const chunkByteLength = await readLAZChunkByteLengthFromReader(reader, inputIterator, metadata);
    chunkByteLengths.push(chunkByteLength);
    recordReadBytesStats(reader, chunkByteLength, state.stats);
    const compressedChunk = reader.readBytes(chunkByteLength);
    for (const batch of appendDecodedLAZChunk(compressedChunk, metadata, outputHeader, state)) {
      yield batch;
    }

    sourcePointIndex += chunkPointCount;
  }

  await validateStreamedFixedLAZChunkTable(
    reader,
    inputIterator,
    header,
    laszip,
    chunkTableOffset,
    chunkByteLengths
  );

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
  const chunkByteLengths: number[] = [];
  const reader = new BinaryChunkReader();
  reader.write(initialPending);

  await readUntilAvailable(
    reader,
    inputIterator,
    header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH,
    'LASLoader: incomplete compressed LAZ point data'
  );
  reader.skip(header.pointsOffset);
  const chunkTableOffset = readStreamedLAZChunkTableOffset(
    reader.getDataView(LAZ_CHUNK_TABLE_POINTER_LENGTH)!
  );

  let sourcePointIndex = 0;
  while (sourcePointIndex < header.pointsCount) {
    const chunkPointCount = Math.min(laszip.chunkSize, header.pointsCount - sourcePointIndex);
    const metadata = createLAZChunkMetadata(header, laszip, chunkPointCount);
    const cursor = createLAZChunkDecoderCursor(new Uint8Array(0), metadata);
    let fedByteLength = 0;
    let inputDone = false;

    while (cursor.remainingPointCount > 0) {
      const availableByteLength = reader.getAvailableByteLength();
      const requestedByteLength = getLegacyLAZFeedByteLength(
        availableByteLength,
        fedByteLength,
        cursor.requiredInputByteLength
      );
      if (requestedByteLength > fedByteLength) {
        const checkpoint = reader.checkpoint();
        reader.skip(fedByteLength);
        const addedByteLength = requestedByteLength - fedByteLength;
        recordReadBytesStats(reader, addedByteLength, state.stats);
        cursor.feed(reader.readBytes(addedByteLength));
        reader.restore(checkpoint);
        fedByteLength = requestedByteLength;
      }

      const availableBatchPointCount = batchSize - state.batchPointCount;
      const decodedPointCount = cursor.decodeAvailableInto(
        state.rawBatch,
        state.batchPointCount * header.pointsStructSize,
        availableBatchPointCount,
        inputDone
      );
      if (decodedPointCount > 0) {
        state.batchPointCount += decodedPointCount;
        if (state.batchPointCount === batchSize) {
          const batch = flushRawPointBatch(outputHeader, state);
          if (batch) {
            yield batch;
          }
        }
        continue;
      }

      if (inputDone) {
        throw new NeedsMoreData(
          `LASLoader: truncated legacy LAZ chunk after ${chunkPointCount - cursor.remainingPointCount} of ${chunkPointCount} points with ${availableByteLength} bytes available`
        );
      }
      const next = await inputIterator.next();
      if (next.done) {
        inputDone = true;
      } else {
        reader.write(next.value);
      }
    }

    reader.skip(cursor.compressedByteOffset);
    chunkByteLengths.push(cursor.compressedByteOffset);

    sourcePointIndex += chunkPointCount;
  }

  await validateStreamedFixedLAZChunkTable(
    reader,
    inputIterator,
    header,
    laszip,
    chunkTableOffset,
    chunkByteLengths
  );

  const finalBatch = flushRawPointBatch(outputHeader, state);
  if (finalBatch) {
    yield finalBatch;
  }
}

/**
 * Return the queued prefix length to expose to a legacy LAZ cursor.
 *
 * Legacy arithmetic decoding can request input one point at a time. Feeding only that minimum
 * makes the streaming path repeat reader checkpoints and tiny copies for every point. Growing
 * the exposed prefix in fixed blocks amortizes that work while limiting speculative read-ahead
 * to one block beyond the cursor requirement.
 */
function getLegacyLAZFeedByteLength(
  availableByteLength: number,
  fedByteLength: number,
  requiredInputByteLength: number
): number {
  return Math.min(
    availableByteLength,
    Math.max(requiredInputByteLength, fedByteLength + LEGACY_LAZ_FEED_BLOCK_SIZE)
  );
}

async function* parseLAZInBatches(
  initialPending: Uint8Array<ArrayBufferLike>,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader,
  options: LASLoaderOptions
): AsyncIterable<LASArrowTable> {
  const {pending, laszip} = await readLASZipVLRFromInput(initialPending, inputIterator, header);
  validateTypeScriptLAZSupport(header, laszip);
  if (!laszip.variableChunks && header.pointsFormatId <= 5) {
    yield* parsePendingFixedLegacyLAZFileInArrowBatches(
      pending,
      inputIterator,
      header,
      laszip,
      options
    );
    return;
  }
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

/**
 * Decode fixed-size legacy LAZ chunks directly into streaming Arrow batches.
 *
 * This path intentionally parallels the raw legacy stream loop for PDRFs 0-5. Writing into
 * Arrow-owned arrays avoids allocating and reparsing an intermediate raw LAS point-record batch,
 * while the cursor still provides point-atomic suspension when more compressed input is required.
 */
async function* parsePendingFixedLegacyLAZFileInArrowBatches(
  initialPending: Uint8Array<ArrayBufferLike>,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader,
  laszip: LASZipVLR,
  options: LASLoaderOptions
): AsyncIterable<LASArrowTable> {
  const outputHeader = {...header, totalToRead: header.pointsCount};
  const state = createPointDataBatchState(getBatchSize(options), header, options);
  const stats = getLAZStreamingDecodeStats(options);
  const chunkByteLengths: number[] = [];
  const reader = new BinaryChunkReader();
  reader.write(initialPending);

  await readUntilAvailable(
    reader,
    inputIterator,
    header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH,
    'LASLoader: incomplete compressed LAZ point data'
  );
  reader.skip(header.pointsOffset);
  const chunkTableOffset = readStreamedLAZChunkTableOffset(
    reader.getDataView(LAZ_CHUNK_TABLE_POINTER_LENGTH)!
  );

  let sourcePointIndex = 0;
  while (sourcePointIndex < header.pointsCount) {
    const chunkPointCount = Math.min(laszip.chunkSize, header.pointsCount - sourcePointIndex);
    const metadata = createLAZChunkMetadata(header, laszip, chunkPointCount);
    const cursor = createLAZChunkDecoderCursor(new Uint8Array(0), metadata);
    let fedByteLength = 0;
    let inputDone = false;

    while (cursor.remainingPointCount > 0) {
      const availableByteLength = reader.getAvailableByteLength();
      const requestedByteLength = getLegacyLAZFeedByteLength(
        availableByteLength,
        fedByteLength,
        cursor.requiredInputByteLength
      );
      if (requestedByteLength > fedByteLength) {
        const checkpoint = reader.checkpoint();
        reader.skip(fedByteLength);
        const addedByteLength = requestedByteLength - fedByteLength;
        recordReadBytesStats(reader, addedByteLength, stats);
        cursor.feed(reader.readBytes(addedByteLength));
        reader.restore(checkpoint);
        fedByteLength = requestedByteLength;
      }

      state.target.pointOffset = state.batchPointCount;
      const availableBatchPointCount = state.batchCapacity - state.batchPointCount;
      const decodedPointCount = cursor.decodeAvailableIntoPointData(
        state.target,
        availableBatchPointCount,
        inputDone
      );
      if (decodedPointCount > 0) {
        populateDecodedTypedExtraBytes(state, state.batchPointCount, decodedPointCount);
        state.batchPointCount += decodedPointCount;
        if (state.batchPointCount === state.batchCapacity) {
          const batch = flushPointDataBatch(outputHeader, state, options);
          if (batch) {
            yield batch;
          }
        }
        continue;
      }

      if (inputDone) {
        throw new NeedsMoreData(
          `LASLoader: truncated legacy LAZ chunk after ${chunkPointCount - cursor.remainingPointCount} of ${chunkPointCount} points with ${availableByteLength} bytes available`
        );
      }
      const next = await inputIterator.next();
      if (next.done) {
        inputDone = true;
      } else {
        reader.write(next.value);
      }
    }

    reader.skip(cursor.compressedByteOffset);
    chunkByteLengths.push(cursor.compressedByteOffset);
    sourcePointIndex += chunkPointCount;
  }

  await validateStreamedFixedLAZChunkTable(
    reader,
    inputIterator,
    header,
    laszip,
    chunkTableOffset,
    chunkByteLengths
  );

  const finalBatch = flushPointDataBatch(outputHeader, state, options);
  if (finalBatch) {
    yield finalBatch;
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
  const chunkByteLengths: number[] = [];
  const reader = new BinaryChunkReader();
  reader.write(initialPending);

  await readUntilAvailable(
    reader,
    inputIterator,
    header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH,
    'LASLoader: incomplete compressed LAZ point data'
  );
  reader.skip(header.pointsOffset);
  const chunkTableOffset = readStreamedLAZChunkTableOffset(
    reader.getDataView(LAZ_CHUNK_TABLE_POINTER_LENGTH)!
  );

  while (sourcePointIndex < header.pointsCount) {
    const chunkPointCount = Math.min(laszip.chunkSize, header.pointsCount - sourcePointIndex);
    const metadata = createLAZChunkMetadata(header, laszip, chunkPointCount);
    const chunkByteLength = yield* appendProgressiveLAZChunkToPointDataBatches(
      reader,
      inputIterator,
      metadata,
      outputHeader,
      state,
      options
    );
    chunkByteLengths.push(chunkByteLength);

    sourcePointIndex += chunkPointCount;
  }

  await validateStreamedFixedLAZChunkTable(
    reader,
    inputIterator,
    header,
    laszip,
    chunkTableOffset,
    chunkByteLengths
  );

  const finalBatch = flushPointDataBatch(outputHeader, state, options);
  if (finalBatch) {
    yield finalBatch;
  }
}

/** Feed one layered LAZ chunk and yield requested Arrow rows before its trailing layers arrive. */
async function* appendProgressiveLAZChunkToPointDataBatches(
  reader: BinaryChunkReader,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  metadata: LAZChunkMetadata,
  header: LASHeader,
  state: PointDataBatchState,
  options: LASLoaderOptions
): AsyncGenerator<LASArrowTable, number> {
  const headerByteLength = getLAZChunkHeaderByteLength(metadata);
  await readUntilAvailable(
    reader,
    inputIterator,
    headerByteLength,
    'LASLoader: incomplete layered LAZ chunk header'
  );
  const compressedHeader = reader.readBytes(headerByteLength);
  const chunkByteLength = getLAZChunkDeclaredByteLength(compressedHeader, metadata);
  const decoder = createLAZChunkDecoder(metadata);
  decoder.feed(compressedHeader);
  let fedByteLength = headerByteLength;

  while (fedByteLength < chunkByteLength) {
    yield* readAvailableLAZPointDataBatches(decoder, header, state, options);
    if (reader.getAvailableByteLength() === 0) {
      const next = await inputIterator.next();
      if (next.done) {
        throw new NeedsMoreData('LASLoader: incomplete layered LAZ chunk payload');
      }
      reader.write(next.value);
    }
    const byteLength = Math.min(reader.getAvailableByteLength(), chunkByteLength - fedByteLength);
    decoder.feed(reader.readBytes(byteLength));
    fedByteLength += byteLength;
  }

  decoder.close();
  yield* readAvailableLAZPointDataBatches(decoder, header, state, options);
  if (decoder.remainingPointCount !== 0) {
    throw new NeedsMoreData(
      `LASLoader: layered LAZ chunk produced ${metadata.pointCount - decoder.remainingPointCount} of ${metadata.pointCount} points`
    );
  }
  return chunkByteLength;
}

/** Drain all currently decodable rows from one feedable layered LAZ chunk. */
function* readAvailableLAZPointDataBatches(
  decoder: ReturnType<typeof createLAZChunkDecoder>,
  header: LASHeader,
  state: PointDataBatchState,
  options: LASLoaderOptions
): Iterable<LASArrowTable> {
  while (decoder.remainingPointCount > 0) {
    const batchRemainingPointCount = state.batchCapacity - state.batchPointCount;
    state.target.pointOffset = state.batchPointCount;
    const pointsDecoded = decoder.readPointDataBatch(state.target, batchRemainingPointCount);
    if (!pointsDecoded) {
      return;
    }
    populateDecodedTypedExtraBytes(state, state.batchPointCount, pointsDecoded);
    state.batchPointCount += pointsDecoded;
    if (state.batchPointCount === state.batchCapacity) {
      const batch = flushPointDataBatch(header, state, options);
      if (batch) {
        yield batch;
      }
    }
  }
}

function* parseLAZChunkedIterator(
  arrayBuffer: ArrayBuffer,
  header: LASHeader,
  batchSize: number,
  parsedLASZipVLR?: LASZipVLR
): Iterable<LASDecodedChunk> {
  const laszip = parsedLASZipVLR || parseLASZipVLR(new Uint8Array(arrayBuffer), header);
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
  const chunkTableOffset = readLAZChunkTableOffset(
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    header.pointsOffset
  );
  const chunkTable = readLAZChunkTable(bytes, header, laszip, chunkTableOffset);
  let byteOffset = header.pointsOffset + 8;

  for (const chunk of chunkTable) {
    const metadata = createLAZChunkMetadata(header, laszip, chunk.pointCount);
    const compressed = bytes.subarray(byteOffset, byteOffset + chunk.byteLength);
    for (const batch of appendDecodedLAZChunk(compressed, metadata, outputHeader, state)) {
      yield batch;
    }

    byteOffset += chunk.byteLength;
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
  const chunkTableOffset = readLAZChunkTableOffset(
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

function decodeLAZFileToRawPointData(
  arrayBuffer: ArrayBuffer,
  header: LASHeader,
  laszip: LASZipVLR
): Uint8Array {
  const totalPointCount = header.pointsCount;
  const rawPointData = new Uint8Array(totalPointCount * header.pointsStructSize);
  let byteOffset = 0;

  for (const batch of parseLAZChunkedIterator(arrayBuffer, header, DEFAULT_BATCH_SIZE, laszip)) {
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
  if (versionMajor !== 1 || versionMinor > 5) {
    throw new Error(`LASLoader: unsupported LAS version ${versionMajor}.${versionMinor}`);
  }
  const headerSize = dataView.getUint16(94, true);
  const globalEncoding = dataView.getUint16(6, true);
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
  if (versionMinor === 5) {
    if (headerSize < 393) {
      throw new Error('LASLoader: LAS 1.5 header must be at least 393 bytes');
    }
    if (pointsFormatId < 6 || pointsFormatId > 10) {
      throw new Error(
        `LASLoader: LAS 1.5 requires point data record formats 6-10; received ${pointsFormatId}`
      );
    }
    if ((globalEncoding & 0x10) === 0) {
      throw new Error('LASLoader: LAS 1.5 requires the WKT global encoding flag');
    }
  }
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

  const header: LASHeader = {
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
    vlrCount,
    userHeaderData:
      versionMinor === 5 && headerSize > 393
        ? new Uint8Array(arrayBuffer, 393, headerSize - 393).slice()
        : undefined
  };
  if (hasCompleteLASMetadata(arrayBuffer, header)) {
    header.metadata = parseLASMetadata(arrayBuffer, header);
  }
  return header;
}

function hasCompleteLASMetadata(arrayBuffer: ArrayBufferLike, header: LASHeader): boolean {
  const vlrEnd = header.headerSize! + header.vlrCount! * 54;
  return arrayBuffer.byteLength >= Math.max(vlrEnd, header.pointsOffset);
}

function parseLASMetadata(arrayBuffer: ArrayBufferLike, header: LASHeader): LASMetadata {
  const dataView = new DataView(arrayBuffer);
  const version = header.versionAsString || '1.0';
  const versionParts = version.split('.').map(Number);
  const isAtLeast14 = versionParts[0] > 1 || (versionParts[0] === 1 && versionParts[1] >= 4);
  const vlrs = parseLASVariableLengthRecords(dataView, header);
  const evlrOffset = isAtLeast14 ? readUint64(dataView, 235) : 0;
  const evlrCount = isAtLeast14 ? dataView.getUint32(243, true) : 0;
  const evlrs = parseLASExtendedVariableLengthRecords(dataView, evlrOffset, evlrCount);
  const metadata: LASMetadata = {
    fileSourceId: dataView.getUint16(4, true),
    globalEncoding: dataView.getUint16(6, true),
    waveformDataOffset:
      versionParts[0] > 1 || (versionParts[0] === 1 && versionParts[1] >= 3)
        ? dataView.getBigUint64(227, true)
        : undefined,
    projectId: formatLASProjectId(new Uint8Array(arrayBuffer, 8, 16)),
    systemIdentifier: readLASString(new Uint8Array(arrayBuffer), 26, 32),
    generatingSoftware: readLASString(new Uint8Array(arrayBuffer), 58, 32),
    creationDayOfYear: dataView.getUint16(90, true),
    creationYear: dataView.getUint16(92, true),
    headerSize: header.headerSize!,
    userHeaderData: header.userHeaderData,
    vlrCount: header.vlrCount!,
    evlrOffset: evlrOffset || undefined,
    evlrCount: evlrCount || undefined,
    maxGpsTime: versionParts[1] === 5 ? dataView.getFloat64(375, true) : undefined,
    minGpsTime: versionParts[1] === 5 ? dataView.getFloat64(383, true) : undefined,
    timeOffset: versionParts[1] === 5 ? dataView.getUint16(391, true) : undefined,
    pointsByReturn: parsePointsByReturn(dataView, isAtLeast14),
    vlrs,
    evlrs,
    extraBytes: [],
    waveformPacketDescriptors: []
  };

  for (const record of vlrs.concat(
    evlrs.map(evlr => ({...evlr, data: evlr.data || new Uint8Array()}))
  )) {
    parseTypedLASMetadataRecord(record, metadata);
  }
  resolveLASGeoTIFFKeyDirectory(metadata);
  return metadata;
}

function parseLASVariableLengthRecords(
  dataView: DataView,
  header: LASHeader
): LASVariableLengthRecord[] {
  const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
  const records: LASVariableLengthRecord[] = [];
  let offset = header.headerSize!;
  for (let index = 0; index < header.vlrCount!; index++) {
    if (offset + 54 > bytes.byteLength) {
      break;
    }
    const dataLength = dataView.getUint16(offset + 20, true);
    const dataOffset = offset + 54;
    if (dataOffset + dataLength > bytes.byteLength) {
      break;
    }
    records.push({
      reserved: dataView.getUint16(offset, true),
      userId: readLASString(bytes, offset + 2, 16),
      recordId: dataView.getUint16(offset + 18, true),
      description: readLASString(bytes, offset + 22, 32),
      offset,
      data: bytes.slice(dataOffset, dataOffset + dataLength)
    });
    offset = dataOffset + dataLength;
  }
  return records;
}

function parseLASExtendedVariableLengthRecords(
  dataView: DataView,
  evlrOffset: number,
  evlrCount: number
): LASExtendedVariableLengthRecord[] {
  if (!evlrOffset || !evlrCount || evlrOffset >= dataView.byteLength) {
    return [];
  }
  const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
  const records: LASExtendedVariableLengthRecord[] = [];
  let offset = evlrOffset;
  for (let index = 0; index < evlrCount; index++) {
    if (offset + 60 > bytes.byteLength) {
      break;
    }
    const dataLength = readUint64(dataView, offset + 20);
    const dataOffset = offset + 60;
    if (dataLength > bytes.byteLength - dataOffset) {
      break;
    }
    records.push({
      reserved: dataView.getUint16(offset, true),
      userId: readLASString(bytes, offset + 2, 16),
      recordId: dataView.getUint16(offset + 18, true),
      description: readLASString(bytes, offset + 28, 32),
      offset,
      data: bytes.slice(dataOffset, dataOffset + dataLength),
      dataOffset,
      dataLength
    });
    offset = dataOffset + dataLength;
  }
  return records;
}

function parseTypedLASMetadataRecord(
  record: LASVariableLengthRecord | LASExtendedVariableLengthRecord,
  metadata: LASMetadata
): void {
  const data = record.data;
  if (!data) {
    return;
  }
  if (record.userId === 'LASF_Spec' && record.recordId === 4) {
    metadata.extraBytes.push(...parseLASExtraBytes(data));
  } else if (record.userId === 'LASF_Spec' && record.recordId >= 100 && record.recordId <= 354) {
    metadata.waveformPacketDescriptors.push(parseLASWaveformDescriptor(record.recordId, data));
  } else if (record.userId === 'LASF_Projection' && record.recordId === 2111) {
    metadata.wktMathTransform = decodeLASString(data);
  } else if (record.userId === 'LASF_Projection' && record.recordId === 2112) {
    metadata.wkt = decodeLASString(data);
  } else if (record.userId === 'LASF_Projection' && record.recordId === 34735) {
    metadata.geotiff = {...metadata.geotiff, keys: readUint16Array(data)};
  } else if (record.userId === 'LASF_Projection' && record.recordId === 34736) {
    metadata.geotiff = {...metadata.geotiff, doubles: readFloat64Array(data)};
  } else if (record.userId === 'LASF_Projection' && record.recordId === 34737) {
    metadata.geotiff = {...metadata.geotiff, ascii: decodeLASString(data)};
  }
}

/** Resolve GeoKey directory entries against their companion LAS GeoTIFF records. */
function resolveLASGeoTIFFKeyDirectory(metadata: LASMetadata): void {
  const geotiff = metadata.geotiff;
  const keys = geotiff?.keys;
  if (!geotiff || !keys || keys.length < 4) {
    return;
  }
  const declaredEntryCount = keys[3];
  if (keys.length < 4 + declaredEntryCount * 4) {
    return;
  }
  const entries: LASGeoTIFFKey[] = [];
  for (let entryIndex = 0; entryIndex < declaredEntryCount; entryIndex++) {
    const entryOffset = 4 + entryIndex * 4;
    const entry: LASGeoTIFFKey = {
      keyId: keys[entryOffset],
      tiffTagLocation: keys[entryOffset + 1],
      count: keys[entryOffset + 2],
      valueOffset: keys[entryOffset + 3]
    };
    entry.value = resolveLASGeoTIFFKeyValue(entry, geotiff);
    if (entry.value === undefined) {
      delete entry.value;
    }
    entries.push(entry);
  }
  geotiff.keyDirectory = {
    version: keys[0],
    keyRevision: keys[1],
    minorRevision: keys[2],
    entries
  };
}

/** Resolve one GeoKey value from its TIFF-tag location. */
function resolveLASGeoTIFFKeyValue(
  entry: LASGeoTIFFKey,
  geotiff: NonNullable<LASMetadata['geotiff']>
): number | number[] | string | undefined {
  if (entry.tiffTagLocation === 0) {
    return entry.valueOffset;
  }
  if (entry.tiffTagLocation === 34735 && geotiff.keys) {
    const values = geotiff.keys.slice(entry.valueOffset, entry.valueOffset + entry.count);
    return values.length === entry.count ? Array.from(values) : undefined;
  }
  if (entry.tiffTagLocation === 34736 && geotiff.doubles) {
    const values = geotiff.doubles.slice(entry.valueOffset, entry.valueOffset + entry.count);
    if (values.length !== entry.count) {
      return undefined;
    }
    return entry.count === 1 ? values[0] : Array.from(values);
  }
  if (entry.tiffTagLocation === 34737 && geotiff.ascii !== undefined) {
    const end = entry.valueOffset + entry.count;
    if (end > geotiff.ascii.length) {
      return undefined;
    }
    return geotiff.ascii.slice(entry.valueOffset, end).replace(/\|$/, '');
  }
  return undefined;
}

function parseLASWaveformDescriptor(
  recordId: number,
  data: Uint8Array
): LASWaveformPacketDescriptor {
  if (data.byteLength < 28) {
    throw new Error(`LASLoader: waveform descriptor VLR ${recordId} is truncated`);
  }
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    recordId,
    bitsPerSample: dataView.getUint8(2),
    compressionType: dataView.getUint8(3),
    numberOfSamples: dataView.getUint32(4, true),
    temporalSampleSpacing: dataView.getUint32(8, true),
    digitizerGain: dataView.getFloat64(12, true),
    digitizerOffset: dataView.getFloat64(20, true)
  };
}

function parsePointsByReturn(dataView: DataView, isAtLeast14: boolean): number[] {
  const count = isAtLeast14 ? 15 : 5;
  const offset = isAtLeast14 ? 255 : 111;
  const values: number[] = [];
  for (let index = 0; index < count; index++) {
    values.push(
      isAtLeast14
        ? readUint64(dataView, offset + index * 8)
        : dataView.getUint32(offset + index * 4, true)
    );
  }
  return values;
}

function readLASString(bytes: Uint8Array, offset: number, length: number): string {
  return decodeLASString(bytes.subarray(offset, offset + length));
}

function decodeLASString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes).replace(/\0+$/, '').trim();
}

function formatLASProjectId(bytes: Uint8Array): string {
  const formatLittleEndian = (start: number, length: number): string =>
    Array.from(bytes.subarray(start, start + length), byte => byte.toString(16).padStart(2, '0'))
      .reverse()
      .join('');
  const formatBigEndian = (start: number, length: number): string =>
    Array.from(bytes.subarray(start, start + length), byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');
  return `${formatLittleEndian(0, 4)}-${formatLittleEndian(4, 2)}-${formatLittleEndian(6, 2)}-${formatBigEndian(8, 2)}${formatBigEndian(10, 6)}`;
}

function readUint16Array(bytes: Uint8Array): Uint16Array {
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values = new Uint16Array(Math.floor(bytes.byteLength / 2));
  for (let index = 0; index < values.length; index++) {
    values[index] = dataView.getUint16(index * 2, true);
  }
  return values;
}

function readFloat64Array(bytes: Uint8Array): Float64Array {
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values = new Float64Array(Math.floor(bytes.byteLength / 8));
  for (let index = 0; index < values.length; index++) {
    values[index] = dataView.getFloat64(index * 8, true);
  }
  return values;
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
  const selection = getLASColumnSelection(options);
  const colors = lasHeader.hasColor && selection.color ? new Uint8Array(batchSize * 4) : null;
  const intensities = selection.intensity ? new Uint16Array(batchSize) : null;
  const classifications = selection.classification ? new Uint8Array(batchSize) : null;
  const syntheticFlags = selection.synthetic ? new Uint8Array(batchSize) : null;
  const keyPointFlags = selection.keyPoint ? new Uint8Array(batchSize) : null;
  const withheldFlags = selection.withheld ? new Uint8Array(batchSize) : null;
  const overlapFlags = selection.overlap ? new Uint8Array(batchSize) : null;
  const gpsTimes =
    selection.gpsTime && getGpsTimeOffset(lasHeader.pointsFormatId) >= 0
      ? new Float64Array(batchSize)
      : null;
  const nir =
    selection.nir && getNirOffset(lasHeader.pointsFormatId) >= 0
      ? new Uint16Array(batchSize)
      : null;
  const scanAngles = selection.scanAngle ? new Int16Array(batchSize) : null;
  const userData = selection.userData ? new Uint8Array(batchSize) : null;
  const pointSourceIds = selection.pointSourceId ? new Uint16Array(batchSize) : null;
  const returnNumbers = selection.returnNumber ? new Uint8Array(batchSize) : null;
  const numberOfReturns = selection.numberOfReturns ? new Uint8Array(batchSize) : null;
  const scannerChannels = selection.scannerChannel ? new Uint8Array(batchSize) : null;
  const scanDirectionFlags = selection.scanDirectionFlag ? new Uint8Array(batchSize) : null;
  const edgeOfFlightLines = selection.edgeOfFlightLine ? new Uint8Array(batchSize) : null;
  const waveforms =
    selection.waveform && getWaveformOffset(lasHeader.pointsFormatId) >= 0
      ? new Uint8Array(batchSize * 29)
      : null;
  const extraByteCount = Math.max(
    0,
    lasHeader.pointsStructSize - getLAZPointDataRecordBaseLength(lasHeader.pointsFormatId)
  );
  const extraBytes =
    selection.extraBytes && options.las?.extraBytes !== 'typed' && extraByteCount
      ? new Uint8Array(batchSize * extraByteCount)
      : null;
  const typedExtraBytes =
    selection.extraBytes && options.las?.extraBytes === 'typed'
      ? createTypedExtraBytesAttributes(batchSize, lasHeader)
      : null;

  populateLASAttributesFromDataView(makeDataView(arrayBuffer), lasHeader, options, {
    positions,
    colors,
    intensities,
    classifications,
    syntheticFlags,
    keyPointFlags,
    withheldFlags,
    overlapFlags,
    gpsTimes,
    nir,
    scanAngles,
    userData,
    pointSourceIds,
    returnNumbers,
    numberOfReturns,
    scannerChannels,
    scanDirectionFlags,
    edgeOfFlightLines,
    waveforms,
    extraBytes,
    typedExtraBytes,
    pointOffset: 0,
    sourcePointIndex: 0,
    pointCount: batchSize
  });

  return makeLASArrowTableFromAttributes(
    lasHeader,
    positions,
    colors,
    intensities,
    classifications,
    syntheticFlags,
    keyPointFlags,
    withheldFlags,
    overlapFlags,
    gpsTimes,
    nir,
    scanAngles,
    userData,
    pointSourceIds,
    returnNumbers,
    numberOfReturns,
    scannerChannels,
    scanDirectionFlags,
    edgeOfFlightLines,
    waveforms,
    extraBytes,
    typedExtraBytes
  );
}

function makeLASArrowTableFromAttributes(
  lasHeader: LASHeader,
  positions: Float32Array | Float64Array,
  colors: Uint8Array | Uint16Array | null,
  intensities: Uint16Array | null,
  classifications: Uint8Array | null,
  syntheticFlags: Uint8Array | null,
  keyPointFlags: Uint8Array | null,
  withheldFlags: Uint8Array | null,
  overlapFlags: Uint8Array | null,
  gpsTimes: Float64Array | null,
  nir: Uint16Array | null,
  scanAngles: Int16Array | null,
  userData: Uint8Array | null,
  pointSourceIds: Uint16Array | null,
  returnNumbers: Uint8Array | null,
  numberOfReturns: Uint8Array | null,
  scannerChannels: Uint8Array | null,
  scanDirectionFlags: Uint8Array | null,
  edgeOfFlightLines: Uint8Array | null,
  waveforms: Uint8Array | null,
  extraBytes: Uint8Array | null,
  typedExtraBytes: LASTypedExtraBytesAttribute[] | null
): LASArrowTable {
  const attributes: MeshAttributes = {
    POSITION: {value: positions, size: 3}
  };
  if (intensities) {
    attributes.intensity = {value: intensities, size: 1};
  }
  if (classifications) {
    attributes.classification = {value: classifications, size: 1};
  }
  if (syntheticFlags) {
    attributes.synthetic = {value: syntheticFlags, size: 1};
  }
  if (keyPointFlags) {
    attributes.keyPoint = {value: keyPointFlags, size: 1};
  }
  if (withheldFlags) {
    attributes.withheld = {value: withheldFlags, size: 1};
  }
  if (overlapFlags) {
    attributes.overlap = {value: overlapFlags, size: 1};
  }
  if (colors) {
    attributes.COLOR_0 = {value: colors, size: colors instanceof Uint16Array ? 3 : 4};
  }
  if (gpsTimes) {
    attributes.GPS_TIME = {value: gpsTimes, size: 1};
  }
  if (nir) {
    attributes.NIR = {value: nir, size: 1};
  }
  if (scanAngles) {
    attributes.scanAngle = {value: scanAngles, size: 1};
  }
  if (userData) {
    attributes.userData = {value: userData, size: 1};
  }
  if (pointSourceIds) {
    attributes.pointSourceId = {value: pointSourceIds, size: 1};
  }
  if (returnNumbers) {
    attributes.returnNumber = {value: returnNumbers, size: 1};
  }
  if (numberOfReturns) {
    attributes.numberOfReturns = {value: numberOfReturns, size: 1};
  }
  if (scannerChannels) {
    attributes.scannerChannel = {value: scannerChannels, size: 1};
  }
  if (scanDirectionFlags) {
    attributes.scanDirectionFlag = {value: scanDirectionFlags, size: 1};
  }
  if (edgeOfFlightLines) {
    attributes.edgeOfFlightLine = {value: edgeOfFlightLines, size: 1};
  }
  if (waveforms) {
    attributes.WAVEFORM = {value: waveforms, size: 29};
  }
  if (extraBytes) {
    attributes.EXTRA_BYTES = {
      value: extraBytes,
      size: extraBytes.length / Math.max(lasHeader.pointsCount, 1)
    };
  }
  if (typedExtraBytes) {
    for (const attribute of typedExtraBytes) {
      attributes[attribute.name] = {value: attribute.value, size: attribute.size};
    }
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
    intensities: Uint16Array | null;
    classifications: Uint8Array | null;
    syntheticFlags: Uint8Array | null;
    keyPointFlags: Uint8Array | null;
    withheldFlags: Uint8Array | null;
    overlapFlags: Uint8Array | null;
    gpsTimes: Float64Array | null;
    nir: Uint16Array | null;
    scanAngles: Int16Array | null;
    userData: Uint8Array | null;
    pointSourceIds: Uint16Array | null;
    returnNumbers: Uint8Array | null;
    numberOfReturns: Uint8Array | null;
    scannerChannels: Uint8Array | null;
    scanDirectionFlags: Uint8Array | null;
    edgeOfFlightLines: Uint8Array | null;
    waveforms: Uint8Array | null;
    extraBytes: Uint8Array | null;
    typedExtraBytes: LASTypedExtraBytesAttribute[] | null;
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
  const colorOffset = target.colors ? getColorOffset(pointsFormatId) : -1;
  const twoByteColor =
    colorOffset >= 0
      ? detectTwoByteColors(
          dataView,
          lasHeader,
          target.sourcePointIndex,
          target.pointCount,
          options.las?.colorDepth
        )
      : false;
  const intensities = target.intensities;
  const classifications = target.classifications;
  const syntheticFlags = target.syntheticFlags;
  const keyPointFlags = target.keyPointFlags;
  const withheldFlags = target.withheldFlags;
  const overlapFlags = target.overlapFlags;
  const gpsTimes = target.gpsTimes;
  const nir = target.nir;
  const scanAngles = target.scanAngles;
  const userData = target.userData;
  const pointSourceIds = target.pointSourceIds;
  const returnNumbers = target.returnNumbers;
  const numberOfReturns = target.numberOfReturns;
  const scannerChannels = target.scannerChannels;
  const scanDirectionFlags = target.scanDirectionFlags;
  const edgeOfFlightLines = target.edgeOfFlightLines;
  const waveforms = target.waveforms;
  const extraBytes = target.extraBytes;
  const typedExtraBytes = target.typedExtraBytes;
  const gpsTimeOffset = gpsTimes ? getGpsTimeOffset(pointsFormatId) : -1;
  const nirOffset = nir ? getNirOffset(pointsFormatId) : -1;

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
    if (intensities) {
      intensities[targetPointIndex] = dataView.getUint16(pointOffset + 12, true);
    }
    if (classifications) {
      classifications[targetPointIndex] = readClassification(dataView, pointOffset, pointsFormatId);
    }
    if (gpsTimes && gpsTimeOffset >= 0) {
      gpsTimes[targetPointIndex] = dataView.getFloat64(pointOffset + gpsTimeOffset, true);
    }
    if (nir && nirOffset >= 0) {
      nir[targetPointIndex] = dataView.getUint16(pointOffset + nirOffset, true);
    }
    if (scanAngles) {
      scanAngles[targetPointIndex] =
        pointsFormatId <= 5
          ? dataView.getInt8(pointOffset + 16)
          : dataView.getInt16(pointOffset + 18, true);
    }
    if (userData) {
      userData[targetPointIndex] = dataView.getUint8(pointOffset + 17);
    }
    if (pointSourceIds) {
      pointSourceIds[targetPointIndex] = dataView.getUint16(
        pointOffset + (pointsFormatId <= 5 ? 18 : 20),
        true
      );
    }
    const returnFlags = dataView.getUint8(pointOffset + 14);
    const scanFlags = dataView.getUint8(pointOffset + 15);
    const classificationFlags = pointsFormatId <= 5 ? scanFlags >> 5 : scanFlags;
    if (syntheticFlags) {
      syntheticFlags[targetPointIndex] = classificationFlags & 1;
    }
    if (keyPointFlags) {
      keyPointFlags[targetPointIndex] = (classificationFlags >> 1) & 1;
    }
    if (withheldFlags) {
      withheldFlags[targetPointIndex] = (classificationFlags >> 2) & 1;
    }
    if (overlapFlags) {
      overlapFlags[targetPointIndex] = pointsFormatId <= 5 ? 0 : (classificationFlags >> 3) & 1;
    }
    if (returnNumbers) {
      returnNumbers[targetPointIndex] =
        pointsFormatId <= 5 ? returnFlags & 0x07 : returnFlags & 0x0f;
    }
    if (numberOfReturns) {
      numberOfReturns[targetPointIndex] =
        pointsFormatId <= 5 ? (returnFlags >> 3) & 0x07 : returnFlags >> 4;
    }
    if (scannerChannels) {
      scannerChannels[targetPointIndex] = pointsFormatId <= 5 ? 0 : (scanFlags >> 4) & 0x03;
    }
    if (scanDirectionFlags) {
      scanDirectionFlags[targetPointIndex] =
        pointsFormatId <= 5 ? (returnFlags >> 6) & 1 : (scanFlags >> 6) & 1;
    }
    if (edgeOfFlightLines) {
      edgeOfFlightLines[targetPointIndex] =
        pointsFormatId <= 5 ? (returnFlags >> 7) & 1 : (scanFlags >> 7) & 1;
    }
    if (waveforms) {
      const waveformOffset = getWaveformOffset(pointsFormatId);
      if (waveformOffset >= 0) {
        const waveformBytes = new Uint8Array(
          dataView.buffer,
          dataView.byteOffset + pointOffset + waveformOffset,
          29
        );
        waveforms.set(waveformBytes, targetPointIndex * 29);
      }
    }
    if (extraBytes) {
      const extraByteOffset = getLAZPointDataRecordBaseLength(pointsFormatId);
      const extraByteCount = lasHeader.pointsStructSize - extraByteOffset;
      if (extraByteCount > 0) {
        extraBytes.set(
          new Uint8Array(
            dataView.buffer,
            dataView.byteOffset + pointOffset + extraByteOffset,
            extraByteCount
          ),
          targetPointIndex * extraByteCount
        );
      }
    }
    if (typedExtraBytes) {
      populateTypedExtraBytesFromDataView(
        dataView,
        pointOffset,
        pointsFormatId,
        targetPointIndex,
        typedExtraBytes
      );
    }

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

/** Return the fixed LAS waveform packet reference offset for a point format. */
function getWaveformOffset(pointsFormatId: number): number {
  switch (pointsFormatId) {
    case 4:
      return 28;
    case 5:
      return 34;
    case 9:
      return 30;
    case 10:
      return 38;
    default:
      return -1;
  }
}

function getGpsTimeOffset(pointsFormatId: number): number {
  return pointsFormatId === 1 ||
    pointsFormatId === 3 ||
    pointsFormatId === 4 ||
    pointsFormatId === 5
    ? 20
    : pointsFormatId >= 6 && pointsFormatId <= 10
      ? 22
      : -1;
}

function getNirOffset(pointsFormatId: number): number {
  return pointsFormatId === 8 || pointsFormatId === 10 ? 36 : -1;
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
      const items: LASZipItem[] = [];
      for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
        const itemOffset = dataOffset + 34 + itemIndex * 6;
        const itemType = dataView.getUint16(itemOffset, true);
        const itemSize = dataView.getUint16(itemOffset + 2, true);
        const itemVersion = dataView.getUint16(itemOffset + 4, true);
        items.push({type: itemType, size: itemSize, version: itemVersion});
        if ([0, 6, 7, 8].includes(itemType)) {
          if (itemVersion !== 2) {
            throw new Error(
              `LASLoader: unsupported legacy LASzip item type ${itemType} version ${itemVersion}`
            );
          }
        } else if (itemType === 9) {
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
        coder: dataView.getUint16(dataOffset + 2, true),
        chunkSize,
        variableChunks: chunkSize === 0 || chunkSize === VARIABLE_CHUNK_SIZE,
        items,
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
  if (laszip.coder !== 0) {
    throw new Error(
      `LASLoader: TypeScript LAZ decoding requires LASzip arithmetic coder 0; received ${laszip.coder}`
    );
  }
  validateLASZipItemLayout(header, laszip.items);
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

/** Validate the LASzip item sequence assumed by the point-format decoder. */
function validateLASZipItemLayout(header: LASHeader, actualItems: LASZipItem[]): void {
  const pointDataRecordFormat = header.pointsFormatId;
  const baseLength = getLAZPointDataRecordBaseLength(pointDataRecordFormat);
  const extraByteCount = header.pointsStructSize - baseLength;
  if (extraByteCount < 0) {
    throw new Error(
      `LASLoader: point format ${pointDataRecordFormat} record length ${header.pointsStructSize} is smaller than ${baseLength}`
    );
  }

  const expectedItems: Array<{type: number; size: number}> = [];
  switch (pointDataRecordFormat) {
    case 0:
      expectedItems.push({type: 6, size: 20});
      break;
    case 1:
      expectedItems.push({type: 6, size: 20}, {type: 7, size: 8});
      break;
    case 2:
      expectedItems.push({type: 6, size: 20}, {type: 8, size: 6});
      break;
    case 3:
      expectedItems.push({type: 6, size: 20}, {type: 7, size: 8}, {type: 8, size: 6});
      break;
    case 4:
      expectedItems.push({type: 6, size: 20}, {type: 7, size: 8}, {type: 9, size: 29});
      break;
    case 5:
      expectedItems.push(
        {type: 6, size: 20},
        {type: 7, size: 8},
        {type: 8, size: 6},
        {type: 9, size: 29}
      );
      break;
    case 6:
      expectedItems.push({type: 10, size: 30});
      break;
    case 7:
      expectedItems.push({type: 10, size: 30}, {type: 11, size: 6});
      break;
    case 8:
      expectedItems.push({type: 10, size: 30}, {type: 12, size: 8});
      break;
    case 9:
      expectedItems.push({type: 10, size: 30}, {type: 13, size: 29});
      break;
    case 10:
      expectedItems.push({type: 10, size: 30}, {type: 12, size: 8}, {type: 13, size: 29});
      break;
    default:
      return;
  }
  if (extraByteCount > 0) {
    expectedItems.push({type: pointDataRecordFormat <= 5 ? 0 : 14, size: extraByteCount});
  }

  if (actualItems.length !== expectedItems.length) {
    throw new Error(
      `LASLoader: point format ${pointDataRecordFormat} has ${actualItems.length} LASzip items; expected ${expectedItems.length}`
    );
  }
  for (let itemIndex = 0; itemIndex < expectedItems.length; itemIndex++) {
    const actualItem = actualItems[itemIndex];
    const expectedItem = expectedItems[itemIndex];
    if (actualItem.type !== expectedItem.type) {
      throw new Error(
        `LASLoader: LASzip item ${itemIndex} has type ${actualItem.type}; expected ${expectedItem.type} for point format ${pointDataRecordFormat}`
      );
    }
    if (actualItem.size !== expectedItem.size) {
      throw new Error(
        `LASLoader: LASzip item ${itemIndex} has size ${actualItem.size}; expected ${expectedItem.size} for point format ${pointDataRecordFormat}`
      );
    }
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

/** Validate the trailing chunk table after progressively decoding a fixed-chunk LAZ file. */
async function validateStreamedFixedLAZChunkTable(
  reader: BinaryChunkReader,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader,
  laszip: LASZipVLR,
  chunkTableOffset: number,
  decodedChunkByteLengths: readonly number[]
): Promise<void> {
  const decodedPointDataByteLength = decodedChunkByteLengths.reduce(
    (total, byteLength) => total + byteLength,
    0
  );
  const decodedPointDataEnd =
    header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH + decodedPointDataByteLength;
  const effectiveChunkTableOffset =
    chunkTableOffset === -1 ? decodedPointDataEnd : chunkTableOffset;
  if (
    !Number.isSafeInteger(effectiveChunkTableOffset) ||
    effectiveChunkTableOffset < decodedPointDataEnd
  ) {
    throw new Error('LASLoader: LAZ chunk table byte lengths overlap the chunk table');
  }

  const gapByteLength = effectiveChunkTableOffset - decodedPointDataEnd;
  await readUntilAvailable(
    reader,
    inputIterator,
    gapByteLength,
    'LASLoader: incomplete LAZ chunk table'
  );
  reader.skip(gapByteLength);
  const chunks = await readStreamedLAZChunkTable(reader, inputIterator, header, laszip);

  if (chunks.length !== decodedChunkByteLengths.length) {
    throw new Error(
      `LASLoader: LAZ chunk table contains ${chunks.length} chunks; decoded ${decodedChunkByteLengths.length}`
    );
  }
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    if (chunks[chunkIndex].byteLength !== decodedChunkByteLengths[chunkIndex]) {
      throw new Error(
        `LASLoader: LAZ chunk ${chunkIndex} has ${chunks[chunkIndex].byteLength} table bytes; decoded ${decodedChunkByteLengths[chunkIndex]}`
      );
    }
  }
  if (chunkTableOffset === -1) {
    await validateStreamedLAZChunkTableFooter(reader, inputIterator, effectiveChunkTableOffset);
  }
}

/** Validate the trailing table pointer emitted by non-seekable LASzip writers. */
async function validateStreamedLAZChunkTableFooter(
  reader: BinaryChunkReader,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  expectedChunkTableOffset: number
): Promise<void> {
  const footer = new Uint8Array(LAZ_CHUNK_TABLE_POINTER_LENGTH);
  let byteLength = 0;
  while (true) {
    const availableByteLength = reader.getAvailableByteLength();
    if (availableByteLength > 0) {
      const bytes = reader.readBytes(Math.min(availableByteLength, 64 * 1024));
      appendTrailingBytes(footer, bytes);
      byteLength += bytes.byteLength;
      continue;
    }
    const next = await inputIterator.next();
    if (next.done) {
      break;
    }
    reader.write(next.value);
  }
  if (byteLength < LAZ_CHUNK_TABLE_POINTER_LENGTH) {
    throw new NeedsMoreData('LASLoader: incomplete non-seekable LAZ chunk-table footer');
  }
  const footerOffset = readUint64(new DataView(footer.buffer), 0);
  if (!Number.isSafeInteger(footerOffset) || footerOffset !== expectedChunkTableOffset) {
    throw new Error(
      `LASLoader: non-seekable LAZ footer points to ${footerOffset}; expected ${expectedChunkTableOffset}`
    );
  }
}

/** Retain only the final bytes from a forward-only input stream. */
function appendTrailingBytes(target: Uint8Array, bytes: Uint8Array): void {
  if (bytes.byteLength >= target.byteLength) {
    target.set(bytes.subarray(bytes.byteLength - target.byteLength));
    return;
  }
  target.copyWithin(0, bytes.byteLength);
  target.set(bytes, target.byteLength - bytes.byteLength);
}

/** Read only as much trailing input as the compressed chunk table requires. */
async function readStreamedLAZChunkTable(
  reader: BinaryChunkReader,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader,
  laszip: LASZipVLR
): Promise<LAZChunkTableEntry[]> {
  let candidateByteLength = 64;
  while (true) {
    const availableByteLength = reader.getAvailableByteLength();
    if (availableByteLength >= 8) {
      const checkpoint = reader.checkpoint();
      try {
        const bytes = reader.readBytes(Math.min(availableByteLength, candidateByteLength));
        const chunks = decodeAndValidateLAZChunkTable(bytes, header, laszip);
        reader.restore(checkpoint);
        return chunks;
      } catch (error) {
        reader.restore(checkpoint);
        if (!(error instanceof NeedsMoreData)) {
          throw error;
        }
        candidateByteLength *= 2;
        if (candidateByteLength <= availableByteLength) {
          continue;
        }
      }
    }

    const next = await inputIterator.next();
    if (next.done) {
      throw new NeedsMoreData('LASLoader: incomplete LAZ chunk table');
    }
    reader.write(next.value);
  }
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
    case 0:
      return 20;
    case 1:
      return 28;
    case 2:
      return 26;
    case 3:
      return 34;
    case 4:
      return 57;
    case 5:
      return 63;
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
      throw new Error(`Unsupported LAS point format ${pointDataRecordFormat}`);
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
): LAZChunkTableEntry[] {
  if (
    !Number.isSafeInteger(chunkTableOffset) ||
    chunkTableOffset < 0 ||
    chunkTableOffset + 8 > bytes.byteLength
  ) {
    throw new NeedsMoreData('LASLoader: incomplete LAZ chunk table');
  }
  const chunks = decodeAndValidateLAZChunkTable(bytes.subarray(chunkTableOffset), header, laszip);
  const decodedByteLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  if (header.pointsOffset + LAZ_CHUNK_TABLE_POINTER_LENGTH + decodedByteLength > chunkTableOffset) {
    throw new Error('LASLoader: LAZ chunk table byte lengths overlap the chunk table');
  }
  return chunks;
}

/** Decode and validate a LAZ chunk table whose first byte is the table version. */
function decodeAndValidateLAZChunkTable(
  chunkTableBytes: Uint8Array,
  header: LASHeader,
  laszip: LASZipVLR
): LAZChunkTableEntry[] {
  if (chunkTableBytes.byteLength < 8) {
    throw new NeedsMoreData('LASLoader: incomplete LAZ chunk table');
  }
  const dataView = new DataView(
    chunkTableBytes.buffer,
    chunkTableBytes.byteOffset,
    chunkTableBytes.byteLength
  );
  const version = dataView.getUint32(0, true);
  const chunkCount = dataView.getUint32(4, true);
  if (version !== 0) {
    throw new Error(`LASLoader: unsupported LAZ chunk table version ${version}`);
  }
  if (chunkCount === 0) {
    if (header.pointsCount !== 0) {
      throw new Error('LASLoader: missing LAZ chunk table');
    }
    return [];
  }
  const chunks = decodeLAZChunkTable(chunkTableBytes.subarray(8), {
    chunkCount,
    pointCount: header.pointsCount,
    chunkSize: laszip.chunkSize,
    variable: laszip.variableChunks
  });
  let decodedPointCount = 0;
  for (const chunk of chunks) {
    if (chunk.pointCount === 0 || chunk.byteLength === 0) {
      throw new Error('LASLoader: invalid empty LAZ chunk-table entry');
    }
    decodedPointCount += chunk.pointCount;
  }
  if (decodedPointCount !== header.pointsCount) {
    throw new Error(
      `LASLoader: LAZ chunk table contains ${decodedPointCount} points; expected ${header.pointsCount}`
    );
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
  const selection = getLASColumnSelection(options);
  const useRawColors =
    header.hasColor &&
    selection.color &&
    (options.las?.colorDepth === 16 || options.las?.colorDepth === 'auto');
  const colors =
    header.hasColor && selection.color && !useRawColors ? new Uint8Array(batchSize * 4) : null;
  const rawColors = useRawColors ? new Uint16Array(batchSize * 3) : null;
  const intensities = selection.intensity ? new Uint16Array(batchSize) : null;
  const classifications = selection.classification ? new Uint8Array(batchSize) : null;
  const syntheticFlags = selection.synthetic ? new Uint8Array(batchSize) : null;
  const keyPointFlags = selection.keyPoint ? new Uint8Array(batchSize) : null;
  const withheldFlags = selection.withheld ? new Uint8Array(batchSize) : null;
  const overlapFlags = selection.overlap ? new Uint8Array(batchSize) : null;
  const gpsTimes =
    selection.gpsTime && getGpsTimeOffset(header.pointsFormatId) >= 0
      ? new Float64Array(batchSize)
      : null;
  const nir =
    selection.nir && getNirOffset(header.pointsFormatId) >= 0 ? new Uint16Array(batchSize) : null;
  const scanAngles = selection.scanAngle ? new Int16Array(batchSize) : null;
  const userData = selection.userData ? new Uint8Array(batchSize) : null;
  const pointSourceIds = selection.pointSourceId ? new Uint16Array(batchSize) : null;
  const returnNumbers = selection.returnNumber ? new Uint8Array(batchSize) : null;
  const numberOfReturns = selection.numberOfReturns ? new Uint8Array(batchSize) : null;
  const scannerChannels = selection.scannerChannel ? new Uint8Array(batchSize) : null;
  const scanDirectionFlags = selection.scanDirectionFlag ? new Uint8Array(batchSize) : null;
  const edgeOfFlightLines = selection.edgeOfFlightLine ? new Uint8Array(batchSize) : null;
  const waveforms =
    selection.waveform && getWaveformOffset(header.pointsFormatId) >= 0
      ? new Uint8Array(batchSize * 29)
      : null;
  const extraByteCount = Math.max(
    0,
    header.pointsStructSize - getLAZPointDataRecordBaseLength(header.pointsFormatId)
  );
  const extraBytes =
    selection.extraBytes && options.las?.extraBytes !== 'typed' && extraByteCount
      ? new Uint8Array(batchSize * extraByteCount)
      : null;
  const typedExtraBytes =
    selection.extraBytes && options.las?.extraBytes === 'typed'
      ? createTypedExtraBytesAttributes(batchSize, header)
      : null;
  const typedExtraBytesSource =
    typedExtraBytes?.length && extraByteCount ? new Uint8Array(batchSize * extraByteCount) : null;
  return {
    batchCapacity: batchSize,
    positions,
    colors,
    rawColors,
    intensities,
    classifications,
    syntheticFlags,
    keyPointFlags,
    withheldFlags,
    overlapFlags,
    gpsTimes,
    nir,
    scanAngles,
    userData,
    pointSourceIds,
    returnNumbers,
    numberOfReturns,
    scannerChannels,
    scanDirectionFlags,
    edgeOfFlightLines,
    waveforms,
    extraBytes,
    typedExtraBytes,
    typedExtraBytesSource,
    target: {
      positions,
      intensities,
      classifications,
      syntheticFlags,
      keyPointFlags,
      withheldFlags,
      overlapFlags,
      gpsTimes,
      nir,
      scanAngles,
      userData,
      pointSourceIds,
      returnNumbers,
      numberOfReturns,
      scannerChannels,
      scanDirectionFlags,
      edgeOfFlightLines,
      waveforms,
      extraBytes: extraBytes || typedExtraBytesSource,
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

/** Create typed Extra Bytes output buffers from the descriptors in a LAS header. */
function createTypedExtraBytesAttributes(
  batchSize: number,
  header: LASHeader
): LASTypedExtraBytesAttribute[] {
  const extraByteCount =
    header.pointsStructSize - getLAZPointDataRecordBaseLength(header.pointsFormatId);
  return createLASTypedExtraBytesAttributes(
    batchSize,
    header.metadata?.extraBytes || [],
    extraByteCount
  );
}

/** Return the byte width of one scalar Extra Bytes value. */
function getExtraBytesScalarByteLength(dataType: number): number {
  if (dataType <= 2) return 1;
  if (dataType <= 4) return 2;
  if (dataType <= 6 || dataType === 9) return 4;
  if (dataType === 7 || dataType === 8 || dataType === 10) return 8;
  return 0;
}

/** Decode typed Extra Bytes directly from uncompressed LAS point records. */
function populateTypedExtraBytesFromDataView(
  dataView: DataView,
  pointOffset: number,
  pointDataRecordFormat: number,
  targetPointIndex: number,
  attributes: LASTypedExtraBytesAttribute[]
): void {
  const extraByteBaseOffset = pointOffset + getLAZPointDataRecordBaseLength(pointDataRecordFormat);
  for (const attribute of attributes) {
    const targetOffset = targetPointIndex * attribute.size;
    const sourceOffset = extraByteBaseOffset + attribute.byteOffset;
    for (let componentIndex = 0; componentIndex < attribute.size; componentIndex++) {
      attribute.value[targetOffset + componentIndex] =
        readExtraBytesValue(
          dataView,
          sourceOffset + componentIndex * getExtraBytesScalarByteLength(attribute.scalarDataType),
          attribute.scalarDataType
        ) *
          attribute.scales[componentIndex] +
        attribute.offsets[componentIndex];
    }
  }
}

/** Project packed direct-decoder Extra Bytes into descriptor-defined typed columns. */
function populateTypedExtraBytesFromPacked(
  packedExtraBytes: Uint8Array,
  extraByteCount: number,
  pointOffset: number,
  pointCount: number,
  attributes: LASTypedExtraBytesAttribute[]
): void {
  const dataView = new DataView(
    packedExtraBytes.buffer,
    packedExtraBytes.byteOffset,
    packedExtraBytes.byteLength
  );
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const targetPointIndex = pointOffset + pointIndex;
    const sourceOffset = targetPointIndex * extraByteCount;
    for (const attribute of attributes) {
      const targetOffset = targetPointIndex * attribute.size;
      const scalarByteLength = getExtraBytesScalarByteLength(attribute.scalarDataType);
      for (let componentIndex = 0; componentIndex < attribute.size; componentIndex++) {
        attribute.value[targetOffset + componentIndex] =
          readExtraBytesValue(
            dataView,
            sourceOffset + attribute.byteOffset + componentIndex * scalarByteLength,
            attribute.scalarDataType
          ) *
            attribute.scales[componentIndex] +
          attribute.offsets[componentIndex];
      }
    }
  }
}

/** Populate typed Extra Bytes produced by the direct LAZ target for newly decoded points. */
function populateDecodedTypedExtraBytes(
  state: PointDataBatchState,
  pointOffset: number,
  pointCount: number
): void {
  if (!state.typedExtraBytesSource || !state.typedExtraBytes?.length || pointCount === 0) {
    return;
  }
  populateTypedExtraBytesFromPacked(
    state.typedExtraBytesSource,
    state.typedExtraBytesSource.length / state.batchCapacity,
    pointOffset,
    pointCount,
    state.typedExtraBytes
  );
}

/** Read one little-endian scalar Extra Bytes value without assuming alignment. */
function readExtraBytesValue(dataView: DataView, offset: number, scalarDataType: number): number {
  switch (scalarDataType) {
    case 1:
      return dataView.getUint8(offset);
    case 2:
      return dataView.getInt8(offset);
    case 3:
      return dataView.getUint16(offset, true);
    case 4:
      return dataView.getInt16(offset, true);
    case 5:
      return dataView.getUint32(offset, true);
    case 6:
      return dataView.getInt32(offset, true);
    case 9:
      return dataView.getFloat32(offset, true);
    case 10:
      return dataView.getFloat64(offset, true);
    default:
      throw new Error(
        `LASLoader: unsupported typed Extra Bytes scalar data type ${scalarDataType}`
      );
  }
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
  const fullBatch = batchPointCount === state.batchCapacity;
  const positions = fullBatch ? state.positions : state.positions.subarray(0, batchPointCount * 3);
  const intensities = state.intensities
    ? fullBatch
      ? state.intensities
      : state.intensities.subarray(0, batchPointCount)
    : null;
  const classifications = state.classifications
    ? fullBatch
      ? state.classifications
      : state.classifications.subarray(0, batchPointCount)
    : null;
  const syntheticFlags = state.syntheticFlags
    ? fullBatch
      ? state.syntheticFlags
      : state.syntheticFlags.subarray(0, batchPointCount)
    : null;
  const keyPointFlags = state.keyPointFlags
    ? fullBatch
      ? state.keyPointFlags
      : state.keyPointFlags.subarray(0, batchPointCount)
    : null;
  const withheldFlags = state.withheldFlags
    ? fullBatch
      ? state.withheldFlags
      : state.withheldFlags.subarray(0, batchPointCount)
    : null;
  const overlapFlags = state.overlapFlags
    ? fullBatch
      ? state.overlapFlags
      : state.overlapFlags.subarray(0, batchPointCount)
    : null;
  const colors = state.colors
    ? fullBatch
      ? state.colors
      : state.colors.subarray(0, batchPointCount * 4)
    : state.rawColors
      ? convertRawColorsToUint8(state.rawColors, batchPointCount, options)
      : null;
  const gpsTimes = state.gpsTimes
    ? fullBatch
      ? state.gpsTimes
      : state.gpsTimes.subarray(0, batchPointCount)
    : null;
  const nir = state.nir ? (fullBatch ? state.nir : state.nir.subarray(0, batchPointCount)) : null;
  const scanAngles = state.scanAngles
    ? fullBatch
      ? state.scanAngles
      : state.scanAngles.subarray(0, batchPointCount)
    : null;
  const userData = state.userData
    ? fullBatch
      ? state.userData
      : state.userData.subarray(0, batchPointCount)
    : null;
  const pointSourceIds = state.pointSourceIds
    ? fullBatch
      ? state.pointSourceIds
      : state.pointSourceIds.subarray(0, batchPointCount)
    : null;
  const returnNumbers = state.returnNumbers
    ? fullBatch
      ? state.returnNumbers
      : state.returnNumbers.subarray(0, batchPointCount)
    : null;
  const numberOfReturns = state.numberOfReturns
    ? fullBatch
      ? state.numberOfReturns
      : state.numberOfReturns.subarray(0, batchPointCount)
    : null;
  const scannerChannels = state.scannerChannels
    ? fullBatch
      ? state.scannerChannels
      : state.scannerChannels.subarray(0, batchPointCount)
    : null;
  const scanDirectionFlags = state.scanDirectionFlags
    ? fullBatch
      ? state.scanDirectionFlags
      : state.scanDirectionFlags.subarray(0, batchPointCount)
    : null;
  const edgeOfFlightLines = state.edgeOfFlightLines
    ? fullBatch
      ? state.edgeOfFlightLines
      : state.edgeOfFlightLines.subarray(0, batchPointCount)
    : null;
  const waveforms = state.waveforms
    ? fullBatch
      ? state.waveforms
      : state.waveforms.subarray(0, batchPointCount * 29)
    : null;
  const extraByteCount = state.extraBytes ? state.extraBytes.length / state.batchCapacity : 0;
  const extraBytes = state.extraBytes
    ? fullBatch
      ? state.extraBytes
      : state.extraBytes.subarray(0, batchPointCount * extraByteCount)
    : null;
  const typedExtraBytes = state.typedExtraBytes
    ? state.typedExtraBytes.map(attribute => ({
        ...attribute,
        value: fullBatch
          ? attribute.value
          : attribute.value.subarray(0, batchPointCount * attribute.size)
      }))
    : null;
  const table = makeLASArrowTableFromAttributes(
    batchHeader,
    positions,
    colors,
    intensities,
    classifications,
    syntheticFlags,
    keyPointFlags,
    withheldFlags,
    overlapFlags,
    gpsTimes,
    nir,
    scanAngles,
    userData,
    pointSourceIds,
    returnNumbers,
    numberOfReturns,
    scannerChannels,
    scanDirectionFlags,
    edgeOfFlightLines,
    waveforms,
    extraBytes,
    typedExtraBytes
  );

  state.batchPointCount = 0;
  if (fullBatch) {
    const PositionsType = options.las?.fp64 ? Float64Array : Float32Array;
    state.positions = new PositionsType(state.positions.length);
    state.colors = state.colors ? new Uint8Array(state.colors.length) : null;
    state.rawColors = state.rawColors ? new Uint16Array(state.rawColors.length) : null;
    state.intensities = state.intensities ? new Uint16Array(state.intensities.length) : null;
    state.classifications = state.classifications
      ? new Uint8Array(state.classifications.length)
      : null;
    state.syntheticFlags = state.syntheticFlags
      ? new Uint8Array(state.syntheticFlags.length)
      : null;
    state.keyPointFlags = state.keyPointFlags ? new Uint8Array(state.keyPointFlags.length) : null;
    state.withheldFlags = state.withheldFlags ? new Uint8Array(state.withheldFlags.length) : null;
    state.overlapFlags = state.overlapFlags ? new Uint8Array(state.overlapFlags.length) : null;
    state.gpsTimes = state.gpsTimes ? new Float64Array(state.gpsTimes.length) : null;
    state.nir = state.nir ? new Uint16Array(state.nir.length) : null;
    state.scanAngles = state.scanAngles ? new Int16Array(state.scanAngles.length) : null;
    state.userData = state.userData ? new Uint8Array(state.userData.length) : null;
    state.pointSourceIds = state.pointSourceIds
      ? new Uint16Array(state.pointSourceIds.length)
      : null;
    state.returnNumbers = state.returnNumbers ? new Uint8Array(state.returnNumbers.length) : null;
    state.numberOfReturns = state.numberOfReturns
      ? new Uint8Array(state.numberOfReturns.length)
      : null;
    state.scannerChannels = state.scannerChannels
      ? new Uint8Array(state.scannerChannels.length)
      : null;
    state.scanDirectionFlags = state.scanDirectionFlags
      ? new Uint8Array(state.scanDirectionFlags.length)
      : null;
    state.edgeOfFlightLines = state.edgeOfFlightLines
      ? new Uint8Array(state.edgeOfFlightLines.length)
      : null;
    state.waveforms = state.waveforms ? new Uint8Array(state.waveforms.length) : null;
    state.extraBytes = state.extraBytes ? new Uint8Array(state.extraBytes.length) : null;
    state.typedExtraBytes = state.typedExtraBytes
      ? state.typedExtraBytes.map(attribute => ({
          ...attribute,
          value: createLASTypedExtraBytesValue(
            attribute.scalarDataType,
            attribute.value.length,
            attribute.outputFloat64
          )
        }))
      : null;
    state.typedExtraBytesSource = state.typedExtraBytesSource
      ? new Uint8Array(state.typedExtraBytesSource.length)
      : null;
    state.target.positions = state.positions;
    state.target.colors = state.colors;
    state.target.rawColors = state.rawColors;
    state.target.intensities = state.intensities;
    state.target.classifications = state.classifications;
    state.target.syntheticFlags = state.syntheticFlags;
    state.target.keyPointFlags = state.keyPointFlags;
    state.target.withheldFlags = state.withheldFlags;
    state.target.overlapFlags = state.overlapFlags;
    state.target.gpsTimes = state.gpsTimes;
    state.target.nir = state.nir;
    state.target.scanAngles = state.scanAngles;
    state.target.userData = state.userData;
    state.target.pointSourceIds = state.pointSourceIds;
    state.target.returnNumbers = state.returnNumbers;
    state.target.numberOfReturns = state.numberOfReturns;
    state.target.scannerChannels = state.scannerChannels;
    state.target.scanDirectionFlags = state.scanDirectionFlags;
    state.target.edgeOfFlightLines = state.edgeOfFlightLines;
    state.target.waveforms = state.waveforms;
    state.target.extraBytes = state.extraBytes || state.typedExtraBytesSource;
  }
  return table;
}

/** Resolve optional Arrow columns once before allocating or decoding a point batch. */
function getLASColumnSelection(options: LASLoaderOptions): {
  intensity: boolean;
  classification: boolean;
  synthetic: boolean;
  keyPoint: boolean;
  withheld: boolean;
  overlap: boolean;
  color: boolean;
  gpsTime: boolean;
  nir: boolean;
  scanAngle: boolean;
  userData: boolean;
  pointSourceId: boolean;
  returnNumber: boolean;
  numberOfReturns: boolean;
  scannerChannel: boolean;
  scanDirectionFlag: boolean;
  edgeOfFlightLine: boolean;
  waveform: boolean;
  extraBytes: boolean;
} {
  const columns = options.las?.columns;
  if (!columns) {
    return {
      intensity: true,
      classification: true,
      synthetic: true,
      keyPoint: true,
      withheld: true,
      overlap: true,
      color: true,
      gpsTime: true,
      nir: true,
      scanAngle: true,
      userData: true,
      pointSourceId: true,
      returnNumber: true,
      numberOfReturns: true,
      scannerChannel: true,
      scanDirectionFlag: true,
      edgeOfFlightLine: true,
      waveform: true,
      extraBytes: options.las?.extraBytes === 'typed'
    };
  }

  let intensity = false;
  let classification = false;
  let synthetic = false;
  let keyPoint = false;
  let withheld = false;
  let overlap = false;
  let color = false;
  let gpsTime = false;
  let nir = false;
  let scanAngle = false;
  let userData = false;
  let pointSourceId = false;
  let returnNumber = false;
  let numberOfReturns = false;
  let scannerChannel = false;
  let scanDirectionFlag = false;
  let edgeOfFlightLine = false;
  let waveform = false;
  let extraBytes = false;
  for (const column of columns as readonly string[]) {
    switch (column) {
      case 'POSITION':
        break;
      case 'intensity':
        intensity = true;
        break;
      case 'classification':
        classification = true;
        break;
      case 'synthetic':
        synthetic = true;
        break;
      case 'keyPoint':
        keyPoint = true;
        break;
      case 'withheld':
        withheld = true;
        break;
      case 'overlap':
        overlap = true;
        break;
      case 'COLOR_0':
        color = true;
        break;
      case 'GPS_TIME':
        gpsTime = true;
        break;
      case 'NIR':
        nir = true;
        break;
      case 'scanAngle':
        scanAngle = true;
        break;
      case 'userData':
        userData = true;
        break;
      case 'pointSourceId':
        pointSourceId = true;
        break;
      case 'returnNumber':
        returnNumber = true;
        break;
      case 'numberOfReturns':
        numberOfReturns = true;
        break;
      case 'scannerChannel':
        scannerChannel = true;
        break;
      case 'scanDirectionFlag':
        scanDirectionFlag = true;
        break;
      case 'edgeOfFlightLine':
        edgeOfFlightLine = true;
        break;
      case 'WAVEFORM':
        waveform = true;
        break;
      case 'EXTRA_BYTES':
        extraBytes = true;
        break;
      default:
        throw new Error(`LASLoader: unsupported column ${column}`);
    }
  }
  return {
    intensity,
    classification,
    synthetic,
    keyPoint,
    withheld,
    overlap,
    color,
    gpsTime,
    nir,
    scanAngle,
    userData,
    pointSourceId,
    returnNumber,
    numberOfReturns,
    scannerChannel,
    scanDirectionFlag,
    edgeOfFlightLine,
    waveform,
    extraBytes
  };
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

/** Resolve the LAZ chunk-table offset, including the non-seekable-writer sentinel layout. */
function readLAZChunkTableOffset(dataView: DataView, pointDataOffset: number): number {
  if (isNegativeOneUint64(dataView, pointDataOffset)) {
    if (dataView.byteLength < LAZ_CHUNK_TABLE_POINTER_LENGTH) {
      return 0;
    }
    return readUint64(dataView, dataView.byteLength - LAZ_CHUNK_TABLE_POINTER_LENGTH);
  }
  return readUint64(dataView, pointDataOffset);
}

/** Read a streaming chunk-table pointer, returning -1 for the end-pointer sentinel. */
function readStreamedLAZChunkTableOffset(dataView: DataView): number {
  return isNegativeOneUint64(dataView, 0) ? -1 : readUint64(dataView, 0);
}

/** Return true when an eight-byte field contains signed little-endian -1. */
function isNegativeOneUint64(dataView: DataView, byteOffset: number): boolean {
  return (
    dataView.byteLength >= byteOffset + 8 &&
    dataView.getUint32(byteOffset, true) === 0xffffffff &&
    dataView.getUint32(byteOffset + 4, true) === 0xffffffff
  );
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
