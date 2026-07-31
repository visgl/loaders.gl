// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
};

/** Parsed Spark RAD top-level metadata with loader-derived byte offsets. */
export type RADMetadata = {
  /** RAD container version. Version 1 is currently supported. */
  version: number;
  /** RAD payload type. Spark currently writes `gsplat`. */
  type: string;
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
};

/** Parsed Spark RADC chunk metadata with loader-derived byte offsets. */
export type RADChunkMetadata = {
  /** RAD chunk version. Version 1 is currently supported. */
  version: number;
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

  const rawMetadata = parseJSONRecord(
    bytes.subarray(RAD_HEADER_BYTE_LENGTH, headerJsonEnd),
    'RADLoader: failed to parse RAD metadata JSON.'
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

  const rawMetadata = parseJSONRecord(
    bytes.subarray(RAD_HEADER_BYTE_LENGTH, headerJsonEnd),
    'RADLoader: failed to parse RADC metadata JSON.'
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
  rawMetadata: Record<string, unknown>,
  headerJsonByteLength: number
): RADMetadata {
  const version = requireSafeInteger(rawMetadata.version, 'RAD version');
  if (version !== 1) {
    throw new Error(`RADLoader: version ${version} is not supported.`);
  }

  const type = requireString(rawMetadata.type, 'RAD type');
  if (type !== 'gsplat') {
    throw new Error(`RADLoader: RAD type ${type} is not supported.`);
  }

  const chunks = requireArray(rawMetadata.chunks, 'RAD chunks').map((chunk, chunkIndex) =>
    normalizeRADChunkRange(chunk, chunkIndex)
  );
  const metadata: RADMetadata = {
    version,
    type,
    count: requireSafeInteger(rawMetadata.count, 'RAD count'),
    maxSh: optionalSafeInteger(rawMetadata.maxSh, 'RAD maxSh'),
    lodTree: optionalBoolean(rawMetadata.lodTree, 'RAD lodTree'),
    chunkSize: optionalSafeInteger(rawMetadata.chunkSize, 'RAD chunkSize'),
    allChunkBytes: optionalSafeInteger(rawMetadata.allChunkBytes, 'RAD allChunkBytes'),
    chunks,
    splatEncoding: optionalSplatEncoding(rawMetadata.splatEncoding, 'RAD splatEncoding'),
    shCodeCount: optionalSafeInteger(rawMetadata.shCodeCount, 'RAD shCodeCount'),
    comment: optionalString(rawMetadata.comment, 'RAD comment'),
    headerJsonByteLength,
    chunksByteOffset: RAD_HEADER_BYTE_LENGTH + roundUpToEight(headerJsonByteLength)
  };

  return metadata;
}

function normalizeRADChunkRange(rawChunk: unknown, chunkIndex: number): RADChunkRange {
  const chunk = requireRecord(rawChunk, `RAD chunk ${chunkIndex}`);
  return {
    offset: requireSafeInteger(chunk.offset, `RAD chunk ${chunkIndex} offset`),
    bytes: requireSafeInteger(chunk.bytes, `RAD chunk ${chunkIndex} bytes`),
    base: optionalSafeInteger(chunk.base, `RAD chunk ${chunkIndex} base`),
    count: optionalSafeInteger(chunk.count, `RAD chunk ${chunkIndex} count`),
    filename: optionalString(chunk.filename, `RAD chunk ${chunkIndex} filename`)
  };
}

function normalizeRADChunkMetadata(
  rawMetadata: Record<string, unknown>,
  headerJsonByteLength: number,
  payloadByteOffset: number,
  payloadBytes: number
): RADChunkMetadata {
  const version = requireSafeInteger(rawMetadata.version, 'RADC version');
  if (version !== 1) {
    throw new Error(`RADLoader: RADC version ${version} is not supported.`);
  }

  const metadataPayloadBytes = requireSafeInteger(rawMetadata.payloadBytes, 'RADC payloadBytes');
  if (metadataPayloadBytes !== payloadBytes) {
    throw new Error('RADLoader: RADC metadata payload byte length does not match binary header.');
  }

  return {
    version,
    base: requireSafeInteger(rawMetadata.base, 'RADC base'),
    count: requireSafeInteger(rawMetadata.count, 'RADC count'),
    payloadBytes,
    maxSh: optionalSafeInteger(rawMetadata.maxSh, 'RADC maxSh'),
    lodTree: optionalBoolean(rawMetadata.lodTree, 'RADC lodTree'),
    splatEncoding: optionalSplatEncoding(rawMetadata.splatEncoding, 'RADC splatEncoding'),
    properties: requireArray(rawMetadata.properties, 'RADC properties').map((property, index) =>
      normalizeRADChunkProperty(property, index)
    ),
    headerJsonByteLength,
    payloadByteOffset,
    chunkByteLength: payloadByteOffset + payloadBytes
  };
}

function normalizeRADChunkProperty(rawProperty: unknown, propertyIndex: number): RADChunkProperty {
  const property = requireRecord(rawProperty, `RADC property ${propertyIndex}`);
  return {
    offset: requireSafeInteger(property.offset, `RADC property ${propertyIndex} offset`),
    bytes: requireSafeInteger(property.bytes, `RADC property ${propertyIndex} bytes`),
    property: requireString(property.property, `RADC property ${propertyIndex} name`),
    encoding: requireString(property.encoding, `RADC property ${propertyIndex} encoding`),
    compression: optionalString(property.compression, `RADC property ${propertyIndex} compression`),
    min: optionalFiniteNumber(property.min, `RADC property ${propertyIndex} min`),
    max: optionalFiniteNumber(property.max, `RADC property ${propertyIndex} max`)
  };
}

function optionalSplatEncoding(value: unknown, fieldName: string): RADSplatEncoding | undefined {
  if (value === undefined) {
    return undefined;
  }
  const encoding = requireRecord(value, fieldName);
  return {
    rgbMin: optionalFiniteNumber(encoding.rgbMin, `${fieldName}.rgbMin`),
    rgbMax: optionalFiniteNumber(encoding.rgbMax, `${fieldName}.rgbMax`),
    lnScaleMin: optionalFiniteNumber(encoding.lnScaleMin, `${fieldName}.lnScaleMin`),
    lnScaleMax: optionalFiniteNumber(encoding.lnScaleMax, `${fieldName}.lnScaleMax`),
    sh1Max: optionalFiniteNumber(encoding.sh1Max, `${fieldName}.sh1Max`),
    sh2Max: optionalFiniteNumber(encoding.sh2Max, `${fieldName}.sh2Max`),
    sh3Max: optionalFiniteNumber(encoding.sh3Max, `${fieldName}.sh3Max`),
    lodOpacity: optionalBoolean(encoding.lodOpacity, `${fieldName}.lodOpacity`)
  };
}

function parseJSONRecord(bytes: Uint8Array, message: string): Record<string, unknown> {
  try {
    return requireRecord(JSON.parse(TEXT_DECODER.decode(bytes)), message);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('RADLoader:')) {
      throw error;
    }
    throw new Error(message);
  }
}

function requireRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`RADLoader: ${fieldName} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, fieldName: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`RADLoader: ${fieldName} must be an array.`);
  }
  return value;
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`RADLoader: ${fieldName} must be a string.`);
  }
  return value;
}

function optionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return requireString(value, fieldName);
}

function optionalBoolean(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new Error(`RADLoader: ${fieldName} must be a boolean.`);
  }
  return value;
}

function requireSafeInteger(value: unknown, fieldName: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error(`RADLoader: ${fieldName} must be a non-negative safe integer.`);
  }
  return Number(value);
}

function optionalSafeInteger(value: unknown, fieldName: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  return requireSafeInteger(value, fieldName);
}

function optionalFiniteNumber(value: unknown, fieldName: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`RADLoader: ${fieldName} must be a finite number.`);
  }
  return value;
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
