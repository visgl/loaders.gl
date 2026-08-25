// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** An integer preserved as a number while safe, and as bigint when wider. */
export type LanceManifestInteger = number | bigint;

/** A field decoded from a Lance table manifest. */
export type LanceManifestField = Readonly<{
  /** Lance field kind: 0 parent, 1 repeated, 2 leaf. */
  type: number;
  /** Fully qualified field name. */
  name: string;
  /** Stable Lance field identifier. */
  id: number;
  /** Parent field identifier, or -1 for a top-level field. */
  parentId: number;
  /** Lance logical type string. */
  logicalType: string;
  /** Whether the field accepts null values. */
  nullable: boolean;
}>;

/** A data file reference decoded from a Lance manifest. */
export type LanceManifestDataFile = Readonly<{
  /** Path relative to the dataset data directory. */
  path: string;
  /** Field ids stored by this data file. */
  fieldIds: number[];
  /** Optional Lance file major version. */
  fileMajorVersion?: number;
  /** Optional Lance file minor version. */
  fileMinorVersion?: number;
  /** Optional known file size. */
  fileSizeBytes?: LanceManifestInteger;
  /** Optional base-path index. */
  baseId?: number;
}>;

/** A fragment summary decoded from a Lance manifest. */
export type LanceManifestFragment = Readonly<{
  /** Fragment identifier. */
  id: number;
  /** Physical row count, including deleted rows. */
  physicalRows: LanceManifestInteger;
  /** Data files attached to this fragment. */
  files: LanceManifestDataFile[];
}>;

/** The read-only subset of a Lance manifest used by the MVP. */
export type LanceManifest = Readonly<{
  /** Manifest snapshot version. */
  version: LanceManifestInteger;
  /** Reader feature flags declared by the writer. */
  readerFeatureFlags: LanceManifestInteger;
  /** Data storage format name and version. */
  dataFormat?: Readonly<{fileFormat: string; version: string}>;
  /** All schema fields, including nested fields. */
  fields: LanceManifestField[];
  /** Fragments included in this snapshot. */
  fragments: LanceManifestFragment[];
}>;

class ProtobufReader {
  private readonly bytes: Uint8Array;
  private offset = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  get done(): boolean {
    return this.offset >= this.bytes.byteLength;
  }

  readVarint(): LanceManifestInteger {
    let value = 0n;
    let shift = 0n;
    while (this.offset < this.bytes.byteLength) {
      const byte = BigInt(this.bytes[this.offset++]);
      value |= (byte & 0x7fn) << shift;
      if ((byte & 0x80n) === 0n) {
        const numberValue = Number(value);
        return Number.isSafeInteger(numberValue) ? numberValue : value;
      }
      shift += 7n;
      if (shift > 70n) {
        throw new Error('Invalid Lance protobuf varint');
      }
    }
    throw new Error('Unexpected end of Lance protobuf varint');
  }

  readBytes(): Uint8Array {
    const length = readSafeVarint(this, 'length');
    const end = this.offset + length;
    if (!Number.isSafeInteger(length) || end > this.bytes.byteLength) {
      throw new Error('Invalid Lance protobuf length-delimited field');
    }
    const value = this.bytes.slice(this.offset, end);
    this.offset = end;
    return value;
  }

  readString(): string {
    return new TextDecoder().decode(this.readBytes());
  }

  skip(wireType: number): void {
    if (wireType === 0) {
      this.readVarint();
    } else if (wireType === 1) {
      this.skipBytes(8);
    } else if (wireType === 2) {
      this.skipBytes(readSafeVarint(this, 'skip length'));
    } else if (wireType === 5) {
      this.skipBytes(4);
    } else {
      throw new Error(`Unsupported Lance protobuf wire type ${wireType}`);
    }
  }

  private skipBytes(length: number): void {
    this.offset += length;
    if (this.offset > this.bytes.byteLength) {
      throw new Error('Unexpected end of Lance protobuf message');
    }
  }
}

function readSafeVarint(reader: ProtobufReader, label: string): number {
  const value = reader.readVarint();
  if (typeof value === 'bigint') {
    throw new Error(`Lance manifest ${label} exceeds JavaScript safe integer limits`);
  }
  return value;
}

function readMessage(
  bytes: Uint8Array,
  callback: (field: number, wireType: number, reader: ProtobufReader) => void
): void {
  const reader = new ProtobufReader(bytes);
  while (!reader.done) {
    const tag = readSafeVarint(reader, 'field tag');
    callback(tag >>> 3, tag & 7, reader);
  }
}

function readField(bytes: Uint8Array): LanceManifestField {
  const field = {
    type: 0,
    name: '',
    id: 0,
    parentId: -1,
    logicalType: '',
    nullable: false
  };
  readMessage(bytes, (number, wireType, reader) => {
    if (number === 1 && wireType === 0) field.type = readSafeVarint(reader, 'field type');
    else if (number === 2 && wireType === 2) field.name = reader.readString();
    else if (number === 3 && wireType === 0) field.id = readSafeVarint(reader, 'field id') | 0;
    else if (number === 4 && wireType === 0)
      field.parentId = readSafeVarint(reader, 'parent id') | 0;
    else if (number === 5 && wireType === 2) field.logicalType = reader.readString();
    else if (number === 6 && wireType === 0)
      field.nullable = readSafeVarint(reader, 'nullable') !== 0;
    else reader.skip(wireType);
  });
  return field;
}

function readDataFile(bytes: Uint8Array): LanceManifestDataFile {
  const dataFile: {
    path: string;
    fieldIds: number[];
    fileMajorVersion?: number;
    fileMinorVersion?: number;
    fileSizeBytes?: LanceManifestInteger;
    baseId?: number;
  } = {path: '', fieldIds: []};
  readMessage(bytes, (number, wireType, reader) => {
    if (number === 1 && wireType === 2) dataFile.path = reader.readString();
    else if (number === 2 && wireType === 0)
      dataFile.fieldIds.push(readSafeVarint(reader, 'field id') | 0);
    else if (number === 2 && wireType === 2) {
      const packed = new ProtobufReader(reader.readBytes());
      while (!packed.done) dataFile.fieldIds.push(readSafeVarint(packed, 'field id') | 0);
    } else if (number === 4 && wireType === 0)
      dataFile.fileMajorVersion = readSafeVarint(reader, 'file major version');
    else if (number === 5 && wireType === 0)
      dataFile.fileMinorVersion = readSafeVarint(reader, 'file minor version');
    else if (number === 6 && wireType === 0) dataFile.fileSizeBytes = reader.readVarint();
    else if (number === 7 && wireType === 0) dataFile.baseId = readSafeVarint(reader, 'base id');
    else reader.skip(wireType);
  });
  return dataFile;
}

function readFragment(bytes: Uint8Array): LanceManifestFragment {
  const fragment: {
    id: number;
    physicalRows: LanceManifestInteger;
    files: LanceManifestDataFile[];
  } = {id: 0, physicalRows: 0, files: []};
  readMessage(bytes, (number, wireType, reader) => {
    if (number === 1 && wireType === 0) fragment.id = readSafeVarint(reader, 'fragment id');
    else if (number === 2 && wireType === 2) fragment.files.push(readDataFile(reader.readBytes()));
    else if (number === 4 && wireType === 0) fragment.physicalRows = reader.readVarint();
    else reader.skip(wireType);
  });
  return fragment;
}

function readDataFormat(bytes: Uint8Array): {fileFormat: string; version: string} {
  const dataFormat = {fileFormat: '', version: ''};
  readMessage(bytes, (number, wireType, reader) => {
    if (number === 1 && wireType === 2) dataFormat.fileFormat = reader.readString();
    else if (number === 2 && wireType === 2) dataFormat.version = reader.readString();
    else reader.skip(wireType);
  });
  return dataFormat;
}

function parseManifestMessage(bytes: Uint8Array): LanceManifest {
  const manifest: {
    version: LanceManifestInteger;
    readerFeatureFlags: LanceManifestInteger;
    dataFormat?: {fileFormat: string; version: string};
    fields: LanceManifestField[];
    fragments: LanceManifestFragment[];
  } = {version: 0, readerFeatureFlags: 0, fields: [], fragments: []};
  readMessage(bytes, (number, wireType, reader) => {
    if (number === 1 && wireType === 2) manifest.fields.push(readField(reader.readBytes()));
    else if (number === 2 && wireType === 2)
      manifest.fragments.push(readFragment(reader.readBytes()));
    else if (number === 3 && wireType === 0) manifest.version = reader.readVarint();
    else if (number === 9 && wireType === 0) manifest.readerFeatureFlags = reader.readVarint();
    else if (number === 15 && wireType === 2)
      manifest.dataFormat = readDataFormat(reader.readBytes());
    else reader.skip(wireType);
  });
  return manifest;
}

function parseFramedManifest(bytes: Uint8Array): LanceManifest | null {
  const hasManifestFooter =
    bytes.byteLength >= 16 &&
    bytes[bytes.byteLength - 4] === 0x4c &&
    bytes[bytes.byteLength - 3] === 0x41 &&
    bytes[bytes.byteLength - 2] === 0x4e &&
    bytes[bytes.byteLength - 1] === 0x43;
  const framedEnd = hasManifestFooter ? bytes.byteLength - 16 : bytes.byteLength;
  let offset = 0;
  let tableManifest: LanceManifest | null = null;

  while (offset + 4 <= framedEnd) {
    const sectionLength =
      bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24);
    const sectionStart = offset + 4;
    const sectionEnd = sectionStart + sectionLength;
    if (sectionLength < 0 || sectionEnd > framedEnd) return null;

    try {
      const candidate = parseManifestMessage(bytes.subarray(sectionStart, sectionEnd));
      if (candidate.fields.length > 0 && candidate.fragments.length > 0) {
        tableManifest = candidate;
      }
    } catch {
      // Other framed sections, such as index metadata, are different protobuf messages.
    }
    offset = sectionEnd;
  }

  return offset === framedEnd ? tableManifest : null;
}

/** Decodes the table-level subset of a Lance manifest protobuf. */
export function parseLanceManifest(arrayBuffer: ArrayBuffer | ArrayBufferView): LanceManifest {
  const bytes =
    arrayBuffer instanceof ArrayBuffer
      ? new Uint8Array(arrayBuffer)
      : new Uint8Array(arrayBuffer.buffer, arrayBuffer.byteOffset, arrayBuffer.byteLength);
  const framedManifest = parseFramedManifest(bytes);
  if (framedManifest) return framedManifest;
  return parseManifestMessage(bytes);
}
