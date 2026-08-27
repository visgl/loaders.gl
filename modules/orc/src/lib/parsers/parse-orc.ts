// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {decompressORCStream} from './orc-compression';

/** Parsed ORC compression kinds. */
export type ORCCompression = 'NONE' | 'ZLIB' | 'SNAPPY' | 'LZO' | 'LZ4' | 'ZSTD' | 'UNKNOWN';

/** Minimal ORC file metadata returned by the initial loader. */
export type ORCFile = {
  format: 'orc';
  postscript: ORCPostScript;
  footer: ORCFooter;
};

/** ORC PostScript fields needed to locate and decode the footer. */
export type ORCPostScript = {
  footerLength: number;
  compression: ORCCompression;
  compressionBlockSize: number;
  version: number[];
  metadataLength: number;
  magic?: string;
};

/** Basic ORC footer metadata. */
export type ORCFooter = {
  headerLength?: number;
  contentLength?: number;
  numberOfRows?: number;
  stripeCount: number;
  typeCount: number;
  fieldNames: string[];
  stripes: ORCStripeInformation[];
  types: ORCTypeDescription[];
  raw: Uint8Array;
};

/** Location and row count for one ORC stripe. */
export type ORCStripeInformation = {
  offset: number;
  indexLength: number;
  dataLength: number;
  footerLength: number;
  numberOfRows: number;
  streams?: ORCStreamInformation[];
  encodings?: ORCColumnEncoding[];
};

/** One stream in an ORC stripe footer. */
export type ORCStreamInformation = {kind: number; column: number; length: number};

/** One column encoding declaration in an ORC stripe footer. */
export type ORCColumnEncoding = {column: number; kind: number; dictionarySize?: number};

/** ORC stream and encoding kinds used by the primitive reader. */
export const ORCStreamKind = {
  PRESENT: 0,
  DATA: 1,
  LENGTH: 2,
  DICTIONARY_DATA: 3,
  DICTIONARY_COUNT: 4
} as const;

/** ORC primitive and container type kinds. */
export const ORCTypeKind = {
  BOOLEAN: 0,
  BYTE: 1,
  SHORT: 2,
  INT: 3,
  LONG: 4,
  FLOAT: 5,
  DOUBLE: 6,
  STRING: 7,
  BINARY: 8,
  TIMESTAMP: 9,
  LIST: 10,
  MAP: 11,
  STRUCT: 12,
  UNION: 13,
  DECIMAL: 14,
  DATE: 15
} as const;

/** One ORC type description from the file footer. */
export type ORCTypeDescription = {
  kind: number;
  fieldNames: string[];
  subtypes: number[];
};

const ORC_MAGIC = new Uint8Array([0x4f, 0x52, 0x43]);
const COMPRESSION_NAMES: ORCCompression[] = ['NONE', 'ZLIB', 'SNAPPY', 'LZO', 'LZ4', 'ZSTD'];

/** Parses an ORC file envelope, PostScript, and basic footer metadata. */
export function parseORC(arrayBuffer: ArrayBuffer): ORCFile {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.length < 4 || !hasBytes(bytes, ORC_MAGIC, 0)) throw new Error('Invalid ORC file magic');
  const postscriptLength = bytes[bytes.length - 1];
  const postscriptStart = bytes.length - 1 - postscriptLength;
  if (postscriptStart < 3) throw new Error('Invalid ORC PostScript length');
  const postscript = parsePostScript(bytes.subarray(postscriptStart, bytes.length - 1));
  const footerStart = postscriptStart - postscript.footerLength;
  if (footerStart < 3) throw new Error('Invalid ORC footer length');
  const footerBytes = decompressORCStream(
    bytes.subarray(footerStart, postscriptStart),
    postscript.compression
  );
  const footer = parseFooter(footerBytes);
  footer.stripes = footer.stripes.map(stripe => {
    const stripeFooterEnd =
      stripe.offset + stripe.indexLength + stripe.dataLength + stripe.footerLength;
    return stripeFooterEnd <= footerStart
      ? parseORCStripeFooter(bytes, stripe, postscript.compression)
      : stripe;
  });
  return {format: 'orc', postscript, footer};
}

/** Parses the ORC PostScript protobuf. */
function parsePostScript(bytes: Uint8Array): ORCPostScript {
  const reader = new ProtoReader(bytes);
  const result: ORCPostScript = {
    footerLength: 0,
    compression: 'UNKNOWN',
    compressionBlockSize: 0,
    version: [],
    metadataLength: 0
  };
  while (!reader.done) {
    const field = reader.readField();
    switch (field.number) {
      case 1:
        result.footerLength = reader.readVarint();
        break;
      case 2:
        result.compression = COMPRESSION_NAMES[reader.readVarint()] || 'UNKNOWN';
        break;
      case 3:
        result.compressionBlockSize = reader.readVarint();
        break;
      case 4:
        if (field.wireType === 2)
          result.version.push(...readPackedVarints(reader.readBytesField()));
        else result.version.push(reader.readVarint());
        break;
      case 5:
        result.metadataLength = reader.readVarint();
        break;
      case 8000:
        result.magic = reader.readString();
        break;
      default:
        reader.skip(field.wireType);
    }
  }
  if (!result.footerLength || result.compression === 'UNKNOWN')
    throw new Error('Invalid ORC PostScript');
  return result;
}

/** Parses basic fields from the ORC footer protobuf. */
function parseFooter(bytes: Uint8Array): ORCFooter {
  const reader = new ProtoReader(bytes);
  const footer: ORCFooter = {
    stripeCount: 0,
    typeCount: 0,
    fieldNames: [],
    stripes: [],
    types: [],
    raw: bytes.slice()
  };
  while (!reader.done) {
    const field = reader.readField();
    switch (field.number) {
      case 1:
        footer.headerLength = reader.readVarint();
        break;
      case 2:
        footer.contentLength = reader.readVarint();
        break;
      case 3:
        footer.stripes.push(parseStripeInformation(reader.readBytesField()));
        footer.stripeCount++;
        break;
      case 4:
        const typeBytes = reader.readBytesField();
        const type = parseTypeDescription(typeBytes);
        if (footer.typeCount === 0) footer.fieldNames = type.fieldNames;
        footer.types.push(type);
        footer.typeCount++;
        break;
      case 6:
        footer.numberOfRows = reader.readVarint();
        break;
      default:
        reader.skip(field.wireType);
    }
  }
  return footer;
}

/** Parses one ORC StripeInformation protobuf message. */
function parseStripeInformation(bytes: Uint8Array): ORCStripeInformation {
  const reader = new ProtoReader(bytes);
  const stripe: ORCStripeInformation = {
    offset: 0,
    indexLength: 0,
    dataLength: 0,
    footerLength: 0,
    numberOfRows: 0
  };
  while (!reader.done) {
    const field = reader.readField();
    switch (field.number) {
      case 1:
        stripe.offset = reader.readVarint();
        break;
      case 2:
        stripe.indexLength = reader.readVarint();
        break;
      case 3:
        stripe.dataLength = reader.readVarint();
        break;
      case 4:
        stripe.footerLength = reader.readVarint();
        break;
      case 5:
        stripe.numberOfRows = reader.readVarint();
        break;
      default:
        reader.skip(field.wireType);
    }
  }
  return stripe;
}

/** Parses the footer at the end of one ORC stripe. */
export function parseORCStripeFooter(
  bytes: Uint8Array,
  stripe: ORCStripeInformation,
  compression: ORCCompression = 'NONE'
): ORCStripeInformation {
  const footerStart = stripe.offset + stripe.indexLength + stripe.dataLength;
  const compressedFooterBytes = bytes.subarray(footerStart, footerStart + stripe.footerLength);
  if (compressedFooterBytes.length !== stripe.footerLength)
    throw new Error('Truncated ORC stripe footer');
  const reader = new ProtoReader(decompressORCStream(compressedFooterBytes, compression));
  const streams: ORCStreamInformation[] = [];
  const encodings: ORCColumnEncoding[] = [];
  while (!reader.done) {
    const field = reader.readField();
    if (field.number === 1) streams.push(parseStreamInformation(reader.readBytesField()));
    else if (field.number === 2) {
      const encoding = parseColumnEncoding(reader.readBytesField());
      encoding.column = encodings.length;
      encodings.push(encoding);
    } else reader.skip(field.wireType);
  }
  return {...stripe, streams, encodings};
}

/** Parses one ORC Stream protobuf message. */
function parseStreamInformation(bytes: Uint8Array): ORCStreamInformation {
  const reader = new ProtoReader(bytes);
  const stream: ORCStreamInformation = {kind: -1, column: 0, length: 0};
  while (!reader.done) {
    const field = reader.readField();
    switch (field.number) {
      case 1:
        stream.kind = reader.readVarint();
        break;
      case 2:
        stream.column = reader.readVarint();
        break;
      case 3:
        stream.length = reader.readVarint();
        break;
      default:
        reader.skip(field.wireType);
    }
  }
  return stream;
}

/** Parses one ORC ColumnEncoding protobuf message. */
function parseColumnEncoding(bytes: Uint8Array): ORCColumnEncoding {
  const reader = new ProtoReader(bytes);
  const encoding: ORCColumnEncoding = {column: 0, kind: -1};
  while (!reader.done) {
    const field = reader.readField();
    switch (field.number) {
      case 1:
        encoding.kind = reader.readVarint();
        break;
      case 2:
        encoding.dictionarySize = reader.readVarint();
        break;
      default:
        reader.skip(field.wireType);
    }
  }
  return encoding;
}

/** Parses one ORC Type protobuf message. */
function parseTypeDescription(bytes: Uint8Array): ORCTypeDescription {
  const reader = new ProtoReader(bytes);
  const type: ORCTypeDescription = {kind: 0, fieldNames: [], subtypes: []};
  while (!reader.done) {
    const field = reader.readField();
    switch (field.number) {
      case 1:
        type.kind = reader.readVarint();
        break;
      case 2:
        if (field.wireType === 2) type.subtypes.push(...readPackedVarints(reader.readBytesField()));
        else type.subtypes.push(reader.readVarint());
        break;
      case 3:
        type.fieldNames.push(reader.readString());
        break;
      default:
        reader.skip(field.wireType);
    }
  }
  return type;
}

/** Checks a byte prefix. */
function hasBytes(bytes: Uint8Array, expected: Uint8Array, offset: number): boolean {
  return expected.every((value, index) => bytes[offset + index] === value);
}

/** Reads protobuf packed repeated unsigned integer values. */
function readPackedVarints(bytes: Uint8Array): number[] {
  const reader = new ProtoReader(bytes);
  const values: number[] = [];
  while (!reader.done) values.push(reader.readVarint());
  return values;
}

/** Minimal protobuf reader for ORC metadata messages. */
class ProtoReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done(): boolean {
    return this.offset >= this.bytes.length;
  }

  readField(): {number: number; wireType: number} {
    const tag = this.readVarint();
    return {number: tag >>> 3, wireType: tag & 7};
  }

  readVarint(): number {
    let value = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = this.readByte();
      value += (byte & 0x7f) * 2 ** shift;
      shift += 7;
    } while (byte & 0x80);
    return value;
  }

  readString(): string {
    const length = this.readVarint();
    return new TextDecoder().decode(this.readBytes(length));
  }

  readBytesField(): Uint8Array {
    return this.readBytes(this.readVarint());
  }

  skip(wireType: number): void {
    switch (wireType) {
      case 0:
        this.readVarint();
        break;
      case 1:
        this.readBytes(8);
        break;
      case 2:
        this.readBytes(this.readVarint());
        break;
      case 5:
        this.readBytes(4);
        break;
      default:
        throw new Error(`Unsupported ORC protobuf wire type ${wireType}`);
    }
  }

  private readBytes(length: number): Uint8Array {
    if (length < 0 || this.offset + length > this.bytes.length)
      throw new Error('Truncated ORC metadata');
    const result = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }

  private readByte(): number {
    if (this.done) throw new Error('Truncated ORC metadata');
    return this.bytes[this.offset++];
  }
}
