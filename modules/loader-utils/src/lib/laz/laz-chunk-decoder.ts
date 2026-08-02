// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Metadata needed to decode a compressed LAZ point chunk. */
export type LAZChunkMetadata = {
  pointDataRecordFormat: number;
  pointDataRecordLength: number;
  pointCount: number;
  /** LASzip Point14 item version. Version 4 fixes scanner-channel context propagation. */
  point14ItemVersion?: 2 | 3 | 4;
  /** LASzip RGB14 or RGBNIR14 item version. Version 4 fixes context switching. */
  rgb14ItemVersion?: 2 | 3 | 4;
  /** LASzip WavePacket14 item version. Version 4 fixes version 3 context switching. */
  wavePacketItemVersion?: 3 | 4;
  /** LASzip Byte14 item version. Version 4 fixes context switching. */
  byte14ItemVersion?: 2 | 3 | 4;
};

/** Options for streaming LAZ chunk decoding. */
export type LAZChunkDecoderOptions = {
  /** Number of raw point records to return per yielded batch. */
  batchSize?: number;
};

/** Typed-array target for direct LAZ point decoding. */
export type LAZPointDataTarget = {
  /** XYZ positions populated with LAS scale and offset applied. */
  positions: Float32Array | Float64Array;
  /** Point intensity values. */
  intensities: Uint16Array;
  /** Point classification values. */
  classifications: Uint8Array;
  /** Optional final RGBA colors as 8-bit channel values. */
  colors?: Uint8Array | null;
  /** Optional raw RGB colors as 16-bit LAS channel values. */
  rawColors?: Uint16Array | null;
  /** First point index to populate in the target arrays. */
  pointOffset: number;
  /** LAS scale tuple. */
  scale: [number, number, number];
  /** LAS offset tuple. */
  offset: [number, number, number];
};

/** One decoded LASzip chunk table entry. */
export type LAZChunkTableEntry = {
  /** Number of points in this chunk. */
  pointCount: number;
  /** Compressed chunk byte length. */
  byteLength: number;
};

/** Output mode selected for one stateful LAZ chunk decoder. */
type LAZChunkDecoderOutputMode = 'raw' | 'point-data';

/** Error raised when a feedable decoder needs more compressed bytes. */
export class NeedsMoreData extends Error {
  constructor(message: string = 'LAZ chunk decoder needs more compressed data') {
    super(message);
    this.name = 'NeedsMoreData';
  }
}

/** Feedable TypeScript LAZ chunk decoder. */
export class FeedableLAZChunkDecoder {
  private metadata: LAZChunkMetadata;
  private chunks: Uint8Array[] = [];
  private closed = false;
  private compressed: Uint8Array | null = null;
  private cursor: LAZChunkDecoderCursor | null = null;
  private fedByteLength = 0;
  private requiredByteLength: number | null = null;

  constructor(metadata: LAZChunkMetadata) {
    this.metadata = metadata;
  }

  /** Add compressed bytes to the decoder input. */
  feed(chunk: ArrayBuffer | ArrayBufferView): void {
    if (this.closed) {
      throw new Error('Cannot feed a closed LAZ chunk decoder');
    }
    const bytes = toUint8Array(chunk);
    this.chunks.push(bytes);
    this.compressed = null;
    this.fedByteLength += bytes.byteLength;
  }

  /** Mark the compressed input as complete. */
  close(): void {
    this.closed = true;
  }

  /** Decode all fed point data into raw LAS point records. */
  decode(): Uint8Array {
    if (!this.closed) {
      throw new NeedsMoreData('LAZ chunk decoder input is not closed');
    }
    return this.decodeAvailable();
  }

  /** Decode and return the next raw LAS point batch if enough bytes are available. */
  readBatch(pointCount: number): Uint8Array | null {
    if (!this.cursor) {
      if (!this.hasCompleteChunk()) {
        return null;
      }
      const compressed = this.getCompressedAvailable();
      const byteLength = this.requiredByteLength ?? compressed.byteLength;
      this.cursor = createLAZChunkDecoderCursor(compressed.subarray(0, byteLength), this.metadata);
    }
    if (this.cursor.remainingPointCount <= 0) {
      return null;
    }
    const pointByteLength = this.metadata.pointDataRecordLength;
    const batchPointCount = Math.min(pointCount, this.cursor.remainingPointCount);
    const batch = new Uint8Array(batchPointCount * pointByteLength);
    this.cursor.decodeInto(batch, 0, batchPointCount);
    return batch;
  }

  private hasCompleteChunk(): boolean {
    if (!hasLayeredChunkSizeHeaders(this.metadata.pointDataRecordFormat)) {
      return this.closed;
    }
    if (this.requiredByteLength !== null) {
      return this.fedByteLength >= this.requiredByteLength;
    }
    if (this.fedByteLength < getLAZChunkMinimumByteLength(this.metadata)) {
      return false;
    }

    try {
      const compressed = this.getCompressedAvailable();
      this.requiredByteLength = getLAZChunkByteLength(compressed, this.metadata);
      return this.requiredByteLength <= this.fedByteLength;
    } catch (error) {
      if (error instanceof NeedsMoreData) {
        return false;
      }
      throw error;
    }
  }

  private decodeAvailable(): Uint8Array {
    const compressed = this.getCompressedAvailable();
    const byteLength = this.requiredByteLength ?? compressed.byteLength;
    return decodeLAZChunk(compressed.subarray(0, byteLength), this.metadata);
  }

  private getCompressedAvailable(): Uint8Array {
    this.compressed ||= concatenateUint8Arrays(this.chunks);
    return this.compressed;
  }
}

/** Create a feedable TypeScript LAZ chunk decoder. */
export function createLAZChunkDecoder(metadata: LAZChunkMetadata): FeedableLAZChunkDecoder {
  return new FeedableLAZChunkDecoder(metadata);
}

/** Stateful cursor that decodes one compressed LAZ chunk into caller-provided output buffers. */
export class LAZChunkDecoderCursor {
  private metadata: LAZChunkMetadata;
  private stream: ByteReader;
  /** Decoder initialized after the caller selects raw or direct point-data output. */
  private decoder: PointDecompressor | null = null;
  private pointIndex = 0;
  /** Output mode selected by the first decode call. */
  private outputMode: LAZChunkDecoderOutputMode | null = null;

  constructor(compressed: ArrayBuffer | ArrayBufferView, metadata: LAZChunkMetadata) {
    this.metadata = metadata;
    this.stream = new ByteReader(toUint8Array(compressed));
  }

  /** Number of points still available in this compressed chunk. */
  get remainingPointCount(): number {
    return this.metadata.pointCount - this.pointIndex;
  }

  /** Number of compressed input bytes consumed by decoded points. */
  get compressedByteOffset(): number {
    return this.stream.byteOffset;
  }

  /** Decode up to `pointCount` points into `output` at `outputOffset`. */
  decodeInto(output: Uint8Array, outputOffset: number, pointCount: number): number {
    const pointsToDecode = Math.min(pointCount, this.remainingPointCount);
    const decoder = this.selectOutputMode('raw', pointsToDecode);
    if (!decoder) {
      return 0;
    }
    let targetOffset = outputOffset;

    for (let pointIndex = 0; pointIndex < pointsToDecode; pointIndex++) {
      targetOffset = decoder.decompress(output, targetOffset);
    }

    this.pointIndex += pointsToDecode;
    return pointsToDecode;
  }

  /** Decode up to `pointCount` points directly into typed point-data arrays. */
  decodeIntoPointData(target: LAZPointDataTarget, pointCount: number): number {
    const pointsToDecode = Math.min(pointCount, this.remainingPointCount);

    if (pointsToDecode > 0 && !supportsDirectPointDataOutput(this.metadata.pointDataRecordFormat)) {
      throw new Error(
        `TypeScript LAZ decoder does not support direct point-data output for point format ${this.metadata.pointDataRecordFormat}`
      );
    }
    const decoder = this.selectOutputMode('point-data', pointsToDecode);
    if (!decoder) {
      return 0;
    }

    if (decoder.decompressPointDataBatch) {
      decoder.decompressPointDataBatch(target, pointsToDecode);
    } else {
      for (let pointIndex = 0; pointIndex < pointsToDecode; pointIndex++) {
        decoder.decompressPointData!(target, target.pointOffset + pointIndex);
      }
    }

    this.pointIndex += pointsToDecode;
    return pointsToDecode;
  }

  /** Lock this cursor to one output mode so skipped layered streams cannot be read later. */
  private selectOutputMode(
    mode: LAZChunkDecoderOutputMode,
    pointCount: number
  ): PointDecompressor | null {
    if (pointCount === 0) {
      return null;
    }
    if (this.outputMode && this.outputMode !== mode) {
      throw new Error('Cannot mix raw and point-data decoding in one LAZ chunk cursor');
    }
    this.outputMode = mode;
    this.decoder ||= createPointDecompressor(this.stream, this.metadata, mode);
    return this.decoder;
  }
}

/** Create a stateful TypeScript LAZ chunk decoder cursor. */
export function createLAZChunkDecoderCursor(
  compressed: ArrayBuffer | ArrayBufferView,
  metadata: LAZChunkMetadata
): LAZChunkDecoderCursor {
  return new LAZChunkDecoderCursor(compressed, metadata);
}

/** Decode a complete compressed LAZ point chunk into raw LAS point records. */
export function decodeLAZChunk(
  compressed: ArrayBuffer | ArrayBufferView,
  metadata: LAZChunkMetadata
): Uint8Array {
  const decoder = createLAZChunkDecoderCursor(compressed, metadata);
  const output = new Uint8Array(metadata.pointCount * metadata.pointDataRecordLength);
  decoder.decodeInto(output, 0, metadata.pointCount);

  return output;
}

/** Decode a compressed LAZ point chunk into raw LAS point record batches. */
export async function* decodeLAZChunkInBatches(
  chunks: AsyncIterable<ArrayBuffer | ArrayBufferView> | Iterable<ArrayBuffer | ArrayBufferView>,
  metadata: LAZChunkMetadata,
  options: LAZChunkDecoderOptions = {}
): AsyncIterable<Uint8Array> {
  const decoder = createLAZChunkDecoder(metadata);
  const batchSize = options.batchSize || metadata.pointCount;

  for await (const chunk of chunks) {
    decoder.feed(chunk);
    let batch = decoder.readBatch(batchSize);
    while (batch) {
      yield batch;
      batch = decoder.readBatch(batchSize);
    }
  }

  decoder.close();
  let batch = decoder.readBatch(batchSize);
  while (batch) {
    yield batch;
    batch = decoder.readBatch(batchSize);
  }
}

/** Return the byte length of a complete LAS 1.4 layered LAZ point chunk. */
export function getLAZChunkByteLength(
  compressed: ArrayBuffer | ArrayBufferView,
  metadata: LAZChunkMetadata
): number {
  if (!hasLayeredChunkSizeHeaders(metadata.pointDataRecordFormat)) {
    throw new NeedsMoreData('Legacy LAZ chunk byte length is not self-describing');
  }
  const bytes = toUint8Array(compressed);
  const extraByteCount = getExtraByteCount(metadata);
  const firstPointByteLength = metadata.pointDataRecordLength;
  const sizeHeaderCount = getChunkSizeHeaderCount(metadata.pointDataRecordFormat, extraByteCount);
  const sizeHeaderOffset = firstPointByteLength + 4;
  const sizeHeaderByteLength = sizeHeaderCount * 4;

  if (bytes.byteLength < sizeHeaderOffset + sizeHeaderByteLength) {
    throw new NeedsMoreData();
  }

  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let byteLength = sizeHeaderOffset + sizeHeaderByteLength;
  for (let index = 0; index < sizeHeaderCount; index++) {
    byteLength += dataView.getUint32(sizeHeaderOffset + index * 4, true);
  }
  if (bytes.byteLength < byteLength) {
    throw new NeedsMoreData();
  }
  return byteLength;
}

/** Decode a LASzip chunk table payload into chunk point counts and byte lengths. */
export function decodeLAZChunkTable(
  compressed: ArrayBuffer | ArrayBufferView,
  options: {
    /** Number of chunks in the LASzip chunk table. */
    chunkCount: number;
    /** Total number of points in the file. */
    pointCount: number;
    /** Fixed LASzip chunk size, or variable chunk marker. */
    chunkSize: number;
    /** Whether the chunk table stores per-chunk point counts. */
    variable: boolean;
  }
): LAZChunkTableEntry[] {
  const input = new ByteReader(toUint8Array(compressed));
  const decoder = new ArithmeticDecoder(input);
  const decompressor = createIntegerDecompressor(32, 2);
  decoder.readInitBytes();

  const chunks: LAZChunkTableEntry[] = [];
  let countPredictor = 0;
  let byteLengthPredictor = 0;
  let remainingPointCount = options.pointCount;

  for (let index = 0; index < options.chunkCount; index++) {
    let pointCount: number;
    if (options.variable) {
      countPredictor = decompressor.decompress(decoder, countPredictor, 0) >>> 0;
      pointCount = countPredictor;
    } else {
      pointCount = Math.min(options.chunkSize, remainingPointCount);
      remainingPointCount -= pointCount;
    }

    byteLengthPredictor = decompressor.decompress(decoder, byteLengthPredictor, 1) >>> 0;
    chunks.push({pointCount, byteLength: byteLengthPredictor});
  }

  return chunks;
}

function getLAZChunkMinimumByteLength(metadata: LAZChunkMetadata): number {
  if (!hasLayeredChunkSizeHeaders(metadata.pointDataRecordFormat)) {
    return metadata.pointDataRecordLength + 4;
  }
  const extraByteCount = getExtraByteCount(metadata);
  return (
    metadata.pointDataRecordLength +
    4 +
    getChunkSizeHeaderCount(metadata.pointDataRecordFormat, extraByteCount) * 4
  );
}

const AC_MIN_LENGTH = 0x01000000;
const AC_MAX_LENGTH = 0xffffffff;
const BM_LENGTH_SHIFT = 13;
const BM_MAX_COUNT = 1 << BM_LENGTH_SHIFT;
const BM_DISTRIBUTION_DIVISOR = 2 ** (31 - BM_LENGTH_SHIFT);
const DM_LENGTH_SHIFT = 15;
const DM_MAX_COUNT = 1 << DM_LENGTH_SHIFT;
const DM_DISTRIBUTION_DIVISOR = 2 ** (31 - DM_LENGTH_SHIFT);

const NUMBER_RETURN_MAP_6_CONTEXT: number[][] = [
  [0, 1, 2, 3, 4, 5, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5],
  [1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [2, 1, 2, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3],
  [3, 3, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [4, 3, 4, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [5, 3, 4, 4, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [3, 3, 4, 4, 4, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [4, 3, 4, 4, 4, 4, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4],
  [4, 3, 4, 4, 4, 4, 4, 4, 5, 4, 4, 4, 4, 4, 4, 4],
  [5, 3, 4, 4, 4, 4, 4, 4, 4, 5, 4, 4, 4, 4, 4, 4],
  [5, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 4, 4, 4, 4, 4],
  [5, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 4, 4, 4],
  [5, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 4, 4],
  [5, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 4],
  [5, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5],
  [5, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5]
];

const NUMBER_RETURN_LEVEL_8_CONTEXT: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7],
  [1, 0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 7, 7, 7, 7],
  [2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 7, 7, 7],
  [3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 7, 7],
  [4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 7],
  [5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7],
  [6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 7, 7],
  [7, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 7],
  [7, 7, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7],
  [7, 7, 7, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6],
  [7, 7, 7, 7, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5],
  [7, 7, 7, 7, 7, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4],
  [7, 7, 7, 7, 7, 7, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3],
  [7, 7, 7, 7, 7, 7, 7, 6, 5, 4, 3, 2, 1, 0, 1, 2],
  [7, 7, 7, 7, 7, 7, 7, 7, 6, 5, 4, 3, 2, 1, 0, 1],
  [7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 5, 4, 3, 2, 1, 0]
];

const GPS_TIME_MULTI = 500;
const GPS_TIME_MULTI_MINUS = -10;
const GPS_TIME_MULTI_CODE_FULL = 511;
const GPS_TIME10_MULTI_UNCHANGED = GPS_TIME_MULTI - GPS_TIME_MULTI_MINUS + 1;
const GPS_TIME10_MULTI_CODE_FULL = GPS_TIME_MULTI - GPS_TIME_MULTI_MINUS + 2;
const FLOAT64_SCRATCH = new ArrayBuffer(8);
const FLOAT64_SCRATCH_BYTES = new Uint8Array(FLOAT64_SCRATCH);
const FLOAT64_SCRATCH_VIEW = new DataView(FLOAT64_SCRATCH);

const NUMBER_RETURN_MAP_10_CONTEXT: number[][] = [
  [15, 14, 13, 12, 11, 10, 9, 8],
  [14, 0, 1, 3, 6, 10, 10, 9],
  [13, 1, 2, 4, 7, 11, 11, 10],
  [12, 3, 4, 5, 8, 12, 12, 11],
  [11, 6, 7, 8, 9, 13, 13, 12],
  [10, 10, 11, 12, 13, 14, 14, 13],
  [9, 10, 11, 12, 13, 14, 15, 14],
  [8, 9, 10, 11, 12, 13, 14, 15]
];

const NUMBER_RETURN_LEVEL_10_CONTEXT: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7],
  [1, 0, 1, 2, 3, 4, 5, 6],
  [2, 1, 0, 1, 2, 3, 4, 5],
  [3, 2, 1, 0, 1, 2, 3, 4],
  [4, 3, 2, 1, 0, 1, 2, 3],
  [5, 4, 3, 2, 1, 0, 1, 2],
  [6, 5, 4, 3, 2, 1, 0, 1],
  [7, 6, 5, 4, 3, 2, 1, 0]
];

class ByteReader {
  private bytes: Uint8Array;
  private offset = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  get byteOffset(): number {
    return this.offset;
  }

  /** Underlying contiguous bytes used by bounded arithmetic layers. */
  get data(): Uint8Array {
    return this.bytes;
  }

  getByte(): number {
    if (this.offset >= this.bytes.length) {
      throw new NeedsMoreData();
    }
    return this.bytes[this.offset++];
  }

  getBytes(target: Uint8Array, targetOffset: number, length: number): void {
    if (this.offset + length > this.bytes.length) {
      throw new NeedsMoreData();
    }
    target.set(this.bytes.subarray(this.offset, this.offset + length), targetOffset);
    this.offset += length;
  }

  /** Consume a bounded byte range without constructing a subreader. */
  consume(length: number): number {
    if (this.offset + length > this.bytes.length) {
      throw new NeedsMoreData();
    }
    const startOffset = this.offset;
    this.offset += length;
    return startOffset;
  }

  getUint32(): number {
    const b0 = this.getByte();
    const b1 = this.getByte();
    const b2 = this.getByte();
    const b3 = this.getByte();
    return (b0 | (b1 << 8) | (b2 << 16) | ((b3 << 24) >>> 0)) >>> 0;
  }
}

type ByteInput = {
  getByte(): number;
};

class ArithmeticModel {
  symbols: number;
  distribution: Uint32Array;
  symbolCount: Uint32Array;
  decoderTable: Uint32Array | null;
  totalCount = 0;
  updateCycle: number;
  symbolsUntilUpdate: number;
  lastSymbol: number;
  tableSize = 0;
  tableShift = 0;

  constructor(symbols: number) {
    if (symbols < 2 || symbols > 1 << 11) {
      throw new Error(`Invalid arithmetic model symbol count ${symbols}`);
    }
    this.symbols = symbols;
    this.lastSymbol = symbols - 1;
    if (symbols > 16) {
      let tableBits = 3;
      while (symbols > 1 << (tableBits + 2)) {
        tableBits++;
      }
      this.tableSize = 1 << tableBits;
      this.tableShift = DM_LENGTH_SHIFT - tableBits;
      this.decoderTable = new Uint32Array(this.tableSize + 2);
    } else {
      this.decoderTable = null;
    }
    this.distribution = new Uint32Array(symbols);
    this.symbolCount = new Uint32Array(symbols);
    this.symbolCount.fill(1);
    this.updateCycle = symbols;
    this.symbolsUntilUpdate = symbols;
    this.update();
    this.symbolsUntilUpdate = this.updateCycle = (symbols + 6) >> 1;
  }

  update(): void {
    this.totalCount += this.updateCycle;
    if (this.totalCount > DM_MAX_COUNT) {
      this.totalCount = 0;
      for (let symbol = 0; symbol < this.symbols; symbol++) {
        this.symbolCount[symbol] = (this.symbolCount[symbol] + 1) >> 1;
        this.totalCount += this.symbolCount[symbol];
      }
    }

    let sum = 0;
    let tableIndex = 0;
    const scale = (0x80000000 / this.totalCount) | 0;

    if (!this.decoderTable) {
      for (let symbol = 0; symbol < this.symbols; symbol++) {
        this.distribution[symbol] = ((scale * sum) / DM_DISTRIBUTION_DIVISOR) | 0;
        sum += this.symbolCount[symbol];
      }
    } else {
      for (let symbol = 0; symbol < this.symbols; symbol++) {
        this.distribution[symbol] = ((scale * sum) / DM_DISTRIBUTION_DIVISOR) | 0;
        sum += this.symbolCount[symbol];
        const width = this.distribution[symbol] >> this.tableShift;
        while (tableIndex < width) {
          this.decoderTable[++tableIndex] = symbol - 1;
        }
      }
      this.decoderTable[0] = 0;
      while (tableIndex <= this.tableSize) {
        this.decoderTable[++tableIndex] = this.symbols - 1;
      }
    }

    this.updateCycle = (5 * this.updateCycle) >> 2;
    const maxCycle = (this.symbols + 6) << 3;
    if (this.updateCycle > maxCycle) {
      this.updateCycle = maxCycle;
    }
    this.symbolsUntilUpdate = this.updateCycle;
  }
}

class ArithmeticBitModel {
  updateCycle = 4;
  bitsUntilUpdate = 4;
  bit0Prob = 1 << (BM_LENGTH_SHIFT - 1);
  bit0Count = 1;
  bitCount = 2;

  update(): void {
    this.bitCount += this.updateCycle;
    if (this.bitCount > BM_MAX_COUNT) {
      this.bitCount = (this.bitCount + 1) >> 1;
      this.bit0Count = (this.bit0Count + 1) >> 1;
      if (this.bit0Count === this.bitCount) {
        this.bitCount++;
      }
    }
    const scale = (0x80000000 / this.bitCount) | 0;
    this.bit0Prob = ((this.bit0Count * scale) / BM_DISTRIBUTION_DIVISOR) | 0;
    this.updateCycle = (5 * this.updateCycle) >> 2;
    if (this.updateCycle > 64) {
      this.updateCycle = 64;
    }
    this.bitsUntilUpdate = this.updateCycle;
  }
}

class ArithmeticDecoder {
  private input: ByteInput | null;
  /** Contiguous layered input used by the LAZ 1.4 hot path. */
  private inputBytes: Uint8Array | null = null;
  /** Current absolute position in {@link inputBytes}. */
  private inputOffset = 0;
  /** Exclusive end of the bounded range in {@link inputBytes}. */
  private inputEnd = 0;
  private value = 0;
  private length = AC_MAX_LENGTH;
  valid = false;

  constructor(input: ByteInput | null = null) {
    this.input = input;
  }

  initStream(source: ByteReader, count: number): void {
    if (count) {
      this.inputBytes = source.data;
      this.inputOffset = source.consume(count);
      this.inputEnd = this.inputOffset + count;
      this.input = null;
      this.readInitBytes();
      this.valid = true;
    } else {
      this.valid = false;
    }
  }

  readInitBytes(): void {
    if (this.inputBytes) {
      const offset = this.inputOffset;
      if (offset + 4 > this.inputEnd) {
        throw new NeedsMoreData();
      }
      this.value =
        (((this.inputBytes[offset] << 24) >>> 0) |
          (this.inputBytes[offset + 1] << 16) |
          (this.inputBytes[offset + 2] << 8) |
          this.inputBytes[offset + 3]) >>>
        0;
      this.inputOffset = offset + 4;
      return;
    }
    const input = this.input!;
    this.value =
      (((input.getByte() << 24) >>> 0) |
        (input.getByte() << 16) |
        (input.getByte() << 8) |
        input.getByte()) >>>
      0;
  }

  decodeBit(model: ArithmeticBitModel): number {
    const value = this.value;
    const length = this.length;
    const x = model.bit0Prob * (length >>> BM_LENGTH_SHIFT);
    const symbol = value >= x ? 1 : 0;
    if (symbol === 0) {
      this.length = x >>> 0;
      model.bit0Count++;
    } else {
      this.value = (value - x) >>> 0;
      this.length = (length - x) >>> 0;
    }
    if (this.length < AC_MIN_LENGTH) {
      this.renormalize();
    }
    if (--model.bitsUntilUpdate === 0) {
      model.update();
    }
    return symbol;
  }

  decodeSymbol(model: ArithmeticModel): number {
    let symbol: number;
    let lower: number;
    let length = this.length;
    let upper = length;
    const value = this.value;
    const distribution = model.distribution;
    const decoderTable = model.decoderTable;

    if (decoderTable) {
      length >>>= DM_LENGTH_SHIFT;
      const dv = (value / length) | 0;
      const tableIndex = dv >> model.tableShift;
      symbol = decoderTable[tableIndex];
      let next = decoderTable[tableIndex + 1] + 1;
      while (next > symbol + 1) {
        const middle = (symbol + next) >> 1;
        if (distribution[middle] > dv) {
          next = middle;
        } else {
          symbol = middle;
        }
      }
      lower = distribution[symbol] * length;
      if (symbol !== model.lastSymbol) {
        upper = distribution[symbol + 1] * length;
      }
    } else {
      lower = 0;
      symbol = 0;
      length >>>= DM_LENGTH_SHIFT;
      let next = model.symbols;
      let middle = next >> 1;
      do {
        const z = length * distribution[middle];
        if (z > value) {
          next = middle;
          upper = z;
        } else {
          symbol = middle;
          lower = z;
        }
        middle = (symbol + next) >> 1;
      } while (middle !== symbol);
    }

    this.value = (value - lower) >>> 0;
    this.length = (upper - lower) >>> 0;
    if (this.length < AC_MIN_LENGTH) {
      this.renormalize();
    }
    model.symbolCount[symbol]++;
    if (--model.symbolsUntilUpdate === 0) {
      model.update();
    }
    return symbol;
  }

  readBits(bits: number): number {
    if (bits > 19) {
      const lower = this.readShort();
      const upper = this.readBits(bits - 16) << 16;
      return (upper | lower) >>> 0;
    }
    const length = this.length >>> bits;
    const value = this.value;
    const symbol = (value / length) | 0;
    this.value = (value - length * symbol) >>> 0;
    this.length = length >>> 0;
    if (length < AC_MIN_LENGTH) {
      this.renormalize();
    }
    return symbol >>> 0;
  }

  readShort(): number {
    const length = this.length >>> 16;
    const value = this.value;
    const symbol = (value / length) | 0;
    this.value = (value - length * symbol) >>> 0;
    this.length = length >>> 0;
    if (length < AC_MIN_LENGTH) {
      this.renormalize();
    }
    return symbol & 0xffff;
  }

  readInt(): number {
    const lower = this.readShort();
    const upper = this.readShort();
    return ((upper << 16) | lower) >>> 0;
  }

  /** Read one lossless 64-bit unsigned integer from the arithmetic stream. */
  readUint64(): bigint {
    const lower = this.readInt();
    const upper = this.readInt();
    return (BigInt(upper) << 32n) | BigInt(lower);
  }

  private renormalize(): void {
    let value = this.value;
    let length = this.length;
    if (this.inputBytes) {
      const inputBytes = this.inputBytes;
      const inputEnd = this.inputEnd;
      let inputOffset = this.inputOffset;
      do {
        if (inputOffset >= inputEnd) {
          throw new NeedsMoreData();
        }
        value = ((value << 8) | inputBytes[inputOffset++]) >>> 0;
        length = (length << 8) >>> 0;
      } while (length < AC_MIN_LENGTH);
      this.inputOffset = inputOffset;
    } else {
      const input = this.input!;
      do {
        value = ((value << 8) | input.getByte()) >>> 0;
        length = (length << 8) >>> 0;
      } while (length < AC_MIN_LENGTH);
    }
    this.value = value;
    this.length = length;
  }
}

class IntegerDecompressor {
  private contexts: number;
  private bitsHigh: number;
  private corrBits: number;
  private corrRange: number;
  private corrMin: number;
  private mBits: ArithmeticModel[] = [];
  private mCorrector0 = new ArithmeticBitModel();
  private mCorrector: ArithmeticModel[] = [];
  k = 0;

  constructor(bits = 16, contexts = 1, bitsHigh = 8, range = 0) {
    this.contexts = contexts;
    this.bitsHigh = bitsHigh;
    if (range) {
      this.corrBits = 0;
      this.corrRange = range;
      while (range) {
        range >>= 1;
        this.corrBits++;
      }
      if (this.corrRange === 1 << (this.corrBits - 1)) {
        this.corrBits--;
      }
      this.corrMin = -(this.corrRange / 2);
    } else if (bits && bits < 32) {
      this.corrBits = bits;
      this.corrRange = 1 << bits;
      this.corrMin = -(this.corrRange / 2);
    } else {
      this.corrBits = 32;
      this.corrRange = 0;
      this.corrMin = -2147483648;
    }
  }

  init(): void {
    if (!this.mBits.length) {
      for (let context = 0; context < this.contexts; context++) {
        this.mBits.push(new ArithmeticModel(this.corrBits + 1));
      }
      for (let bit = 1; bit <= this.corrBits; bit++) {
        const value = bit <= this.bitsHigh ? 1 << bit : 1 << this.bitsHigh;
        this.mCorrector.push(new ArithmeticModel(value));
      }
    }
  }

  decompress(decoder: ArithmeticDecoder, prediction: number, context: number): number {
    let real = toInt32(prediction + this.readCorrector(decoder, this.mBits[context]));
    if (this.corrRange === 0) {
      return real;
    }
    if (real < 0) {
      real = toInt32(real + this.corrRange);
    } else if (real >= this.corrRange) {
      real = toInt32(real - this.corrRange);
    }
    return real;
  }

  private readCorrector(decoder: ArithmeticDecoder, mBits: ArithmeticModel): number {
    const k = decoder.decodeSymbol(mBits);
    this.k = k;
    let corrector: number;
    if (k) {
      if (k < 32) {
        const bitsHigh = this.bitsHigh;
        const correctorModel = this.mCorrector[k - 1];
        if (k <= bitsHigh) {
          corrector = decoder.decodeSymbol(correctorModel);
        } else {
          const lowerBitCount = k - bitsHigh;
          corrector = decoder.decodeSymbol(correctorModel);
          corrector = (corrector << lowerBitCount) | decoder.readBits(lowerBitCount);
        }
        if (corrector >= 1 << (k - 1)) {
          corrector += 1;
        } else {
          corrector -= (1 << k) - 1;
        }
      } else {
        corrector = this.corrMin;
      }
    } else {
      corrector = decoder.decodeBit(this.mCorrector0);
    }
    return toInt32(corrector);
  }
}

class StreamingMedian {
  /** Smallest retained value. */
  private value0 = 0;
  /** Second-smallest retained value. */
  private value1 = 0;
  /** Current median. */
  private value2 = 0;
  /** Second-largest retained value. */
  private value3 = 0;
  /** Largest retained value. */
  private value4 = 0;
  /** Whether the next update shifts values toward the upper half. */
  private high = true;

  add(value: number): void {
    if (this.high) {
      if (value < this.value2) {
        this.value4 = this.value3;
        this.value3 = this.value2;
        if (value < this.value0) {
          this.value2 = this.value1;
          this.value1 = this.value0;
          this.value0 = value;
        } else if (value < this.value1) {
          this.value2 = this.value1;
          this.value1 = value;
        } else {
          this.value2 = value;
        }
      } else {
        if (value < this.value3) {
          this.value4 = this.value3;
          this.value3 = value;
        } else {
          this.value4 = value;
        }
        this.high = false;
      }
    } else if (this.value2 < value) {
      this.value0 = this.value1;
      this.value1 = this.value2;
      if (this.value4 < value) {
        this.value2 = this.value3;
        this.value3 = this.value4;
        this.value4 = value;
      } else if (this.value3 < value) {
        this.value2 = this.value3;
        this.value3 = value;
      } else {
        this.value2 = value;
      }
    } else {
      if (this.value1 < value) {
        this.value0 = this.value1;
        this.value1 = value;
      } else {
        this.value0 = value;
      }
      this.high = true;
    }
  }

  get(): number {
    return this.value2;
  }
}

type Point14 = {
  x: number;
  y: number;
  z: number;
  intensity: number;
  returns: number;
  flags: number;
  classification: number;
  userData: number;
  scanAngle: number;
  pointSourceId: number;
  gpsTime: number;
};

type Point10 = {
  x: number;
  y: number;
  z: number;
  intensity: number;
  bitByte: number;
  classification: number;
  scanAngleRank: number;
  userData: number;
  pointSourceId: number;
};

class Point10Decompressor {
  private stream: ByteReader;
  private decoder: ArithmeticDecoder;
  private changedValuesModel = new ArithmeticModel(64);
  private bitByteModel = createModels(256, 256);
  private classificationModel = createModels(256, 256);
  private scanAngleRankModel = createModels(2, 256);
  private userDataModel = createModels(256, 256);
  private intensity = createIntegerDecompressor(16, 4);
  private pointSourceId = createIntegerDecompressor(16, 1);
  private dx = createIntegerDecompressor(32, 2);
  private dy = createIntegerDecompressor(32, 22);
  private z = createIntegerDecompressor(32, 20);
  private lastIntensity = new Array<number>(16).fill(0);
  private lastHeight = new Array<number>(8).fill(0);
  private lastXDiffMedian = Array.from({length: 16}, () => new StreamingMedian());
  private lastYDiffMedian = Array.from({length: 16}, () => new StreamingMedian());
  private haveLast = false;
  private last = createPoint10();

  constructor(stream: ByteReader) {
    this.stream = stream;
    this.decoder = new ArithmeticDecoder(stream);
  }

  getDecoder(): ArithmeticDecoder {
    return this.decoder;
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    if (!this.haveLast) {
      this.haveLast = true;
      this.stream.getBytes(output, outputOffset, 20);
      this.last = readPoint10(output, outputOffset);
      this.last.intensity = 0;
      return outputOffset + 20;
    }

    const changedValues = this.decoder.decodeSymbol(this.changedValuesModel);
    if (changedValues) {
      if (changedValues & (1 << 5)) {
        this.last.bitByte = this.decoder.decodeSymbol(this.bitByteModel[this.last.bitByte]);
      }

      const returnNumber = getPoint10ReturnNumber(this.last);
      const numberOfReturns = getPoint10NumberOfReturns(this.last);
      const context = NUMBER_RETURN_MAP_10_CONTEXT[numberOfReturns][returnNumber];

      if (changedValues & (1 << 4)) {
        this.last.intensity =
          this.intensity.decompress(
            this.decoder,
            this.lastIntensity[context],
            context < 3 ? context : 3
          ) & 0xffff;
        this.lastIntensity[context] = this.last.intensity;
      } else {
        this.last.intensity = this.lastIntensity[context];
      }

      if (changedValues & (1 << 3)) {
        this.last.classification = this.decoder.decodeSymbol(
          this.classificationModel[this.last.classification]
        );
      }

      if (changedValues & (1 << 2)) {
        const value = this.decoder.decodeSymbol(
          this.scanAngleRankModel[getPoint10ScanDirectionFlag(this.last)]
        );
        this.last.scanAngleRank = toInt8(this.last.scanAngleRank + value);
      }

      if (changedValues & (1 << 1)) {
        this.last.userData = this.decoder.decodeSymbol(this.userDataModel[this.last.userData]);
      }

      if (changedValues & 1) {
        this.last.pointSourceId =
          this.pointSourceId.decompress(this.decoder, this.last.pointSourceId, 0) & 0xffff;
      }
    }

    const returnNumber = getPoint10ReturnNumber(this.last);
    const numberOfReturns = getPoint10NumberOfReturns(this.last);
    const mapContext = NUMBER_RETURN_MAP_10_CONTEXT[numberOfReturns][returnNumber];
    const levelContext = NUMBER_RETURN_LEVEL_10_CONTEXT[numberOfReturns][returnNumber];

    const xMedian = this.lastXDiffMedian[mapContext].get();
    const xDiff = this.dx.decompress(this.decoder, xMedian, numberOfReturns === 1 ? 1 : 0);
    this.last.x = toInt32(this.last.x + xDiff);
    this.lastXDiffMedian[mapContext].add(xDiff);

    const yMedian = this.lastYDiffMedian[mapContext].get();
    const xKbits = Math.min(this.dx.k, 20) & ~1;
    const yDiff = this.dy.decompress(
      this.decoder,
      yMedian,
      (numberOfReturns === 1 ? 1 : 0) + xKbits
    );
    this.last.y = toInt32(this.last.y + yDiff);
    this.lastYDiffMedian[mapContext].add(yDiff);

    const zKbits = Math.min((this.dx.k + this.dy.k) >> 1, 18) & ~1;
    this.last.z = this.z.decompress(
      this.decoder,
      this.lastHeight[levelContext],
      (numberOfReturns === 1 ? 1 : 0) + zKbits
    );
    this.lastHeight[levelContext] = this.last.z;

    writePoint10(this.last, output, outputOffset);
    return outputOffset + 20;
  }

  readFirstMetadata(): void {
    this.decoder.readInitBytes();
  }
}

class RGB10Decompressor {
  private stream: ByteReader;
  private decoder: ArithmeticDecoder;
  private haveLast = false;
  private lastRed = 0;
  private lastGreen = 0;
  private lastBlue = 0;
  private usedModel = new ArithmeticModel(128);
  private diffModel = createModels(6, 256);

  constructor(stream: ByteReader, decoder: ArithmeticDecoder) {
    this.stream = stream;
    this.decoder = decoder;
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    if (!this.haveLast) {
      this.haveLast = true;
      this.stream.getBytes(output, outputOffset, 6);
      this.lastRed = readUint16(output, outputOffset);
      this.lastGreen = readUint16(output, outputOffset + 2);
      this.lastBlue = readUint16(output, outputOffset + 4);
      return outputOffset + 6;
    }

    const symbol = this.decoder.decodeSymbol(this.usedModel);
    let red = 0;
    let green = 0;
    let blue = 0;
    if (symbol & 1) {
      red = (this.decoder.decodeSymbol(this.diffModel[0]) + (this.lastRed & 0xff)) & 0xff;
    } else {
      red = this.lastRed & 0xff;
    }
    if (symbol & 2) {
      red |= ((this.decoder.decodeSymbol(this.diffModel[1]) + (this.lastRed >> 8)) & 0xff) << 8;
    } else {
      red |= this.lastRed & 0xff00;
    }

    if (symbol & 64) {
      let diff = (red & 0xff) - (this.lastRed & 0xff);
      if (symbol & 4) {
        green =
          (this.decoder.decodeSymbol(this.diffModel[2]) +
            clampUint8(diff + (this.lastGreen & 0xff))) &
          0xff;
      } else {
        green = this.lastGreen & 0xff;
      }
      if (symbol & 16) {
        diff = ((diff + ((green & 0xff) - (this.lastGreen & 0xff))) / 2) | 0;
        blue =
          (this.decoder.decodeSymbol(this.diffModel[4]) +
            clampUint8(diff + (this.lastBlue & 0xff))) &
          0xff;
      } else {
        blue = this.lastBlue & 0xff;
      }

      diff = (red >> 8) - (this.lastRed >> 8);
      if (symbol & 8) {
        green |=
          ((this.decoder.decodeSymbol(this.diffModel[3]) +
            clampUint8(diff + (this.lastGreen >> 8))) &
            0xff) <<
          8;
      } else {
        green |= this.lastGreen & 0xff00;
      }
      if (symbol & 32) {
        diff = ((diff + (green >> 8) - (this.lastGreen >> 8)) / 2) | 0;
        blue |=
          ((this.decoder.decodeSymbol(this.diffModel[5]) +
            clampUint8(diff + (this.lastBlue >> 8))) &
            0xff) <<
          8;
      } else {
        blue |= this.lastBlue & 0xff00;
      }
    } else {
      green = red;
      blue = red;
    }
    this.lastRed = red;
    this.lastGreen = green;
    this.lastBlue = blue;
    writeUint16(red, output, outputOffset);
    writeUint16(green, output, outputOffset + 2);
    writeUint16(blue, output, outputOffset + 4);
    return outputOffset + 6;
  }
}

class Byte10Decompressor {
  private stream: ByteReader;
  private decoder: ArithmeticDecoder;
  private count: number;
  private haveLast = false;
  private last: Uint8Array;
  private models: ArithmeticModel[];

  constructor(stream: ByteReader, decoder: ArithmeticDecoder, count: number) {
    this.stream = stream;
    this.decoder = decoder;
    this.count = count;
    this.last = new Uint8Array(count);
    this.models = createModels(count, 256);
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    if (this.count === 0) {
      return outputOffset;
    }
    if (!this.haveLast) {
      this.stream.getBytes(output, outputOffset, this.count);
      this.last.set(output.subarray(outputOffset, outputOffset + this.count));
      this.haveLast = true;
      return outputOffset + this.count;
    }
    for (let index = 0; index < this.count; index++) {
      const value = (this.last[index] + this.decoder.decodeSymbol(this.models[index])) & 0xff;
      output[outputOffset + index] = value;
      this.last[index] = value;
    }
    return outputOffset + this.count;
  }
}

/** Determines whether Point14 decoding preserves every field or only returned point data. */
enum Point14DecompressionMode {
  /** Preserve every field in the raw LAS point record. */
  Full,
  /** Decode only fields represented by {@link LAZPointDataTarget}. */
  PointData
}

class Point14Context {
  changedValuesModel = createModels(8, 128);
  scannerChannelModel = new ArithmeticModel(3);
  returnNumberGpsSameModel = new ArithmeticModel(13);
  numberReturnsModel = createModels(16, 16);
  returnNumberModel = createModels(16, 16);
  classModel = createModels(64, 256);
  flagModel: ArithmeticModel[] = [];
  userDataModel: ArithmeticModel[] = [];
  gpsTimeMultiModel!: ArithmeticModel;
  gpsTime0DiffModel!: ArithmeticModel;
  dx = createIntegerDecompressor(32, 2);
  dy = createIntegerDecompressor(32, 22);
  z = createIntegerDecompressor(32, 20);
  intensity = createIntegerDecompressor(16, 4);
  scanAngle!: IntegerDecompressor;
  pointSourceId!: IntegerDecompressor;
  gpsTime!: IntegerDecompressor;
  haveLast = false;
  last = createPoint14();
  lastIntensity = new Array<number>(8).fill(0);
  lastZ = new Array<number>(8).fill(0);
  lastXDiffMedian = Array.from({length: 12}, () => new StreamingMedian());
  lastYDiffMedian = Array.from({length: 12}, () => new StreamingMedian());
  lastGpsSequence = 0;
  nextGpsSequence = 0;
  lastGpsTime: number[] = [];
  lastGpsTimeDiff: number[] = [];
  multiExtremeCounter: number[] = [];
  gpsTimeChange = false;

  /** Construct context models required by the selected output mode. */
  constructor(mode: Point14DecompressionMode) {
    if (mode === Point14DecompressionMode.Full) {
      this.flagModel = createModels(64, 64);
      this.userDataModel = createModels(64, 256);
      this.gpsTimeMultiModel = new ArithmeticModel(515);
      this.gpsTime0DiffModel = new ArithmeticModel(5);
      this.scanAngle = createIntegerDecompressor(16, 2);
      this.pointSourceId = createIntegerDecompressor(16, 1);
      this.gpsTime = createIntegerDecompressor(32, 9);
      this.lastGpsTime = new Array<number>(4).fill(0);
      this.lastGpsTimeDiff = new Array<number>(4).fill(0);
      this.multiExtremeCounter = new Array<number>(4).fill(0);
    }
  }
}

class Point14Decompressor {
  private stream: ByteReader;
  private contexts: Point14Context[];
  /** Current scanner-channel context, cached because channel switches are uncommon. */
  private activeContext: Point14Context | null = null;
  /** Whether fields omitted from direct point-data output must be decoded. */
  private decompressOptionalFields: boolean;
  private xy = new ArithmeticDecoder();
  private z = new ArithmeticDecoder();
  private classification = new ArithmeticDecoder();
  private flags: ArithmeticDecoder | null;
  private intensity = new ArithmeticDecoder();
  private scanAngle: ArithmeticDecoder | null;
  private userData: ArithmeticDecoder | null;
  private pointSourceId: ArithmeticDecoder | null;
  private gpsTime: ArithmeticDecoder | null;
  private sizes: number[] = [];
  /** Actual scanner channel used by Point14 context state. */
  private currentScannerChannel = 0;
  /** LASzip v3 item context emitted to fields following Point14. */
  itemContextChannel = 0;
  /** Point14 item version controlling downstream scanner-channel propagation. */
  private itemVersion: 2 | 3 | 4;

  constructor(
    stream: ByteReader,
    mode: Point14DecompressionMode = Point14DecompressionMode.Full,
    itemVersion: 2 | 3 | 4 = 3
  ) {
    this.stream = stream;
    this.itemVersion = itemVersion;
    this.contexts = Array.from({length: 4}, () => new Point14Context(mode));
    this.decompressOptionalFields = mode === Point14DecompressionMode.Full;
    this.flags = this.decompressOptionalFields ? new ArithmeticDecoder() : null;
    this.scanAngle = this.decompressOptionalFields ? new ArithmeticDecoder() : null;
    this.userData = this.decompressOptionalFields ? new ArithmeticDecoder() : null;
    this.pointSourceId = this.decompressOptionalFields ? new ArithmeticDecoder() : null;
    this.gpsTime = this.decompressOptionalFields ? new ArithmeticDecoder() : null;
  }

  readSizes(): void {
    this.sizes = [];
    for (let index = 0; index < 9; index++) {
      this.sizes.push(this.stream.getUint32());
    }
  }

  readData(): void {
    let index = 0;
    this.xy.initStream(this.stream, this.sizes[index++]);
    this.z.initStream(this.stream, this.sizes[index++]);
    this.classification.initStream(this.stream, this.sizes[index++]);
    this.initializeOptionalStream(this.flags, this.sizes[index++]);
    this.intensity.initStream(this.stream, this.sizes[index++]);
    this.initializeOptionalStream(this.scanAngle, this.sizes[index++]);
    this.initializeOptionalStream(this.userData, this.sizes[index++]);
    this.initializeOptionalStream(this.pointSourceId, this.sizes[index++]);
    this.initializeOptionalStream(this.gpsTime, this.sizes[index++]);
  }

  /** Initialize a retained field layer or consume its compressed range. */
  private initializeOptionalStream(decoder: ArithmeticDecoder | null, byteLength: number): void {
    if (decoder) {
      decoder.initStream(this.stream, byteLength);
    } else {
      this.stream.consume(byteLength);
    }
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    const point = this.decompressPoint(output, outputOffset);
    writePoint14(point, output, outputOffset);
    return outputOffset + 30;
  }

  decompressPoint(output?: Uint8Array, outputOffset: number = 0): Point14 {
    const decompressOptionalFields = this.decompressOptionalFields;
    if (!this.activeContext) {
      const point = this.contexts[0].last;
      if (output) {
        this.stream.getBytes(output, outputOffset, 30);
        readPoint14Into(point, output, outputOffset);
      } else {
        readPoint14FromStreamInto(point, this.stream);
      }
      this.currentScannerChannel = getScannerChannel(point);
      this.itemContextChannel = this.currentScannerChannel;
      const context = this.contexts[this.currentScannerChannel];
      if (context.last !== point) {
        copyPoint14(context.last, point);
      }
      context.haveLast = true;
      if (decompressOptionalFields) {
        context.lastGpsTime[0] = context.last.gpsTime;
      }
      this.activeContext = context;
      context.lastZ.fill(context.last.z);
      context.lastIntensity.fill(context.last.intensity);
      return context.last;
    }

    const previous = this.activeContext!;
    const previousReturns = previous.last.returns;
    const previousReturnNumber = previousReturns & 0x0f;
    const changeStream =
      (previousReturnNumber === 1 ? 1 : 0) |
      ((previousReturnNumber >= previousReturns >> 4 ? 1 : 0) << 1) |
      ((previous.gpsTimeChange ? 1 : 0) << 2);
    const changedValues = this.xy.decodeSymbol(previous.changedValuesModel[changeStream]);
    const scannerChannelChanged = Boolean((changedValues >> 6) & 1);
    const pointSourceChanged = Boolean((changedValues >> 5) & 1);
    const gpsTimeChanged = Boolean((changedValues >> 4) & 1);
    const scanAngleChanged = Boolean((changedValues >> 3) & 1);
    const numberReturnsChanged = Boolean((changedValues >> 2) & 1);
    const returnNumberMinus = Boolean((changedValues >> 1) & 1);
    const returnNumberPlus = Boolean(changedValues & 1);
    const returnNumberIncrements = returnNumberPlus && !returnNumberMinus;
    const returnNumberDecrements = returnNumberMinus && !returnNumberPlus;
    const returnNumberMiscChange = returnNumberPlus && returnNumberMinus;

    this.itemContextChannel = 0;
    let scannerChannel = this.currentScannerChannel;
    let context = previous;
    if (scannerChannelChanged) {
      const diff = this.xy.decodeSymbol(previous.scannerChannelModel);
      scannerChannel = (scannerChannel + diff + 1) % 4;
      context = this.contexts[scannerChannel];
      this.activeContext = context;
      this.itemContextChannel = scannerChannel;
    }
    this.currentScannerChannel = scannerChannel;
    if (this.itemVersion >= 4) {
      this.itemContextChannel = scannerChannel;
    }

    if (!context.haveLast) {
      context.haveLast = true;
      copyPoint14(context.last, previous.last);
      context.lastZ.fill(previous.last.z);
      context.lastIntensity.fill(previous.last.intensity);
      if (decompressOptionalFields) {
        context.lastGpsTime[0] = previous.last.gpsTime;
      }
    }
    setScannerChannel(context.last, scannerChannel);

    let numberOfReturns = context.last.returns >> 4;
    let returnNumber = context.last.returns & 0x0f;
    if (numberReturnsChanged) {
      numberOfReturns = this.xy.decodeSymbol(context.numberReturnsModel[numberOfReturns]);
    }
    if (returnNumberIncrements) {
      returnNumber = (returnNumber + 1) % 16;
    } else if (returnNumberDecrements) {
      returnNumber = (returnNumber + 15) % 16;
    } else if (returnNumberMiscChange) {
      returnNumber = gpsTimeChanged
        ? this.xy.decodeSymbol(context.returnNumberModel[returnNumber])
        : (returnNumber + this.xy.decodeSymbol(context.returnNumberGpsSameModel) + 2) % 16;
    }
    context.last.returns = (numberOfReturns << 4) | returnNumber;

    const xyContext =
      (NUMBER_RETURN_MAP_6_CONTEXT[numberOfReturns][returnNumber] << 1) | (gpsTimeChanged ? 1 : 0);
    const xMedian = context.lastXDiffMedian[xyContext].get();
    const xDiff = context.dx.decompress(this.xy, xMedian, numberOfReturns === 1 ? 1 : 0);
    context.last.x = toInt32(context.last.x + xDiff);
    context.lastXDiffMedian[xyContext].add(xDiff);

    const yKbits = Math.min(context.dx.k, 20) & ~1;
    const yMedian = context.lastYDiffMedian[xyContext].get();
    const yDiff = context.dy.decompress(this.xy, yMedian, (numberOfReturns === 1 ? 1 : 0) | yKbits);
    context.last.y = toInt32(context.last.y + yDiff);
    context.lastYDiffMedian[xyContext].add(yDiff);

    if (this.z.valid) {
      const kbits = Math.min((context.dx.k + context.dy.k) >> 1, 18) & ~1;
      const zContext = NUMBER_RETURN_LEVEL_8_CONTEXT[numberOfReturns][returnNumber];
      const z = context.z.decompress(
        this.z,
        context.lastZ[zContext],
        (numberOfReturns === 1 ? 1 : 0) | kbits
      );
      context.last.z = z;
      context.lastZ[zContext] = z;
    }

    if (this.classification.valid) {
      const classContext =
        (returnNumber === 1 && returnNumber >= numberOfReturns ? 1 : 0) |
        ((context.last.classification & 0x1f) << 1);
      context.last.classification = this.classification.decodeSymbol(
        context.classModel[classContext]
      );
    }

    if (this.flags?.valid) {
      const mergedFlags = mergeFlags(context.last);
      const flags = this.flags.decodeSymbol(context.flagModel[mergedFlags]);
      setEdgeOfFlightLine(context.last, (flags >> 5) & 1);
      setScanDirectionFlag(context.last, (flags >> 4) & 1);
      setClassFlags(context.last, flags & 0x0f);
    }

    if (this.intensity.valid) {
      const intensityContext =
        (gpsTimeChanged ? 1 : 0) |
        ((returnNumber >= numberOfReturns ? 1 : 0) << 1) |
        ((returnNumber === 1 ? 1 : 0) << 2);
      const intensity = context.intensity.decompress(
        this.intensity,
        context.lastIntensity[intensityContext],
        intensityContext >> 1
      );
      context.lastIntensity[intensityContext] = intensity & 0xffff;
      context.last.intensity = intensity & 0xffff;
    }

    if (scanAngleChanged && this.scanAngle) {
      context.last.scanAngle = toInt16(
        context.scanAngle.decompress(this.scanAngle, context.last.scanAngle, gpsTimeChanged ? 1 : 0)
      );
    }

    if (this.userData?.valid) {
      const userDataContext = context.last.userData >> 2;
      context.last.userData = this.userData.decodeSymbol(context.userDataModel[userDataContext]);
    }

    if (pointSourceChanged && this.pointSourceId) {
      context.last.pointSourceId =
        context.pointSourceId.decompress(this.pointSourceId, context.last.pointSourceId, 0) &
        0xffff;
    }

    if (gpsTimeChanged && this.gpsTime) {
      this.decodeGpsTime(context);
    }
    context.gpsTimeChange = gpsTimeChanged;
    return context.last;
  }

  private decodeGpsTime(context: Point14Context): void {
    const gpsTime = this.gpsTime!;
    while (true) {
      if (context.lastGpsTimeDiff[context.lastGpsSequence] === 0) {
        const multi = gpsTime.decodeSymbol(context.gpsTime0DiffModel);
        if (multi === 0) {
          const symbol = context.gpsTime.decompress(gpsTime, 0, 0);
          context.lastGpsTimeDiff[context.lastGpsSequence] = symbol;
          context.lastGpsTime[context.lastGpsSequence] = addInt32ToFloat64Bits(
            context.lastGpsTime[context.lastGpsSequence],
            symbol
          );
          context.multiExtremeCounter[context.lastGpsSequence] = 0;
        } else if (multi === 1) {
          context.nextGpsSequence = (context.nextGpsSequence + 1) & 3;
          const lastTimeBits = float64ToBigUint64(context.lastGpsTime[context.lastGpsSequence]);
          const upper = context.gpsTime.decompress(gpsTime, Number(lastTimeBits >> 32n) | 0, 8);
          const lower = gpsTime.readInt();
          context.lastGpsTime[context.nextGpsSequence] = bigUint64ToFloat64(
            (BigInt(upper >>> 0) << 32n) | BigInt(lower)
          );
          context.lastGpsSequence = context.nextGpsSequence;
          context.lastGpsTimeDiff[context.lastGpsSequence] = 0;
          context.multiExtremeCounter[context.lastGpsSequence] = 0;
        } else {
          context.lastGpsSequence = (context.lastGpsSequence + multi - 1) & 3;
          continue;
        }
      } else {
        let multi = gpsTime.decodeSymbol(context.gpsTimeMultiModel);
        let gpsTimeDiff = 0;
        if (multi === 1) {
          const symbol = context.gpsTime.decompress(
            gpsTime,
            context.lastGpsTimeDiff[context.lastGpsSequence],
            1
          );
          context.lastGpsTime[context.lastGpsSequence] = addInt32ToFloat64Bits(
            context.lastGpsTime[context.lastGpsSequence],
            symbol
          );
          context.multiExtremeCounter[context.lastGpsSequence] = 0;
        } else if (multi < GPS_TIME_MULTI_CODE_FULL) {
          if (multi === 0) {
            gpsTimeDiff = context.gpsTime.decompress(gpsTime, 0, 7);
            context.multiExtremeCounter[context.lastGpsSequence]++;
            if (context.multiExtremeCounter[context.lastGpsSequence] > 3) {
              context.multiExtremeCounter[context.lastGpsSequence] = 0;
              context.lastGpsTimeDiff[context.lastGpsSequence] = gpsTimeDiff;
            }
          } else if (multi < GPS_TIME_MULTI) {
            const tag = multi < 10 ? 2 : 3;
            gpsTimeDiff = context.gpsTime.decompress(
              gpsTime,
              multi * context.lastGpsTimeDiff[context.lastGpsSequence],
              tag
            );
          } else if (multi === GPS_TIME_MULTI) {
            gpsTimeDiff = context.gpsTime.decompress(
              gpsTime,
              GPS_TIME_MULTI * context.lastGpsTimeDiff[context.lastGpsSequence],
              4
            );
            context.multiExtremeCounter[context.lastGpsSequence]++;
            if (context.multiExtremeCounter[context.lastGpsSequence] > 3) {
              context.multiExtremeCounter[context.lastGpsSequence] = 0;
              context.lastGpsTimeDiff[context.lastGpsSequence] = gpsTimeDiff;
            }
          } else {
            multi = GPS_TIME_MULTI - multi;
            if (multi > GPS_TIME_MULTI_MINUS) {
              gpsTimeDiff = context.gpsTime.decompress(
                gpsTime,
                multi * context.lastGpsTimeDiff[context.lastGpsSequence],
                5
              );
            } else {
              gpsTimeDiff = context.gpsTime.decompress(
                gpsTime,
                GPS_TIME_MULTI_MINUS * context.lastGpsTimeDiff[context.lastGpsSequence],
                6
              );
              context.multiExtremeCounter[context.lastGpsSequence]++;
              if (context.multiExtremeCounter[context.lastGpsSequence] > 3) {
                context.multiExtremeCounter[context.lastGpsSequence] = 0;
                context.lastGpsTimeDiff[context.lastGpsSequence] = gpsTimeDiff;
              }
            }
          }
          context.lastGpsTime[context.lastGpsSequence] = addInt32ToFloat64Bits(
            context.lastGpsTime[context.lastGpsSequence],
            gpsTimeDiff
          );
        } else if (multi === GPS_TIME_MULTI_CODE_FULL) {
          context.nextGpsSequence = (context.nextGpsSequence + 1) & 3;
          const lastTimeBits = float64ToBigUint64(context.lastGpsTime[context.lastGpsSequence]);
          const upper = context.gpsTime.decompress(gpsTime, Number(lastTimeBits >> 32n) | 0, 8);
          const lower = gpsTime.readInt();
          context.lastGpsTime[context.nextGpsSequence] = bigUint64ToFloat64(
            (BigInt(upper >>> 0) << 32n) | BigInt(lower)
          );
          context.lastGpsSequence = context.nextGpsSequence;
          context.lastGpsTimeDiff[context.lastGpsSequence] = 0;
          context.multiExtremeCounter[context.lastGpsSequence] = 0;
        } else if (multi >= GPS_TIME_MULTI_CODE_FULL) {
          context.lastGpsSequence =
            (context.lastGpsSequence + multi - GPS_TIME_MULTI_CODE_FULL) & 3;
          continue;
        }
      }
      context.last.gpsTime = context.lastGpsTime[context.lastGpsSequence];
      break;
    }
  }
}

class RGB14Context {
  haveLast = false;
  lastRed = 0;
  lastGreen = 0;
  lastBlue = 0;
  usedModel = new ArithmeticModel(128);
  diffModel = createModels(6, 256);
}

class RGB14Decompressor {
  private stream: ByteReader;
  private contexts = Array.from({length: 4}, () => new RGB14Context());
  /** Current scanner-channel context, cached because channel switches are uncommon. */
  private activeContext: RGB14Context | null = null;
  private lastChannel = -1;
  private rgbCount = 0;
  private rgb = new ArithmeticDecoder();
  decodedRed = 0;
  decodedGreen = 0;
  decodedBlue = 0;
  /** RGB item version controlling scanner-channel predictor selection. */
  private itemVersion: 2 | 3 | 4;

  constructor(stream: ByteReader, itemVersion: 2 | 3 | 4 = 3) {
    this.stream = stream;
    this.itemVersion = itemVersion;
  }

  readSizes(): void {
    this.rgbCount = this.stream.getUint32();
  }

  readData(): void {
    this.rgb.initStream(this.stream, this.rgbCount);
  }

  decompress(output: Uint8Array, outputOffset: number, scannerChannel: number): number {
    this.decompressRgb(scannerChannel);
    writeUint16(this.decodedRed, output, outputOffset);
    writeUint16(this.decodedGreen, output, outputOffset + 2);
    writeUint16(this.decodedBlue, output, outputOffset + 4);
    return outputOffset + 6;
  }

  decompressRgb(scannerChannel: number): void {
    if (this.lastChannel === -1) {
      this.decodedRed = this.stream.getByte() | (this.stream.getByte() << 8);
      this.decodedGreen = this.stream.getByte() | (this.stream.getByte() << 8);
      this.decodedBlue = this.stream.getByte() | (this.stream.getByte() << 8);
      const context = this.contexts[scannerChannel];
      context.lastRed = this.decodedRed;
      context.lastGreen = this.decodedGreen;
      context.lastBlue = this.decodedBlue;
      context.haveLast = true;
      this.lastChannel = scannerChannel;
      this.activeContext = context;
      return;
    }
    if (this.rgbCount === 0) {
      const context = this.activeContext!;
      this.decodedRed = context.lastRed;
      this.decodedGreen = context.lastGreen;
      this.decodedBlue = context.lastBlue;
      return;
    }
    let context = this.activeContext!;
    let lastContext = context;
    if (scannerChannel !== this.lastChannel) {
      const previous = context;
      context = this.contexts[scannerChannel];
      lastContext = previous;
      this.lastChannel = scannerChannel;
      if (!context.haveLast) {
        context.haveLast = true;
        context.lastRed = previous.lastRed;
        context.lastGreen = previous.lastGreen;
        context.lastBlue = previous.lastBlue;
        lastContext = context;
      }
      if (this.itemVersion >= 4) {
        lastContext = context;
      }
      this.activeContext = context;
    }
    const symbol = this.rgb.decodeSymbol(context.usedModel);
    let red = 0;
    let green = 0;
    let blue = 0;
    if (symbol & 1) {
      const correction = this.rgb.decodeSymbol(context.diffModel[0]);
      red = (correction + (lastContext.lastRed & 0xff)) & 0xff;
    } else {
      red = lastContext.lastRed & 0xff;
    }
    if (symbol & 2) {
      const correction = this.rgb.decodeSymbol(context.diffModel[1]);
      red |= ((correction + (lastContext.lastRed >> 8)) & 0xff) << 8;
    } else {
      red |= lastContext.lastRed & 0xff00;
    }
    if (symbol & 64) {
      let diff = (red & 0xff) - (lastContext.lastRed & 0xff);
      if (symbol & 4) {
        const correction = this.rgb.decodeSymbol(context.diffModel[2]);
        green = (correction + clampUint8(diff + (lastContext.lastGreen & 0xff))) & 0xff;
      } else {
        green = lastContext.lastGreen & 0xff;
      }
      if (symbol & 16) {
        const correction = this.rgb.decodeSymbol(context.diffModel[4]);
        diff = ((diff + ((green & 0xff) - (lastContext.lastGreen & 0xff))) / 2) | 0;
        blue = (correction + clampUint8(diff + (lastContext.lastBlue & 0xff))) & 0xff;
      } else {
        blue = lastContext.lastBlue & 0xff;
      }
      diff = (red >> 8) - (lastContext.lastRed >> 8);
      if (symbol & 8) {
        const correction = this.rgb.decodeSymbol(context.diffModel[3]);
        green |= ((correction + clampUint8(diff + (lastContext.lastGreen >> 8))) & 0xff) << 8;
      } else {
        green |= lastContext.lastGreen & 0xff00;
      }
      if (symbol & 32) {
        const correction = this.rgb.decodeSymbol(context.diffModel[5]);
        diff = ((diff + (green >> 8) - (lastContext.lastGreen >> 8)) / 2) | 0;
        blue |= ((correction + clampUint8(diff + (lastContext.lastBlue >> 8))) & 0xff) << 8;
      } else {
        blue |= lastContext.lastBlue & 0xff00;
      }
    } else {
      green = red;
      blue = red;
    }
    lastContext.lastRed = red;
    lastContext.lastGreen = green;
    lastContext.lastBlue = blue;
    this.decodedRed = red;
    this.decodedGreen = green;
    this.decodedBlue = blue;
  }
}

class NIR14Context {
  haveLast = false;
  lastValue = 0;
  usedModel = new ArithmeticModel(4);
  diffModel = createModels(2, 256);
}

class NIR14Decompressor {
  private stream: ByteReader;
  private contexts = Array.from({length: 4}, () => new NIR14Context());
  private lastChannel = -1;
  private nirCount = 0;
  private nir = new ArithmeticDecoder();
  /** RGBNIR item version controlling scanner-channel predictor selection. */
  private itemVersion: 2 | 3 | 4;

  constructor(stream: ByteReader, itemVersion: 2 | 3 | 4 = 3) {
    this.stream = stream;
    this.itemVersion = itemVersion;
  }

  readSizes(): void {
    this.nirCount = this.stream.getUint32();
  }

  readData(): void {
    this.nir.initStream(this.stream, this.nirCount);
  }

  decompress(output: Uint8Array, outputOffset: number, scannerChannel: number): number {
    if (this.lastChannel === -1) {
      this.stream.getBytes(output, outputOffset, 2);
      const context = this.contexts[scannerChannel];
      context.lastValue = readUint16(output, outputOffset);
      context.haveLast = true;
      this.lastChannel = scannerChannel;
      return outputOffset + 2;
    }
    if (this.nirCount === 0) {
      writeUint16(this.contexts[this.lastChannel].lastValue, output, outputOffset);
      return outputOffset + 2;
    }
    const context = this.contexts[scannerChannel];
    let lastContext = this.contexts[this.lastChannel];
    if (scannerChannel !== this.lastChannel) {
      this.lastChannel = scannerChannel;
      if (!context.haveLast) {
        context.haveLast = true;
        context.lastValue = lastContext.lastValue;
        lastContext = context;
      }
      if (this.itemVersion >= 4) {
        lastContext = context;
      }
    }
    const symbol = this.nir.decodeSymbol(context.usedModel);
    let value =
      symbol & 1
        ? (this.nir.decodeSymbol(context.diffModel[0]) + (lastContext.lastValue & 0xff)) & 0xff
        : lastContext.lastValue & 0xff;
    value |=
      symbol & 2
        ? ((this.nir.decodeSymbol(context.diffModel[1]) + (lastContext.lastValue >> 8)) & 0xff) << 8
        : lastContext.lastValue & 0xff00;
    lastContext.lastValue = value;
    writeUint16(value, output, outputOffset);
    return outputOffset + 2;
  }
}

/** Arithmetic state and last waveform packet reference for one scanner channel. */
class WavePacket14Context {
  /** Whether this scanner channel has inherited or decoded a waveform reference. */
  haveLast = false;
  /** Last waveform packet descriptor index. */
  descriptorIndex = 0;
  /** Last waveform packet byte offset, kept losslessly as an unsigned 64-bit integer. */
  offset = 0n;
  /** Last waveform packet byte size. */
  packetSize = 0;
  /** Raw IEEE-754 bits for the last return-point location. */
  returnPointBits = 0;
  /** Raw IEEE-754 bits for the last waveform X vector component. */
  xBits = 0;
  /** Raw IEEE-754 bits for the last waveform Y vector component. */
  yBits = 0;
  /** Raw IEEE-754 bits for the last waveform Z vector component. */
  zBits = 0;
  /** Last signed 32-bit offset difference used by the integer predictor. */
  lastOffsetDifference = 0;
  /** Last offset coding symbol, which selects the next four-symbol model. */
  lastOffsetDifferenceSymbol = 0;
  /** Waveform descriptor arithmetic model. */
  descriptorModel = new ArithmeticModel(256);
  /** Context-dependent waveform offset coding models. */
  offsetDifferenceModels = createModels(4, 4);
  /** Integer decompressor for signed waveform offset differences. */
  offsetDifferenceDecompressor = createIntegerDecompressor(32, 1);
  /** Integer decompressor for waveform packet sizes. */
  packetSizeDecompressor = createIntegerDecompressor(32, 1);
  /** Integer decompressor for raw return-point float bits. */
  returnPointDecompressor = createIntegerDecompressor(32, 1);
  /** Shared three-context decompressor for raw X, Y, and Z float bits. */
  vectorDecompressor = createIntegerDecompressor(32, 3);
}

/** Decoder for the independent LASzip 1.4 waveform packet reference layer. */
class WavePacket14Decompressor {
  /** Compressed chunk source. */
  private stream: ByteReader;
  /** Per-scanner-channel arithmetic and prediction state. */
  private contexts = Array.from({length: 4}, () => new WavePacket14Context());
  /** Scanner channel used by the previous point. */
  private lastChannel = -1;
  /** Compressed waveform layer byte length. */
  private wavePacketByteCount = 0;
  /** Arithmetic decoder bounded to the waveform layer. */
  private decoder = new ArithmeticDecoder();
  /** WavePacket14 item version selected by the LASzip VLR. */
  private itemVersion: 3 | 4;

  constructor(stream: ByteReader, itemVersion: 3 | 4) {
    this.stream = stream;
    this.itemVersion = itemVersion;
  }

  /** Read the compressed waveform layer byte length. */
  readSizes(): void {
    this.wavePacketByteCount = this.stream.getUint32();
  }

  /** Bind the arithmetic decoder to the compressed waveform layer. */
  readData(): void {
    this.decoder.initStream(this.stream, this.wavePacketByteCount);
  }

  /** Decode one 29-byte LAS waveform packet reference. */
  decompress(output: Uint8Array, outputOffset: number, scannerChannel: number): number {
    if (this.lastChannel === -1) {
      this.stream.getBytes(output, outputOffset, 29);
      const context = this.contexts[scannerChannel];
      this.readContext(context, output, outputOffset);
      context.haveLast = true;
      this.lastChannel = scannerChannel;
      return outputOffset + 29;
    }

    const previousContext = this.contexts[this.lastChannel];
    const context = this.contexts[scannerChannel];
    let lastWavePacketContext = context;
    if (scannerChannel !== this.lastChannel) {
      lastWavePacketContext = previousContext;
      if (!context.haveLast) {
        this.copyLastWavePacket(context, previousContext);
        context.haveLast = true;
        lastWavePacketContext = context;
      } else if (this.itemVersion >= 4) {
        lastWavePacketContext = context;
      }
      this.lastChannel = scannerChannel;
    }

    if (this.wavePacketByteCount) {
      this.decodeContext(context, lastWavePacketContext);
    }
    this.writeContext(lastWavePacketContext, output, outputOffset);
    return outputOffset + 29;
  }

  /** Decode changed waveform fields into one scanner-channel context. */
  private decodeContext(
    codingContext: WavePacket14Context,
    lastWavePacketContext: WavePacket14Context
  ): void {
    lastWavePacketContext.descriptorIndex = this.decoder.decodeSymbol(
      codingContext.descriptorModel
    );
    const offsetDifferenceSymbol = this.decoder.decodeSymbol(
      codingContext.offsetDifferenceModels[codingContext.lastOffsetDifferenceSymbol]
    );
    codingContext.lastOffsetDifferenceSymbol = offsetDifferenceSymbol;
    switch (offsetDifferenceSymbol) {
      case 0:
        break;
      case 1:
        lastWavePacketContext.offset = BigInt.asUintN(
          64,
          lastWavePacketContext.offset + BigInt(lastWavePacketContext.packetSize)
        );
        break;
      case 2:
        codingContext.lastOffsetDifference = codingContext.offsetDifferenceDecompressor.decompress(
          this.decoder,
          codingContext.lastOffsetDifference,
          0
        );
        lastWavePacketContext.offset = BigInt.asUintN(
          64,
          lastWavePacketContext.offset + BigInt(codingContext.lastOffsetDifference)
        );
        break;
      default:
        lastWavePacketContext.offset = this.decoder.readUint64();
        break;
    }

    lastWavePacketContext.packetSize =
      codingContext.packetSizeDecompressor.decompress(
        this.decoder,
        lastWavePacketContext.packetSize | 0,
        0
      ) >>> 0;
    lastWavePacketContext.returnPointBits = codingContext.returnPointDecompressor.decompress(
      this.decoder,
      lastWavePacketContext.returnPointBits,
      0
    );
    lastWavePacketContext.xBits = codingContext.vectorDecompressor.decompress(
      this.decoder,
      lastWavePacketContext.xBits,
      0
    );
    lastWavePacketContext.yBits = codingContext.vectorDecompressor.decompress(
      this.decoder,
      lastWavePacketContext.yBits,
      1
    );
    lastWavePacketContext.zBits = codingContext.vectorDecompressor.decompress(
      this.decoder,
      lastWavePacketContext.zBits,
      2
    );
  }

  /** Initialize one context from the previous scanner channel's last reference. */
  private copyLastWavePacket(target: WavePacket14Context, source: WavePacket14Context): void {
    target.descriptorIndex = source.descriptorIndex;
    target.offset = source.offset;
    target.packetSize = source.packetSize;
    target.returnPointBits = source.returnPointBits;
    target.xBits = source.xBits;
    target.yBits = source.yBits;
    target.zBits = source.zBits;
  }

  /** Read one uncompressed waveform reference into a decoder context. */
  private readContext(context: WavePacket14Context, input: Uint8Array, inputOffset: number): void {
    context.descriptorIndex = input[inputOffset];
    context.offset = readBigUint64(input, inputOffset + 1);
    context.packetSize = readUint32(input, inputOffset + 9);
    context.returnPointBits = readInt32(input, inputOffset + 13);
    context.xBits = readInt32(input, inputOffset + 17);
    context.yBits = readInt32(input, inputOffset + 21);
    context.zBits = readInt32(input, inputOffset + 25);
  }

  /** Write one decoder context as an uncompressed 29-byte waveform reference. */
  private writeContext(
    context: WavePacket14Context,
    output: Uint8Array,
    outputOffset: number
  ): void {
    output[outputOffset] = context.descriptorIndex;
    writeBigUint64(context.offset, output, outputOffset + 1);
    writeUint32(context.packetSize, output, outputOffset + 9);
    writeInt32(context.returnPointBits, output, outputOffset + 13);
    writeInt32(context.xBits, output, outputOffset + 17);
    writeInt32(context.yBits, output, outputOffset + 21);
    writeInt32(context.zBits, output, outputOffset + 25);
  }
}

class Byte14Context {
  haveLast = false;
  last: Uint8Array;
  byteModel: ArithmeticModel[];

  constructor(count: number) {
    this.last = new Uint8Array(count);
    this.byteModel = createModels(count, 256);
  }
}

class Byte14Decompressor {
  private stream: ByteReader;
  private count: number;
  private contexts: Byte14Context[];
  private lastChannel = -1;
  private byteCount: number[];
  private byteDecoder: ArithmeticDecoder[];
  /** Byte14 item version controlling scanner-channel predictor selection. */
  private itemVersion: 2 | 3 | 4;

  constructor(stream: ByteReader, count: number, itemVersion: 2 | 3 | 4 = 3) {
    this.stream = stream;
    this.count = count;
    this.itemVersion = itemVersion;
    this.contexts = Array.from({length: 4}, () => new Byte14Context(count));
    this.byteCount = new Array<number>(count).fill(0);
    this.byteDecoder = Array.from({length: count}, () => new ArithmeticDecoder());
  }

  readSizes(): void {
    for (let index = 0; index < this.count; index++) {
      this.byteCount[index] = this.stream.getUint32();
    }
  }

  readData(): void {
    for (let index = 0; index < this.count; index++) {
      this.byteDecoder[index].initStream(this.stream, this.byteCount[index]);
    }
  }

  decompress(output: Uint8Array, outputOffset: number, scannerChannel: number): number {
    if (this.lastChannel === -1) {
      this.stream.getBytes(output, outputOffset, this.count);
      const context = this.contexts[scannerChannel];
      context.last.set(output.subarray(outputOffset, outputOffset + this.count));
      context.haveLast = true;
      this.lastChannel = scannerChannel;
      return outputOffset + this.count;
    }
    const context = this.contexts[scannerChannel];
    let lastByte = this.contexts[this.lastChannel].last;
    if (scannerChannel !== this.lastChannel) {
      this.lastChannel = scannerChannel;
      if (!context.haveLast) {
        context.haveLast = true;
        context.last.set(lastByte);
        lastByte = this.contexts[this.lastChannel].last;
      }
      if (this.itemVersion >= 4) {
        lastByte = context.last;
      }
    }
    for (let index = 0; index < this.count; index++) {
      if (this.byteCount[index]) {
        const value =
          (lastByte[index] + this.byteDecoder[index].decodeSymbol(context.byteModel[index])) & 0xff;
        output[outputOffset + index] = value;
        lastByte[index] = value;
      } else {
        output[outputOffset + index] = lastByte[index];
      }
    }
    return outputOffset + this.count;
  }
}

type PointDecompressor = {
  decompress(output: Uint8Array, outputOffset: number): number;
  decompressPointData?(target: LAZPointDataTarget, targetPointIndex: number): void;
  decompressPointDataBatch?(target: LAZPointDataTarget, pointCount: number): void;
};

function createPointDecompressor(
  stream: ByteReader,
  metadata: LAZChunkMetadata,
  outputMode: LAZChunkDecoderOutputMode
): PointDecompressor {
  const extraByteCount = getExtraByteCount(metadata);
  switch (metadata.pointDataRecordFormat) {
    case 0:
      return new PointFormat0Decompressor(stream, extraByteCount);
    case 1:
      return new PointFormat1Decompressor(stream, extraByteCount);
    case 2:
      return new PointFormat2Decompressor(stream, extraByteCount);
    case 3:
      return new PointFormat3Decompressor(stream, extraByteCount);
    case 6:
      return new PointFormat6Decompressor(stream, extraByteCount, outputMode, metadata);
    case 7:
      return new PointFormat7Decompressor(stream, extraByteCount, outputMode, metadata);
    case 8:
      return new PointFormat8Decompressor(stream, extraByteCount, outputMode, metadata);
    case 9:
      return new PointFormat9Decompressor(stream, extraByteCount, outputMode, metadata);
    case 10:
      return new PointFormat10Decompressor(stream, extraByteCount, outputMode, metadata);
    default:
      throw new Error(
        `TypeScript LAZ decoder does not support point format ${metadata.pointDataRecordFormat}`
      );
  }
}

/** Return whether a point format has a direct typed-array output path. */
function supportsDirectPointDataOutput(pointDataRecordFormat: number): boolean {
  return pointDataRecordFormat >= 6 && pointDataRecordFormat <= 10;
}

class PointFormat0Decompressor implements PointDecompressor {
  private point: Point10Decompressor;
  private bytes: Byte10Decompressor;
  private first = true;

  constructor(stream: ByteReader, extraByteCount: number) {
    this.point = new Point10Decompressor(stream);
    this.bytes = new Byte10Decompressor(stream, this.point.getDecoder(), extraByteCount);
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    outputOffset = this.point.decompress(output, outputOffset);
    outputOffset = this.bytes.decompress(output, outputOffset);
    this.readFirstMetadata();
    return outputOffset;
  }

  private readFirstMetadata(): void {
    if (this.first) {
      this.point.readFirstMetadata();
      this.first = false;
    }
  }
}

class GpsTime10Decompressor {
  private stream: ByteReader;
  private decoder: ArithmeticDecoder;
  private gpsTimeMultiModel = new ArithmeticModel(516);
  private gpsTime0DiffModel = new ArithmeticModel(6);
  private gpsTime = createIntegerDecompressor(32, 9);
  private lastGpsSequence = 0;
  private nextGpsSequence = 0;
  private lastGpsTime = new Array<number>(4).fill(0);
  private lastGpsTimeDiff = new Array<number>(4).fill(0);
  private multiExtremeCounter = new Array<number>(4).fill(0);
  private haveLast = false;

  constructor(stream: ByteReader, decoder: ArithmeticDecoder) {
    this.stream = stream;
    this.decoder = decoder;
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    if (!this.haveLast) {
      this.stream.getBytes(output, outputOffset, 8);
      this.lastGpsTime[0] = readFloat64(output, outputOffset);
      this.haveLast = true;
      return outputOffset + 8;
    }

    this.decodeGpsTime();
    writeFloat64(this.lastGpsTime[this.lastGpsSequence], output, outputOffset);
    return outputOffset + 8;
  }

  private decodeGpsTime(): void {
    while (true) {
      if (this.lastGpsTimeDiff[this.lastGpsSequence] === 0) {
        const multi = this.decoder.decodeSymbol(this.gpsTime0DiffModel);
        if (multi === 0) {
          break;
        }
        if (multi === 1) {
          const gpsTimeDiff = this.gpsTime.decompress(this.decoder, 0, 0);
          this.lastGpsTimeDiff[this.lastGpsSequence] = gpsTimeDiff;
          this.lastGpsTime[this.lastGpsSequence] = addInt32ToFloat64Bits(
            this.lastGpsTime[this.lastGpsSequence],
            gpsTimeDiff
          );
          this.multiExtremeCounter[this.lastGpsSequence] = 0;
          break;
        }
        if (multi === 2) {
          this.readFullGpsTime();
          break;
        }
        this.lastGpsSequence = (this.lastGpsSequence + multi - 2) & 3;
        continue;
      }

      let multi = this.decoder.decodeSymbol(this.gpsTimeMultiModel);
      let gpsTimeDiff = 0;
      if (multi === 1) {
        const symbol = this.gpsTime.decompress(
          this.decoder,
          this.lastGpsTimeDiff[this.lastGpsSequence],
          1
        );
        this.lastGpsTime[this.lastGpsSequence] = addInt32ToFloat64Bits(
          this.lastGpsTime[this.lastGpsSequence],
          symbol
        );
        this.multiExtremeCounter[this.lastGpsSequence] = 0;
      } else if (multi < GPS_TIME10_MULTI_UNCHANGED) {
        if (multi === 0) {
          gpsTimeDiff = this.gpsTime.decompress(this.decoder, 0, 7);
          this.multiExtremeCounter[this.lastGpsSequence]++;
          if (this.multiExtremeCounter[this.lastGpsSequence] > 3) {
            this.multiExtremeCounter[this.lastGpsSequence] = 0;
            this.lastGpsTimeDiff[this.lastGpsSequence] = gpsTimeDiff;
          }
        } else if (multi < GPS_TIME_MULTI) {
          const tag = multi < 10 ? 2 : 3;
          gpsTimeDiff = this.gpsTime.decompress(
            this.decoder,
            multi * this.lastGpsTimeDiff[this.lastGpsSequence],
            tag
          );
        } else if (multi === GPS_TIME_MULTI) {
          gpsTimeDiff = this.gpsTime.decompress(
            this.decoder,
            GPS_TIME_MULTI * this.lastGpsTimeDiff[this.lastGpsSequence],
            4
          );
          this.multiExtremeCounter[this.lastGpsSequence]++;
          if (this.multiExtremeCounter[this.lastGpsSequence] > 3) {
            this.multiExtremeCounter[this.lastGpsSequence] = 0;
            this.lastGpsTimeDiff[this.lastGpsSequence] = gpsTimeDiff;
          }
        } else {
          multi = GPS_TIME_MULTI - multi;
          if (multi > GPS_TIME_MULTI_MINUS) {
            gpsTimeDiff = this.gpsTime.decompress(
              this.decoder,
              multi * this.lastGpsTimeDiff[this.lastGpsSequence],
              5
            );
          } else {
            gpsTimeDiff = this.gpsTime.decompress(
              this.decoder,
              GPS_TIME_MULTI_MINUS * this.lastGpsTimeDiff[this.lastGpsSequence],
              6
            );
            this.multiExtremeCounter[this.lastGpsSequence]++;
            if (this.multiExtremeCounter[this.lastGpsSequence] > 3) {
              this.multiExtremeCounter[this.lastGpsSequence] = 0;
              this.lastGpsTimeDiff[this.lastGpsSequence] = gpsTimeDiff;
            }
          }
        }
        this.lastGpsTime[this.lastGpsSequence] = addInt32ToFloat64Bits(
          this.lastGpsTime[this.lastGpsSequence],
          gpsTimeDiff
        );
      } else if (multi === GPS_TIME10_MULTI_CODE_FULL) {
        this.readFullGpsTime();
      } else if (multi >= GPS_TIME10_MULTI_CODE_FULL) {
        this.lastGpsSequence = (this.lastGpsSequence + multi - GPS_TIME10_MULTI_CODE_FULL) & 3;
        continue;
      }
      break;
    }
  }

  private readFullGpsTime(): void {
    this.nextGpsSequence = (this.nextGpsSequence + 1) & 3;
    const lastTimeBits = float64ToBigUint64(this.lastGpsTime[this.lastGpsSequence]);
    const upper = this.gpsTime.decompress(this.decoder, Number(lastTimeBits >> 32n) | 0, 8);
    const lower = this.decoder.readInt();
    this.lastGpsTime[this.nextGpsSequence] = bigUint64ToFloat64(
      (BigInt(upper >>> 0) << 32n) | BigInt(lower)
    );
    this.lastGpsSequence = this.nextGpsSequence;
    this.lastGpsTimeDiff[this.lastGpsSequence] = 0;
    this.multiExtremeCounter[this.lastGpsSequence] = 0;
  }
}

class PointFormat1Decompressor implements PointDecompressor {
  private point: Point10Decompressor;
  private gpsTime: GpsTime10Decompressor;
  private bytes: Byte10Decompressor;
  private first = true;

  constructor(stream: ByteReader, extraByteCount: number) {
    this.point = new Point10Decompressor(stream);
    const decoder = this.point.getDecoder();
    this.gpsTime = new GpsTime10Decompressor(stream, decoder);
    this.bytes = new Byte10Decompressor(stream, decoder, extraByteCount);
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    outputOffset = this.point.decompress(output, outputOffset);
    outputOffset = this.gpsTime.decompress(output, outputOffset);
    outputOffset = this.bytes.decompress(output, outputOffset);
    this.readFirstMetadata();
    return outputOffset;
  }

  private readFirstMetadata(): void {
    if (this.first) {
      this.point.readFirstMetadata();
      this.first = false;
    }
  }
}

class PointFormat2Decompressor implements PointDecompressor {
  private point: Point10Decompressor;
  private rgb: RGB10Decompressor;
  private bytes: Byte10Decompressor;
  private first = true;

  constructor(stream: ByteReader, extraByteCount: number) {
    this.point = new Point10Decompressor(stream);
    const decoder = this.point.getDecoder();
    this.rgb = new RGB10Decompressor(stream, decoder);
    this.bytes = new Byte10Decompressor(stream, decoder, extraByteCount);
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    outputOffset = this.point.decompress(output, outputOffset);
    outputOffset = this.rgb.decompress(output, outputOffset);
    outputOffset = this.bytes.decompress(output, outputOffset);
    this.readFirstMetadata();
    return outputOffset;
  }

  private readFirstMetadata(): void {
    if (this.first) {
      this.point.readFirstMetadata();
      this.first = false;
    }
  }
}

class PointFormat3Decompressor implements PointDecompressor {
  private point: Point10Decompressor;
  private gpsTime: GpsTime10Decompressor;
  private rgb: RGB10Decompressor;
  private bytes: Byte10Decompressor;
  private first = true;

  constructor(stream: ByteReader, extraByteCount: number) {
    this.point = new Point10Decompressor(stream);
    const decoder = this.point.getDecoder();
    this.gpsTime = new GpsTime10Decompressor(stream, decoder);
    this.rgb = new RGB10Decompressor(stream, decoder);
    this.bytes = new Byte10Decompressor(stream, decoder, extraByteCount);
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    outputOffset = this.point.decompress(output, outputOffset);
    outputOffset = this.gpsTime.decompress(output, outputOffset);
    outputOffset = this.rgb.decompress(output, outputOffset);
    outputOffset = this.bytes.decompress(output, outputOffset);
    this.readFirstMetadata();
    return outputOffset;
  }

  private readFirstMetadata(): void {
    if (this.first) {
      this.point.readFirstMetadata();
      this.first = false;
    }
  }
}

class PointFormat6Decompressor implements PointDecompressor {
  private stream: ByteReader;
  private point: Point14Decompressor;
  private bytes: Byte14Decompressor | null;
  /** Extra bytes stored with the first point and in independent later layers. */
  private extraByteCount: number;
  private first = true;

  constructor(
    stream: ByteReader,
    extraByteCount: number,
    outputMode: LAZChunkDecoderOutputMode,
    metadata: LAZChunkMetadata
  ) {
    this.stream = stream;
    this.extraByteCount = extraByteCount;
    this.point = new Point14Decompressor(
      stream,
      outputMode === 'raw' ? Point14DecompressionMode.Full : Point14DecompressionMode.PointData,
      metadata.point14ItemVersion ?? 3
    );
    this.bytes =
      outputMode === 'raw' && extraByteCount
        ? new Byte14Decompressor(stream, extraByteCount, metadata.byte14ItemVersion ?? 3)
        : null;
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    outputOffset = this.point.decompress(output, outputOffset);
    if (this.bytes) {
      outputOffset = this.bytes.decompress(output, outputOffset, this.point.itemContextChannel);
    }
    this.readFirstMetadata();
    return outputOffset;
  }

  decompressPointData(target: LAZPointDataTarget, targetPointIndex: number): void {
    const point = this.point.decompressPoint();
    if (this.first && this.extraByteCount) {
      this.stream.consume(this.extraByteCount);
    }
    this.readFirstMetadata();
    writePoint14ToPointDataTarget(point, target, targetPointIndex);
  }

  decompressPointDataBatch(target: LAZPointDataTarget, pointCount: number): void {
    const positions = target.positions;
    const intensities = target.intensities;
    const classifications = target.classifications;
    const scale = target.scale;
    const offset = target.offset;
    let targetPointIndex = target.pointOffset;

    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      const point = this.point.decompressPoint();
      if (this.first && this.extraByteCount) {
        this.stream.consume(this.extraByteCount);
      }
      this.readFirstMetadata();
      writePoint14ToPointDataArrays(
        point,
        positions,
        intensities,
        classifications,
        scale,
        offset,
        targetPointIndex++
      );
    }
  }

  private readFirstMetadata(): void {
    if (this.first) {
      this.stream.getUint32();
      this.point.readSizes();
      let skippedExtraByteLength = 0;
      if (this.bytes) {
        this.bytes.readSizes();
      } else {
        for (let index = 0; index < this.extraByteCount; index++) {
          skippedExtraByteLength += this.stream.getUint32();
        }
      }
      this.point.readData();
      if (this.bytes) {
        this.bytes.readData();
      } else {
        this.stream.consume(skippedExtraByteLength);
      }
      this.first = false;
    }
  }
}

class PointFormat7Decompressor implements PointDecompressor {
  private stream: ByteReader;
  private point: Point14Decompressor;
  private rgb: RGB14Decompressor;
  private bytes: Byte14Decompressor | null;
  /** Extra bytes stored with the first point and in independent later layers. */
  private extraByteCount: number;
  private pointScratch = new Uint8Array(30);
  private first = true;

  constructor(
    stream: ByteReader,
    extraByteCount: number,
    outputMode: LAZChunkDecoderOutputMode,
    metadata: LAZChunkMetadata
  ) {
    this.stream = stream;
    this.extraByteCount = extraByteCount;
    this.point = new Point14Decompressor(
      stream,
      outputMode === 'raw' ? Point14DecompressionMode.Full : Point14DecompressionMode.PointData,
      metadata.point14ItemVersion ?? 3
    );
    this.rgb = new RGB14Decompressor(stream, metadata.rgb14ItemVersion ?? 3);
    this.bytes =
      outputMode === 'raw' && extraByteCount
        ? new Byte14Decompressor(stream, extraByteCount, metadata.byte14ItemVersion ?? 3)
        : null;
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    outputOffset = this.point.decompress(output, outputOffset);
    outputOffset = this.rgb.decompress(output, outputOffset, this.point.itemContextChannel);
    if (this.bytes) {
      outputOffset = this.bytes.decompress(output, outputOffset, this.point.itemContextChannel);
    }
    this.readFirstMetadata();
    return outputOffset;
  }

  decompressPointData(target: LAZPointDataTarget, targetPointIndex: number): void {
    const point = this.point.decompressPoint(this.pointScratch, 0);
    this.rgb.decompressRgb(this.point.itemContextChannel);
    // The first point stores extra bytes before the layered stream metadata.
    if (this.first && this.extraByteCount) {
      this.stream.consume(this.extraByteCount);
    }
    this.readFirstMetadata();
    writePoint14ToPointDataTarget(point, target, targetPointIndex);
    writeRgbToPointDataTarget(
      this.rgb.decodedRed,
      this.rgb.decodedGreen,
      this.rgb.decodedBlue,
      target,
      targetPointIndex
    );
  }

  decompressPointDataBatch(target: LAZPointDataTarget, pointCount: number): void {
    const positions = target.positions;
    const intensities = target.intensities;
    const classifications = target.classifications;
    const colors = target.colors;
    const rawColors = target.rawColors;
    const scale = target.scale;
    const offset = target.offset;
    let targetPointIndex = target.pointOffset;

    // The first point stores extra bytes before the layered stream metadata.
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      const point = this.point.decompressPoint(this.pointScratch, 0);
      this.rgb.decompressRgb(this.point.itemContextChannel);
      if (this.first && this.extraByteCount) {
        this.stream.consume(this.extraByteCount);
      }
      this.readFirstMetadata();
      writePoint14ToPointDataArrays(
        point,
        positions,
        intensities,
        classifications,
        scale,
        offset,
        targetPointIndex
      );
      if (colors) {
        const colorOffset = targetPointIndex * 4;
        colors[colorOffset] = this.rgb.decodedRed & 0xff;
        colors[colorOffset + 1] = this.rgb.decodedGreen & 0xff;
        colors[colorOffset + 2] = this.rgb.decodedBlue & 0xff;
        colors[colorOffset + 3] = 255;
      } else if (rawColors) {
        const colorOffset = targetPointIndex * 3;
        rawColors[colorOffset] = this.rgb.decodedRed;
        rawColors[colorOffset + 1] = this.rgb.decodedGreen;
        rawColors[colorOffset + 2] = this.rgb.decodedBlue;
      }
      targetPointIndex++;
    }
  }

  private readFirstMetadata(): void {
    if (this.first) {
      this.stream.getUint32();
      this.point.readSizes();
      this.rgb.readSizes();
      let skippedExtraByteLength = 0;
      if (this.bytes) {
        this.bytes.readSizes();
      } else {
        for (let index = 0; index < this.extraByteCount; index++) {
          skippedExtraByteLength += this.stream.getUint32();
        }
      }
      this.point.readData();
      this.rgb.readData();
      if (this.bytes) {
        this.bytes.readData();
      } else {
        this.stream.consume(skippedExtraByteLength);
      }
      this.first = false;
    }
  }
}

class PointFormat8Decompressor implements PointDecompressor {
  private stream: ByteReader;
  private point: Point14Decompressor;
  private rgb: RGB14Decompressor;
  private nir: NIR14Decompressor | null;
  private bytes: Byte14Decompressor | null;
  /** Extra bytes stored with the first point and in independent later layers. */
  private extraByteCount: number;
  private first = true;

  constructor(
    stream: ByteReader,
    extraByteCount: number,
    outputMode: LAZChunkDecoderOutputMode,
    metadata: LAZChunkMetadata
  ) {
    this.stream = stream;
    this.extraByteCount = extraByteCount;
    this.point = new Point14Decompressor(
      stream,
      outputMode === 'raw' ? Point14DecompressionMode.Full : Point14DecompressionMode.PointData,
      metadata.point14ItemVersion ?? 3
    );
    this.rgb = new RGB14Decompressor(stream, metadata.rgb14ItemVersion ?? 3);
    this.nir =
      outputMode === 'raw' ? new NIR14Decompressor(stream, metadata.rgb14ItemVersion ?? 3) : null;
    this.bytes =
      outputMode === 'raw' && extraByteCount
        ? new Byte14Decompressor(stream, extraByteCount, metadata.byte14ItemVersion ?? 3)
        : null;
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    outputOffset = this.point.decompress(output, outputOffset);
    outputOffset = this.rgb.decompress(output, outputOffset, this.point.itemContextChannel);
    outputOffset = this.nir!.decompress(output, outputOffset, this.point.itemContextChannel);
    if (this.bytes) {
      outputOffset = this.bytes.decompress(output, outputOffset, this.point.itemContextChannel);
    }
    this.readFirstMetadata();
    return outputOffset;
  }

  decompressPointData(target: LAZPointDataTarget, targetPointIndex: number): void {
    const point = this.point.decompressPoint();
    this.rgb.decompressRgb(this.point.itemContextChannel);
    if (this.first) {
      this.stream.consume(2 + this.extraByteCount);
    }
    this.readFirstMetadata();
    writePoint14ToPointDataTarget(point, target, targetPointIndex);
    writeRgbToPointDataTarget(
      this.rgb.decodedRed,
      this.rgb.decodedGreen,
      this.rgb.decodedBlue,
      target,
      targetPointIndex
    );
  }

  decompressPointDataBatch(target: LAZPointDataTarget, pointCount: number): void {
    const positions = target.positions;
    const intensities = target.intensities;
    const classifications = target.classifications;
    const colors = target.colors;
    const rawColors = target.rawColors;
    const scale = target.scale;
    const offset = target.offset;
    let targetPointIndex = target.pointOffset;

    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      const point = this.point.decompressPoint();
      this.rgb.decompressRgb(this.point.itemContextChannel);
      if (this.first) {
        this.stream.consume(2 + this.extraByteCount);
      }
      this.readFirstMetadata();
      writePoint14ToPointDataArrays(
        point,
        positions,
        intensities,
        classifications,
        scale,
        offset,
        targetPointIndex
      );
      if (colors) {
        const colorOffset = targetPointIndex * 4;
        colors[colorOffset] = this.rgb.decodedRed & 0xff;
        colors[colorOffset + 1] = this.rgb.decodedGreen & 0xff;
        colors[colorOffset + 2] = this.rgb.decodedBlue & 0xff;
        colors[colorOffset + 3] = 255;
      } else if (rawColors) {
        const colorOffset = targetPointIndex * 3;
        rawColors[colorOffset] = this.rgb.decodedRed;
        rawColors[colorOffset + 1] = this.rgb.decodedGreen;
        rawColors[colorOffset + 2] = this.rgb.decodedBlue;
      }
      targetPointIndex++;
    }
  }

  private readFirstMetadata(): void {
    if (this.first) {
      this.stream.getUint32();
      this.point.readSizes();
      this.rgb.readSizes();
      const skippedNirByteLength = this.nir ? 0 : this.stream.getUint32();
      this.nir?.readSizes();
      let skippedExtraByteLength = 0;
      if (this.bytes) {
        this.bytes.readSizes();
      } else {
        for (let index = 0; index < this.extraByteCount; index++) {
          skippedExtraByteLength += this.stream.getUint32();
        }
      }
      this.point.readData();
      this.rgb.readData();
      if (this.nir) {
        this.nir.readData();
      } else {
        this.stream.consume(skippedNirByteLength);
      }
      if (this.bytes) {
        this.bytes.readData();
      } else {
        this.stream.consume(skippedExtraByteLength);
      }
      this.first = false;
    }
  }
}

/** LASzip layered decoder for LAS 1.4 point format 9. */
class PointFormat9Decompressor implements PointDecompressor {
  /** Compressed chunk source. */
  private stream: ByteReader;
  /** Core LAS 1.4 point decoder. */
  private point: Point14Decompressor;
  /** Waveform packet reference decoder, omitted for selective Arrow output. */
  private wavePacket: WavePacket14Decompressor | null;
  /** Extra Bytes decoder, omitted for selective Arrow output. */
  private bytes: Byte14Decompressor | null;
  /** Extra bytes stored with the first point and in independent later layers. */
  private extraByteCount: number;
  /** Whether the first point and layered stream metadata remain unread. */
  private first = true;

  constructor(
    stream: ByteReader,
    extraByteCount: number,
    outputMode: LAZChunkDecoderOutputMode,
    metadata: LAZChunkMetadata
  ) {
    this.stream = stream;
    this.extraByteCount = extraByteCount;
    this.point = new Point14Decompressor(
      stream,
      outputMode === 'raw' ? Point14DecompressionMode.Full : Point14DecompressionMode.PointData,
      metadata.point14ItemVersion ?? 3
    );
    this.wavePacket =
      outputMode === 'raw'
        ? new WavePacket14Decompressor(stream, metadata.wavePacketItemVersion ?? 3)
        : null;
    this.bytes =
      outputMode === 'raw' && extraByteCount
        ? new Byte14Decompressor(stream, extraByteCount, metadata.byte14ItemVersion ?? 3)
        : null;
  }

  /** Decode one complete PDRF 9 point record. */
  decompress(output: Uint8Array, outputOffset: number): number {
    outputOffset = this.point.decompress(output, outputOffset);
    outputOffset = this.wavePacket!.decompress(output, outputOffset, this.point.itemContextChannel);
    if (this.bytes) {
      outputOffset = this.bytes.decompress(output, outputOffset, this.point.itemContextChannel);
    }
    this.readFirstMetadata();
    return outputOffset;
  }

  /** Decode one PDRF 9 point directly into represented Arrow columns. */
  decompressPointData(target: LAZPointDataTarget, targetPointIndex: number): void {
    const point = this.point.decompressPoint();
    if (this.first) {
      this.stream.consume(29 + this.extraByteCount);
    }
    this.readFirstMetadata();
    writePoint14ToPointDataTarget(point, target, targetPointIndex);
  }

  /** Decode PDRF 9 points directly into represented Arrow columns. */
  decompressPointDataBatch(target: LAZPointDataTarget, pointCount: number): void {
    const positions = target.positions;
    const intensities = target.intensities;
    const classifications = target.classifications;
    const scale = target.scale;
    const offset = target.offset;
    let targetPointIndex = target.pointOffset;

    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      const point = this.point.decompressPoint();
      if (this.first) {
        this.stream.consume(29 + this.extraByteCount);
      }
      this.readFirstMetadata();
      writePoint14ToPointDataArrays(
        point,
        positions,
        intensities,
        classifications,
        scale,
        offset,
        targetPointIndex++
      );
    }
  }

  /** Read and bind or skip the independent PDRF 9 field layers. */
  private readFirstMetadata(): void {
    if (this.first) {
      this.stream.getUint32();
      this.point.readSizes();
      const skippedWavePacketByteLength = this.wavePacket ? 0 : this.stream.getUint32();
      this.wavePacket?.readSizes();
      let skippedExtraByteLength = 0;
      if (this.bytes) {
        this.bytes.readSizes();
      } else {
        for (let index = 0; index < this.extraByteCount; index++) {
          skippedExtraByteLength += this.stream.getUint32();
        }
      }
      this.point.readData();
      if (this.wavePacket) {
        this.wavePacket.readData();
      } else {
        this.stream.consume(skippedWavePacketByteLength);
      }
      if (this.bytes) {
        this.bytes.readData();
      } else {
        this.stream.consume(skippedExtraByteLength);
      }
      this.first = false;
    }
  }
}

/** LASzip layered decoder for LAS 1.4 point format 10. */
class PointFormat10Decompressor implements PointDecompressor {
  /** Compressed chunk source. */
  private stream: ByteReader;
  /** Core LAS 1.4 point decoder. */
  private point: Point14Decompressor;
  /** RGB decoder retained for raw and Arrow output. */
  private rgb: RGB14Decompressor;
  /** NIR decoder, omitted for selective Arrow output. */
  private nir: NIR14Decompressor | null;
  /** Waveform packet reference decoder, omitted for selective Arrow output. */
  private wavePacket: WavePacket14Decompressor | null;
  /** Extra Bytes decoder, omitted for selective Arrow output. */
  private bytes: Byte14Decompressor | null;
  /** Extra bytes stored with the first point and in independent later layers. */
  private extraByteCount: number;
  /** Whether the first point and layered stream metadata remain unread. */
  private first = true;

  constructor(
    stream: ByteReader,
    extraByteCount: number,
    outputMode: LAZChunkDecoderOutputMode,
    metadata: LAZChunkMetadata
  ) {
    this.stream = stream;
    this.extraByteCount = extraByteCount;
    this.point = new Point14Decompressor(
      stream,
      outputMode === 'raw' ? Point14DecompressionMode.Full : Point14DecompressionMode.PointData,
      metadata.point14ItemVersion ?? 3
    );
    this.rgb = new RGB14Decompressor(stream, metadata.rgb14ItemVersion ?? 3);
    this.nir =
      outputMode === 'raw' ? new NIR14Decompressor(stream, metadata.rgb14ItemVersion ?? 3) : null;
    this.wavePacket =
      outputMode === 'raw'
        ? new WavePacket14Decompressor(stream, metadata.wavePacketItemVersion ?? 3)
        : null;
    this.bytes =
      outputMode === 'raw' && extraByteCount
        ? new Byte14Decompressor(stream, extraByteCount, metadata.byte14ItemVersion ?? 3)
        : null;
  }

  /** Decode one complete PDRF 10 point record. */
  decompress(output: Uint8Array, outputOffset: number): number {
    outputOffset = this.point.decompress(output, outputOffset);
    outputOffset = this.rgb.decompress(output, outputOffset, this.point.itemContextChannel);
    outputOffset = this.nir!.decompress(output, outputOffset, this.point.itemContextChannel);
    outputOffset = this.wavePacket!.decompress(output, outputOffset, this.point.itemContextChannel);
    if (this.bytes) {
      outputOffset = this.bytes.decompress(output, outputOffset, this.point.itemContextChannel);
    }
    this.readFirstMetadata();
    return outputOffset;
  }

  /** Decode one PDRF 10 point directly into represented Arrow columns. */
  decompressPointData(target: LAZPointDataTarget, targetPointIndex: number): void {
    const point = this.point.decompressPoint();
    this.rgb.decompressRgb(this.point.itemContextChannel);
    if (this.first) {
      this.stream.consume(2 + 29 + this.extraByteCount);
    }
    this.readFirstMetadata();
    writePoint14ToPointDataTarget(point, target, targetPointIndex);
    writeRgbToPointDataTarget(
      this.rgb.decodedRed,
      this.rgb.decodedGreen,
      this.rgb.decodedBlue,
      target,
      targetPointIndex
    );
  }

  /** Decode PDRF 10 points directly into represented Arrow columns. */
  decompressPointDataBatch(target: LAZPointDataTarget, pointCount: number): void {
    const positions = target.positions;
    const intensities = target.intensities;
    const classifications = target.classifications;
    const colors = target.colors;
    const rawColors = target.rawColors;
    const scale = target.scale;
    const offset = target.offset;
    let targetPointIndex = target.pointOffset;

    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      const point = this.point.decompressPoint();
      this.rgb.decompressRgb(this.point.itemContextChannel);
      if (this.first) {
        this.stream.consume(2 + 29 + this.extraByteCount);
      }
      this.readFirstMetadata();
      writePoint14ToPointDataArrays(
        point,
        positions,
        intensities,
        classifications,
        scale,
        offset,
        targetPointIndex
      );
      if (colors) {
        const colorOffset = targetPointIndex * 4;
        colors[colorOffset] = this.rgb.decodedRed & 0xff;
        colors[colorOffset + 1] = this.rgb.decodedGreen & 0xff;
        colors[colorOffset + 2] = this.rgb.decodedBlue & 0xff;
        colors[colorOffset + 3] = 255;
      } else if (rawColors) {
        const colorOffset = targetPointIndex * 3;
        rawColors[colorOffset] = this.rgb.decodedRed;
        rawColors[colorOffset + 1] = this.rgb.decodedGreen;
        rawColors[colorOffset + 2] = this.rgb.decodedBlue;
      }
      targetPointIndex++;
    }
  }

  /** Read and bind or skip the independent PDRF 10 field layers. */
  private readFirstMetadata(): void {
    if (this.first) {
      this.stream.getUint32();
      this.point.readSizes();
      this.rgb.readSizes();
      const skippedNirByteLength = this.nir ? 0 : this.stream.getUint32();
      this.nir?.readSizes();
      const skippedWavePacketByteLength = this.wavePacket ? 0 : this.stream.getUint32();
      this.wavePacket?.readSizes();
      let skippedExtraByteLength = 0;
      if (this.bytes) {
        this.bytes.readSizes();
      } else {
        for (let index = 0; index < this.extraByteCount; index++) {
          skippedExtraByteLength += this.stream.getUint32();
        }
      }
      this.point.readData();
      this.rgb.readData();
      if (this.nir) {
        this.nir.readData();
      } else {
        this.stream.consume(skippedNirByteLength);
      }
      if (this.wavePacket) {
        this.wavePacket.readData();
      } else {
        this.stream.consume(skippedWavePacketByteLength);
      }
      if (this.bytes) {
        this.bytes.readData();
      } else {
        this.stream.consume(skippedExtraByteLength);
      }
      this.first = false;
    }
  }
}

function createIntegerDecompressor(bits: number, contexts: number): IntegerDecompressor {
  const decompressor = new IntegerDecompressor(bits, contexts);
  decompressor.init();
  return decompressor;
}

function createModels(count: number, symbols: number): ArithmeticModel[] {
  return Array.from({length: count}, () => new ArithmeticModel(symbols));
}

function getExtraByteCount(metadata: LAZChunkMetadata): number {
  const baseLength = getPointDataRecordBaseLength(metadata.pointDataRecordFormat);
  const extraByteCount = metadata.pointDataRecordLength - baseLength;
  if (extraByteCount < 0) {
    throw new Error(`Invalid point record length ${metadata.pointDataRecordLength}`);
  }
  return extraByteCount;
}

function getPointDataRecordBaseLength(pointDataRecordFormat: number): number {
  switch (pointDataRecordFormat) {
    case 0:
      return 20;
    case 1:
      return 28;
    case 2:
      return 26;
    case 3:
      return 34;
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
      throw new Error(
        `TypeScript LAZ decoder does not support point format ${pointDataRecordFormat}`
      );
  }
}

function hasLayeredChunkSizeHeaders(pointDataRecordFormat: number): boolean {
  return pointDataRecordFormat >= 6 && pointDataRecordFormat <= 10;
}

function getChunkSizeHeaderCount(pointDataRecordFormat: number, extraByteCount: number): number {
  switch (pointDataRecordFormat) {
    case 6:
      return 9 + extraByteCount;
    case 7:
      return 10 + extraByteCount;
    case 8:
      return 11 + extraByteCount;
    case 9:
      return 10 + extraByteCount;
    case 10:
      return 12 + extraByteCount;
    default:
      throw new Error(
        `TypeScript LAZ decoder does not support point format ${pointDataRecordFormat}`
      );
  }
}

function createPoint14(): Point14 {
  return {
    x: 0,
    y: 0,
    z: 0,
    intensity: 0,
    returns: 0,
    flags: 0,
    classification: 0,
    userData: 0,
    scanAngle: 0,
    pointSourceId: 0,
    gpsTime: 0
  };
}

function createPoint10(): Point10 {
  return {
    x: 0,
    y: 0,
    z: 0,
    intensity: 0,
    bitByte: 0,
    classification: 0,
    scanAngleRank: 0,
    userData: 0,
    pointSourceId: 0
  };
}

function readPoint10(bytes: Uint8Array, offset: number): Point10 {
  return {
    x: readInt32(bytes, offset),
    y: readInt32(bytes, offset + 4),
    z: readInt32(bytes, offset + 8),
    intensity: readUint16(bytes, offset + 12),
    bitByte: bytes[offset + 14],
    classification: bytes[offset + 15],
    scanAngleRank: toInt8(bytes[offset + 16]),
    userData: bytes[offset + 17],
    pointSourceId: readUint16(bytes, offset + 18)
  };
}

function writePoint10(point: Point10, bytes: Uint8Array, offset: number): void {
  writeInt32(point.x, bytes, offset);
  writeInt32(point.y, bytes, offset + 4);
  writeInt32(point.z, bytes, offset + 8);
  writeUint16(point.intensity, bytes, offset + 12);
  bytes[offset + 14] = point.bitByte;
  bytes[offset + 15] = point.classification;
  bytes[offset + 16] = point.scanAngleRank & 0xff;
  bytes[offset + 17] = point.userData;
  writeUint16(point.pointSourceId, bytes, offset + 18);
}

function getPoint10ReturnNumber(point: Point10): number {
  return point.bitByte & 0x07;
}

function getPoint10NumberOfReturns(point: Point10): number {
  return (point.bitByte >> 3) & 0x07;
}

function getPoint10ScanDirectionFlag(point: Point10): number {
  return (point.bitByte >> 6) & 1;
}

function copyPoint14(target: Point14, source: Point14): void {
  target.x = source.x;
  target.y = source.y;
  target.z = source.z;
  target.intensity = source.intensity;
  target.returns = source.returns;
  target.flags = source.flags;
  target.classification = source.classification;
  target.userData = source.userData;
  target.scanAngle = source.scanAngle;
  target.pointSourceId = source.pointSourceId;
  target.gpsTime = source.gpsTime;
}

function readPoint14Into(point: Point14, bytes: Uint8Array, offset: number): void {
  point.x = readInt32(bytes, offset);
  point.y = readInt32(bytes, offset + 4);
  point.z = readInt32(bytes, offset + 8);
  point.intensity = readUint16(bytes, offset + 12);
  point.returns = bytes[offset + 14];
  point.flags = bytes[offset + 15];
  point.classification = bytes[offset + 16];
  point.userData = bytes[offset + 17];
  point.scanAngle = readInt16(bytes, offset + 18);
  point.pointSourceId = readUint16(bytes, offset + 20);
  point.gpsTime = readFloat64(bytes, offset + 22);
}

function readPoint14FromStreamInto(point: Point14, stream: ByteReader): void {
  point.x = readInt32FromStream(stream);
  point.y = readInt32FromStream(stream);
  point.z = readInt32FromStream(stream);
  point.intensity = readUint16FromStream(stream);
  point.returns = stream.getByte();
  point.flags = stream.getByte();
  point.classification = stream.getByte();
  point.userData = stream.getByte();
  point.scanAngle = toInt16(readUint16FromStream(stream));
  point.pointSourceId = readUint16FromStream(stream);
  point.gpsTime = readFloat64FromStream(stream);
}

function writePoint14(point: Point14, bytes: Uint8Array, offset: number): void {
  writeInt32(point.x, bytes, offset);
  writeInt32(point.y, bytes, offset + 4);
  writeInt32(point.z, bytes, offset + 8);
  writeUint16(point.intensity, bytes, offset + 12);
  bytes[offset + 14] = point.returns;
  bytes[offset + 15] = point.flags;
  bytes[offset + 16] = point.classification;
  bytes[offset + 17] = point.userData;
  writeInt16(point.scanAngle, bytes, offset + 18);
  writeUint16(point.pointSourceId, bytes, offset + 20);
  writeFloat64(point.gpsTime, bytes, offset + 22);
}

function writePoint14ToPointDataTarget(
  point: Point14,
  target: LAZPointDataTarget,
  targetPointIndex: number
): void {
  writePoint14ToPointDataArrays(
    point,
    target.positions,
    target.intensities,
    target.classifications,
    target.scale,
    target.offset,
    targetPointIndex
  );
}

function writePoint14ToPointDataArrays(
  point: Point14,
  positions: Float32Array | Float64Array,
  intensities: Uint16Array,
  classifications: Uint8Array,
  scale: [number, number, number],
  offset: [number, number, number],
  targetPointIndex: number
): void {
  const positionOffset = targetPointIndex * 3;
  positions[positionOffset] = point.x * scale[0] + offset[0];
  positions[positionOffset + 1] = point.y * scale[1] + offset[1];
  positions[positionOffset + 2] = point.z * scale[2] + offset[2];
  intensities[targetPointIndex] = point.intensity;
  classifications[targetPointIndex] = point.classification;
}

function writeRgbToPointDataTarget(
  red: number,
  green: number,
  blue: number,
  target: LAZPointDataTarget,
  targetPointIndex: number
): void {
  if (target.colors) {
    const colorOffset = targetPointIndex * 4;
    target.colors[colorOffset] = red & 0xff;
    target.colors[colorOffset + 1] = green & 0xff;
    target.colors[colorOffset + 2] = blue & 0xff;
    target.colors[colorOffset + 3] = 255;
    return;
  }
  if (!target.rawColors) {
    return;
  }
  const colorOffset = targetPointIndex * 3;
  target.rawColors[colorOffset] = red;
  target.rawColors[colorOffset + 1] = green;
  target.rawColors[colorOffset + 2] = blue;
}

function getScannerChannel(point: Point14): number {
  return (point.flags >> 4) & 0x03;
}

function setScannerChannel(point: Point14, scannerChannel: number): void {
  point.flags = ((scannerChannel & 0x03) << 4) | (point.flags & ~0x30);
}

function setClassFlags(point: Point14, flags: number): void {
  point.flags = (flags & 0x0f) | (point.flags & 0xf0);
}

function setScanDirectionFlag(point: Point14, flag: number): void {
  point.flags = ((flag & 1) << 6) | (point.flags & 0xbf);
}

function setEdgeOfFlightLine(point: Point14, flag: number): void {
  point.flags = ((flag & 1) << 7) | (point.flags & 0x7f);
}

function mergeFlags(point: Point14): number {
  return (point.flags & 0x0f) | (((point.flags >> 6) & 1) << 4) | (((point.flags >> 7) & 1) << 5);
}

function readUint16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint16FromStream(stream: ByteReader): number {
  const b0 = stream.getByte();
  const b1 = stream.getByte();
  return b0 | (b1 << 8);
}

function writeUint16(value: number, bytes: Uint8Array, offset: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
}

function readInt16(bytes: Uint8Array, offset: number): number {
  return toInt16(readUint16(bytes, offset));
}

function writeInt16(value: number, bytes: Uint8Array, offset: number): void {
  writeUint16(value, bytes, offset);
}

/** Read an unaligned little-endian unsigned 32-bit integer. */
function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      ((bytes[offset + 3] << 24) >>> 0)) >>>
    0
  );
}

/** Write an unaligned little-endian unsigned 32-bit integer. */
function writeUint32(value: number, bytes: Uint8Array, offset: number): void {
  writeInt32(value, bytes, offset);
}

/** Read an unaligned little-endian unsigned 64-bit integer without precision loss. */
function readBigUint64(bytes: Uint8Array, offset: number): bigint {
  const lower = readUint32(bytes, offset);
  const upper = readUint32(bytes, offset + 4);
  return (BigInt(upper) << 32n) | BigInt(lower);
}

/** Write an unaligned little-endian unsigned 64-bit integer without precision loss. */
function writeBigUint64(value: bigint, bytes: Uint8Array, offset: number): void {
  writeUint32(Number(value & 0xffffffffn), bytes, offset);
  writeUint32(Number((value >> 32n) & 0xffffffffn), bytes, offset + 4);
}

function readInt32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)
  );
}

function readInt32FromStream(stream: ByteReader): number {
  const b0 = stream.getByte();
  const b1 = stream.getByte();
  const b2 = stream.getByte();
  const b3 = stream.getByte();
  return b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
}

function writeInt32(value: number, bytes: Uint8Array, offset: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
  bytes[offset + 2] = (value >> 16) & 0xff;
  bytes[offset + 3] = (value >> 24) & 0xff;
}

function readFloat64(bytes: Uint8Array, offset: number): number {
  for (let index = 0; index < 8; index++) {
    FLOAT64_SCRATCH_BYTES[index] = bytes[offset + index];
  }
  return FLOAT64_SCRATCH_VIEW.getFloat64(0, true);
}

function readFloat64FromStream(stream: ByteReader): number {
  for (let index = 0; index < 8; index++) {
    FLOAT64_SCRATCH_BYTES[index] = stream.getByte();
  }
  return FLOAT64_SCRATCH_VIEW.getFloat64(0, true);
}

function writeFloat64(value: number, bytes: Uint8Array, offset: number): void {
  FLOAT64_SCRATCH_VIEW.setFloat64(0, value, true);
  for (let index = 0; index < 8; index++) {
    bytes[offset + index] = FLOAT64_SCRATCH_BYTES[index];
  }
}

function clampUint8(value: number): number {
  return value <= 0 ? 0 : value >= 255 ? 255 : value;
}

function toInt16(value: number): number {
  const uint16 = value & 0xffff;
  return uint16 & 0x8000 ? uint16 - 0x10000 : uint16;
}

function toInt8(value: number): number {
  const uint8 = value & 0xff;
  return uint8 & 0x80 ? uint8 - 0x100 : uint8;
}

function toInt32(value: number): number {
  return value | 0;
}

function float64ToBigUint64(value: number): bigint {
  FLOAT64_SCRATCH_VIEW.setFloat64(0, value, true);
  return FLOAT64_SCRATCH_VIEW.getBigUint64(0, true);
}

function bigUint64ToFloat64(value: bigint): number {
  FLOAT64_SCRATCH_VIEW.setBigUint64(0, value, true);
  return FLOAT64_SCRATCH_VIEW.getFloat64(0, true);
}

function addInt32ToFloat64Bits(value: number, diff: number): number {
  const bits = BigInt.asIntN(64, BigInt.asIntN(64, float64ToBigUint64(value)) + BigInt(diff));
  return bigUint64ToFloat64(BigInt.asUintN(64, bits));
}

function toUint8Array(arrayBuffer: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (arrayBuffer instanceof ArrayBuffer) {
    return new Uint8Array(arrayBuffer);
  }
  return new Uint8Array(arrayBuffer.buffer, arrayBuffer.byteOffset, arrayBuffer.byteLength);
}

function concatenateUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const byteLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
