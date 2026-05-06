// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshAttributes} from '@loaders.gl/schema';
import {
  BinaryChunkReader,
  decodeLAZChunk,
  decodeLAZChunkTable,
  getLAZChunkByteLength,
  NeedsMoreData
} from '@loaders.gl/loader-utils';
import type {LASLoaderOptions} from '../../las-loader';
import {getLASSchema} from '../get-las-schema';
import type {LASHeader, LASMesh} from '../las-types';

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

type LASZipVLR = {
  compressor: number;
  chunkSize: number;
  variableChunks: boolean;
};

type RawPointBatchState = {
  rawBatch: Uint8Array;
  batchPointCount: number;
  totalRead: number;
};

type LAZChunkByteLengthMetadata = {
  pointDataRecordFormat: number;
  pointDataRecordLength: number;
  pointCount: number;
};

/** Parse LAS data with the TypeScript backend. */
export function parseLAS(arrayBuffer: ArrayBuffer, options: LASLoaderOptions = {}): LASMesh {
  const header = parseLASHeader(arrayBuffer);
  if (header.isCompressed) {
    const rawPointData = decodeLAZFileToRawPointData(arrayBuffer, header);
    const totalPointCount = header.pointsCount;
    return parseLASMeshBatch(
      rawPointData.buffer,
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
  const outputHeader = {...header, totalToRead: totalPointCount, totalRead: totalPointCount};
  const PositionsType = options.las?.fp64 ? Float64Array : Float32Array;
  const positions = new PositionsType(totalPointCount * 3);
  const colors = outputHeader.hasColor ? new Uint8Array(totalPointCount * 4) : null;
  const intensities = new Uint16Array(totalPointCount);
  const classifications = new Uint8Array(totalPointCount);

  populateLASAttributesFromDataView(new DataView(arrayBuffer), outputHeader, options, {
    positions,
    colors,
    intensities,
    classifications,
    pointOffset: 0,
    sourcePointIndex: 0,
    pointCount: totalPointCount
  });

  const attributes: MeshAttributes = {
    POSITION: {value: positions, size: 3},
    intensity: {value: intensities, size: 1},
    classification: {value: classifications, size: 1}
  };
  if (colors) {
    attributes.COLOR_0 = {value: colors, size: 4};
  }

  const lasMesh: LASMesh = {
    loader: 'las',
    loaderData: outputHeader,
    schema: {fields: [], metadata: {}},
    header: {
      vertexCount: totalPointCount,
      boundingBox: getHeaderBoundingBox(outputHeader)
    },
    attributes,
    topology: 'point-list',
    mode: 0
  };
  lasMesh.schema = getLASSchema(lasMesh.loaderData, lasMesh.attributes);
  return lasMesh;
}

/** Parse LAS data from an incoming byte iterator into point batches. */
export async function* parseLASInBatches(
  arrayBufferIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options: LASLoaderOptions = {}
): AsyncIterable<LASMesh> {
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
      yield parseLASMeshBatch(batch.arrayBuffer, batch.header, options);
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
  const laszip = parseLASZipVLR(initialPending, header);
  validateTypeScriptLAZSupport(header, laszip);

  if (header.pointsFormatId <= 5) {
    yield* decodePendingLegacyLAZFileInBatches(
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
  const state = createRawPointBatchState(batchSize, header.pointsStructSize);
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
    const metadata = {
      pointDataRecordFormat: header.pointsFormatId,
      pointDataRecordLength: header.pointsStructSize,
      pointCount: chunkPointCount
    };
    const chunkByteLength = await readLAZChunkByteLengthFromReader(reader, inputIterator, metadata);
    const compressedChunk = new Uint8Array(chunkByteLength);
    reader.readInto(compressedChunk, 0, chunkByteLength);
    const rawChunk = decodeLAZChunk(compressedChunk, metadata);
    for (const batch of appendRawPointChunk(rawChunk, outputHeader, state)) {
      yield batch;
    }

    sourcePointIndex += chunkPointCount;
  }

  const finalBatch = flushRawPointBatch(outputHeader, state);
  if (finalBatch) {
    yield finalBatch;
  }
}

async function* decodePendingLegacyLAZFileInBatches(
  initialPending: Uint8Array<ArrayBufferLike>,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader,
  laszip: LASZipVLR,
  options: LASLoaderOptions = {}
): AsyncIterable<LASDecodedChunk> {
  let pending = initialPending;
  while (true) {
    try {
      yield* decodeLegacyLAZFileFromCompleteBytes(pending, header, laszip, options);
      return;
    } catch (error) {
      if (!(error instanceof NeedsMoreData)) {
        throw error;
      }
    }

    const next = await inputIterator.next();
    if (next.done) {
      throw new NeedsMoreData('LASLoader: truncated legacy LAZ file');
    }
    pending = concatenateUint8Arrays(pending, toUint8Array(next.value));
  }
}

async function* parseLAZInBatches(
  initialPending: Uint8Array<ArrayBufferLike>,
  inputIterator: AsyncIterator<ArrayBufferLike | ArrayBufferView>,
  header: LASHeader,
  options: LASLoaderOptions
): AsyncIterable<LASMesh> {
  for await (const batch of decodePendingLAZFileInBatches(
    initialPending,
    inputIterator,
    header,
    options
  )) {
    yield parseLASMeshBatch(batch.arrayBuffer, batch.header, options);
  }
}

function* parseLAZChunkedIterator(
  arrayBuffer: ArrayBuffer,
  header: LASHeader,
  batchSize: number
): Iterable<LASDecodedChunk> {
  const laszip = parseLASZipVLR(new Uint8Array(arrayBuffer), header);
  validateTypeScriptLAZSupport(header, laszip);

  if (header.pointsFormatId <= 5) {
    yield* decodeLegacyLAZFileFromCompleteBytes(new Uint8Array(arrayBuffer), header, laszip, {
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
    const metadata = {
      pointDataRecordFormat: header.pointsFormatId,
      pointDataRecordLength: header.pointsStructSize,
      pointCount: chunkPointCount
    };
    const compressed = bytes.subarray(byteOffset);
    const chunkByteLength = getLAZChunkByteLength(compressed, metadata);
    const rawChunk = decodeLAZChunk(compressed.subarray(0, chunkByteLength), metadata);

    for (const batch of appendRawPointChunk(rawChunk, outputHeader, state)) {
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

function* decodeLegacyLAZFileFromCompleteBytes(
  bytes: Uint8Array,
  header: LASHeader,
  laszip: LASZipVLR,
  options: LASLoaderOptions = {}
): Iterable<LASDecodedChunk> {
  const batchSize = getBatchSize(options);
  const outputHeader = {...header, totalToRead: header.pointsCount};
  const state = createRawPointBatchState(batchSize, header.pointsStructSize);
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
    const metadata = {
      pointDataRecordFormat: header.pointsFormatId,
      pointDataRecordLength: header.pointsStructSize,
      pointCount: chunk.pointCount
    };
    const rawChunk = decodeLAZChunk(compressedChunk, metadata);
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

function parseLASMeshBatch(
  arrayBuffer: ArrayBufferLike,
  lasHeader: LASHeader,
  options: LASLoaderOptions = {}
): LASMesh {
  const batchSize = lasHeader.pointsCount;
  const PositionsType = options.las?.fp64 ? Float64Array : Float32Array;
  const positions = new PositionsType(batchSize * 3);
  const colors = lasHeader.hasColor ? new Uint8Array(batchSize * 4) : null;
  const intensities = new Uint16Array(batchSize);
  const classifications = new Uint8Array(batchSize);

  populateLASAttributesFromDataView(new DataView(arrayBuffer), lasHeader, options, {
    positions,
    colors,
    intensities,
    classifications,
    pointOffset: 0,
    sourcePointIndex: 0,
    pointCount: batchSize
  });

  const attributes: MeshAttributes = {
    POSITION: {value: positions, size: 3},
    intensity: {value: intensities, size: 1},
    classification: {value: classifications, size: 1}
  };
  if (colors) {
    attributes.COLOR_0 = {value: colors, size: 4};
  }

  const lasMesh: LASMesh = {
    loader: 'las',
    loaderData: lasHeader,
    schema: {fields: [], metadata: {}},
    header: {
      vertexCount: batchSize,
      boundingBox: getHeaderBoundingBox(lasHeader)
    },
    attributes,
    topology: 'point-list',
    mode: 0,
    progress: lasHeader.totalRead / lasHeader.totalToRead
  } as LASMesh & {progress: number};
  lasMesh.schema = getLASSchema(lasHeader, lasMesh.attributes);
  return lasMesh;
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
      return 57;
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
      const chunkSize = dataView.getUint32(dataOffset + 12, true);
      return {
        compressor: dataView.getUint16(dataOffset, true),
        chunkSize,
        variableChunks: chunkSize === 0 || chunkSize === VARIABLE_CHUNK_SIZE
      };
    }
    offset = dataOffset + recordLength;
  }

  throw new Error('LASLoader: compressed LAZ file does not contain a LASzip VLR');
}

function validateTypeScriptLAZSupport(header: LASHeader, laszip: LASZipVLR): void {
  if (![0, 2, 6, 7, 8].includes(header.pointsFormatId)) {
    throw new Error(
      `LASLoader: TypeScript LAZ streaming only supports point formats 0, 2, 6, 7, and 8; received ${header.pointsFormatId}`
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
  if (laszip.variableChunks) {
    throw new Error(
      'LASLoader: TypeScript LAZ streaming does not yet support variable chunk sizes'
    );
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
  if (metadata.pointDataRecordFormat < 6 || metadata.pointDataRecordFormat > 8) {
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
  if (chunkTableOffset < 0 || chunkTableOffset + 8 > bytes.byteLength) {
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
  return decodeLAZChunkTable(bytes.subarray(chunkTableOffset + 8), {
    chunkCount,
    pointCount: header.pointsCount,
    chunkSize: laszip.chunkSize,
    variable: laszip.variableChunks
  });
}

function createRawPointBatchState(
  batchSize: number,
  pointRecordLength: number
): RawPointBatchState {
  return {
    rawBatch: new Uint8Array(batchSize * pointRecordLength),
    batchPointCount: 0,
    totalRead: 0
  };
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
  const arrayBuffer = state.rawBatch.buffer.slice(0, byteLength);
  state.totalRead += state.batchPointCount;
  const batchHeader = {
    ...header,
    pointsOffset: 0,
    pointsCount: state.batchPointCount,
    totalRead: state.totalRead
  };
  state.batchPointCount = 0;
  return {arrayBuffer, header: batchHeader};
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
