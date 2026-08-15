// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RADChunkMetadataJSONSchema, RADMetadataJSONSchema} from '../rad-zod-schema';

const RAD_MAGIC = 0x30444152;
const RAD_CHUNK_MAGIC = 0x43444152;
const RAD_HEADER_BYTE_LENGTH = 8;
const RAD_CHUNK_PAYLOAD_LENGTH_BYTE_LENGTH = 8;
const TEXT_DECODER = new TextDecoder();

/** Spark RAD splat quantization and shader decode range metadata. */
export type RADSplatEncoding = {
  /** Minimum RGB value encoded into quantized color properties. */
  rgbMin?: number;
  /** Maximum RGB value encoded into quantized color properties. */
  rgbMax?: number;
  /** Minimum natural log scale encoded into quantized scale properties. */
  lnScaleMin?: number;
  /** Maximum natural log scale encoded into quantized scale properties. */
  lnScaleMax?: number;
  /** Maximum absolute SH degree-1 coefficient value. */
  sh1Max?: number;
  /** Maximum absolute SH degree-2 coefficient value. */
  sh2Max?: number;
  /** Maximum absolute SH degree-3 coefficient value. */
  sh3Max?: number;
  /** Whether opacity is encoded for LoD blending. */
  lodOpacity?: boolean;
  /** Additional splat-encoding properties are preserved verbatim. */
  [key: string]: unknown;
};

/** One RAD chunk location in the top-level RAD chunk table. */
export type RADChunkRange = {
  /** Chunk byte offset relative to the top-level RAD chunk payload area. */
  offset: number;
  /** Chunk byte length. */
  bytes: number;
  /** Optional first splat index represented by this chunk. */
  base?: number;
  /** Optional number of splats represented by this chunk. */
  count?: number;
  /** Optional sidecar `.radc` filename relative to the RAD file URL. */
  filename?: string;
  /** Additional chunk-range properties are preserved verbatim. */
  [key: string]: unknown;
};

/** Handwritten type for the JSON metadata stored in a Spark RAD header. */
export type RADMetadataJSON = {
  /** RAD container version. Version 1 is currently supported. */
  version: 1;
  /** RAD payload type. Spark currently writes `gsplat`. */
  type: 'gsplat';
  /** Total splat count represented by the RAD source. */
  count: number;
  /** Maximum spherical harmonics degree present in the chunks. */
  maxSh?: number;
  /** Whether the source includes LoD tree child-count and child-start properties. */
  lodTree?: boolean;
  /** Nominal number of splats per chunk. */
  chunkSize?: number;
  /** Total inline chunk byte length when present in the RAD metadata. */
  allChunkBytes?: number;
  /** RAD chunk table. */
  chunks: RADChunkRange[];
  /** Optional shared splat encoding metadata for chunk decoding. */
  splatEncoding?: RADSplatEncoding;
  /** Optional spherical harmonics codebook count. */
  shCodeCount?: number;
  /** Optional RAD writer comment. */
  comment?: string;
  /** Additional RAD metadata properties are preserved verbatim. */
  [key: string]: unknown;
};

/** Parsed Spark RAD top-level metadata with loader-derived byte offsets. */
export type RADMetadata = RADMetadataJSON & {
  /** Byte length of the JSON metadata block. */
  headerJsonByteLength: number;
  /** Byte offset where inline RAD chunks begin. */
  chunksByteOffset: number;
};

/** Known RAD chunk property names. */
export type RADChunkPropertyName =
  | 'center'
  | 'alpha'
  | 'rgb'
  | 'scales'
  | 'orientation'
  | 'sh1'
  | 'sh2'
  | 'sh3'
  | 'child_count'
  | 'child_start'
  | 'sh1_code'
  | 'sh2_code'
  | 'sh3_code'
  | 'sh_label';

/** Known RAD chunk property encodings. */
export type RADChunkPropertyEncoding =
  | 'f32'
  | 'f16'
  | 'f32_lebytes'
  | 'f16_lebytes'
  | 'r8'
  | 'r8_delta'
  | 's8'
  | 's8_delta'
  | 'ln_0r8'
  | 'ln_f16'
  | 'oct88r8'
  | 'u16'
  | 'u32';

/** Known RAD chunk property compression modes. */
export type RADChunkPropertyCompression = 'gz';

/** One property payload entry inside a RAD chunk. */
export type RADChunkProperty = {
  /** Property byte offset relative to the chunk payload area. */
  offset: number;
  /** Property byte length before 8-byte payload padding. */
  bytes: number;
  /** Property semantic name. */
  property: RADChunkPropertyName | string;
  /** Property encoding name. */
  encoding: RADChunkPropertyEncoding | string;
  /** Optional property compression mode. */
  compression?: RADChunkPropertyCompression | string;
  /** Optional decode minimum for quantized properties. */
  min?: number;
  /** Optional decode maximum for quantized properties. */
  max?: number;
  /** Additional chunk-property metadata is preserved verbatim. */
  [key: string]: unknown;
};

/** Handwritten type for the JSON metadata stored in a Spark RADC chunk header. */
export type RADChunkMetadataJSON = {
  /** RAD chunk version. Version 1 is currently supported. */
  version: 1;
  /** First global splat index represented by this chunk. */
  base: number;
  /** Number of splats represented by this chunk. */
  count: number;
  /** Byte length of the padded property payload. */
  payloadBytes: number;
  /** Maximum spherical harmonics degree present in this chunk. */
  maxSh?: number;
  /** Whether this chunk contains LoD tree properties. */
  lodTree?: boolean;
  /** Optional chunk-local splat encoding metadata. */
  splatEncoding?: RADSplatEncoding;
  /** Property table for the chunk payload. */
  properties: RADChunkProperty[];
  /** Additional RADC metadata properties are preserved verbatim. */
  [key: string]: unknown;
};

/** Parsed Spark RADC chunk metadata with loader-derived byte offsets. */
export type RADChunkMetadata = RADChunkMetadataJSON & {
  /** Byte length of the chunk JSON metadata block. */
  headerJsonByteLength: number;
  /** Byte offset where the chunk payload begins. */
  payloadByteOffset: number;
  /** Byte length of the RADC header and payload. */
  chunkByteLength: number;
};

/** Returns true when the input begins with the Spark RAD magic bytes. */
export function isRAD(data: ArrayBuffer | ArrayBufferView): boolean {
  const bytes = getUint8Array(data);
  if (bytes.byteLength < 4) {
    return false;
  }
  return (
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true) === RAD_MAGIC
  );
}

/** Parses a complete or header-prefix Spark `.rad` buffer. */
export function parseRADHeader(data: ArrayBuffer | ArrayBufferView): RADMetadata {
  const metadata = tryParseRADHeader(data);
  if (!metadata) {
    throw new Error('RADLoader: file must contain a complete RAD metadata header.');
  }
  return metadata;
}

/** Parses a Spark `.rad` header when enough bytes are available. */
export function tryParseRADHeader(data: ArrayBuffer | ArrayBufferView): RADMetadata | null {
  const bytes = getUint8Array(data);
  if (bytes.byteLength < RAD_HEADER_BYTE_LENGTH) {
    return null;
  }

  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = dataView.getUint32(0, true);
  if (magic !== RAD_MAGIC) {
    throw new Error(`RADLoader: RAD0 magic header not found, received 0x${magic.toString(16)}.`);
  }

  const headerJsonByteLength = dataView.getUint32(4, true);
  const headerJsonEnd = RAD_HEADER_BYTE_LENGTH + headerJsonByteLength;
  if (bytes.byteLength < headerJsonEnd) {
    return null;
  }

  const rawMetadata = RADMetadataJSONSchema.parse(
    parseJSON(
      bytes.subarray(RAD_HEADER_BYTE_LENGTH, headerJsonEnd),
      'RADLoader: failed to parse RAD metadata JSON.'
    )
  );
  return normalizeRADMetadata(rawMetadata, headerJsonByteLength);
}

/** Parses the metadata header from one Spark `.radc` chunk buffer. */
export function parseRADChunkHeader(data: ArrayBuffer | ArrayBufferView): RADChunkMetadata {
  const bytes = getUint8Array(data);
  if (bytes.byteLength < RAD_HEADER_BYTE_LENGTH) {
    throw new Error('RADLoader: RADC chunk must contain an 8-byte metadata header.');
  }

  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = dataView.getUint32(0, true);
  if (magic !== RAD_CHUNK_MAGIC) {
    throw new Error(`RADLoader: RADC magic header not found, received 0x${magic.toString(16)}.`);
  }

  const headerJsonByteLength = dataView.getUint32(4, true);
  const headerJsonEnd = RAD_HEADER_BYTE_LENGTH + headerJsonByteLength;
  const payloadByteLengthOffset = RAD_HEADER_BYTE_LENGTH + roundUpToEight(headerJsonByteLength);
  const payloadByteOffset = payloadByteLengthOffset + RAD_CHUNK_PAYLOAD_LENGTH_BYTE_LENGTH;
  if (bytes.byteLength < payloadByteOffset) {
    throw new Error('RADLoader: RADC chunk must contain a complete metadata header.');
  }

  const rawMetadata = RADChunkMetadataJSONSchema.parse(
    parseJSON(
      bytes.subarray(RAD_HEADER_BYTE_LENGTH, headerJsonEnd),
      'RADLoader: failed to parse RADC metadata JSON.'
    )
  );
  const payloadBytes = readSafeUint64(
    dataView,
    payloadByteLengthOffset,
    'RADC payload byte length'
  );
  return normalizeRADChunkMetadata(
    rawMetadata,
    headerJsonByteLength,
    payloadByteOffset,
    payloadBytes
  );
}

/** Rounds a byte length to Spark RAD's 8-byte alignment. */
export function roundUpToEight(byteLength: number): number {
  return (byteLength + 7) & ~7;
}

function normalizeRADMetadata(
  rawMetadata: RADMetadataJSON,
  headerJsonByteLength: number
): RADMetadata {
  return {
    ...rawMetadata,
    headerJsonByteLength,
    chunksByteOffset: RAD_HEADER_BYTE_LENGTH + roundUpToEight(headerJsonByteLength)
  };
}

function normalizeRADChunkMetadata(
  rawMetadata: RADChunkMetadataJSON,
  headerJsonByteLength: number,
  payloadByteOffset: number,
  payloadBytes: number
): RADChunkMetadata {
  if (rawMetadata.payloadBytes !== payloadBytes) {
    throw new Error('RADLoader: RADC metadata payload byte length does not match binary header.');
  }

  return {
    ...rawMetadata,
    payloadBytes,
    headerJsonByteLength,
    payloadByteOffset,
    chunkByteLength: payloadByteOffset + payloadBytes
  };
}

function parseJSON(bytes: Uint8Array, message: string): unknown {
  try {
    return JSON.parse(TEXT_DECODER.decode(bytes));
  } catch {
    throw new Error(message);
  }
}

function readSafeUint64(dataView: DataView, byteOffset: number, fieldName: string): number {
  const value = dataView.getBigUint64(byteOffset, true);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`RADLoader: ${fieldName} exceeds Number.MAX_SAFE_INTEGER.`);
  }
  return Number(value);
}

function getUint8Array(data: ArrayBuffer | ArrayBufferView): Uint8Array {
  return data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}
