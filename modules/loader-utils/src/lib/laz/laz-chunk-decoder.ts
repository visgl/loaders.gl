// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Metadata needed to decode a compressed LAZ point chunk. */
export type LAZChunkMetadata = {
  pointDataRecordFormat: number;
  pointDataRecordLength: number;
  pointCount: number;
};

/** Options for streaming LAZ chunk decoding. */
export type LAZChunkDecoderOptions = {
  /** Number of raw point records to return per yielded batch. */
  batchSize?: number;
};

/** One decoded LASzip chunk table entry. */
export type LAZChunkTableEntry = {
  /** Number of points in this chunk. */
  pointCount: number;
  /** Compressed chunk byte length. */
  byteLength: number;
};

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
  private decoded: Uint8Array | null = null;
  private decodedOffset = 0;
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
    if (!this.decoded) {
      if (!this.hasCompleteChunk()) {
        return null;
      }
      this.decoded = this.decodeAvailable();
    }
    if (this.decodedOffset >= this.decoded.byteLength) {
      return null;
    }
    const pointByteLength = this.metadata.pointDataRecordLength;
    const byteLength = Math.min(
      pointCount * pointByteLength,
      this.decoded.byteLength - this.decodedOffset
    );
    const batch = this.decoded.slice(this.decodedOffset, this.decodedOffset + byteLength);
    this.decodedOffset += byteLength;
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
      const compressed = concatenateUint8Arrays(this.chunks);
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
    const compressed = concatenateUint8Arrays(this.chunks);
    const byteLength = this.requiredByteLength ?? compressed.byteLength;
    return decodeLAZChunk(compressed.subarray(0, byteLength), this.metadata);
  }
}

/** Create a feedable TypeScript LAZ chunk decoder. */
export function createLAZChunkDecoder(metadata: LAZChunkMetadata): FeedableLAZChunkDecoder {
  return new FeedableLAZChunkDecoder(metadata);
}

/** Decode a complete compressed LAZ point chunk into raw LAS point records. */
export function decodeLAZChunk(
  compressed: ArrayBuffer | ArrayBufferView,
  metadata: LAZChunkMetadata
): Uint8Array {
  const input = new ByteReader(toUint8Array(compressed));
  const decoder = createPointDecompressor(input, metadata);
  const output = new Uint8Array(metadata.pointCount * metadata.pointDataRecordLength);
  let outputOffset = 0;

  for (let pointIndex = 0; pointIndex < metadata.pointCount; pointIndex++) {
    outputOffset = decoder.decompress(output, outputOffset);
  }

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
const DM_LENGTH_SHIFT = 15;
const DM_MAX_COUNT = 1 << DM_LENGTH_SHIFT;

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

  getUint32(): number {
    const b0 = this.getByte();
    const b1 = this.getByte();
    const b2 = this.getByte();
    const b3 = this.getByte();
    return (b0 | (b1 << 8) | (b2 << 16) | ((b3 << 24) >>> 0)) >>> 0;
  }

  copy(length: number): MemoryByteReader {
    if (this.offset + length > this.bytes.length) {
      throw new NeedsMoreData();
    }
    const copy = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return new MemoryByteReader(copy);
  }
}

type ByteInput = {
  getByte(): number;
};

class MemoryByteReader implements ByteInput {
  private bytes: Uint8Array;
  private offset = 0;

  constructor(bytes: Uint8Array = new Uint8Array(0)) {
    this.bytes = bytes;
  }

  getByte(): number {
    if (this.offset >= this.bytes.length) {
      throw new NeedsMoreData();
    }
    return this.bytes[this.offset++];
  }
}

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
    const scale = Math.floor(0x80000000 / this.totalCount);

    if (!this.decoderTable) {
      for (let symbol = 0; symbol < this.symbols; symbol++) {
        this.distribution[symbol] = Math.floor((scale * sum) / 2 ** (31 - DM_LENGTH_SHIFT));
        sum += this.symbolCount[symbol];
      }
    } else {
      for (let symbol = 0; symbol < this.symbols; symbol++) {
        this.distribution[symbol] = Math.floor((scale * sum) / 2 ** (31 - DM_LENGTH_SHIFT));
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
    const scale = Math.floor(0x80000000 / this.bitCount);
    this.bit0Prob = Math.floor((this.bit0Count * scale) / 2 ** (31 - BM_LENGTH_SHIFT));
    this.updateCycle = (5 * this.updateCycle) >> 2;
    if (this.updateCycle > 64) {
      this.updateCycle = 64;
    }
    this.bitsUntilUpdate = this.updateCycle;
  }
}

class ArithmeticDecoder {
  private input: ByteInput;
  private value = 0;
  private length = AC_MAX_LENGTH;
  valid = false;

  constructor(input: ByteInput = new MemoryByteReader()) {
    this.input = input;
  }

  initStream(source: ByteReader, count: number): void {
    if (count) {
      this.input = source.copy(count);
      this.readInitBytes();
      this.valid = true;
    } else {
      this.valid = false;
    }
  }

  readInitBytes(): void {
    this.value =
      (((this.input.getByte() << 24) >>> 0) |
        (this.input.getByte() << 16) |
        (this.input.getByte() << 8) |
        this.input.getByte()) >>>
      0;
  }

  decodeBit(model: ArithmeticBitModel): number {
    const x = model.bit0Prob * (this.length >>> BM_LENGTH_SHIFT);
    const symbol = this.value >= x ? 1 : 0;
    if (symbol === 0) {
      this.length = x >>> 0;
      model.bit0Count++;
    } else {
      this.value = (this.value - x) >>> 0;
      this.length = (this.length - x) >>> 0;
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
    let upper = this.length;

    if (model.decoderTable) {
      this.length >>>= DM_LENGTH_SHIFT;
      const dv = Math.floor(this.value / this.length);
      const tableIndex = dv >> model.tableShift;
      symbol = model.decoderTable[tableIndex];
      let next = model.decoderTable[tableIndex + 1] + 1;
      while (next > symbol + 1) {
        const middle = (symbol + next) >> 1;
        if (model.distribution[middle] > dv) {
          next = middle;
        } else {
          symbol = middle;
        }
      }
      lower = model.distribution[symbol] * this.length;
      if (symbol !== model.lastSymbol) {
        upper = model.distribution[symbol + 1] * this.length;
      }
    } else {
      lower = 0;
      symbol = 0;
      this.length >>>= DM_LENGTH_SHIFT;
      let next = model.symbols;
      let middle = next >> 1;
      do {
        const z = this.length * model.distribution[middle];
        if (z > this.value) {
          next = middle;
          upper = z;
        } else {
          symbol = middle;
          lower = z;
        }
        middle = (symbol + next) >> 1;
      } while (middle !== symbol);
    }

    this.value = (this.value - lower) >>> 0;
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
    this.length >>>= bits;
    const symbol = Math.floor(this.value / this.length);
    this.value = (this.value - this.length * symbol) >>> 0;
    if (this.length < AC_MIN_LENGTH) {
      this.renormalize();
    }
    return symbol >>> 0;
  }

  readShort(): number {
    this.length >>>= 16;
    const symbol = Math.floor(this.value / this.length);
    this.value = (this.value - this.length * symbol) >>> 0;
    if (this.length < AC_MIN_LENGTH) {
      this.renormalize();
    }
    return symbol & 0xffff;
  }

  readInt(): number {
    const lower = this.readShort();
    const upper = this.readShort();
    return ((upper << 16) | lower) >>> 0;
  }

  private renormalize(): void {
    do {
      this.value = ((this.value << 8) | this.input.getByte()) >>> 0;
      this.length = (this.length << 8) >>> 0;
    } while (this.length < AC_MIN_LENGTH);
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
    this.k = decoder.decodeSymbol(mBits);
    let corrector: number;
    if (this.k) {
      if (this.k < 32) {
        if (this.k <= this.bitsHigh) {
          corrector = decoder.decodeSymbol(this.mCorrector[this.k - 1]);
        } else {
          const lowerBitCount = this.k - this.bitsHigh;
          corrector = decoder.decodeSymbol(this.mCorrector[this.k - 1]);
          corrector = (corrector << lowerBitCount) | decoder.readBits(lowerBitCount);
        }
        if (corrector >= 1 << (this.k - 1)) {
          corrector += 1;
        } else {
          corrector -= (1 << this.k) - 1;
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
  values = [0, 0, 0, 0, 0];
  high = true;

  add(value: number): void {
    if (this.high) {
      if (value < this.values[2]) {
        this.values[4] = this.values[3];
        this.values[3] = this.values[2];
        if (value < this.values[0]) {
          this.values[2] = this.values[1];
          this.values[1] = this.values[0];
          this.values[0] = value;
        } else if (value < this.values[1]) {
          this.values[2] = this.values[1];
          this.values[1] = value;
        } else {
          this.values[2] = value;
        }
      } else {
        if (value < this.values[3]) {
          this.values[4] = this.values[3];
          this.values[3] = value;
        } else {
          this.values[4] = value;
        }
        this.high = false;
      }
    } else if (this.values[2] < value) {
      this.values[0] = this.values[1];
      this.values[1] = this.values[2];
      if (this.values[4] < value) {
        this.values[2] = this.values[3];
        this.values[3] = this.values[4];
        this.values[4] = value;
      } else if (this.values[3] < value) {
        this.values[2] = this.values[3];
        this.values[3] = value;
      } else {
        this.values[2] = value;
      }
    } else {
      if (this.values[1] < value) {
        this.values[0] = this.values[1];
        this.values[1] = value;
      } else {
        this.values[0] = value;
      }
      this.high = true;
    }
  }

  get(): number {
    return this.values[2];
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

type RGB = {r: number; g: number; b: number};
type NIR = {value: number};

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

    const zKbits = Math.min(Math.trunc((this.dx.k + this.dy.k) / 2), 18) & ~1;
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
  private last: RGB = {r: 0, g: 0, b: 0};
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
      this.last = readRGB(output, outputOffset);
      return outputOffset + 6;
    }

    const symbol = this.decoder.decodeSymbol(this.usedModel);
    const color: RGB = {r: 0, g: 0, b: 0};
    if (symbol & 1) {
      color.r = (this.decoder.decodeSymbol(this.diffModel[0]) + (this.last.r & 0xff)) & 0xff;
    } else {
      color.r = this.last.r & 0xff;
    }
    if (symbol & 2) {
      color.r |= ((this.decoder.decodeSymbol(this.diffModel[1]) + (this.last.r >> 8)) & 0xff) << 8;
    } else {
      color.r |= this.last.r & 0xff00;
    }

    if (symbol & 64) {
      let diff = (color.r & 0xff) - (this.last.r & 0xff);
      if (symbol & 4) {
        color.g =
          (this.decoder.decodeSymbol(this.diffModel[2]) + clampUint8(diff + (this.last.g & 0xff))) &
          0xff;
      } else {
        color.g = this.last.g & 0xff;
      }
      if (symbol & 16) {
        diff = Math.trunc((diff + ((color.g & 0xff) - (this.last.g & 0xff))) / 2);
        color.b =
          (this.decoder.decodeSymbol(this.diffModel[4]) + clampUint8(diff + (this.last.b & 0xff))) &
          0xff;
      } else {
        color.b = this.last.b & 0xff;
      }

      diff = (color.r >> 8) - (this.last.r >> 8);
      if (symbol & 8) {
        color.g |=
          ((this.decoder.decodeSymbol(this.diffModel[3]) + clampUint8(diff + (this.last.g >> 8))) &
            0xff) <<
          8;
      } else {
        color.g |= this.last.g & 0xff00;
      }
      if (symbol & 32) {
        diff = Math.trunc((diff + (color.g >> 8) - (this.last.g >> 8)) / 2);
        color.b |=
          ((this.decoder.decodeSymbol(this.diffModel[5]) + clampUint8(diff + (this.last.b >> 8))) &
            0xff) <<
          8;
      } else {
        color.b |= this.last.b & 0xff00;
      }
    } else {
      color.g = color.r;
      color.b = color.r;
    }
    this.last = color;
    writeRGB(color, output, outputOffset);
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

class Point14Context {
  changedValuesModel = createModels(8, 128);
  scannerChannelModel = new ArithmeticModel(3);
  returnNumberGpsSameModel = new ArithmeticModel(13);
  numberReturnsModel = createModels(16, 16);
  returnNumberModel = createModels(16, 16);
  classModel = createModels(64, 256);
  flagModel = createModels(64, 64);
  userDataModel = createModels(64, 256);
  gpsTimeMultiModel = new ArithmeticModel(515);
  gpsTime0DiffModel = new ArithmeticModel(5);
  dx = createIntegerDecompressor(32, 2);
  dy = createIntegerDecompressor(32, 22);
  z = createIntegerDecompressor(32, 20);
  intensity = createIntegerDecompressor(16, 4);
  scanAngle = createIntegerDecompressor(16, 2);
  pointSourceId = createIntegerDecompressor(16, 1);
  gpsTime = createIntegerDecompressor(32, 9);
  haveLast = false;
  last = createPoint14();
  lastIntensity = new Array<number>(8).fill(0);
  lastZ = new Array<number>(8).fill(0);
  lastXDiffMedian = Array.from({length: 12}, () => new StreamingMedian());
  lastYDiffMedian = Array.from({length: 12}, () => new StreamingMedian());
  lastGpsSequence = 0;
  nextGpsSequence = 0;
  lastGpsTime = new Array<number>(4).fill(0);
  lastGpsTimeDiff = new Array<number>(4).fill(0);
  multiExtremeCounter = new Array<number>(4).fill(0);
  gpsTimeChange = false;
}

class Point14Decompressor {
  private stream: ByteReader;
  private contexts = Array.from({length: 4}, () => new Point14Context());
  private lastChannel = -1;
  private xy = new ArithmeticDecoder();
  private z = new ArithmeticDecoder();
  private classification = new ArithmeticDecoder();
  private flags = new ArithmeticDecoder();
  private intensity = new ArithmeticDecoder();
  private scanAngle = new ArithmeticDecoder();
  private userData = new ArithmeticDecoder();
  private pointSourceId = new ArithmeticDecoder();
  private gpsTime = new ArithmeticDecoder();
  private sizes: number[] = [];

  constructor(stream: ByteReader) {
    this.stream = stream;
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
    this.flags.initStream(this.stream, this.sizes[index++]);
    this.intensity.initStream(this.stream, this.sizes[index++]);
    this.scanAngle.initStream(this.stream, this.sizes[index++]);
    this.userData.initStream(this.stream, this.sizes[index++]);
    this.pointSourceId.initStream(this.stream, this.sizes[index++]);
    this.gpsTime.initStream(this.stream, this.sizes[index++]);
  }

  decompress(
    output: Uint8Array,
    outputOffset: number,
    scannerChannelReference: {value: number}
  ): number {
    if (this.lastChannel === -1) {
      this.stream.getBytes(output, outputOffset, 30);
      const point = readPoint14(output, outputOffset);
      scannerChannelReference.value = getScannerChannel(point);
      const context = this.contexts[scannerChannelReference.value];
      context.last = point;
      context.haveLast = true;
      context.lastGpsTime[0] = point.gpsTime;
      this.lastChannel = scannerChannelReference.value;
      context.lastZ.fill(point.z);
      context.lastIntensity.fill(point.intensity);
      return outputOffset + 30;
    }

    const previous = this.contexts[this.lastChannel];
    const changeStream =
      (getReturnNumber(previous.last) === 1 ? 1 : 0) |
      ((getReturnNumber(previous.last) >= getNumberOfReturns(previous.last) ? 1 : 0) << 1) |
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

    let scannerChannel = getScannerChannel(previous.last);
    if (scannerChannelChanged) {
      const diff = this.xy.decodeSymbol(previous.scannerChannelModel);
      scannerChannel = (scannerChannel + diff + 1) % 4;
      this.lastChannel = scannerChannel;
      scannerChannelReference.value = scannerChannel;
    }

    const context = this.contexts[scannerChannel];
    if (!context.haveLast) {
      context.haveLast = true;
      context.last = clonePoint14(previous.last);
      context.lastZ.fill(previous.last.z);
      context.lastIntensity.fill(previous.last.intensity);
      context.lastGpsTime[0] = previous.last.gpsTime;
    }
    setScannerChannel(context.last, scannerChannel);

    let numberOfReturns = getNumberOfReturns(context.last);
    let returnNumber = getReturnNumber(context.last);
    if (numberReturnsChanged) {
      numberOfReturns = this.xy.decodeSymbol(context.numberReturnsModel[numberOfReturns]);
    }
    setNumberOfReturns(context.last, numberOfReturns);
    if (returnNumberIncrements) {
      returnNumber = (returnNumber + 1) % 16;
    } else if (returnNumberDecrements) {
      returnNumber = (returnNumber + 15) % 16;
    } else if (returnNumberMiscChange) {
      returnNumber = gpsTimeChanged
        ? this.xy.decodeSymbol(context.returnNumberModel[returnNumber])
        : (returnNumber + this.xy.decodeSymbol(context.returnNumberGpsSameModel) + 2) % 16;
    }
    setReturnNumber(context.last, returnNumber);

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
      const kbits = Math.min((context.dx.k + context.dy.k) / 2, 18) & ~1;
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

    if (this.flags.valid) {
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

    if (scanAngleChanged) {
      context.last.scanAngle = toInt16(
        context.scanAngle.decompress(this.scanAngle, context.last.scanAngle, gpsTimeChanged ? 1 : 0)
      );
    }

    if (this.userData.valid) {
      const userDataContext = Math.floor(context.last.userData / 4);
      context.last.userData = this.userData.decodeSymbol(context.userDataModel[userDataContext]);
    }

    if (pointSourceChanged) {
      context.last.pointSourceId =
        context.pointSourceId.decompress(this.pointSourceId, context.last.pointSourceId, 0) &
        0xffff;
    }

    if (gpsTimeChanged) {
      this.decodeGpsTime(context);
    }
    context.gpsTimeChange = gpsTimeChanged;
    writePoint14(context.last, output, outputOffset);
    return outputOffset + 30;
  }

  private decodeGpsTime(context: Point14Context): void {
    while (true) {
      if (context.lastGpsTimeDiff[context.lastGpsSequence] === 0) {
        const multi = this.gpsTime.decodeSymbol(context.gpsTime0DiffModel);
        if (multi === 0) {
          const symbol = context.gpsTime.decompress(this.gpsTime, 0, 0);
          context.lastGpsTimeDiff[context.lastGpsSequence] = symbol;
          context.lastGpsTime[context.lastGpsSequence] = addInt32ToFloat64Bits(
            context.lastGpsTime[context.lastGpsSequence],
            symbol
          );
          context.multiExtremeCounter[context.lastGpsSequence] = 0;
        } else if (multi === 1) {
          context.nextGpsSequence = (context.nextGpsSequence + 1) & 3;
          const lastTimeBits = float64ToBigUint64(context.lastGpsTime[context.lastGpsSequence]);
          const upper = context.gpsTime.decompress(
            this.gpsTime,
            Number(lastTimeBits >> 32n) | 0,
            8
          );
          const lower = this.gpsTime.readInt();
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
        let multi = this.gpsTime.decodeSymbol(context.gpsTimeMultiModel);
        let gpsTimeDiff = 0;
        if (multi === 1) {
          const symbol = context.gpsTime.decompress(
            this.gpsTime,
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
            gpsTimeDiff = context.gpsTime.decompress(this.gpsTime, 0, 7);
            context.multiExtremeCounter[context.lastGpsSequence]++;
            if (context.multiExtremeCounter[context.lastGpsSequence] > 3) {
              context.multiExtremeCounter[context.lastGpsSequence] = 0;
              context.lastGpsTimeDiff[context.lastGpsSequence] = gpsTimeDiff;
            }
          } else if (multi < GPS_TIME_MULTI) {
            const tag = multi < 10 ? 2 : 3;
            gpsTimeDiff = context.gpsTime.decompress(
              this.gpsTime,
              multi * context.lastGpsTimeDiff[context.lastGpsSequence],
              tag
            );
          } else if (multi === GPS_TIME_MULTI) {
            gpsTimeDiff = context.gpsTime.decompress(
              this.gpsTime,
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
                this.gpsTime,
                multi * context.lastGpsTimeDiff[context.lastGpsSequence],
                5
              );
            } else {
              gpsTimeDiff = context.gpsTime.decompress(
                this.gpsTime,
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
          const upper = context.gpsTime.decompress(
            this.gpsTime,
            Number(lastTimeBits >> 32n) | 0,
            8
          );
          const lower = this.gpsTime.readInt();
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
  last: RGB = {r: 0, g: 0, b: 0};
  usedModel = new ArithmeticModel(128);
  diffModel = createModels(6, 256);
}

class RGB14Decompressor {
  private stream: ByteReader;
  private contexts = Array.from({length: 4}, () => new RGB14Context());
  private lastChannel = -1;
  private rgbCount = 0;
  private rgb = new ArithmeticDecoder();

  constructor(stream: ByteReader) {
    this.stream = stream;
  }

  readSizes(): void {
    this.rgbCount = this.stream.getUint32();
  }

  readData(): void {
    this.rgb.initStream(this.stream, this.rgbCount);
  }

  decompress(output: Uint8Array, outputOffset: number, scannerChannel: number): number {
    if (this.lastChannel === -1) {
      this.stream.getBytes(output, outputOffset, 6);
      const rgb = readRGB(output, outputOffset);
      this.contexts[scannerChannel].last = rgb;
      this.contexts[scannerChannel].haveLast = true;
      this.lastChannel = scannerChannel;
      return outputOffset + 6;
    }
    if (this.rgbCount === 0) {
      writeRGB(this.contexts[this.lastChannel].last, output, outputOffset);
      return outputOffset + 6;
    }
    const context = this.contexts[scannerChannel];
    let lastColor = this.contexts[this.lastChannel].last;
    if (scannerChannel !== this.lastChannel) {
      this.lastChannel = scannerChannel;
      if (!context.haveLast) {
        context.haveLast = true;
        context.last = {...lastColor};
        lastColor = this.contexts[this.lastChannel].last;
      }
    }
    const symbol = this.rgb.decodeSymbol(context.usedModel);
    const color: RGB = {r: 0, g: 0, b: 0};
    if (symbol & 1) {
      const correction = this.rgb.decodeSymbol(context.diffModel[0]);
      color.r = (correction + (lastColor.r & 0xff)) & 0xff;
    } else {
      color.r = lastColor.r & 0xff;
    }
    if (symbol & 2) {
      const correction = this.rgb.decodeSymbol(context.diffModel[1]);
      color.r |= ((correction + (lastColor.r >> 8)) & 0xff) << 8;
    } else {
      color.r |= lastColor.r & 0xff00;
    }
    if (symbol & 64) {
      let diff = (color.r & 0xff) - (lastColor.r & 0xff);
      if (symbol & 4) {
        const correction = this.rgb.decodeSymbol(context.diffModel[2]);
        color.g = (correction + clampUint8(diff + (lastColor.g & 0xff))) & 0xff;
      } else {
        color.g = lastColor.g & 0xff;
      }
      if (symbol & 16) {
        const correction = this.rgb.decodeSymbol(context.diffModel[4]);
        diff = Math.trunc((diff + ((color.g & 0xff) - (lastColor.g & 0xff))) / 2);
        color.b = (correction + clampUint8(diff + (lastColor.b & 0xff))) & 0xff;
      } else {
        color.b = lastColor.b & 0xff;
      }
      diff = (color.r >> 8) - (lastColor.r >> 8);
      if (symbol & 8) {
        const correction = this.rgb.decodeSymbol(context.diffModel[3]);
        color.g |= ((correction + clampUint8(diff + (lastColor.g >> 8))) & 0xff) << 8;
      } else {
        color.g |= lastColor.g & 0xff00;
      }
      if (symbol & 32) {
        const correction = this.rgb.decodeSymbol(context.diffModel[5]);
        diff = Math.trunc((diff + (color.g >> 8) - (lastColor.g >> 8)) / 2);
        color.b |= ((correction + clampUint8(diff + (lastColor.b >> 8))) & 0xff) << 8;
      } else {
        color.b |= lastColor.b & 0xff00;
      }
    } else {
      color.g = color.r;
      color.b = color.r;
    }
    Object.assign(lastColor, color);
    writeRGB(color, output, outputOffset);
    return outputOffset + 6;
  }
}

class NIR14Context {
  haveLast = false;
  last: NIR = {value: 0};
  usedModel = new ArithmeticModel(4);
  diffModel = createModels(2, 256);
}

class NIR14Decompressor {
  private stream: ByteReader;
  private contexts = Array.from({length: 4}, () => new NIR14Context());
  private lastChannel = -1;
  private nirCount = 0;
  private nir = new ArithmeticDecoder();

  constructor(stream: ByteReader) {
    this.stream = stream;
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
      const value = readUint16(output, outputOffset);
      this.contexts[scannerChannel].last = {value};
      this.contexts[scannerChannel].haveLast = true;
      this.lastChannel = scannerChannel;
      return outputOffset + 2;
    }
    if (this.nirCount === 0) {
      writeUint16(this.contexts[this.lastChannel].last.value, output, outputOffset);
      return outputOffset + 2;
    }
    const context = this.contexts[scannerChannel];
    let lastNir = this.contexts[this.lastChannel].last;
    if (scannerChannel !== this.lastChannel) {
      this.lastChannel = scannerChannel;
      if (!context.haveLast) {
        context.haveLast = true;
        context.last = {...lastNir};
        lastNir = this.contexts[this.lastChannel].last;
      }
    }
    const symbol = this.nir.decodeSymbol(context.usedModel);
    let value =
      symbol & 1
        ? (this.nir.decodeSymbol(context.diffModel[0]) + (lastNir.value & 0xff)) & 0xff
        : lastNir.value & 0xff;
    value |=
      symbol & 2
        ? ((this.nir.decodeSymbol(context.diffModel[1]) + (lastNir.value >> 8)) & 0xff) << 8
        : lastNir.value & 0xff00;
    lastNir.value = value;
    writeUint16(value, output, outputOffset);
    return outputOffset + 2;
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

  constructor(stream: ByteReader, count: number) {
    this.stream = stream;
    this.count = count;
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
};

function createPointDecompressor(
  stream: ByteReader,
  metadata: LAZChunkMetadata
): PointDecompressor {
  const extraByteCount = getExtraByteCount(metadata);
  switch (metadata.pointDataRecordFormat) {
    case 0:
      return new PointFormat0Decompressor(stream, extraByteCount);
    case 2:
      return new PointFormat2Decompressor(stream, extraByteCount);
    case 6:
      return new PointFormat6Decompressor(stream, extraByteCount);
    case 7:
      return new PointFormat7Decompressor(stream, extraByteCount);
    case 8:
      return new PointFormat8Decompressor(stream, extraByteCount);
    default:
      throw new Error(
        `TypeScript LAZ decoder does not support point format ${metadata.pointDataRecordFormat}`
      );
  }
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

class PointFormat6Decompressor implements PointDecompressor {
  private stream: ByteReader;
  private point: Point14Decompressor;
  private bytes: Byte14Decompressor | null;
  private first = true;

  constructor(stream: ByteReader, extraByteCount: number) {
    this.stream = stream;
    this.point = new Point14Decompressor(stream);
    this.bytes = extraByteCount ? new Byte14Decompressor(stream, extraByteCount) : null;
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    const scannerChannel = {value: 0};
    outputOffset = this.point.decompress(output, outputOffset, scannerChannel);
    if (this.bytes) {
      outputOffset = this.bytes.decompress(output, outputOffset, scannerChannel.value);
    }
    this.readFirstMetadata();
    return outputOffset;
  }

  private readFirstMetadata(): void {
    if (this.first) {
      this.stream.getUint32();
      this.point.readSizes();
      this.bytes?.readSizes();
      this.point.readData();
      this.bytes?.readData();
      this.first = false;
    }
  }
}

class PointFormat7Decompressor implements PointDecompressor {
  private stream: ByteReader;
  private point: Point14Decompressor;
  private rgb: RGB14Decompressor;
  private bytes: Byte14Decompressor | null;
  private first = true;

  constructor(stream: ByteReader, extraByteCount: number) {
    this.stream = stream;
    this.point = new Point14Decompressor(stream);
    this.rgb = new RGB14Decompressor(stream);
    this.bytes = extraByteCount ? new Byte14Decompressor(stream, extraByteCount) : null;
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    const scannerChannel = {value: 0};
    outputOffset = this.point.decompress(output, outputOffset, scannerChannel);
    outputOffset = this.rgb.decompress(output, outputOffset, scannerChannel.value);
    if (this.bytes) {
      outputOffset = this.bytes.decompress(output, outputOffset, scannerChannel.value);
    }
    this.readFirstMetadata();
    return outputOffset;
  }

  private readFirstMetadata(): void {
    if (this.first) {
      this.stream.getUint32();
      this.point.readSizes();
      this.rgb.readSizes();
      this.bytes?.readSizes();
      this.point.readData();
      this.rgb.readData();
      this.bytes?.readData();
      this.first = false;
    }
  }
}

class PointFormat8Decompressor implements PointDecompressor {
  private stream: ByteReader;
  private point: Point14Decompressor;
  private rgb: RGB14Decompressor;
  private nir: NIR14Decompressor;
  private bytes: Byte14Decompressor | null;
  private first = true;

  constructor(stream: ByteReader, extraByteCount: number) {
    this.stream = stream;
    this.point = new Point14Decompressor(stream);
    this.rgb = new RGB14Decompressor(stream);
    this.nir = new NIR14Decompressor(stream);
    this.bytes = extraByteCount ? new Byte14Decompressor(stream, extraByteCount) : null;
  }

  decompress(output: Uint8Array, outputOffset: number): number {
    const scannerChannel = {value: 0};
    outputOffset = this.point.decompress(output, outputOffset, scannerChannel);
    outputOffset = this.rgb.decompress(output, outputOffset, scannerChannel.value);
    outputOffset = this.nir.decompress(output, outputOffset, scannerChannel.value);
    if (this.bytes) {
      outputOffset = this.bytes.decompress(output, outputOffset, scannerChannel.value);
    }
    this.readFirstMetadata();
    return outputOffset;
  }

  private readFirstMetadata(): void {
    if (this.first) {
      this.stream.getUint32();
      this.point.readSizes();
      this.rgb.readSizes();
      this.nir.readSizes();
      this.bytes?.readSizes();
      this.point.readData();
      this.rgb.readData();
      this.nir.readData();
      this.bytes?.readData();
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
    case 2:
      return 26;
    case 6:
      return 30;
    case 7:
      return 36;
    case 8:
      return 38;
    default:
      throw new Error(
        `TypeScript LAZ decoder does not support point format ${pointDataRecordFormat}`
      );
  }
}

function hasLayeredChunkSizeHeaders(pointDataRecordFormat: number): boolean {
  return pointDataRecordFormat >= 6 && pointDataRecordFormat <= 8;
}

function getChunkSizeHeaderCount(pointDataRecordFormat: number, extraByteCount: number): number {
  switch (pointDataRecordFormat) {
    case 6:
      return 9 + extraByteCount;
    case 7:
      return 10 + extraByteCount;
    case 8:
      return 11 + extraByteCount;
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
  const dataView = new DataView(bytes.buffer, bytes.byteOffset + offset, 20);
  return {
    x: dataView.getInt32(0, true),
    y: dataView.getInt32(4, true),
    z: dataView.getInt32(8, true),
    intensity: dataView.getUint16(12, true),
    bitByte: dataView.getUint8(14),
    classification: dataView.getUint8(15),
    scanAngleRank: dataView.getInt8(16),
    userData: dataView.getUint8(17),
    pointSourceId: dataView.getUint16(18, true)
  };
}

function writePoint10(point: Point10, bytes: Uint8Array, offset: number): void {
  const dataView = new DataView(bytes.buffer, bytes.byteOffset + offset, 20);
  dataView.setInt32(0, point.x, true);
  dataView.setInt32(4, point.y, true);
  dataView.setInt32(8, point.z, true);
  dataView.setUint16(12, point.intensity, true);
  dataView.setUint8(14, point.bitByte);
  dataView.setUint8(15, point.classification);
  dataView.setInt8(16, point.scanAngleRank);
  dataView.setUint8(17, point.userData);
  dataView.setUint16(18, point.pointSourceId, true);
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

function clonePoint14(point: Point14): Point14 {
  return {...point};
}

function readPoint14(bytes: Uint8Array, offset: number): Point14 {
  const dataView = new DataView(bytes.buffer, bytes.byteOffset + offset, 30);
  return {
    x: dataView.getInt32(0, true),
    y: dataView.getInt32(4, true),
    z: dataView.getInt32(8, true),
    intensity: dataView.getUint16(12, true),
    returns: dataView.getUint8(14),
    flags: dataView.getUint8(15),
    classification: dataView.getUint8(16),
    userData: dataView.getUint8(17),
    scanAngle: dataView.getInt16(18, true),
    pointSourceId: dataView.getUint16(20, true),
    gpsTime: dataView.getFloat64(22, true)
  };
}

function writePoint14(point: Point14, bytes: Uint8Array, offset: number): void {
  const dataView = new DataView(bytes.buffer, bytes.byteOffset + offset, 30);
  dataView.setInt32(0, point.x, true);
  dataView.setInt32(4, point.y, true);
  dataView.setInt32(8, point.z, true);
  dataView.setUint16(12, point.intensity, true);
  dataView.setUint8(14, point.returns);
  dataView.setUint8(15, point.flags);
  dataView.setUint8(16, point.classification);
  dataView.setUint8(17, point.userData);
  dataView.setInt16(18, point.scanAngle, true);
  dataView.setUint16(20, point.pointSourceId, true);
  dataView.setFloat64(22, point.gpsTime, true);
}

function getReturnNumber(point: Point14): number {
  return point.returns & 0x0f;
}

function setReturnNumber(point: Point14, returnNumber: number): void {
  point.returns = (returnNumber & 0x0f) | (point.returns & 0xf0);
}

function getNumberOfReturns(point: Point14): number {
  return point.returns >> 4;
}

function setNumberOfReturns(point: Point14, numberOfReturns: number): void {
  point.returns = ((numberOfReturns & 0x0f) << 4) | (point.returns & 0x0f);
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

function readRGB(bytes: Uint8Array, offset: number): RGB {
  return {
    r: readUint16(bytes, offset),
    g: readUint16(bytes, offset + 2),
    b: readUint16(bytes, offset + 4)
  };
}

function writeRGB(rgb: RGB, bytes: Uint8Array, offset: number): void {
  writeUint16(rgb.r, bytes, offset);
  writeUint16(rgb.g, bytes, offset + 2);
  writeUint16(rgb.b, bytes, offset + 4);
}

function readUint16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function writeUint16(value: number, bytes: Uint8Array, offset: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
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
  const arrayBuffer = new ArrayBuffer(8);
  new DataView(arrayBuffer).setFloat64(0, value, true);
  return new DataView(arrayBuffer).getBigUint64(0, true);
}

function bigUint64ToFloat64(value: bigint): number {
  const arrayBuffer = new ArrayBuffer(8);
  new DataView(arrayBuffer).setBigUint64(0, value, true);
  return new DataView(arrayBuffer).getFloat64(0, true);
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
