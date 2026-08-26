// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseLASExtraBytes, type LASExtraBytesDescriptor} from '@loaders.gl/las';

/** Function that reads an exact half-open byte range from a COPC file. */
export type COPCRangeReader = (
  begin: number,
  end: number,
  signal?: AbortSignal
) => Promise<Uint8Array>;

/** LAS 1.4 public header fields required by a COPC reader. */
export type COPCHeader = {
  /** LAS file signature. */
  fileSignature: 'LASF';
  /** LAS global encoding bit field. */
  globalEncoding: number;
  /** LAS major version. */
  majorVersion: 1;
  /** LAS minor version. */
  minorVersion: 4;
  /** Public header byte length. */
  headerLength: number;
  /** Byte offset of point data. */
  pointDataOffset: number;
  /** Number of regular VLRs. */
  vlrCount: number;
  /** Uncompressed point data record format. */
  pointDataRecordFormat: 6 | 7 | 8;
  /** Byte length of one uncompressed point record. */
  pointDataRecordLength: number;
  /** Extended LAS 1.4 point count. */
  pointCount: number;
  /** Coordinate scale factors. */
  scale: [number, number, number];
  /** Coordinate offsets. */
  offset: [number, number, number];
  /** Dataset minimum coordinates. */
  min: [number, number, number];
  /** Dataset maximum coordinates. */
  max: [number, number, number];
  /** Byte offset of internally stored waveform data. */
  waveformDataOffset: number;
  /** Byte offset of the first EVLR. */
  evlrOffset: number;
  /** Number of EVLRs. */
  evlrCount: number;
};

/** One LAS VLR or EVLR descriptor. */
export type COPCVariableLengthRecord = {
  /** VLR user identifier. */
  userId: string;
  /** VLR record identifier. */
  recordId: number;
  /** Absolute byte offset of the record payload. */
  contentOffset: number;
  /** Byte length of the record payload. */
  contentLength: number;
  /** Human-readable record description. */
  description: string;
  /** Whether this record uses the LAS EVLR header. */
  isExtended: boolean;
};

/** Byte range containing a COPC hierarchy page. */
export type COPCHierarchyPage = {
  /** Absolute file byte offset. */
  pageOffset: number;
  /** Page byte length. */
  pageLength: number;
};

/** Byte range and point count for one COPC octree node. */
export type COPCHierarchyNode = {
  /** Number of points in this node. */
  pointCount: number;
  /** Absolute offset of the compressed LAZ node chunk. */
  pointDataOffset: number;
  /** Compressed LAZ node chunk byte length. */
  pointDataLength: number;
};

/** Parsed hierarchy entries from one or more COPC hierarchy pages. */
export type COPCHierarchy = {
  /** Point-bearing nodes keyed by `depth-x-y-z`. */
  nodes: Record<string, COPCHierarchyNode | undefined>;
  /** Child hierarchy pages keyed by `depth-x-y-z`. */
  pages: Record<string, COPCHierarchyPage | undefined>;
};

/** Parsed COPC info VLR. */
export type COPCInfo = {
  /** Root octree cube as minimum XYZ followed by maximum XYZ. */
  cube: [number, number, number, number, number, number];
  /** Root point spacing. */
  spacing: number;
  /** Root hierarchy page byte range. */
  rootHierarchyPage: COPCHierarchyPage;
  /** Minimum and maximum GPS time. */
  gpsTimeRange: [number, number];
};

/** LASzip codec metadata required to decode COPC node chunks. */
export type COPCLAZMetadata = {
  /** LASzip compressor identifier. COPC uses layered compressor 3. */
  compressor: number;
  /** LASzip entropy coder identifier. The TypeScript decoder supports arithmetic coder 0. */
  coder: number;
  /** Declared LASzip chunk size. COPC normally uses variable-size chunks. */
  chunkSize: number;
  /** Point14 item version. */
  point14ItemVersion: 2 | 3 | 4;
  /** RGB14 or RGBNIR14 item version, when present. */
  rgb14ItemVersion?: 2 | 3 | 4;
  /** Byte14 item version, when Extra Bytes are present. */
  byte14ItemVersion?: 2 | 3 | 4;
};

/** Native metadata required to read a COPC file. */
export type COPCFile = {
  /** LAS 1.4 public header. */
  header: COPCHeader;
  /** Regular VLR and EVLR descriptors. */
  vlrs: COPCVariableLengthRecord[];
  /** COPC info VLR. */
  info: COPCInfo;
  /** Parsed and validated LASzip codec metadata. */
  laz: COPCLAZMetadata;
  /** OGC WKT coordinate reference system, when present. */
  wkt?: string;
  /** Raw Extra Bytes VLR payload, when present. */
  extraBytes?: Uint8Array;
  /** Parsed Extra Bytes descriptors, when present. */
  extraBytesDescriptors: LASExtraBytesDescriptor[];
};

const LAS_1_4_HEADER_LENGTH = 375;
const VLR_HEADER_LENGTH = 54;
const EVLR_HEADER_LENGTH = 60;
const COPC_INFO_LENGTH = 160;
const HIERARCHY_ENTRY_LENGTH = 32;
const COPC_INFO_USER_ID = 'copc';
const COPC_INFO_RECORD_ID = 1;
const WKT_USER_ID = 'LASF_Projection';
const WKT_RECORD_ID = 2112;
const EXTRA_BYTES_USER_ID = 'LASF_Spec';
const EXTRA_BYTES_RECORD_ID = 4;
const LASZIP_USER_ID = 'laszip encoded';
const LASZIP_RECORD_ID = 22204;

/** Open and validate a COPC 1.0 file using only exact byte-range reads. */
export async function openCOPC(
  readRange: COPCRangeReader,
  signal?: AbortSignal
): Promise<COPCFile> {
  const header = parseCOPCHeader(await readExactRange(readRange, 0, LAS_1_4_HEADER_LENGTH, signal));
  const regularVlrs = await readVariableLengthRecords(
    readRange,
    header.headerLength,
    header.vlrCount,
    false,
    header.pointDataOffset,
    signal
  );
  const extendedVlrs = header.evlrCount
    ? await readVariableLengthRecords(
        readRange,
        header.evlrOffset,
        header.evlrCount,
        true,
        Number.MAX_SAFE_INTEGER,
        signal
      )
    : [];
  const vlrs = [...regularVlrs, ...extendedVlrs];
  const infoRecord = findRecord(regularVlrs, COPC_INFO_USER_ID, COPC_INFO_RECORD_ID);
  if (!infoRecord) {
    throw new Error('COPC info VLR is required');
  }
  if (regularVlrs[0] !== infoRecord) {
    throw new Error('COPC info VLR must be the first VLR');
  }
  const info = parseCOPCInfo(await readRecordPayload(readRange, infoRecord, signal));
  const laszipRecord = findRecord(regularVlrs, LASZIP_USER_ID, LASZIP_RECORD_ID);
  if (!laszipRecord) {
    throw new Error('COPC LASzip VLR is required');
  }
  const laz = parseCOPCLAZMetadata(
    await readRecordPayload(readRange, laszipRecord, signal),
    header
  );
  const wktRecord = findRecord(vlrs, WKT_USER_ID, WKT_RECORD_ID);
  const wkt = wktRecord?.contentLength
    ? decodeCString(await readRecordPayload(readRange, wktRecord, signal)) || undefined
    : undefined;
  const extraBytesRecord = findRecord(vlrs, EXTRA_BYTES_USER_ID, EXTRA_BYTES_RECORD_ID);
  const extraBytes = extraBytesRecord
    ? await readRecordPayload(readRange, extraBytesRecord, signal)
    : undefined;

  return {
    header,
    vlrs,
    info,
    laz,
    wkt,
    extraBytes,
    extraBytesDescriptors: extraBytes ? parseLASExtraBytes(extraBytes) : []
  };
}

/** Parse and validate the LASzip item table used by COPC node chunks. */
export function parseCOPCLAZMetadata(bytes: Uint8Array, header: COPCHeader): COPCLAZMetadata {
  if (bytes.byteLength < 34) {
    throw new Error('Malformed COPC LASzip VLR');
  }
  const dataView = createDataView(bytes);
  const compressor = dataView.getUint16(0, true);
  const coder = dataView.getUint16(2, true);
  if (compressor !== 3) {
    throw new Error(`COPC requires LASzip layered compressor 3; received ${compressor}`);
  }
  if (coder !== 0) {
    throw new Error(
      `COPC TypeScript decoding requires LASzip arithmetic coder 0; received ${coder}`
    );
  }

  const extraByteCount =
    header.pointDataRecordLength - [0, 0, 0, 0, 0, 0, 30, 36, 38][header.pointDataRecordFormat];
  const expectedItems: Array<{type: number; size: number}> = [{type: 10, size: 30}];
  if (header.pointDataRecordFormat === 7) {
    expectedItems.push({type: 11, size: 6});
  } else if (header.pointDataRecordFormat === 8) {
    expectedItems.push({type: 12, size: 8});
  }
  if (extraByteCount > 0) {
    expectedItems.push({type: 14, size: extraByteCount});
  }

  const itemCount = dataView.getUint16(32, true);
  if (bytes.byteLength < 34 + itemCount * 6) {
    throw new Error('Malformed COPC LASzip VLR item table');
  }
  if (itemCount !== expectedItems.length) {
    throw new Error(
      `COPC PDRF ${header.pointDataRecordFormat} has ${itemCount} LASzip items; expected ${expectedItems.length}`
    );
  }

  let point14ItemVersion: 2 | 3 | 4 | undefined;
  let rgb14ItemVersion: 2 | 3 | 4 | undefined;
  let byte14ItemVersion: 2 | 3 | 4 | undefined;
  for (let itemIndex = 0; itemIndex < expectedItems.length; itemIndex++) {
    const itemOffset = 34 + itemIndex * 6;
    const itemType = dataView.getUint16(itemOffset, true);
    const itemSize = dataView.getUint16(itemOffset + 2, true);
    const itemVersion = dataView.getUint16(itemOffset + 4, true);
    const expectedItem = expectedItems[itemIndex];
    if (itemType !== expectedItem.type || itemSize !== expectedItem.size) {
      throw new Error(
        `COPC LASzip item ${itemIndex} is type ${itemType}, size ${itemSize}; expected type ${expectedItem.type}, size ${expectedItem.size}`
      );
    }
    if (itemVersion !== 2 && itemVersion !== 3 && itemVersion !== 4) {
      throw new Error(`Unsupported COPC LASzip item type ${itemType} version ${itemVersion}`);
    }
    if (itemType === 10) point14ItemVersion = itemVersion;
    else if (itemType === 11 || itemType === 12) rgb14ItemVersion = itemVersion;
    else if (itemType === 14) byte14ItemVersion = itemVersion;
  }

  return {
    compressor,
    coder,
    chunkSize: dataView.getUint32(12, true),
    point14ItemVersion: point14ItemVersion!,
    rgb14ItemVersion,
    byte14ItemVersion
  };
}

/** Parse and validate the LAS 1.4 public header required by COPC 1.0. */
export function parseCOPCHeader(bytes: Uint8Array): COPCHeader {
  if (bytes.byteLength < LAS_1_4_HEADER_LENGTH) {
    throw new Error(`COPC header requires ${LAS_1_4_HEADER_LENGTH} bytes`);
  }
  const dataView = createDataView(bytes);
  if (decodeCString(bytes.subarray(0, 4)) !== 'LASF') {
    throw new Error('Invalid COPC LAS file signature');
  }
  const majorVersion = dataView.getUint8(24);
  const minorVersion = dataView.getUint8(25);
  if (majorVersion !== 1 || minorVersion !== 4) {
    throw new Error(`COPC requires LAS 1.4; received LAS ${majorVersion}.${minorVersion}`);
  }
  const headerLength = dataView.getUint16(94, true);
  if (headerLength < LAS_1_4_HEADER_LENGTH) {
    throw new Error(`Invalid COPC LAS header length ${headerLength}`);
  }
  const encodedPointFormat = dataView.getUint8(104);
  const pointDataRecordFormat = encodedPointFormat & 0x3f;
  if ((encodedPointFormat & 0x80) === 0) {
    throw new Error('COPC point data must use LAZ compression');
  }
  if (pointDataRecordFormat < 6 || pointDataRecordFormat > 8) {
    throw new Error(`COPC requires PDRF 6, 7, or 8; received ${pointDataRecordFormat}`);
  }
  const pointDataOffset = dataView.getUint32(96, true);
  if (pointDataOffset < headerLength) {
    throw new Error('COPC point data offset precedes the VLR area');
  }
  const globalEncoding = dataView.getUint16(6, true);
  if ((globalEncoding & 0x10) === 0) {
    throw new Error('COPC requires the LAS 1.4 WKT global encoding bit');
  }
  const pointDataRecordLength = dataView.getUint16(105, true);
  const minimumRecordLengths = [0, 0, 0, 0, 0, 0, 30, 36, 38];
  if (pointDataRecordLength < minimumRecordLengths[pointDataRecordFormat]) {
    throw new Error(
      `COPC PDRF ${pointDataRecordFormat} requires at least ${minimumRecordLengths[pointDataRecordFormat]} bytes per point`
    );
  }

  return {
    fileSignature: 'LASF',
    globalEncoding,
    majorVersion: 1,
    minorVersion: 4,
    headerLength,
    pointDataOffset,
    vlrCount: dataView.getUint32(100, true),
    pointDataRecordFormat: pointDataRecordFormat as 6 | 7 | 8,
    pointDataRecordLength,
    pointCount: readSafeUint64(dataView, 247, 'point count'),
    scale: readPoint(dataView, 131),
    offset: readPoint(dataView, 155),
    min: [
      dataView.getFloat64(187, true),
      dataView.getFloat64(203, true),
      dataView.getFloat64(219, true)
    ],
    max: [
      dataView.getFloat64(179, true),
      dataView.getFloat64(195, true),
      dataView.getFloat64(211, true)
    ],
    waveformDataOffset: readSafeUint64(dataView, 227, 'waveform data offset'),
    evlrOffset: readSafeUint64(dataView, 235, 'EVLR offset'),
    evlrCount: dataView.getUint32(243, true)
  };
}

/** Parse the 160-byte COPC info VLR payload. */
export function parseCOPCInfo(bytes: Uint8Array): COPCInfo {
  if (bytes.byteLength !== COPC_INFO_LENGTH) {
    throw new Error(`COPC info VLR must contain ${COPC_INFO_LENGTH} bytes`);
  }
  const dataView = createDataView(bytes);
  const center: [number, number, number] = [
    dataView.getFloat64(0, true),
    dataView.getFloat64(8, true),
    dataView.getFloat64(16, true)
  ];
  const radius = dataView.getFloat64(24, true);
  const spacing = dataView.getFloat64(32, true);
  if (!center.every(Number.isFinite) || !Number.isFinite(radius) || radius <= 0) {
    throw new Error('COPC info VLR contains an invalid root cube');
  }
  if (!Number.isFinite(spacing) || spacing <= 0) {
    throw new Error('COPC info VLR contains invalid point spacing');
  }
  const rootHierarchyPage = {
    pageOffset: readSafeUint64(dataView, 40, 'root hierarchy offset'),
    pageLength: readSafeUint64(dataView, 48, 'root hierarchy length')
  };
  validatePage(rootHierarchyPage, 'root hierarchy');
  for (let byteOffset = 72; byteOffset < bytes.byteLength; byteOffset++) {
    if (bytes[byteOffset] !== 0) {
      throw new Error('COPC info VLR reserved bytes must be zero');
    }
  }
  return {
    cube: [
      center[0] - radius,
      center[1] - radius,
      center[2] - radius,
      center[0] + radius,
      center[1] + radius,
      center[2] + radius
    ],
    spacing,
    rootHierarchyPage,
    gpsTimeRange: [dataView.getFloat64(56, true), dataView.getFloat64(64, true)]
  };
}

/** Parse one COPC hierarchy page. */
export function parseCOPCHierarchy(bytes: Uint8Array): COPCHierarchy {
  if (bytes.byteLength === 0 || bytes.byteLength % HIERARCHY_ENTRY_LENGTH !== 0) {
    throw new Error(`Invalid COPC hierarchy page length ${bytes.byteLength}`);
  }
  const dataView = createDataView(bytes);
  const nodes: COPCHierarchy['nodes'] = {};
  const pages: COPCHierarchy['pages'] = {};
  for (let byteOffset = 0; byteOffset < bytes.byteLength; byteOffset += HIERARCHY_ENTRY_LENGTH) {
    const key = formatCOPCKey([
      dataView.getInt32(byteOffset, true),
      dataView.getInt32(byteOffset + 4, true),
      dataView.getInt32(byteOffset + 8, true),
      dataView.getInt32(byteOffset + 12, true)
    ]);
    const offset = readSafeUint64(dataView, byteOffset + 16, `hierarchy offset for ${key}`);
    const length = dataView.getInt32(byteOffset + 24, true);
    const pointCount = dataView.getInt32(byteOffset + 28, true);
    if (length < 0 || pointCount < -1) {
      throw new Error(`Invalid COPC hierarchy entry ${key}`);
    }
    if (nodes[key] || pages[key]) {
      throw new Error(`Duplicate COPC hierarchy entry ${key}`);
    }
    if (pointCount === -1) {
      const page = {pageOffset: offset, pageLength: length};
      validatePage(page, `hierarchy page ${key}`);
      pages[key] = page;
    } else {
      if (pointCount > 0 && length === 0) {
        throw new Error(`COPC node ${key} has points but no compressed data`);
      }
      nodes[key] = {pointCount, pointDataOffset: offset, pointDataLength: length};
    }
  }
  return {nodes, pages};
}

/** Fetch and parse one hierarchy page. */
export async function loadCOPCHierarchyPage(
  readRange: COPCRangeReader,
  page: COPCHierarchyPage,
  signal?: AbortSignal
): Promise<COPCHierarchy> {
  validatePage(page, 'hierarchy');
  return parseCOPCHierarchy(
    await readExactRange(readRange, page.pageOffset, page.pageOffset + page.pageLength, signal)
  );
}

/** Fetch one complete compressed COPC node chunk. */
export async function loadCOPCNodeData(
  readRange: COPCRangeReader,
  node: COPCHierarchyNode,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (node.pointDataOffset < 0 || node.pointDataLength < 0) {
    throw new Error('Invalid COPC node byte range');
  }
  return await readExactRange(
    readRange,
    node.pointDataOffset,
    node.pointDataOffset + node.pointDataLength,
    signal
  );
}

/** Format a COPC octree key as `depth-x-y-z`. */
export function formatCOPCKey(key: readonly number[]): string {
  if (!isValidCOPCKey(key)) {
    throw new Error(`Invalid COPC key ${key.join('-')}`);
  }
  return key.join('-');
}

/** Parse a `depth-x-y-z` COPC octree key. */
export function parseCOPCKey(key: string): [number, number, number, number] {
  const values = key.split('-').map(value => Number(value));
  if (!isValidCOPCKey(values)) {
    throw new Error(`Invalid COPC key ${key}`);
  }
  return values as [number, number, number, number];
}

/** Compute the octree bounds represented by a COPC key. */
export function getCOPCKeyBounds(
  cube: readonly number[],
  key: readonly [number, number, number, number]
): [number, number, number, number, number, number] {
  let bounds = [...cube] as [number, number, number, number, number, number];
  for (let bit = key[0] - 1; bit >= 0; bit--) {
    const middleX = (bounds[0] + bounds[3]) / 2;
    const middleY = (bounds[1] + bounds[4]) / 2;
    const middleZ = (bounds[2] + bounds[5]) / 2;
    const childX = (key[1] >> bit) & 1;
    const childY = (key[2] >> bit) & 1;
    const childZ = (key[3] >> bit) & 1;
    bounds = [
      childX ? middleX : bounds[0],
      childY ? middleY : bounds[1],
      childZ ? middleZ : bounds[2],
      childX ? bounds[3] : middleX,
      childY ? bounds[4] : middleY,
      childZ ? bounds[5] : middleZ
    ];
  }
  return bounds;
}

/** Read one VLR payload by descriptor. */
async function readRecordPayload(
  readRange: COPCRangeReader,
  record: COPCVariableLengthRecord,
  signal?: AbortSignal
): Promise<Uint8Array> {
  return await readExactRange(
    readRange,
    record.contentOffset,
    record.contentOffset + record.contentLength,
    signal
  );
}

/** Walk regular VLR or EVLR headers without reading unrelated payload bytes. */
async function readVariableLengthRecords(
  readRange: COPCRangeReader,
  startOffset: number,
  count: number,
  isExtended: boolean,
  maximumEndOffset: number,
  signal?: AbortSignal
): Promise<COPCVariableLengthRecord[]> {
  if (!Number.isSafeInteger(startOffset) || startOffset < 0) {
    throw new Error('Invalid LAS variable length record offset');
  }
  const headerLength = isExtended ? EVLR_HEADER_LENGTH : VLR_HEADER_LENGTH;
  const records: COPCVariableLengthRecord[] = [];
  let byteOffset = startOffset;
  for (let recordIndex = 0; recordIndex < count; recordIndex++) {
    if (byteOffset + headerLength > maximumEndOffset) {
      throw new Error('LAS VLR header overlaps point data');
    }
    const bytes = await readExactRange(readRange, byteOffset, byteOffset + headerLength, signal);
    const dataView = createDataView(bytes);
    const contentLength = isExtended
      ? readSafeUint64(dataView, 20, 'EVLR content length')
      : dataView.getUint16(20, true);
    const contentOffset = byteOffset + headerLength;
    const contentEnd = contentOffset + contentLength;
    if (!Number.isSafeInteger(contentEnd) || contentEnd > maximumEndOffset) {
      throw new Error('LAS variable length record exceeds its containing section');
    }
    records.push({
      userId: decodeCString(bytes.subarray(2, 18)),
      recordId: dataView.getUint16(18, true),
      contentOffset,
      contentLength,
      description: decodeCString(bytes.subarray(isExtended ? 28 : 22, headerLength)),
      isExtended
    });
    byteOffset = contentEnd;
  }
  return records;
}

/** Find one VLR by its user and record identifiers. */
function findRecord(
  records: readonly COPCVariableLengthRecord[],
  userId: string,
  recordId: number
): COPCVariableLengthRecord | undefined {
  return records.find(record => record.userId === userId && record.recordId === recordId);
}

/** Read a byte range and verify that the source returned exactly that range. */
async function readExactRange(
  readRange: COPCRangeReader,
  begin: number,
  end: number,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (!Number.isSafeInteger(begin) || !Number.isSafeInteger(end) || begin < 0 || end < begin) {
    throw new Error(`Invalid COPC byte range ${begin}-${end}`);
  }
  if (signal?.aborted) {
    throw new Error('COPC range request was aborted');
  }
  const bytes = await readRange(begin, end, signal);
  if (signal?.aborted) {
    throw new Error('COPC range request was aborted');
  }
  if (bytes.byteLength !== end - begin) {
    throw new Error(
      `COPC range source returned ${bytes.byteLength} bytes; expected ${end - begin}`
    );
  }
  return bytes;
}

/** Validate one non-empty hierarchy page range. */
function validatePage(page: COPCHierarchyPage, label: string): void {
  if (
    !Number.isSafeInteger(page.pageOffset) ||
    !Number.isSafeInteger(page.pageLength) ||
    page.pageOffset < 0 ||
    page.pageLength <= 0 ||
    page.pageLength % HIERARCHY_ENTRY_LENGTH !== 0
  ) {
    throw new Error(`Invalid COPC ${label} byte range`);
  }
}

/** Read a three-component little-endian float64 point. */
function readPoint(dataView: DataView, byteOffset: number): [number, number, number] {
  return [
    dataView.getFloat64(byteOffset, true),
    dataView.getFloat64(byteOffset + 8, true),
    dataView.getFloat64(byteOffset + 16, true)
  ];
}

/** Read a uint64 that can be represented exactly by JavaScript. */
function readSafeUint64(dataView: DataView, byteOffset: number, label: string): number {
  const value = dataView.getBigUint64(byteOffset, true);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`COPC ${label} exceeds JavaScript's safe integer range`);
  }
  return Number(value);
}

/** Decode a fixed-width null-terminated ASCII/UTF-8 string. */
function decodeCString(bytes: Uint8Array): string {
  const zeroOffset = bytes.indexOf(0);
  return new TextDecoder().decode(zeroOffset < 0 ? bytes : bytes.subarray(0, zeroOffset));
}

/** Create an alignment-safe DataView over the exact input view. */
function createDataView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/** Return whether values form a representable COPC octree key. */
function isValidCOPCKey(key: readonly number[]): boolean {
  if (
    key.length !== 4 ||
    key.some(value => !Number.isSafeInteger(value) || value < 0) ||
    key[0] > 31
  ) {
    return false;
  }
  const coordinateLimit = 2 ** key[0];
  return key[1] < coordinateLimit && key[2] < coordinateLimit && key[3] < coordinateLimit;
}
