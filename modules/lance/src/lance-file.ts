// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** An absolute byte range in a Lance file. */
export type LanceFileRange = Readonly<{
  /** Inclusive start offset. */
  offset: number;
  /** Number of bytes in the range. */
  size: number;
}>;

/** Metadata for one physical page in a Lance column. */
export type LanceFilePageMetadata = Readonly<{
  /** Absolute offsets of page buffers. */
  bufferOffsets: number[];
  /** Byte sizes of page buffers. */
  bufferSizes: number[];
  /** Logical item count in the page. */
  length: number;
  /** Top-level row priority, normally the first row number. */
  priority: number;
  /** Opaque protobuf encoding descriptor for the page. */
  encoding?: Uint8Array;
}>;

/** Decoded protobuf metadata for one physical Lance column. */
export type LanceFileColumnMetadata = Readonly<{
  /** Pages belonging to this column. */
  pages: LanceFilePageMetadata[];
  /** Absolute offsets of column metadata buffers. */
  bufferOffsets: number[];
  /** Byte sizes of column metadata buffers. */
  bufferSizes: number[];
  /** Opaque protobuf encoding descriptor for the column. */
  encoding?: Uint8Array;
}>;

/** Parsed Lance file footer and metadata tables. */
export type LanceFileMetadata = Readonly<{
  /** Lance file major version from the footer. */
  majorVersion: number;
  /** Lance file minor version from the footer. */
  minorVersion: number;
  /** Total file size in bytes. */
  fileSizeBytes: number;
  /** Number of physical columns. */
  numColumns: number;
  /** Number of global buffers. */
  numGlobalBuffers: number;
  /** Ranges for each column descriptor protobuf. */
  columnMetadataRanges: LanceFileRange[];
  /** Raw column descriptor protobuf messages. */
  columnMetadata: Uint8Array[];
  /** Decoded column descriptor protobuf messages. */
  columns: LanceFileColumnMetadata[];
  /** Ranges for each global buffer. */
  globalBufferRanges: LanceFileRange[];
  /** Raw global buffers. */
  globalBuffers: Uint8Array[];
}>;

const FOOTER_SIZE = 40;
const FOOTER_MAGIC = 'LANC';

class ProtobufReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done(): boolean {
    return this.offset >= this.bytes.byteLength;
  }

  readVarint(): number {
    let value = 0n;
    let shift = 0n;
    while (!this.done) {
      const byte = BigInt(this.bytes[this.offset++]);
      value |= (byte & 0x7fn) << shift;
      if ((byte & 0x80n) === 0n) return Number(value);
      shift += 7n;
      if (shift > 70n) throw new Error('Invalid Lance column metadata varint');
    }
    throw new Error('Unexpected end of Lance column metadata varint');
  }

  readBytes(): Uint8Array {
    const length = this.readVarint();
    const end = this.offset + length;
    if (!Number.isSafeInteger(length) || end > this.bytes.byteLength) {
      throw new Error('Invalid Lance column metadata length');
    }
    const result = this.bytes.slice(this.offset, end);
    this.offset = end;
    return result;
  }

  skip(wireType: number): void {
    if (wireType === 0) this.readVarint();
    else if (wireType === 1) this.skipBytes(8);
    else if (wireType === 2) this.skipBytes(this.readVarint());
    else if (wireType === 5) this.skipBytes(4);
    else throw new Error(`Unsupported Lance column metadata wire type ${wireType}`);
  }

  private skipBytes(length: number): void {
    this.offset += length;
    if (this.offset > this.bytes.byteLength)
      throw new Error('Unexpected end of Lance column metadata');
  }
}

function readProtobufMessage(
  bytes: Uint8Array,
  callback: (field: number, wireType: number, reader: ProtobufReader) => void
): void {
  const reader = new ProtobufReader(bytes);
  while (!reader.done) {
    const tag = reader.readVarint();
    callback(tag >>> 3, tag & 7, reader);
  }
}

function readPackedUint64(reader: ProtobufReader): number[] {
  const packed = new ProtobufReader(reader.readBytes());
  const values: number[] = [];
  while (!packed.done) values.push(packed.readVarint());
  return values;
}

function readUint64Field(reader: ProtobufReader, wireType: number): number[] {
  return wireType === 0 ? [reader.readVarint()] : wireType === 2 ? readPackedUint64(reader) : [];
}

/** Decodes one Lance column descriptor protobuf. */
export function parseLanceColumnMetadata(bytes: Uint8Array): LanceFileColumnMetadata {
  const column = {
    pages: [] as LanceFilePageMetadata[],
    bufferOffsets: [] as number[],
    bufferSizes: [] as number[],
    encoding: undefined as Uint8Array | undefined
  };
  readProtobufMessage(bytes, (field, wireType, reader) => {
    if (field === 1 && wireType === 2) column.encoding = reader.readBytes();
    else if (field === 2 && wireType === 2)
      column.pages.push(parseLancePageMetadata(reader.readBytes()));
    else if (field === 3) column.bufferOffsets.push(...readUint64Field(reader, wireType));
    else if (field === 4) column.bufferSizes.push(...readUint64Field(reader, wireType));
    else reader.skip(wireType);
  });
  return column;
}

function parseLancePageMetadata(bytes: Uint8Array): LanceFilePageMetadata {
  const page = {
    bufferOffsets: [] as number[],
    bufferSizes: [] as number[],
    length: 0,
    priority: 0,
    encoding: undefined as Uint8Array | undefined
  };
  readProtobufMessage(bytes, (field, wireType, reader) => {
    if (field === 1) page.bufferOffsets.push(...readUint64Field(reader, wireType));
    else if (field === 2) page.bufferSizes.push(...readUint64Field(reader, wireType));
    else if (field === 3 && wireType === 0) page.length = reader.readVarint();
    else if (field === 4 && wireType === 2) page.encoding = reader.readBytes();
    else if (field === 5 && wireType === 0) page.priority = reader.readVarint();
    else reader.skip(wireType);
  });
  return page;
}

function validateRange(range: LanceFileRange, fileSizeBytes: number, label: string): void {
  if (
    !Number.isSafeInteger(range.offset) ||
    !Number.isSafeInteger(range.size) ||
    range.offset < 0 ||
    range.size < 0 ||
    range.offset + range.size > fileSizeBytes
  ) {
    throw new Error(`Invalid Lance ${label} range`);
  }
}

function readRanges(
  bytes: Uint8Array,
  tableOffset: number,
  count: number,
  label: string
): {ranges: LanceFileRange[]; values: Uint8Array[]} {
  const tableSize = count * 16;
  if (
    !Number.isSafeInteger(tableSize) ||
    tableOffset < 0 ||
    tableOffset + tableSize > bytes.byteLength
  ) {
    throw new Error(`Invalid Lance ${label} offset table`);
  }

  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ranges: LanceFileRange[] = [];
  const values: Uint8Array[] = [];
  for (let index = 0; index < count; index++) {
    const entryOffset = tableOffset + index * 16;
    const range = {
      offset: Number(dataView.getBigUint64(entryOffset, true)),
      size: Number(dataView.getBigUint64(entryOffset + 8, true))
    };
    validateRange(range, bytes.byteLength, label);
    ranges.push(range);
    values.push(bytes.slice(range.offset, range.offset + range.size));
  }
  return {ranges, values};
}

/** Parses the fixed footer, offset tables, and raw metadata buffers of a Lance file. */
export function parseLanceFileMetadata(
  arrayBuffer: ArrayBuffer | ArrayBufferView
): LanceFileMetadata {
  const bytes =
    arrayBuffer instanceof ArrayBuffer
      ? new Uint8Array(arrayBuffer)
      : new Uint8Array(arrayBuffer.buffer, arrayBuffer.byteOffset, arrayBuffer.byteLength);
  if (bytes.byteLength < FOOTER_SIZE) {
    throw new Error('Lance file is smaller than its footer');
  }

  const footerOffset = bytes.byteLength - FOOTER_SIZE;
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = new TextDecoder().decode(bytes.slice(footerOffset + 36, footerOffset + 40));
  if (magic !== FOOTER_MAGIC) {
    throw new Error(`Invalid Lance file magic: expected ${FOOTER_MAGIC}`);
  }

  const columnMetadataOffset = Number(dataView.getBigUint64(footerOffset, true));
  const columnOffsetTable = Number(dataView.getBigUint64(footerOffset + 8, true));
  const globalBufferOffsetTable = Number(dataView.getBigUint64(footerOffset + 16, true));
  const numGlobalBuffers = dataView.getUint32(footerOffset + 24, true);
  const numColumns = dataView.getUint32(footerOffset + 28, true);
  const majorVersion = dataView.getUint16(footerOffset + 32, true);
  const minorVersion = dataView.getUint16(footerOffset + 34, true);

  if (columnMetadataOffset > bytes.byteLength) {
    throw new Error('Invalid Lance column metadata offset');
  }
  if (columnOffsetTable < columnMetadataOffset || globalBufferOffsetTable < columnOffsetTable) {
    throw new Error('Invalid Lance metadata table ordering');
  }

  const columnData = readRanges(bytes, columnOffsetTable, numColumns, 'column metadata');
  const globalData = readRanges(bytes, globalBufferOffsetTable, numGlobalBuffers, 'global buffer');
  const columns = columnData.values.map(parseLanceColumnMetadata);
  return {
    majorVersion,
    minorVersion,
    fileSizeBytes: bytes.byteLength,
    numColumns,
    numGlobalBuffers,
    columnMetadataRanges: columnData.ranges,
    columnMetadata: columnData.values,
    columns,
    globalBufferRanges: globalData.ranges,
    globalBuffers: globalData.values
  };
}
