// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * TypeScript decoder for standalone LEPCC blobs used by I3S Point Cloud
 * layers. The wire format follows the Apache-licensed Esri reference
 * implementation (https://github.com/Esri/lepcc).
 */

/** Attribute kinds encoded by an I3S LEPCC resource. */
export type I3SLEPCCBlobType = 'xyz' | 'rgb' | 'intensity' | 'flagBytes';

/** Values returned by an I3S LEPCC decode operation. */
export type I3SLEPCCDecodedValue = Float64Array | Uint8Array | Uint16Array;

/** Decoder options. */
export interface I3SLEPCCDecoderOptions {
  /** Verify the Fletcher-32 checksum in each blob. Defaults to `true`. */
  readonly verifyChecksum?: boolean;
}

/**
 * Decodes standalone LEPCC attribute blobs used by I3S Point Cloud layers.
 *
 * I3S stores positions and each point attribute in separate self-describing
 * resources. This implementation is dependency-free and keeps the decoder
 * behind a loaders.gl-owned seam for future worker integration.
 */
export class I3SLEPCCDecoder {
  /** Whether blob checksums are verified before decoding. */
  readonly verifyChecksum: boolean;

  /**
   * @param options - Optional decoder settings.
   */
  constructor(options: I3SLEPCCDecoderOptions = {}) {
    this.verifyChecksum = options.verifyChecksum ?? true;
  }

  /**
   * Identifies the attribute represented by a LEPCC blob.
   *
   * @param bytes - One standalone I3S LEPCC resource.
   * @returns The normalized I3S attribute type.
   */
  getBlobType(bytes: Uint8Array): I3SLEPCCBlobType {
    const magic = readMagic(bytes);
    switch (magic) {
      case 'LEPCC     ':
        return 'xyz';
      case 'ClusterRGB':
        return 'rgb';
      case 'Intensity ':
        return 'intensity';
      case 'FlagBytes ':
        return 'flagBytes';
      default:
        throw new Error(`Unsupported LEPCC blob magic: ${JSON.stringify(magic)}`);
    }
  }

  /**
   * Decodes an I3S LEPCC position resource.
   *
   * @param bytes - A `lepcc-xyz` resource.
   * @returns Interleaved longitude, latitude, and elevation values.
   */
  decodeXyz(bytes: Uint8Array): Float64Array {
    const reader = new BinaryReader(bytes);
    const header = readHeader(reader, 'LEPCC     ', 104, this.verifyChecksum);
    const extent = {
      lower: [reader.readFloat64(), reader.readFloat64(), reader.readFloat64()],
      upper: [reader.readFloat64(), reader.readFloat64(), reader.readFloat64()]
    };
    const maxError = [reader.readFloat64(), reader.readFloat64(), reader.readFloat64()];
    const pointCount = reader.readUint32();
    reader.readUint32();

    const yDelta = decodeCutInSegments(reader);
    const pointsPerRow = decodeCutInSegments(reader);
    const xDelta = decodeCutInSegments(reader);
    const zValues = decodeCutInSegments(reader);
    if (pointsPerRow.reduce((sum, value) => sum + value, 0) !== pointCount) {
      throw new Error('LEPCC XYZ row count does not match the point count');
    }
    if (
      yDelta.length !== pointsPerRow.length ||
      xDelta.length !== pointCount ||
      zValues.length !== pointCount
    ) {
      throw new Error('LEPCC XYZ delta arrays have inconsistent lengths');
    }
    assertBlobConsumed(reader, header.blobSize);

    const output = new Float64Array(pointCount * 3);
    const cellWidth = maxError.map(value => value * 2);
    let y = 0;
    let pointIndex = 0;
    for (let rowIndex = 0; rowIndex < yDelta.length; rowIndex++) {
      y += yDelta[rowIndex];
      let x = 0;
      for (let columnIndex = 0; columnIndex < pointsPerRow[rowIndex]; columnIndex++) {
        x += xDelta[pointIndex];
        const offset = pointIndex * 3;
        output[offset] = Math.min(extent.upper[0], extent.lower[0] + x * cellWidth[0]);
        output[offset + 1] = Math.min(extent.upper[1], extent.lower[1] + y * cellWidth[1]);
        output[offset + 2] = Math.min(
          extent.upper[2],
          extent.lower[2] + zValues[pointIndex] * cellWidth[2]
        );
        pointIndex++;
      }
    }
    return output;
  }

  /**
   * Decodes an I3S LEPCC RGB resource.
   *
   * @param bytes - A `lepcc-rgb` resource.
   * @returns Interleaved 8-bit red, green, and blue values.
   */
  decodeRgb(bytes: Uint8Array): Uint8Array {
    const reader = new BinaryReader(bytes);
    const header = readHeader(reader, 'ClusterRGB', 32, this.verifyChecksum);
    const pointCount = reader.readUint32();
    const colorCount = reader.readUint16();
    const lookupMethod = reader.readUint8();
    const compressionMethod = reader.readUint8();

    const output = new Uint8Array(pointCount * 3);
    if (colorCount === 0) {
      output.set(reader.readBytes(pointCount * 3));
    } else {
      const colorMap = reader.readBytes(colorCount * 3);
      if (lookupMethod !== 1 && lookupMethod !== 2) {
        throw new Error(`Unsupported LEPCC RGB lookup method: ${lookupMethod}`);
      }
      if (compressionMethod === 0) {
        for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
          const colorIndex = reader.readUint8();
          if (colorIndex >= colorCount) {
            throw new Error('LEPCC RGB color index is outside the color map');
          }
          output.set(colorMap.subarray(colorIndex * 3, colorIndex * 3 + 3), pointIndex * 3);
        }
      } else if (compressionMethod === 1) {
        for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
          output.set(colorMap.subarray(0, 3), pointIndex * 3);
        }
      } else if (compressionMethod === 2) {
        const indexes = decodeHuffman(reader, pointCount);
        for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
          const colorIndex = indexes[pointIndex];
          if (colorIndex >= colorCount) {
            throw new Error('LEPCC RGB Huffman color index is outside the color map');
          }
          output.set(colorMap.subarray(colorIndex * 3, colorIndex * 3 + 3), pointIndex * 3);
        }
      } else {
        throw new Error(`Unsupported LEPCC RGB compression method: ${compressionMethod}`);
      }
    }
    assertBlobConsumed(reader, header.blobSize);
    return output;
  }

  /**
   * Decodes an I3S LEPCC intensity resource.
   *
   * @param bytes - A `lepcc-intensity` resource.
   * @returns One unsigned 16-bit intensity value per point.
   */
  decodeIntensity(bytes: Uint8Array): Uint16Array {
    const reader = new BinaryReader(bytes);
    const header = readHeader(reader, 'Intensity ', 32, this.verifyChecksum);
    const pointCount = reader.readUint32();
    const scaleFactor = reader.readUint16();
    const bitsPerPoint = reader.readUint8();
    reader.readUint8();
    if (scaleFactor < 1 || bitsPerPoint > 16) {
      throw new Error('Invalid LEPCC intensity header');
    }

    const values = new Uint16Array(pointCount);
    if (bitsPerPoint === 16) {
      for (let index = 0; index < pointCount; index++) {
        values[index] = reader.readUint16();
      }
    } else if (bitsPerPoint === 8) {
      for (let index = 0; index < pointCount; index++) {
        values[index] = reader.readUint8() * scaleFactor;
      }
    } else {
      const packedValues = decodeSimple(reader);
      if (packedValues.length !== pointCount) {
        throw new Error('LEPCC intensity value count does not match the header');
      }
      for (let index = 0; index < pointCount; index++) {
        values[index] = packedValues[index] * scaleFactor;
      }
    }
    assertBlobConsumed(reader, header.blobSize);
    return values;
  }

  /**
   * Decodes an I3S LEPCC packed LAS flags resource.
   *
   * @param bytes - A LEPCC flag-bytes resource.
   * @returns One packed flag byte per point.
   */
  decodeFlagBytes(bytes: Uint8Array): Uint8Array {
    const reader = new BinaryReader(bytes);
    const header = readHeader(reader, 'FlagBytes ', 32, this.verifyChecksum);
    const pointCount = reader.readUint32();
    const compressionMethod = reader.readUint8();
    const minimumValue = reader.readUint8();
    reader.readUint16();
    const packedValues =
      compressionMethod === 0 ? decodeSimple(reader) : decodeHuffman(reader, pointCount);
    if (packedValues.length !== pointCount) {
      throw new Error('LEPCC flag-byte value count does not match the header');
    }
    const output = new Uint8Array(pointCount);
    for (let index = 0; index < pointCount; index++) {
      output[index] = packedValues[index] + minimumValue;
    }
    assertBlobConsumed(reader, header.blobSize);
    return output;
  }

  /**
   * Decodes a blob using its self-described attribute type.
   *
   * @param bytes - One standalone I3S LEPCC resource.
   * @returns The typed decoded values.
   */
  decode(bytes: Uint8Array): I3SLEPCCDecodedValue {
    switch (this.getBlobType(bytes)) {
      case 'xyz':
        return this.decodeXyz(bytes);
      case 'rgb':
        return this.decodeRgb(bytes);
      case 'intensity':
        return this.decodeIntensity(bytes);
      case 'flagBytes':
        return this.decodeFlagBytes(bytes);
    }
  }
}

interface LEPCCHeader {
  readonly blobSize: number;
}

class BinaryReader {
  readonly bytes: Uint8Array;
  offset = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  readUint8(): number {
    this.ensure(1);
    return this.bytes[this.offset++];
  }

  readUint16(): number {
    this.ensure(2);
    const value = this.bytes[this.offset] | (this.bytes[this.offset + 1] << 8);
    this.offset += 2;
    return value;
  }

  readUint32(): number {
    this.ensure(4);
    const value =
      this.bytes[this.offset] |
      (this.bytes[this.offset + 1] << 8) |
      (this.bytes[this.offset + 2] << 16) |
      (this.bytes[this.offset + 3] << 24);
    this.offset += 4;
    return value >>> 0;
  }

  readBigUint64(): number {
    this.ensure(8);
    let value = 0;
    for (let index = 7; index >= 0; index--) {
      value = value * 256 + this.bytes[this.offset + index];
    }
    this.offset += 8;
    if (!Number.isSafeInteger(value)) {
      throw new Error('LEPCC blob size exceeds JavaScript safe integer range');
    }
    return value;
  }

  readFloat64(): number {
    this.ensure(8);
    const view = new DataView(this.bytes.buffer, this.bytes.byteOffset + this.offset, 8);
    const value = view.getFloat64(0, true);
    this.offset += 8;
    return value;
  }

  readBytes(length: number): Uint8Array {
    this.ensure(length);
    const value = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  ensure(length: number): void {
    if (length < 0 || this.offset + length > this.bytes.byteLength) {
      throw new Error('Truncated LEPCC blob');
    }
  }
}

function readMagic(bytes: Uint8Array): string {
  if (bytes.byteLength < 10) {
    throw new Error('Truncated LEPCC blob header');
  }
  return new TextDecoder().decode(bytes.subarray(0, 10));
}

function readHeader(
  reader: BinaryReader,
  expectedMagic: string,
  headerSize: number,
  verifyChecksum: boolean
): LEPCCHeader {
  const magic = new TextDecoder().decode(reader.readBytes(10));
  if (magic !== expectedMagic) {
    throw new Error(`Unexpected LEPCC blob type: ${JSON.stringify(magic)}`);
  }
  const version = reader.readUint16();
  if (version > 1) {
    throw new Error(`Unsupported LEPCC version: ${version}`);
  }
  const expectedChecksum = reader.readUint32();
  const blobSize = reader.readBigUint64();
  if (blobSize < headerSize || blobSize > reader.bytes.byteLength) {
    throw new Error(`Invalid LEPCC blob size: ${blobSize}`);
  }
  if (verifyChecksum) {
    const actualChecksum = computeFletcher32(reader.bytes.subarray(16, blobSize));
    if (actualChecksum !== expectedChecksum) {
      throw new Error('LEPCC checksum mismatch');
    }
  }
  return {blobSize};
}

function assertBlobConsumed(reader: BinaryReader, blobSize: number): void {
  if (reader.offset !== blobSize) {
    throw new Error(`LEPCC decoder consumed ${reader.offset} bytes, expected ${blobSize}`);
  }
}

function computeFletcher32(bytes: Uint8Array): number {
  let sum1 = 0xffff;
  let sum2 = 0xffff;
  let offset = 0;
  let words = Math.floor(bytes.length / 2);
  while (words > 0) {
    const count = Math.min(words, 359);
    words -= count;
    for (let index = 0; index < count; index++) {
      sum1 += bytes[offset++] << 8;
      sum1 += bytes[offset++];
      sum2 += sum1;
    }
    sum1 = (sum1 & 0xffff) + (sum1 >>> 16);
    sum2 = (sum2 & 0xffff) + (sum2 >>> 16);
  }
  if (bytes.length & 1) {
    sum1 += bytes[offset] << 8;
    sum2 += sum1;
  }
  sum1 = (sum1 & 0xffff) + (sum1 >>> 16);
  sum2 = (sum2 & 0xffff) + (sum2 >>> 16);
  return ((sum2 << 16) | sum1) >>> 0;
}

function decodeCutInSegments(reader: BinaryReader): number[] {
  const sectionMinimums = decodeSimple(reader);
  const values: number[] = [];
  for (const sectionMinimum of sectionMinimums) {
    const sectionValues = decodeSimple(reader);
    for (const sectionValue of sectionValues) {
      values.push(sectionValue + sectionMinimum);
    }
  }
  return values;
}

function decodeSimple(reader: BinaryReader): number[] {
  const header = reader.readUint8();
  const numberOfBits = header & 31;
  const encodedNumberOfBytes = header >>> 6;
  const numberOfBytes = encodedNumberOfBytes === 0 ? 4 : 3 - encodedNumberOfBytes;
  if (numberOfBytes !== 1 && numberOfBytes !== 2 && numberOfBytes !== 4) {
    throw new Error('Invalid LEPCC bit-stuffer element width');
  }
  const elementCount =
    numberOfBytes === 1
      ? reader.readUint8()
      : numberOfBytes === 2
        ? reader.readUint16()
        : reader.readUint32();
  if (header & 32) {
    throw new Error('LEPCC lookup-table bit stuffing is not supported');
  }
  if (numberOfBits === 0) {
    return new Array<number>(elementCount).fill(0);
  }
  const bitReader = new BitReader(reader);
  const values = new Array<number>(elementCount);
  for (let index = 0; index < elementCount; index++) {
    values[index] = bitReader.readBits(numberOfBits);
  }
  bitReader.alignToByte();
  return values;
}

function decodeHuffman(reader: BinaryReader, elementCount: number): number[] {
  const version = reader.readUint32();
  const tableSize = reader.readUint32();
  const firstSymbol = reader.readUint32();
  const lastSymbol = reader.readUint32();
  if (version < 2 || tableSize === 0 || tableSize > 32768 || firstSymbol >= lastSymbol) {
    throw new Error('Invalid LEPCC Huffman code table');
  }
  const codeLengths = decodeSimple(reader);
  if (codeLengths.length !== lastSymbol - firstSymbol) {
    throw new Error('LEPCC Huffman code table length mismatch');
  }

  const lengthsBySymbol = new Array<number>(tableSize).fill(0);
  let codeBitCount = 0;
  for (let symbol = firstSymbol; symbol < lastSymbol; symbol++) {
    const tableIndex = symbol < tableSize ? symbol : symbol - tableSize;
    const codeLength = codeLengths[symbol - firstSymbol];
    if (codeLength > 32) {
      throw new Error('LEPCC Huffman code is too long');
    }
    lengthsBySymbol[tableIndex] = codeLength;
    codeBitCount += codeLength;
  }

  const symbols = lengthsBySymbol
    .map((codeLength, symbol) => ({codeLength, symbol}))
    .filter(value => value.codeLength > 0)
    .sort((left, right) => right.codeLength - left.codeLength || left.symbol - right.symbol);
  if (symbols.length < 2) {
    throw new Error('LEPCC Huffman table has fewer than two symbols');
  }

  const codeLookup = new Map<string, number>();
  let canonicalCode = 0;
  let canonicalLength = symbols[0].codeLength;
  for (const symbol of symbols) {
    const delta = canonicalLength - symbol.codeLength;
    canonicalCode = Math.floor(canonicalCode / 2 ** delta);
    canonicalLength = symbol.codeLength;
    codeLookup.set(`${canonicalLength}:${canonicalCode}`, symbol.symbol);
    canonicalCode++;
  }

  const codeReader = new MsbBitReader(reader);
  for (const codeLength of lengthsBySymbol) {
    if (codeLength > 0) {
      codeReader.readBits(codeLength);
    }
  }
  codeReader.finishWords();
  if (codeBitCount === 0) {
    throw new Error('LEPCC Huffman table has no code bits');
  }

  const valueReader = new MsbBitReader(reader);
  const values = new Array<number>(elementCount);
  for (let index = 0; index < elementCount; index++) {
    let code = 0;
    let decodedSymbol: number | undefined;
    for (let codeLength = 1; codeLength <= 32; codeLength++) {
      code = code * 2 + valueReader.readBits(1);
      decodedSymbol = codeLookup.get(`${codeLength}:${code}`);
      if (decodedSymbol !== undefined) {
        break;
      }
    }
    if (decodedSymbol === undefined) {
      throw new Error('Invalid LEPCC Huffman value');
    }
    values[index] = decodedSymbol;
  }
  valueReader.finishWords(1);
  return values;
}

class BitReader {
  readonly reader: BinaryReader;
  bitOffset = 0;

  constructor(reader: BinaryReader) {
    this.reader = reader;
  }

  readBits(numberOfBits: number): number {
    let value = 0;
    for (let bitIndex = 0; bitIndex < numberOfBits; bitIndex++) {
      if (this.bitOffset === 0) {
        this.reader.ensure(1);
      }
      const currentByte = this.reader.bytes[this.reader.offset];
      value += ((currentByte >>> this.bitOffset) & 1) * 2 ** bitIndex;
      this.bitOffset++;
      if (this.bitOffset === 8) {
        this.bitOffset = 0;
        this.reader.offset++;
      }
    }
    return value;
  }

  alignToByte(): void {
    if (this.bitOffset !== 0) {
      this.reader.offset++;
      this.bitOffset = 0;
    }
  }
}

class MsbBitReader {
  readonly reader: BinaryReader;
  readonly startOffset: number;
  bitOffset = 0;
  bitsRead = 0;

  constructor(reader: BinaryReader) {
    this.reader = reader;
    this.startOffset = reader.offset;
  }

  readBits(numberOfBits: number): number {
    let value = 0;
    for (let bitIndex = 0; bitIndex < numberOfBits; bitIndex++) {
      if (this.bitOffset === 0) {
        this.reader.ensure(4);
      }
      const word =
        this.reader.bytes[this.reader.offset] |
        (this.reader.bytes[this.reader.offset + 1] << 8) |
        (this.reader.bytes[this.reader.offset + 2] << 16) |
        (this.reader.bytes[this.reader.offset + 3] << 24);
      value = value * 2 + ((word >>> (31 - this.bitOffset)) & 1);
      this.bitOffset++;
      this.bitsRead++;
      if (this.bitOffset === 32) {
        this.bitOffset = 0;
        this.reader.offset += 4;
      }
    }
    return value;
  }

  finishWords(extraWords = 0): void {
    this.reader.offset = this.startOffset + Math.ceil(this.bitsRead / 32) * 4 + extraWords * 4;
    this.bitOffset = 0;
  }
}
