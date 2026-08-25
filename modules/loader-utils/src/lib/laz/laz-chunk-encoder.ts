// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LAZChunkMetadata} from './laz-chunk-decoder';
import type {LAZChunkTableEntry} from './laz-chunk-decoder';
import {
  ArithmeticEncoder,
  ArithmeticModel,
  IntegerCompressor,
  StreamingMedian,
  toInt32
} from './laz-arithmetic-encoder';

const POINT_FORMAT_BASE_LENGTHS: Record<number, number> = {0: 20, 6: 30, 7: 36, 8: 38};
const LASZIP_VLR_HEADER_LENGTH = 54;
const LASZIP_VLR_PAYLOAD_BASE_LENGTH = 34;
const GPS_TIME_MULTI = 500;
const GPS_TIME_MULTI_MINUS = -10;
const GPS_TIME_MULTI_CODE_FULL = 511;

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

/** Feedable TypeScript LAZ chunk encoder. */
export class FeedableLAZChunkEncoder {
  /** Metadata describing the raw point records. */
  private readonly metadata: LAZChunkMetadata;
  /** Raw point byte ranges supplied by the caller. */
  private readonly chunks: Uint8Array[] = [];
  /** Whether the raw point input has been closed. */
  private closed = false;

  /** Create a feedable encoder for one LAZ chunk. */
  constructor(metadata: LAZChunkMetadata) {
    this.metadata = metadata;
  }

  /** Add raw LAS point record bytes to the encoder input. */
  feed(chunk: ArrayBuffer | ArrayBufferView): void {
    if (this.closed) {
      throw new Error('Cannot feed a closed LAZ chunk encoder');
    }
    this.chunks.push(toUint8Array(chunk));
  }

  /** Mark the raw point input as complete. */
  close(): void {
    this.closed = true;
  }

  /** Encode all fed point data into one compressed LAZ chunk. */
  encode(): Uint8Array {
    if (!this.closed) {
      throw new Error('LAZ chunk encoder input is not closed');
    }
    return encodeLAZChunk(concatenateUint8Arrays(this.chunks), this.metadata);
  }
}

/** Create a feedable TypeScript LAZ chunk encoder. */
export function createLAZChunkEncoder(metadata: LAZChunkMetadata): FeedableLAZChunkEncoder {
  return new FeedableLAZChunkEncoder(metadata);
}

/** Encode raw LAS 1.4 point records into one LASzip layered chunk. */
export function encodeLAZChunk(
  rawPointData: ArrayBuffer | ArrayBufferView,
  metadata: LAZChunkMetadata
): Uint8Array {
  const rawBytes = toUint8Array(rawPointData);
  validateMetadata(rawBytes, metadata);
  if (metadata.pointCount === 0) {
    return new Uint8Array(0);
  }

  if (metadata.pointDataRecordFormat === 0) {
    return encodeLegacyPointFormat0Chunk(rawBytes, metadata);
  }

  const pointRecordLength = metadata.pointDataRecordLength;
  const pointFormat = metadata.pointDataRecordFormat;
  const baseRecordLength = POINT_FORMAT_BASE_LENGTHS[pointFormat];
  const extraByteCount = pointRecordLength - baseRecordLength;
  const firstRecord = rawBytes.subarray(0, pointRecordLength);
  const firstPoint = readPoint14(firstRecord, 0);
  const pointEncoder = new Point14LayerEncoder(firstPoint);
  const firstRgb = pointFormat >= 7 ? readRgb(firstRecord, 30) : null;
  const rgbEncoder = firstRgb
    ? new RGB14LayerEncoder(firstRgb, getScannerChannel(firstPoint))
    : null;
  const nirEncoder =
    pointFormat === 8
      ? new NIR14LayerEncoder(readUint16(firstRecord, 36), getScannerChannel(firstPoint))
      : null;
  const extraBytesEncoder = extraByteCount
    ? new Byte14LayerEncoder(
        firstRecord.subarray(baseRecordLength, pointRecordLength),
        getScannerChannel(firstPoint)
      )
    : null;

  for (let pointIndex = 1; pointIndex < metadata.pointCount; pointIndex++) {
    const recordOffset = pointIndex * pointRecordLength;
    const record = rawBytes.subarray(recordOffset, recordOffset + pointRecordLength);
    const itemContext = pointEncoder.encode(readPoint14(record, 0));
    rgbEncoder?.encode(readRgb(record, 30), itemContext);
    nirEncoder?.encode(readUint16(record, 36), itemContext);
    extraBytesEncoder?.encode(record.subarray(baseRecordLength, pointRecordLength), itemContext);
  }

  const pointLayers = pointEncoder.finish();
  const rgbLayer = rgbEncoder?.finish();
  const nirLayer = nirEncoder?.finish();
  const extraByteLayers = extraBytesEncoder?.finish() || [];
  const layers = [
    ...pointLayers,
    ...(rgbLayer ? [rgbLayer] : []),
    ...(nirLayer ? [nirLayer] : []),
    ...extraByteLayers
  ];

  const sizeHeader = new Uint8Array(4 + layers.length * 4);
  const sizeView = new DataView(sizeHeader.buffer);
  sizeView.setUint32(0, metadata.pointCount, true);
  for (let index = 0; index < layers.length; index++) {
    sizeView.setUint32(4 + index * 4, layers[index].byteLength, true);
  }
  return concatenateUint8Arrays([firstRecord, sizeHeader, ...layers]);
}

/** Encode LASzip chunk-table entries as one arithmetic-coded payload. */
export function encodeLAZChunkTable(
  chunks: readonly LAZChunkTableEntry[],
  options: {
    /** Whether to include the point count for each variable-size chunk. */
    variable?: boolean;
  } = {}
): Uint8Array {
  if (chunks.length === 0) {
    return new Uint8Array(0);
  }

  const encoder = new ArithmeticEncoder();
  const compressor = new IntegerCompressor(encoder, 32, 2);
  let pointCountPredictor = 0;
  let byteLengthPredictor = 0;

  for (const chunk of chunks) {
    validateChunkTableEntry(chunk);
    if (options.variable) {
      compressor.compress(pointCountPredictor, chunk.pointCount, 0);
      pointCountPredictor = chunk.pointCount;
    }
    compressor.compress(byteLengthPredictor, chunk.byteLength, 1);
    byteLengthPredictor = chunk.byteLength;
  }

  return encoder.finish();
}

/** Encode a complete LASzip VLR for a supported layered point layout. */
export function encodeLASzipVLR(options: {
  /** LAS point data record format. */
  pointDataRecordFormat: number;
  /** Uncompressed byte length of each point record. */
  pointDataRecordLength: number;
  /** Fixed chunk size or `0xffffffff` for variable chunks. */
  chunkSize: number;
  /** LASzip item codec version. */
  itemVersion?: 2 | 3;
}): Uint8Array {
  const legacy = options.pointDataRecordFormat <= 5;
  const itemVersion = options.itemVersion || (legacy ? 2 : 3);
  const items = getLASzipItems(options.pointDataRecordFormat, options.pointDataRecordLength);
  const payloadLength = LASZIP_VLR_PAYLOAD_BASE_LENGTH + items.length * 6;
  const bytes = new Uint8Array(LASZIP_VLR_HEADER_LENGTH + payloadLength);
  const dataView = new DataView(bytes.buffer);
  const payloadOffset = LASZIP_VLR_HEADER_LENGTH;

  writeString(dataView, 2, 'laszip encoded', 16);
  dataView.setUint16(18, 22204, true);
  dataView.setUint16(20, payloadLength, true);
  writeString(dataView, 22, 'loaders.gl LAZ writer', 32);
  dataView.setUint16(payloadOffset, legacy ? 2 : 3, true);
  dataView.setUint16(payloadOffset + 2, 0, true);
  dataView.setUint8(payloadOffset + 4, legacy ? 2 : 3);
  dataView.setUint8(payloadOffset + 5, 0);
  dataView.setUint16(payloadOffset + 6, 1, true);
  dataView.setUint32(payloadOffset + 8, 0, true);
  dataView.setUint32(payloadOffset + 12, options.chunkSize, true);
  bytes.fill(0xff, payloadOffset + 16, payloadOffset + 32);
  dataView.setUint16(payloadOffset + 32, items.length, true);
  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    const itemOffset = payloadOffset + LASZIP_VLR_PAYLOAD_BASE_LENGTH + itemIndex * 6;
    const item = items[itemIndex];
    dataView.setUint16(itemOffset, item.type, true);
    dataView.setUint16(itemOffset + 2, item.size, true);
    dataView.setUint16(itemOffset + 4, itemVersion, true);
  }
  return bytes;
}

type Point14 = {
  /** Quantized X coordinate. */
  x: number;
  /** Quantized Y coordinate. */
  y: number;
  /** Quantized Z coordinate. */
  z: number;
  /** Pulse return intensity. */
  intensity: number;
  /** Packed return number and number of returns. */
  returns: number;
  /** Packed classification, scanner-channel, and flight-line flags. */
  flags: number;
  /** Point classification. */
  classification: number;
  /** User-defined point data. */
  userData: number;
  /** Scan angle in LAS 1.4 units. */
  scanAngle: number;
  /** Point source identifier. */
  pointSourceId: number;
  /** Raw IEEE-754 GPS timestamp bits. */
  gpsTimeBits: bigint;
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

/** Encode the legacy LAS point-format 0 item and optional Extra Bytes. */
function encodeLegacyPointFormat0Chunk(
  rawBytes: Uint8Array,
  metadata: LAZChunkMetadata
): Uint8Array {
  const pointRecordLength = metadata.pointDataRecordLength;
  const extraByteCount = pointRecordLength - 20;
  const firstRecord = rawBytes.subarray(0, pointRecordLength);
  const encoder = new ArithmeticEncoder();
  const pointEncoder = new Point10LayerEncoder(encoder, readPoint10(firstRecord, 0));
  const extraBytesEncoder = extraByteCount
    ? new Byte10LayerEncoder(encoder, firstRecord.subarray(20, pointRecordLength))
    : null;

  for (let pointIndex = 1; pointIndex < metadata.pointCount; pointIndex++) {
    const recordOffset = pointIndex * pointRecordLength;
    const record = rawBytes.subarray(recordOffset, recordOffset + pointRecordLength);
    pointEncoder.encode(readPoint10(record, 0));
    extraBytesEncoder?.encode(record.subarray(20, pointRecordLength));
  }

  return concatenateUint8Arrays([firstRecord, encoder.finish()]);
}

/** Encode the interleaved arithmetic Point10 LASzip item. */
class Point10LayerEncoder {
  private readonly changedValuesModel = new ArithmeticModel(64);
  private readonly bitByteModels = createModels(256, 256);
  private readonly classificationModels = createModels(256, 256);
  private readonly scanAngleRankModels = createModels(2, 256);
  private readonly userDataModels = createModels(256, 256);
  private readonly intensityCompressor: IntegerCompressor;
  private readonly pointSourceIdCompressor: IntegerCompressor;
  private readonly xDifferenceCompressor: IntegerCompressor;
  private readonly yDifferenceCompressor: IntegerCompressor;
  private readonly zCompressor: IntegerCompressor;
  private readonly lastIntensity = new Array<number>(16).fill(0);
  private readonly lastHeight = new Array<number>(8).fill(0);
  private readonly lastXDifferenceMedian = Array.from({length: 16}, () => new StreamingMedian());
  private readonly lastYDifferenceMedian = Array.from({length: 16}, () => new StreamingMedian());
  private last: Point10;

  constructor(
    private readonly encoder: ArithmeticEncoder,
    firstPoint: Point10
  ) {
    this.last = {...firstPoint};
    this.lastHeight.fill(firstPoint.z);
    this.intensityCompressor = new IntegerCompressor(encoder, 16, 4);
    this.pointSourceIdCompressor = new IntegerCompressor(encoder, 16, 1);
    this.xDifferenceCompressor = new IntegerCompressor(encoder, 32, 2);
    this.yDifferenceCompressor = new IntegerCompressor(encoder, 32, 22);
    this.zCompressor = new IntegerCompressor(encoder, 32, 20);
  }

  /** Encode one Point10 record after the first raw record. */
  encode(point: Point10): void {
    const lastPoint = this.last;
    const changedValues =
      (point.bitByte !== lastPoint.bitByte ? 1 << 5 : 0) |
      (point.intensity !== lastPoint.intensity ? 1 << 4 : 0) |
      (point.classification !== lastPoint.classification ? 1 << 3 : 0) |
      (point.scanAngleRank !== lastPoint.scanAngleRank ? 1 << 2 : 0) |
      (point.userData !== lastPoint.userData ? 1 << 1 : 0) |
      (point.pointSourceId !== lastPoint.pointSourceId ? 1 : 0);
    this.encoder.encodeSymbol(this.changedValuesModel, changedValues);

    if (changedValues & (1 << 5)) {
      this.encoder.encodeSymbol(this.bitByteModels[lastPoint.bitByte], point.bitByte);
    }

    const returnNumber = point.bitByte & 7;
    const numberOfReturns = (point.bitByte >> 3) & 7;
    const context = NUMBER_RETURN_MAP_10_CONTEXT[numberOfReturns][returnNumber];
    const levelContext = NUMBER_RETURN_LEVEL_10_CONTEXT[numberOfReturns][returnNumber];

    if (changedValues & (1 << 4)) {
      this.intensityCompressor.compress(
        this.lastIntensity[context],
        point.intensity,
        context < 3 ? context : 3
      );
      this.lastIntensity[context] = point.intensity;
    }
    if (changedValues & (1 << 3)) {
      this.encoder.encodeSymbol(
        this.classificationModels[lastPoint.classification],
        point.classification
      );
    }
    if (changedValues & (1 << 2)) {
      this.encoder.encodeSymbol(
        this.scanAngleRankModels[(lastPoint.bitByte >> 6) & 1],
        foldInt8(point.scanAngleRank - lastPoint.scanAngleRank)
      );
    }
    if (changedValues & (1 << 1)) {
      this.encoder.encodeSymbol(this.userDataModels[lastPoint.userData], point.userData);
    }
    if (changedValues & 1) {
      this.pointSourceIdCompressor.compress(lastPoint.pointSourceId, point.pointSourceId);
    }

    const xMedian = this.lastXDifferenceMedian[context].get();
    const xDifference = toInt32(point.x - lastPoint.x);
    this.xDifferenceCompressor.compress(xMedian, xDifference, numberOfReturns === 1 ? 1 : 0);
    this.lastXDifferenceMedian[context].add(xDifference);

    const yMedian = this.lastYDifferenceMedian[context].get();
    const xKbits = Math.min(this.xDifferenceCompressor.k, 20) & ~1;
    const yDifference = toInt32(point.y - lastPoint.y);
    this.yDifferenceCompressor.compress(
      yMedian,
      yDifference,
      (numberOfReturns === 1 ? 1 : 0) + xKbits
    );
    this.lastYDifferenceMedian[context].add(yDifference);

    const zKbits =
      Math.min((this.xDifferenceCompressor.k + this.yDifferenceCompressor.k) >> 1, 18) & ~1;
    this.zCompressor.compress(
      this.lastHeight[levelContext],
      point.z,
      (numberOfReturns === 1 ? 1 : 0) + zKbits
    );
    this.lastHeight[levelContext] = point.z;
    this.last = {...point};
  }
}

/** Encode the legacy Byte item that carries Extra Bytes values. */
class Byte10LayerEncoder {
  private readonly models: ArithmeticModel[];
  private readonly last: Uint8Array;

  constructor(
    private readonly encoder: ArithmeticEncoder,
    firstValues: Uint8Array
  ) {
    this.models = createModels(firstValues.byteLength, 256);
    this.last = new Uint8Array(firstValues);
  }

  /** Encode one Extra Bytes value after the first raw value. */
  encode(values: Uint8Array): void {
    for (let index = 0; index < values.byteLength; index++) {
      const difference = values[index] - this.last[index];
      this.encoder.encodeSymbol(this.models[index], foldUint8(difference));
      this.last[index] = values[index];
    }
  }
}

type Rgb14 = {
  /** Red channel. */
  red: number;
  /** Green channel. */
  green: number;
  /** Blue channel. */
  blue: number;
};

/** One LASzip item descriptor written into the codec VLR. */
type LASzipItem = {
  /** LASzip item type identifier. */
  type: number;
  /** Uncompressed item byte length. */
  size: number;
};

/** Prediction state for one Point14 scanner channel. */
class Point14Context {
  /** Changed-value models selected by prior return and GPS state. */
  readonly changedValuesModels = createModels(8, 128);
  /** Scanner-channel delta model. */
  readonly scannerChannelModel = new ArithmeticModel(3);
  /** Return-number delta model used when GPS time is unchanged. */
  readonly returnNumberGpsSameModel = new ArithmeticModel(13);
  /** Lazily allocated number-of-returns models. */
  readonly numberReturnsModels: Array<ArithmeticModel | null> = new Array(16).fill(null);
  /** Lazily allocated return-number models. */
  readonly returnNumberModels: Array<ArithmeticModel | null> = new Array(16).fill(null);
  /** Lazily allocated classification models. */
  readonly classificationModels: Array<ArithmeticModel | null> = new Array(64).fill(null);
  /** Lazily allocated flag models. */
  readonly flagModels: Array<ArithmeticModel | null> = new Array(64).fill(null);
  /** Lazily allocated user-data models. */
  readonly userDataModels: Array<ArithmeticModel | null> = new Array(64).fill(null);
  /** GPS multiplier model. */
  readonly gpsTimeMultiplierModel = new ArithmeticModel(515);
  /** GPS zero-difference model. */
  readonly gpsTimeZeroDifferenceModel = new ArithmeticModel(5);
  /** X difference compressor. */
  readonly xDifferenceCompressor: IntegerCompressor;
  /** Y difference compressor. */
  readonly yDifferenceCompressor: IntegerCompressor;
  /** Z value compressor. */
  readonly zCompressor: IntegerCompressor;
  /** Intensity compressor. */
  readonly intensityCompressor: IntegerCompressor;
  /** Scan-angle compressor. */
  readonly scanAngleCompressor: IntegerCompressor;
  /** Point-source ID compressor. */
  readonly pointSourceIdCompressor: IntegerCompressor;
  /** GPS bit-difference compressor. */
  readonly gpsTimeCompressor: IntegerCompressor;
  /** Last X difference medians by return context. */
  readonly lastXDifferenceMedian = Array.from({length: 12}, () => new StreamingMedian());
  /** Last Y difference medians by return context. */
  readonly lastYDifferenceMedian = Array.from({length: 12}, () => new StreamingMedian());
  /** Last Z value by return level. */
  readonly lastZ: number[];
  /** Last intensity by first/last and GPS context. */
  readonly lastIntensity: number[];
  /** Last GPS time for each interleaved sequence. */
  readonly lastGpsTimeBits: bigint[];
  /** Last signed GPS bit difference for each sequence. */
  readonly lastGpsTimeDifference = new Array<number>(4).fill(0);
  /** Extreme GPS multiplier counters by sequence. */
  readonly gpsTimeExtremeCounter = new Array<number>(4).fill(0);
  /** Current GPS sequence. */
  lastGpsSequence = 0;
  /** Next GPS sequence replacement slot. */
  nextGpsSequence = 0;
  /** Whether the preceding point changed GPS time. */
  gpsTimeChanged = false;
  /** Last point encoded in this scanner channel. */
  readonly last: Point14;

  /** Create scanner-channel state initialized from a preceding point. */
  constructor(point: Point14, layers: Point14ArithmeticLayers) {
    this.last = {...point};
    this.xDifferenceCompressor = new IntegerCompressor(layers.xy, 32, 2);
    this.yDifferenceCompressor = new IntegerCompressor(layers.xy, 32, 22);
    this.zCompressor = new IntegerCompressor(layers.z, 32, 20);
    this.intensityCompressor = new IntegerCompressor(layers.intensity, 16, 4);
    this.scanAngleCompressor = new IntegerCompressor(layers.scanAngle, 16, 2);
    this.pointSourceIdCompressor = new IntegerCompressor(layers.pointSourceId, 16, 1);
    this.gpsTimeCompressor = new IntegerCompressor(layers.gpsTime, 32, 9);
    this.lastZ = new Array<number>(8).fill(point.z);
    this.lastIntensity = new Array<number>(8).fill(point.intensity);
    this.lastGpsTimeBits = [point.gpsTimeBits, 0n, 0n, 0n];
  }
}

type Point14ArithmeticLayers = {
  /** Scanner channel, return, X, and Y stream. */
  xy: ArithmeticEncoder;
  /** Z coordinate stream. */
  z: ArithmeticEncoder;
  /** Classification stream. */
  classification: ArithmeticEncoder;
  /** Classification and flight-line flags stream. */
  flags: ArithmeticEncoder;
  /** Intensity stream. */
  intensity: ArithmeticEncoder;
  /** Scan-angle stream. */
  scanAngle: ArithmeticEncoder;
  /** User-data stream. */
  userData: ArithmeticEncoder;
  /** Point-source identifier stream. */
  pointSourceId: ArithmeticEncoder;
  /** GPS timestamp stream. */
  gpsTime: ArithmeticEncoder;
};

/** Encoder for the nine layered Point14 streams. */
class Point14LayerEncoder {
  /** Arithmetic encoder for each independent Point14 layer. */
  private readonly layers: Point14ArithmeticLayers = {
    xy: new ArithmeticEncoder(),
    z: new ArithmeticEncoder(),
    classification: new ArithmeticEncoder(),
    flags: new ArithmeticEncoder(),
    intensity: new ArithmeticEncoder(),
    scanAngle: new ArithmeticEncoder(),
    userData: new ArithmeticEncoder(),
    pointSourceId: new ArithmeticEncoder(),
    gpsTime: new ArithmeticEncoder()
  };
  /** Scanner-channel prediction contexts. */
  private readonly contexts: Array<Point14Context | null> = new Array(4).fill(null);
  /** Scanner channel used by the previous point. */
  private currentScannerChannel: number;
  /** Whether each optional Point14 layer changed in this chunk. */
  private readonly changed = {
    classification: false,
    flags: false,
    intensity: false,
    scanAngle: false,
    userData: false,
    pointSourceId: false,
    gpsTime: false
  };

  /** Initialize Point14 coding from the raw first point. */
  constructor(firstPoint: Point14) {
    this.currentScannerChannel = getScannerChannel(firstPoint);
    this.contexts[this.currentScannerChannel] = new Point14Context(firstPoint, this.layers);
  }

  /** Encode one subsequent Point14 item and return the LASzip v3 item context. */
  encode(point: Point14): number {
    const previousContext = this.contexts[this.currentScannerChannel]!;
    let lastPoint = previousContext.last;
    const scannerChannel = getScannerChannel(point);
    if (scannerChannel !== this.currentScannerChannel && this.contexts[scannerChannel]) {
      lastPoint = this.contexts[scannerChannel]!.last;
    }

    const pointSourceChanged = point.pointSourceId !== lastPoint.pointSourceId;
    const gpsTimeChanged = point.gpsTimeBits !== lastPoint.gpsTimeBits;
    const scanAngleChanged = point.scanAngle !== lastPoint.scanAngle;
    const lastNumberOfReturns = lastPoint.returns >> 4;
    const lastReturnNumber = lastPoint.returns & 0x0f;
    const numberOfReturns = point.returns >> 4;
    const returnNumber = point.returns & 0x0f;
    const previousReturnContext =
      (lastReturnNumber === 1 ? 1 : 0) |
      (lastReturnNumber >= lastNumberOfReturns ? 2 : 0) |
      (previousContext.gpsTimeChanged ? 4 : 0);

    let changedValues =
      (scannerChannel !== this.currentScannerChannel ? 1 << 6 : 0) |
      (pointSourceChanged ? 1 << 5 : 0) |
      (gpsTimeChanged ? 1 << 4 : 0) |
      (scanAngleChanged ? 1 << 3 : 0) |
      (numberOfReturns !== lastNumberOfReturns ? 1 << 2 : 0);
    if (returnNumber !== lastReturnNumber) {
      if (returnNumber === (lastReturnNumber + 1) % 16) {
        changedValues |= 1;
      } else if (returnNumber === (lastReturnNumber + 15) % 16) {
        changedValues |= 2;
      } else {
        changedValues |= 3;
      }
    }
    this.layers.xy.encodeSymbol(
      previousContext.changedValuesModels[previousReturnContext],
      changedValues
    );

    let itemContext = 0;
    if (scannerChannel !== this.currentScannerChannel) {
      const scannerDifference = scannerChannel - this.currentScannerChannel;
      this.layers.xy.encodeSymbol(previousContext.scannerChannelModel, (scannerDifference + 3) % 4);
      this.contexts[scannerChannel] ||= new Point14Context(previousContext.last, this.layers);
      this.currentScannerChannel = scannerChannel;
      itemContext = scannerChannel;
      lastPoint = this.contexts[scannerChannel]!.last;
    }
    const context = this.contexts[this.currentScannerChannel]!;

    if (numberOfReturns !== lastNumberOfReturns) {
      let model = context.numberReturnsModels[lastNumberOfReturns];
      if (!model) {
        model = new ArithmeticModel(16);
        context.numberReturnsModels[lastNumberOfReturns] = model;
      }
      this.layers.xy.encodeSymbol(model, numberOfReturns);
    }
    if ((changedValues & 3) === 3) {
      if (gpsTimeChanged) {
        let model = context.returnNumberModels[lastReturnNumber];
        if (!model) {
          model = new ArithmeticModel(16);
          context.returnNumberModels[lastReturnNumber] = model;
        }
        this.layers.xy.encodeSymbol(model, returnNumber);
      } else {
        const returnDifference = returnNumber - lastReturnNumber;
        this.layers.xy.encodeSymbol(context.returnNumberGpsSameModel, (returnDifference + 14) % 16);
      }
    }

    const returnMap = NUMBER_RETURN_MAP_6_CONTEXT[numberOfReturns][returnNumber];
    const returnLevel = NUMBER_RETURN_LEVEL_8_CONTEXT[numberOfReturns][returnNumber];
    const currentReturnContext =
      (returnNumber === 1 ? 2 : 0) | (returnNumber >= numberOfReturns ? 1 : 0);
    const xyContext = (returnMap << 1) | (gpsTimeChanged ? 1 : 0);
    const xMedian = context.lastXDifferenceMedian[xyContext].get();
    const xDifference = toInt32(point.x - lastPoint.x);
    context.xDifferenceCompressor.compress(xMedian, xDifference, numberOfReturns === 1 ? 1 : 0);
    context.lastXDifferenceMedian[xyContext].add(xDifference);

    const yMedian = context.lastYDifferenceMedian[xyContext].get();
    const yDifference = toInt32(point.y - lastPoint.y);
    const yContext =
      (numberOfReturns === 1 ? 1 : 0) | (Math.min(context.xDifferenceCompressor.k, 20) & ~1);
    context.yDifferenceCompressor.compress(yMedian, yDifference, yContext);
    context.lastYDifferenceMedian[xyContext].add(yDifference);

    const zContext =
      (numberOfReturns === 1 ? 1 : 0) |
      (Math.min((context.xDifferenceCompressor.k + context.yDifferenceCompressor.k) >> 1, 18) & ~1);
    context.zCompressor.compress(context.lastZ[returnLevel], point.z, zContext);
    context.lastZ[returnLevel] = point.z;

    if (point.classification !== lastPoint.classification) {
      this.changed.classification = true;
    }
    const classificationContext =
      ((lastPoint.classification & 0x1f) << 1) | (currentReturnContext === 3 ? 1 : 0);
    let classificationModel = context.classificationModels[classificationContext];
    if (!classificationModel) {
      classificationModel = new ArithmeticModel(256);
      context.classificationModels[classificationContext] = classificationModel;
    }
    this.layers.classification.encodeSymbol(classificationModel, point.classification);

    const lastFlags = mergeFlags(lastPoint);
    const flags = mergeFlags(point);
    if (flags !== lastFlags) {
      this.changed.flags = true;
    }
    let flagModel = context.flagModels[lastFlags];
    if (!flagModel) {
      flagModel = new ArithmeticModel(64);
      context.flagModels[lastFlags] = flagModel;
    }
    this.layers.flags.encodeSymbol(flagModel, flags);

    if (point.intensity !== lastPoint.intensity) {
      this.changed.intensity = true;
    }
    const intensityIndex = (currentReturnContext << 1) | (gpsTimeChanged ? 1 : 0);
    context.intensityCompressor.compress(
      context.lastIntensity[intensityIndex],
      point.intensity,
      currentReturnContext
    );
    context.lastIntensity[intensityIndex] = point.intensity;

    if (scanAngleChanged) {
      this.changed.scanAngle = true;
      context.scanAngleCompressor.compress(
        lastPoint.scanAngle,
        point.scanAngle,
        gpsTimeChanged ? 1 : 0
      );
    }

    if (point.userData !== lastPoint.userData) {
      this.changed.userData = true;
    }
    const userDataContext = lastPoint.userData >> 2;
    let userDataModel = context.userDataModels[userDataContext];
    if (!userDataModel) {
      userDataModel = new ArithmeticModel(256);
      context.userDataModels[userDataContext] = userDataModel;
    }
    this.layers.userData.encodeSymbol(userDataModel, point.userData);

    if (pointSourceChanged) {
      this.changed.pointSourceId = true;
      context.pointSourceIdCompressor.compress(lastPoint.pointSourceId, point.pointSourceId);
    }
    if (gpsTimeChanged) {
      this.changed.gpsTime = true;
      this.encodeGpsTime(context, point.gpsTimeBits);
    }

    copyPoint14(context.last, point);
    context.gpsTimeChanged = gpsTimeChanged;
    return itemContext;
  }

  /** Finish Point14 arithmetic streams in LASzip layer order. */
  finish(): Uint8Array[] {
    return [
      this.layers.xy.finish(),
      this.layers.z.finish(),
      this.changed.classification ? this.layers.classification.finish() : new Uint8Array(0),
      this.changed.flags ? this.layers.flags.finish() : new Uint8Array(0),
      this.changed.intensity ? this.layers.intensity.finish() : new Uint8Array(0),
      this.changed.scanAngle ? this.layers.scanAngle.finish() : new Uint8Array(0),
      this.changed.userData ? this.layers.userData.finish() : new Uint8Array(0),
      this.changed.pointSourceId ? this.layers.pointSourceId.finish() : new Uint8Array(0),
      this.changed.gpsTime ? this.layers.gpsTime.finish() : new Uint8Array(0)
    ];
  }

  /** Encode one changed GPS time into the active scanner-channel sequence state. */
  private encodeGpsTime(context: Point14Context, gpsTimeBits: bigint): void {
    const sequence = context.lastGpsSequence;
    const difference64 = BigInt.asIntN(64, gpsTimeBits - context.lastGpsTimeBits[sequence]);
    const difference = Number(BigInt.asIntN(32, difference64));
    const differenceFits = difference64 === BigInt(difference);

    if (context.lastGpsTimeDifference[sequence] === 0) {
      if (differenceFits) {
        this.layers.gpsTime.encodeSymbol(context.gpsTimeZeroDifferenceModel, 0);
        context.gpsTimeCompressor.compress(0, difference, 0);
        context.lastGpsTimeDifference[sequence] = difference;
        context.gpsTimeExtremeCounter[sequence] = 0;
      } else if (this.selectGpsTimeSequence(context, gpsTimeBits, false)) {
        this.encodeGpsTime(context, gpsTimeBits);
        return;
      } else {
        this.layers.gpsTime.encodeSymbol(context.gpsTimeZeroDifferenceModel, 1);
        this.startGpsTimeSequence(context, gpsTimeBits);
      }
    } else if (differenceFits) {
      const lastDifference = context.lastGpsTimeDifference[sequence];
      const multiplier = quantizeFloat32(difference, lastDifference);
      if (multiplier === 1) {
        this.layers.gpsTime.encodeSymbol(context.gpsTimeMultiplierModel, 1);
        context.gpsTimeCompressor.compress(lastDifference, difference, 1);
        context.gpsTimeExtremeCounter[sequence] = 0;
      } else if (multiplier > 0) {
        if (multiplier < GPS_TIME_MULTI) {
          this.layers.gpsTime.encodeSymbol(context.gpsTimeMultiplierModel, multiplier);
          context.gpsTimeCompressor.compress(
            toInt32(multiplier * lastDifference),
            difference,
            multiplier < 10 ? 2 : 3
          );
        } else {
          this.layers.gpsTime.encodeSymbol(context.gpsTimeMultiplierModel, GPS_TIME_MULTI);
          context.gpsTimeCompressor.compress(
            toInt32(GPS_TIME_MULTI * lastDifference),
            difference,
            4
          );
          this.recordExtremeGpsDifference(context, sequence, difference);
        }
      } else if (multiplier < 0) {
        if (multiplier > GPS_TIME_MULTI_MINUS) {
          this.layers.gpsTime.encodeSymbol(
            context.gpsTimeMultiplierModel,
            GPS_TIME_MULTI - multiplier
          );
          context.gpsTimeCompressor.compress(toInt32(multiplier * lastDifference), difference, 5);
        } else {
          this.layers.gpsTime.encodeSymbol(
            context.gpsTimeMultiplierModel,
            GPS_TIME_MULTI - GPS_TIME_MULTI_MINUS
          );
          context.gpsTimeCompressor.compress(
            toInt32(GPS_TIME_MULTI_MINUS * lastDifference),
            difference,
            6
          );
          this.recordExtremeGpsDifference(context, sequence, difference);
        }
      } else {
        this.layers.gpsTime.encodeSymbol(context.gpsTimeMultiplierModel, 0);
        context.gpsTimeCompressor.compress(0, difference, 7);
        this.recordExtremeGpsDifference(context, sequence, difference);
      }
    } else if (this.selectGpsTimeSequence(context, gpsTimeBits, true)) {
      this.encodeGpsTime(context, gpsTimeBits);
      return;
    } else {
      this.layers.gpsTime.encodeSymbol(context.gpsTimeMultiplierModel, GPS_TIME_MULTI_CODE_FULL);
      this.startGpsTimeSequence(context, gpsTimeBits);
    }
    context.lastGpsTimeBits[context.lastGpsSequence] = gpsTimeBits;
  }

  /** Select an existing GPS sequence whose bit difference fits in 32 bits. */
  private selectGpsTimeSequence(
    context: Point14Context,
    gpsTimeBits: bigint,
    hasLastDifference: boolean
  ): boolean {
    for (let index = 1; index < 4; index++) {
      const sequence = (context.lastGpsSequence + index) & 3;
      const difference64 = BigInt.asIntN(64, gpsTimeBits - context.lastGpsTimeBits[sequence]);
      if (difference64 === BigInt.asIntN(32, difference64)) {
        const symbol = hasLastDifference ? GPS_TIME_MULTI_CODE_FULL + index : index + 1;
        const model = hasLastDifference
          ? context.gpsTimeMultiplierModel
          : context.gpsTimeZeroDifferenceModel;
        this.layers.gpsTime.encodeSymbol(model, symbol);
        context.lastGpsSequence = sequence;
        return true;
      }
    }
    return false;
  }

  /** Start a new GPS sequence by writing upper and lower timestamp words. */
  private startGpsTimeSequence(context: Point14Context, gpsTimeBits: bigint): void {
    const previousBits = context.lastGpsTimeBits[context.lastGpsSequence];
    context.gpsTimeCompressor.compress(
      Number(BigInt.asIntN(32, previousBits >> 32n)),
      Number(BigInt.asIntN(32, gpsTimeBits >> 32n)),
      8
    );
    this.layers.gpsTime.writeInt(Number(gpsTimeBits & 0xffffffffn));
    context.nextGpsSequence = (context.nextGpsSequence + 1) & 3;
    context.lastGpsSequence = context.nextGpsSequence;
    context.lastGpsTimeDifference[context.lastGpsSequence] = 0;
    context.gpsTimeExtremeCounter[context.lastGpsSequence] = 0;
  }

  /** Update GPS difference prediction after four consecutive extreme multipliers. */
  private recordExtremeGpsDifference(
    context: Point14Context,
    sequence: number,
    difference: number
  ): void {
    context.gpsTimeExtremeCounter[sequence]++;
    if (context.gpsTimeExtremeCounter[sequence] > 3) {
      context.lastGpsTimeDifference[sequence] = difference;
      context.gpsTimeExtremeCounter[sequence] = 0;
    }
  }
}

/** RGB prediction state for one LASzip v3 item context. */
class RGB14Context {
  /** Previous red channel. */
  red: number;
  /** Previous green channel. */
  green: number;
  /** Previous blue channel. */
  blue: number;
  /** Changed-byte mask model. */
  readonly usedModel = new ArithmeticModel(128);
  /** Byte correction models. */
  readonly differenceModels = createModels(6, 256);

  /** Initialize an RGB context from a previous color. */
  constructor(color: Rgb14) {
    this.red = color.red;
    this.green = color.green;
    this.blue = color.blue;
  }
}

/** Encoder for the layered RGB14 stream. */
class RGB14LayerEncoder {
  /** RGB arithmetic stream. */
  private readonly encoder = new ArithmeticEncoder();
  /** LASzip v3 item contexts. */
  private readonly contexts: Array<RGB14Context | null> = new Array(4).fill(null);
  /** Item context used by the previous point. */
  private currentContext: number;
  /** Whether any RGB channel changed. */
  private changed = false;

  /** Initialize RGB coding from the first point. */
  constructor(firstColor: Rgb14, firstContext: number) {
    this.currentContext = firstContext;
    this.contexts[firstContext] = new RGB14Context(firstColor);
  }

  /** Encode one RGB item in the Point14-provided item context. */
  encode(color: Rgb14, itemContext: number): void {
    let lastContext = this.contexts[this.currentContext]!;
    if (itemContext !== this.currentContext) {
      this.currentContext = itemContext;
      if (!this.contexts[itemContext]) {
        this.contexts[itemContext] = new RGB14Context({
          red: lastContext.red,
          green: lastContext.green,
          blue: lastContext.blue
        });
        lastContext = this.contexts[itemContext]!;
      }
    }
    const codingContext = this.contexts[this.currentContext]!;
    let symbol =
      ((color.red & 0xff) !== (lastContext.red & 0xff) ? 1 : 0) |
      ((color.red & 0xff00) !== (lastContext.red & 0xff00) ? 2 : 0) |
      ((color.green & 0xff) !== (lastContext.green & 0xff) ? 4 : 0) |
      ((color.green & 0xff00) !== (lastContext.green & 0xff00) ? 8 : 0) |
      ((color.blue & 0xff) !== (lastContext.blue & 0xff) ? 16 : 0) |
      ((color.blue & 0xff00) !== (lastContext.blue & 0xff00) ? 32 : 0);
    if (
      (color.red & 0xff) !== (color.green & 0xff) ||
      (color.red & 0xff) !== (color.blue & 0xff) ||
      (color.red & 0xff00) !== (color.green & 0xff00) ||
      (color.red & 0xff00) !== (color.blue & 0xff00)
    ) {
      symbol |= 64;
    }
    this.encoder.encodeSymbol(codingContext.usedModel, symbol);

    let lowDifference = 0;
    let highDifference = 0;
    if (symbol & 1) {
      lowDifference = (color.red & 0xff) - (lastContext.red & 0xff);
      this.encoder.encodeSymbol(codingContext.differenceModels[0], foldUint8(lowDifference));
    }
    if (symbol & 2) {
      highDifference = (color.red >> 8) - (lastContext.red >> 8);
      this.encoder.encodeSymbol(codingContext.differenceModels[1], foldUint8(highDifference));
    }
    if (symbol & 64) {
      if (symbol & 4) {
        const correction =
          (color.green & 0xff) - clampUint8(lowDifference + (lastContext.green & 0xff));
        this.encoder.encodeSymbol(codingContext.differenceModels[2], foldUint8(correction));
      }
      if (symbol & 16) {
        lowDifference = Math.trunc(
          (lowDifference + (color.green & 0xff) - (lastContext.green & 0xff)) / 2
        );
        const correction =
          (color.blue & 0xff) - clampUint8(lowDifference + (lastContext.blue & 0xff));
        this.encoder.encodeSymbol(codingContext.differenceModels[4], foldUint8(correction));
      }
      if (symbol & 8) {
        const correction =
          (color.green >> 8) - clampUint8(highDifference + (lastContext.green >> 8));
        this.encoder.encodeSymbol(codingContext.differenceModels[3], foldUint8(correction));
      }
      if (symbol & 32) {
        highDifference = Math.trunc(
          (highDifference + (color.green >> 8) - (lastContext.green >> 8)) / 2
        );
        const correction = (color.blue >> 8) - clampUint8(highDifference + (lastContext.blue >> 8));
        this.encoder.encodeSymbol(codingContext.differenceModels[5], foldUint8(correction));
      }
    }
    this.changed ||= symbol !== 0;
    lastContext.red = color.red;
    lastContext.green = color.green;
    lastContext.blue = color.blue;
  }

  /** Finish the RGB stream, or return an omitted unchanged layer. */
  finish(): Uint8Array {
    return this.changed ? this.encoder.finish() : new Uint8Array(0);
  }
}

/** NIR prediction state for one LASzip v3 item context. */
class NIR14Context {
  /** Previous NIR value. */
  value: number;
  /** Changed-byte mask model. */
  readonly usedModel = new ArithmeticModel(4);
  /** Byte correction models. */
  readonly differenceModels = createModels(2, 256);

  /** Initialize an NIR context from a previous value. */
  constructor(value: number) {
    this.value = value;
  }
}

/** Encoder for the layered NIR14 stream. */
class NIR14LayerEncoder {
  /** NIR arithmetic stream. */
  private readonly encoder = new ArithmeticEncoder();
  /** LASzip v3 item contexts. */
  private readonly contexts: Array<NIR14Context | null> = new Array(4).fill(null);
  /** Item context used by the previous point. */
  private currentContext: number;
  /** Whether any NIR byte changed. */
  private changed = false;

  /** Initialize NIR coding from the first point. */
  constructor(firstValue: number, firstContext: number) {
    this.currentContext = firstContext;
    this.contexts[firstContext] = new NIR14Context(firstValue);
  }

  /** Encode one NIR item in the Point14-provided item context. */
  encode(value: number, itemContext: number): void {
    let lastContext = this.contexts[this.currentContext]!;
    if (itemContext !== this.currentContext) {
      this.currentContext = itemContext;
      if (!this.contexts[itemContext]) {
        this.contexts[itemContext] = new NIR14Context(lastContext.value);
        lastContext = this.contexts[itemContext]!;
      }
    }
    const codingContext = this.contexts[this.currentContext]!;
    const symbol =
      ((value & 0xff) !== (lastContext.value & 0xff) ? 1 : 0) |
      ((value & 0xff00) !== (lastContext.value & 0xff00) ? 2 : 0);
    this.encoder.encodeSymbol(codingContext.usedModel, symbol);
    if (symbol & 1) {
      this.encoder.encodeSymbol(
        codingContext.differenceModels[0],
        foldUint8((value & 0xff) - (lastContext.value & 0xff))
      );
    }
    if (symbol & 2) {
      this.encoder.encodeSymbol(
        codingContext.differenceModels[1],
        foldUint8((value >> 8) - (lastContext.value >> 8))
      );
    }
    this.changed ||= symbol !== 0;
    lastContext.value = value;
  }

  /** Finish the NIR stream, or return an omitted unchanged layer. */
  finish(): Uint8Array {
    return this.changed ? this.encoder.finish() : new Uint8Array(0);
  }
}

/** Extra-byte prediction state for one LASzip v3 item context. */
class Byte14Context {
  /** Previous value for each extra-byte layer. */
  readonly values: Uint8Array;
  /** Difference model for each extra-byte layer. */
  readonly models: ArithmeticModel[];

  /** Initialize an extra-byte context from preceding values. */
  constructor(values: Uint8Array) {
    this.values = values.slice();
    this.models = createModels(values.byteLength, 256);
  }
}

/** Encoder for independent Byte14 extra-byte streams. */
class Byte14LayerEncoder {
  /** Arithmetic stream for each extra-byte offset. */
  private readonly encoders: ArithmeticEncoder[];
  /** LASzip v3 item contexts. */
  private readonly contexts: Array<Byte14Context | null> = new Array(4).fill(null);
  /** Whether each extra-byte offset changed. */
  private readonly changed: boolean[];
  /** Item context used by the previous point. */
  private currentContext: number;

  /** Initialize extra-byte coding from the first point. */
  constructor(firstValues: Uint8Array, firstContext: number) {
    this.encoders = Array.from({length: firstValues.byteLength}, () => new ArithmeticEncoder());
    this.changed = new Array<boolean>(firstValues.byteLength).fill(false);
    this.currentContext = firstContext;
    this.contexts[firstContext] = new Byte14Context(firstValues);
  }

  /** Encode extra bytes in the Point14-provided item context. */
  encode(values: Uint8Array, itemContext: number): void {
    let lastContext = this.contexts[this.currentContext]!;
    if (itemContext !== this.currentContext) {
      this.currentContext = itemContext;
      if (!this.contexts[itemContext]) {
        this.contexts[itemContext] = new Byte14Context(lastContext.values);
        lastContext = this.contexts[itemContext]!;
      }
    }
    const codingContext = this.contexts[this.currentContext]!;
    for (let index = 0; index < values.byteLength; index++) {
      const difference = values[index] - lastContext.values[index];
      this.encoders[index].encodeSymbol(codingContext.models[index], foldUint8(difference));
      if (difference) {
        this.changed[index] = true;
        lastContext.values[index] = values[index];
      }
    }
  }

  /** Finish changed extra-byte streams and omit unchanged offsets. */
  finish(): Uint8Array[] {
    return this.encoders.map((encoder, index) =>
      this.changed[index] ? encoder.finish() : new Uint8Array(0)
    );
  }
}

/** Validate that raw records can be represented by the supported LASzip item set. */
function validateMetadata(rawBytes: Uint8Array, metadata: LAZChunkMetadata): void {
  if (!Number.isInteger(metadata.pointCount) || metadata.pointCount < 0) {
    throw new Error(`Invalid LAZ chunk point count ${metadata.pointCount}`);
  }
  const baseLength = POINT_FORMAT_BASE_LENGTHS[metadata.pointDataRecordFormat];
  if (!baseLength) {
    throw new Error(
      `TypeScript LAZ encoder does not support point format ${metadata.pointDataRecordFormat}`
    );
  }
  if (
    !Number.isInteger(metadata.pointDataRecordLength) ||
    metadata.pointDataRecordLength < baseLength
  ) {
    throw new Error(
      `Invalid point record length ${metadata.pointDataRecordLength} for point format ${metadata.pointDataRecordFormat}`
    );
  }
  if (metadata.point14ItemVersion !== undefined && metadata.point14ItemVersion !== 3) {
    throw new Error(`TypeScript LAZ encoder only supports Point14 item version 3`);
  }
  if (
    metadata.pointDataRecordFormat >= 7 &&
    metadata.rgb14ItemVersion !== undefined &&
    metadata.rgb14ItemVersion !== 3
  ) {
    throw new Error(`TypeScript LAZ encoder only supports RGB14 item version 3`);
  }
  if (
    metadata.pointDataRecordLength > baseLength &&
    metadata.byte14ItemVersion !== undefined &&
    metadata.byte14ItemVersion !== 3
  ) {
    throw new Error(`TypeScript LAZ encoder only supports Byte14 item version 3`);
  }
  const expectedByteLength = metadata.pointCount * metadata.pointDataRecordLength;
  if (rawBytes.byteLength !== expectedByteLength) {
    throw new Error(
      `LAZ chunk input has ${rawBytes.byteLength} bytes; expected ${expectedByteLength}`
    );
  }
}

/** Validate one chunk-table entry before integer compression. */
function validateChunkTableEntry(chunk: LAZChunkTableEntry): void {
  if (
    !Number.isInteger(chunk.pointCount) ||
    chunk.pointCount <= 0 ||
    chunk.pointCount > 0xffffffff
  ) {
    throw new Error(`Invalid LAZ chunk point count ${chunk.pointCount}`);
  }
  if (
    !Number.isInteger(chunk.byteLength) ||
    chunk.byteLength <= 0 ||
    chunk.byteLength > 0xffffffff
  ) {
    throw new Error(`Invalid LAZ chunk byte length ${chunk.byteLength}`);
  }
}

/** Return LASzip item descriptors for one supported point format. */
function getLASzipItems(
  pointDataRecordFormat: number,
  pointDataRecordLength: number
): LASzipItem[] {
  const baseLength = POINT_FORMAT_BASE_LENGTHS[pointDataRecordFormat];
  if (!baseLength || pointDataRecordLength < baseLength) {
    throw new Error(
      `Invalid point record length ${pointDataRecordLength} for point format ${pointDataRecordFormat}`
    );
  }
  if (pointDataRecordFormat === 0) {
    const legacyItems: LASzipItem[] = [{type: 6, size: 20}];
    const legacyExtraByteCount = pointDataRecordLength - baseLength;
    if (legacyExtraByteCount > 0) {
      legacyItems.push({type: 0, size: legacyExtraByteCount});
    }
    return legacyItems;
  }
  const items: LASzipItem[] = [{type: 10, size: 30}];
  if (pointDataRecordFormat === 7) {
    items.push({type: 11, size: 6});
  } else if (pointDataRecordFormat === 8) {
    items.push({type: 12, size: 8});
  }
  const extraByteCount = pointDataRecordLength - baseLength;
  if (extraByteCount > 0) {
    items.push({type: 14, size: extraByteCount});
  }
  return items;
}

/** Parse a raw LAS 1.4 Point14 item. */
function readPoint14(bytes: Uint8Array, offset: number): Point14 {
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 30);
  return {
    x: view.getInt32(0, true),
    y: view.getInt32(4, true),
    z: view.getInt32(8, true),
    intensity: view.getUint16(12, true),
    returns: view.getUint8(14),
    flags: view.getUint8(15),
    classification: view.getUint8(16),
    userData: view.getUint8(17),
    scanAngle: view.getInt16(18, true),
    pointSourceId: view.getUint16(20, true),
    gpsTimeBits: view.getBigUint64(22, true)
  };
}

/** Parse a raw legacy LAS Point10 item. */
function readPoint10(bytes: Uint8Array, offset: number): Point10 {
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 20);
  return {
    x: view.getInt32(0, true),
    y: view.getInt32(4, true),
    z: view.getInt32(8, true),
    intensity: view.getUint16(12, true),
    bitByte: view.getUint8(14),
    classification: view.getUint8(15),
    scanAngleRank: view.getInt8(16),
    userData: view.getUint8(17),
    pointSourceId: view.getUint16(18, true)
  };
}

/** Parse one raw RGB14 item. */
function readRgb(bytes: Uint8Array, offset: number): Rgb14 {
  return {
    red: readUint16(bytes, offset),
    green: readUint16(bytes, offset + 2),
    blue: readUint16(bytes, offset + 4)
  };
}

/** Read one little-endian unsigned 16-bit integer. */
function readUint16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

/** Copy all Point14 fields without replacing context object identity. */
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
  target.gpsTimeBits = source.gpsTimeBits;
}

/** Return the scanner-channel bits from a Point14 flags byte. */
function getScannerChannel(point: Point14): number {
  return (point.flags >> 4) & 3;
}

/** Merge Point14 classification and flight-line flags into the LASzip symbol. */
function mergeFlags(point: Point14): number {
  return ((point.flags >> 2) & 0x30) | (point.flags & 0x0f);
}

/** Create uniformly initialized arithmetic models. */
function createModels(count: number, symbols: number): ArithmeticModel[] {
  return Array.from({length: count}, () => new ArithmeticModel(symbols));
}

/** Fold an arbitrary signed byte difference into an unsigned byte. */
function foldUint8(value: number): number {
  return value & 0xff;
}

/** Fold a signed byte correction into the arithmetic symbol range. */
function foldInt8(value: number): number {
  return value & 0xff;
}

/** Clamp a predictor to the unsigned byte range. */
function clampUint8(value: number): number {
  return Math.min(255, Math.max(0, value));
}

/** Match LASzip's float32 multiplier calculation and nearest-integer quantization. */
function quantizeFloat32(numerator: number, denominator: number): number {
  const ratio = Math.fround(Math.fround(numerator) / Math.fround(denominator));
  return ratio >= 0 ? Math.trunc(ratio + 0.5) : Math.trunc(ratio - 0.5);
}

/** Return a byte view that preserves an input view's byte range. */
function toUint8Array(data: ArrayBuffer | ArrayBufferView): Uint8Array {
  return data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

/** Concatenate byte arrays without retaining caller-owned backing buffers. */
function concatenateUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((length, chunk) => length + chunk.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

/** Write a fixed-length ASCII string into a DataView. */
function writeString(
  dataView: DataView,
  byteOffset: number,
  value: string,
  byteLength: number
): void {
  for (let characterIndex = 0; characterIndex < byteLength; characterIndex++) {
    dataView.setUint8(byteOffset + characterIndex, value.charCodeAt(characterIndex) || 0);
  }
}
