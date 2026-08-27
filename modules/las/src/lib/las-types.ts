// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh} from '@loaders.gl/schema';
import type {WKTCRSDefinition} from '@math.gl/crs';

/** LAS Variable Length Record metadata and payload. */
export type LASVariableLengthRecord = {
  /** Reserved VLR field. */
  reserved: number;
  /** LAS VLR user id. */
  userId: string;
  /** LAS VLR record id. */
  recordId: number;
  /** VLR description string. */
  description: string;
  /** Byte offset of the VLR header in the source file. */
  offset: number;
  /** Raw VLR payload bytes. */
  data: Uint8Array;
};

/** LAS Extended Variable Length Record metadata and payload. */
export type LASExtendedVariableLengthRecord = {
  /** Reserved EVLR field. */
  reserved: number;
  /** LAS EVLR user id. */
  userId: string;
  /** LAS EVLR record id. */
  recordId: number;
  /** EVLR description string. */
  description: string;
  /** Byte offset of the EVLR header in the source file. */
  offset: number;
  /** Raw EVLR payload bytes when available in memory. */
  data?: Uint8Array;
  /** Byte offset of the EVLR payload in the source file. */
  dataOffset: number;
  /** Byte length of the EVLR payload. */
  dataLength: number;
};

/** LAS Extra Bytes descriptor parsed from an Extra Bytes VLR. */
export type LASExtraBytesDescriptor = {
  /** Extra Bytes data type code. */
  dataType: number;
  /** Extra Bytes options bit mask. */
  options: number;
  /** Extra Bytes field name. */
  name: string;
  /** Extra Bytes field description. */
  description: string;
  /** First descriptor scale value, used when option bit 3 is set. */
  scale: number;
  /** First descriptor offset value, used when option bit 4 is set. */
  offset: number;
  /** Per-component descriptor scale values for scalar and vector fields. */
  scales: [number, number, number];
  /** Per-component descriptor offset values for scalar and vector fields. */
  offsets: [number, number, number];
  /** Raw 192-byte descriptor payload. */
  data: Uint8Array;
};

/** LAS waveform packet descriptor parsed from a waveform descriptor VLR. */
export type LASWaveformPacketDescriptor = {
  /** Waveform descriptor record id. */
  recordId: number;
  /** Number of bits per waveform sample. */
  bitsPerSample: number;
  /** Waveform compression type. */
  compressionType: number;
  /** Number of samples in the waveform packet. */
  numberOfSamples: number;
  /** Temporal sample spacing in picoseconds. */
  temporalSampleSpacing: number;
  /** Digitizer gain. */
  digitizerGain: number;
  /** Digitizer offset. */
  digitizerOffset: number;
};

/** One resolved GeoTIFF GeoKey directory entry from LAS CRS metadata. */
export type LASGeoTIFFKey = {
  /** GeoTIFF key identifier. */
  keyId: number;
  /** TIFF tag containing the value, or zero when the value is inline. */
  tiffTagLocation: number;
  /** Number of values referenced by this key. */
  count: number;
  /** Inline value or offset into the referenced GeoTIFF parameter tag. */
  valueOffset: number;
  /** Resolved scalar, numeric array, or ASCII value when its source tag is available. */
  value?: number | number[] | string;
};

/** Parsed GeoTIFF GeoKey directory header and entries. */
export type LASGeoTIFFKeyDirectory = {
  /** GeoKey directory format version. */
  version: number;
  /** GeoKey revision. */
  keyRevision: number;
  /** GeoKey minor revision. */
  minorRevision: number;
  /** Resolved GeoKey entries. */
  entries: LASGeoTIFFKey[];
};

/** Typed metadata parsed from a LAS file. */
export type LASMetadata = {
  /** File source id from the public header. */
  fileSourceId: number;
  /** Global encoding bit field from the public header. */
  globalEncoding: number;
  /** Start of the internal waveform data packet record, preserved as an exact uint64. */
  waveformDataOffset?: bigint;
  /** Project identifier as a UUID string. */
  projectId: string;
  /** System identifier string. */
  systemIdentifier: string;
  /** Generating software string. */
  generatingSoftware: string;
  /** File creation day of year. */
  creationDayOfYear: number;
  /** File creation year. */
  creationYear: number;
  /** LAS header byte length. */
  headerSize: number;
  /** LAS header extension bytes after the standard 393-byte LAS 1.5 header. */
  userHeaderData?: Uint8Array;
  /** Number of VLRs before point data. */
  vlrCount: number;
  /** Offset of first EVLR, or zero when absent. */
  evlrOffset?: number;
  /** Number of EVLRs after point data. */
  evlrCount?: number;
  /** Extended point count by return. */
  pointsByReturn?: number[];
  /** LAS 1.5 maximum GPS time. */
  maxGpsTime?: number;
  /** LAS 1.5 minimum GPS time. */
  minGpsTime?: number;
  /** LAS 1.5 GPS time offset. */
  timeOffset?: number;
  /** Parsed VLR records. */
  vlrs: LASVariableLengthRecord[];
  /** Parsed EVLR records when available. */
  evlrs: LASExtendedVariableLengthRecord[];
  /** WKT coordinate reference system text when present. */
  wkt?: WKTCRSDefinition;
  /** WKT math transform text when present. */
  wktMathTransform?: string;
  /** GeoTIFF VLRs retained for legacy LAS versions. */
  geotiff?: {
    /** GeoKeyDirectoryTag payload. */
    keys?: Uint16Array;
    /** GeoDoubleParamsTag payload. */
    doubles?: Float64Array;
    /** GeoAsciiParamsTag payload. */
    ascii?: string;
    /** Parsed and resolved GeoKey directory entries. */
    keyDirectory?: LASGeoTIFFKeyDirectory;
  };
  /** Extra Bytes descriptors parsed from the Extra Bytes VLR. */
  extraBytes: LASExtraBytesDescriptor[];
  /** Waveform packet descriptors parsed from waveform descriptor VLRs. */
  waveformPacketDescriptors: LASWaveformPacketDescriptor[];
};

/**
 * Type for header of the .las file
 */
export type LASHeader = {
  pointsOffset: number;
  pointsFormatId: number;
  pointsStructSize: number;
  pointsCount: number;
  scale: [number, number, number];
  offset: [number, number, number];
  maxs?: number[];
  mins?: number[];
  totalToRead: number;
  totalRead: number;
  hasColor: boolean;
  versionAsString?: string;
  isCompressed?: boolean;
  headerSize?: number;
  /** LAS header extension bytes after the standard 393-byte LAS 1.5 header. */
  userHeaderData?: Uint8Array;
  vlrCount?: number;
  metadata?: LASMetadata;
};

/**
 * loaders.gl Mesh with Draco specific data
 */
export type LASMesh = Mesh & {
  loader: 'las';
  loaderData: LASHeader; // Draco specific data
  topology: 'point-list';
  mode: 0;
};
