// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  encodeLASzipVLR,
  encodeLAZChunk,
  encodeLAZChunkTable,
  type LAZChunkTableEntry,
  type WriterOptions,
  type WriterWithEncoder
} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable, MeshAttribute} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import {LASFormat} from './las-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const LAS_HEADER_LENGTH = 227;
const LAS_1_4_HEADER_LENGTH = 375;
const VLR_HEADER_LENGTH = 54;
const EXTRA_BYTES_DESCRIPTOR_LENGTH = 192;
const DEFAULT_LAZ_CHUNK_SIZE = 50_000;
const VARIABLE_LAZ_CHUNK_SIZE = 0xffffffff;
const POINT_RECORD_LENGTHS: Record<number, number> = {
  0: 20,
  1: 28,
  2: 26,
  3: 34,
  4: 57,
  5: 63,
  6: 30,
  7: 36,
  8: 38
};

/** Description of a typed mesh attribute stored in LAS Extra Bytes. */
export type LASExtraBytesWriter = {
  /** Name of the mesh attribute to append to each point record. */
  attribute: string;
  /** Optional LAS Extra Bytes field name. */
  name?: string;
  /** Optional LAS Extra Bytes field description. */
  description?: string;
};

/** Options for `LASWriter`. */
export type LASWriterOptions = WriterOptions & {
  /** LAS-specific writer options. */
  las?: {
    /** Output container format. COPC has its own writer in @loaders.gl/copc. */
    format?: 'las' | 'laz';
    /** LAS file version to write. LAS 1.5 writing is intentionally not supported. */
    version?: '1.0' | '1.1' | '1.2' | '1.3' | '1.4';
    /** LAS point data record format to write. */
    pointDataRecordFormat?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    /** Coordinate scale factors used to quantize positions into LAS integer coordinates. */
    scale?: [number, number, number];
    /** Coordinate offsets used to quantize positions into LAS integer coordinates. */
    offset?: [number, number, number];
    /** Color component depth used by source color attributes. */
    colorDepth?: number | string;
    /** Number of points per fixed-size LAZ chunk. */
    chunkSize?: number;
    /** Write a variable-size LAZ chunk table instead of a fixed-size table. */
    variableChunkTable?: boolean;
    /** Typed mesh attributes with one, three, or four components to append as Extra Bytes fields. */
    extraBytes?: LASExtraBytesWriter[];
  };
};

/**
 * Writer for LAS and LAZ point cloud data.
 */
export const LASWriter = {
  ...LASFormat,
  dataType: null as unknown as Mesh | MeshArrowTable,
  batchType: null as never,
  version: VERSION,
  extensions: ['las', 'laz'],
  options: {
    las: {}
  },
  encode: async (data, options) => encodeLASSync(data, options),
  encodeSync: encodeLASSync,
  encodeInBatches: async function* (dataIterator, options) {
    const batches: (Mesh | MeshArrowTable)[] = [];
    for await (const batch of dataIterator as AsyncIterable<Mesh | MeshArrowTable>) {
      batches.push(batch);
    }
    yield encodeLASSync(mergeMeshBatches(batches), options);
  }
} as const satisfies WriterWithEncoder<Mesh | MeshArrowTable, never, LASWriterOptions>;

/** Encode mesh category data as LAS or LAZ bytes. */
function encodeLASSync(data: Mesh | MeshArrowTable, options: LASWriterOptions = {}): ArrayBuffer {
  const format = options.las?.format || 'las';
  const mesh = normalizeMesh(data);
  const positionAttribute = getRequiredAttribute(mesh, 'POSITION');
  validatePositionAttribute(positionAttribute);
  const vertexCount = positionAttribute.value.length / positionAttribute.size;
  const colorAttribute = mesh.attributes.COLOR_0;
  const intensityAttribute = mesh.attributes.intensity;
  const classificationAttribute = mesh.attributes.classification;
  const nirAttribute = mesh.attributes.nir;
  const extraByteFields = getExtraByteFields(mesh, options, vertexCount);
  const gpsTimeAttribute = mesh.attributes.gpsTime;
  const scanAngleAttribute = mesh.attributes.scanAngle;
  const userDataAttribute = mesh.attributes.userData;
  const pointSourceIdAttribute = mesh.attributes.pointSourceId;
  const returnNumberAttribute = mesh.attributes.returnNumber;
  const numberOfReturnsAttribute = mesh.attributes.numberOfReturns;
  const scannerChannelAttribute = mesh.attributes.scannerChannel;
  const scanDirectionFlagAttribute = mesh.attributes.scanDirectionFlag;
  const edgeOfFlightLineAttribute = mesh.attributes.edgeOfFlightLine;
  const syntheticAttribute = mesh.attributes.synthetic;
  const keyPointAttribute = mesh.attributes.keyPoint;
  const withheldAttribute = mesh.attributes.withheld;
  const overlapAttribute = mesh.attributes.overlap;
  const boundingBox = getBoundingBox(positionAttribute, vertexCount);
  const scale = getScale(mesh, options);
  const offset = getOffset(mesh, options, boundingBox);
  const pointDataRecordFormat =
    options.las?.pointDataRecordFormat ?? getDefaultPointDataRecordFormat(options, colorAttribute);
  const basePointDataRecordLength = POINT_RECORD_LENGTHS[pointDataRecordFormat];
  if (!basePointDataRecordLength) {
    throw new Error(`LASWriter: unsupported point data record format ${pointDataRecordFormat}`);
  }
  const pointDataRecordLength =
    basePointDataRecordLength +
    extraByteFields.reduce((byteLength, field) => byteLength + field.byteLength, 0);
  if (pointDataRecordLength > 0xffff) {
    throw new Error(
      `LASWriter: point data record length ${pointDataRecordLength} exceeds the LAS limit`
    );
  }
  const version = options.las?.version || (pointDataRecordFormat >= 6 ? '1.4' : '1.2');
  const headerLength = version === '1.4' ? LAS_1_4_HEADER_LENGTH : LAS_HEADER_LENGTH;
  if (format === 'laz') {
    validateLAZOptions(version, pointDataRecordFormat, options.las?.chunkSize);
  }

  const rawPointData = new Uint8Array(vertexCount * pointDataRecordLength);
  const pointDataView = new DataView(rawPointData.buffer);

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const pointOffset = vertexIndex * pointDataRecordLength;
    pointDataView.setInt32(
      pointOffset,
      Math.round((getComponent(positionAttribute, vertexIndex, 0) - offset[0]) / scale[0]),
      true
    );
    pointDataView.setInt32(
      pointOffset + 4,
      Math.round((getComponent(positionAttribute, vertexIndex, 1) - offset[1]) / scale[1]),
      true
    );
    pointDataView.setInt32(
      pointOffset + 8,
      Math.round((getComponent(positionAttribute, vertexIndex, 2) - offset[2]) / scale[2]),
      true
    );
    writePointRecord(
      pointDataView,
      pointOffset,
      vertexIndex,
      pointDataRecordFormat,
      basePointDataRecordLength,
      {
        intensityAttribute,
        classificationAttribute,
        nirAttribute,
        colorAttribute,
        gpsTimeAttribute,
        scanAngleAttribute,
        userDataAttribute,
        pointSourceIdAttribute,
        returnNumberAttribute,
        numberOfReturnsAttribute,
        scannerChannelAttribute,
        scanDirectionFlagAttribute,
        edgeOfFlightLineAttribute,
        syntheticAttribute,
        keyPointAttribute,
        withheldAttribute,
        overlapAttribute,
        extraByteFields
      }
    );
  }

  const writeParameters: LASWriteParameters = {
    vertexCount,
    boundingBox,
    scale,
    offset,
    version,
    headerLength,
    pointDataRecordFormat,
    pointDataRecordLength
  };
  if (format === 'laz') {
    return encodeLAZFile(
      rawPointData,
      writeParameters,
      options.las?.chunkSize,
      options.las?.variableChunkTable,
      extraByteFields
    );
  }

  const extraBytesVLR = encodeExtraBytesVLR(extraByteFields);
  const pointDataOffset = headerLength + extraBytesVLR.byteLength;
  const arrayBuffer = new ArrayBuffer(pointDataOffset + rawPointData.byteLength);
  writeHeader(new DataView(arrayBuffer), {
    ...writeParameters,
    pointDataOffset,
    vlrCount: extraBytesVLR.byteLength ? 1 : 0
  });
  const bytes = new Uint8Array(arrayBuffer);
  bytes.set(extraBytesVLR, headerLength);
  bytes.set(rawPointData, pointDataOffset);
  return arrayBuffer;
}

/** Values shared by LAS header and point-data encoding. */
type LASWriteParameters = {
  /** Number of point records in the output. */
  vertexCount: number;
  /** World-coordinate bounds. */
  boundingBox: [[number, number, number], [number, number, number]];
  /** Coordinate quantization scales. */
  scale: [number, number, number];
  /** Coordinate quantization offsets. */
  offset: [number, number, number];
  /** LAS file version. */
  version: '1.0' | '1.1' | '1.2' | '1.3' | '1.4';
  /** Public header byte length. */
  headerLength: number;
  /** LAS point data record format. */
  pointDataRecordFormat: number;
  /** Byte length of each raw point record. */
  pointDataRecordLength: number;
};

/** Internal description of one encoded LAS Extra Bytes field. */
type LASExtraByteField = LASExtraBytesWriter & {
  /** Mesh attribute containing the field values. */
  meshAttribute: MeshAttribute;
  /** LAS Extra Bytes data type code. */
  dataType: number;
  /** Number of bytes occupied by one field value. */
  byteLength: number;
  /** Number of components in one field value. */
  componentCount: number;
};

/** Assemble raw LAS point records into a complete fixed-chunk LAZ file. */
function encodeLAZFile(
  rawPointData: Uint8Array,
  parameters: LASWriteParameters,
  requestedChunkSize?: number,
  variableChunkTable = false,
  extraByteFields: LASExtraByteField[] = []
): ArrayBuffer {
  const chunkSize = requestedChunkSize || DEFAULT_LAZ_CHUNK_SIZE;
  const laszipVLR = encodeLASzipVLR({
    pointDataRecordFormat: parameters.pointDataRecordFormat,
    pointDataRecordLength: parameters.pointDataRecordLength,
    chunkSize: variableChunkTable ? VARIABLE_LAZ_CHUNK_SIZE : chunkSize
  });
  const extraBytesVLR = encodeExtraBytesVLR(extraByteFields);
  const pointDataOffset = parameters.headerLength + extraBytesVLR.byteLength + laszipVLR.byteLength;
  const compressedChunks: Uint8Array[] = [];
  const chunkTableEntries: LAZChunkTableEntry[] = [];

  for (let pointOffset = 0; pointOffset < parameters.vertexCount; pointOffset += chunkSize) {
    const pointCount = Math.min(chunkSize, parameters.vertexCount - pointOffset);
    const byteOffset = pointOffset * parameters.pointDataRecordLength;
    const compressed = encodeLAZChunk(
      rawPointData.subarray(byteOffset, byteOffset + pointCount * parameters.pointDataRecordLength),
      {
        pointDataRecordFormat: parameters.pointDataRecordFormat,
        pointDataRecordLength: parameters.pointDataRecordLength,
        pointCount,
        point14ItemVersion: 3,
        rgb14ItemVersion: 3,
        byte14ItemVersion: 3
      }
    );
    compressedChunks.push(compressed);
    chunkTableEntries.push({pointCount, byteLength: compressed.byteLength});
  }

  const compressedPointDataByteLength = compressedChunks.reduce(
    (byteLength, chunk) => byteLength + chunk.byteLength,
    0
  );
  const chunkTablePayload = encodeLAZChunkTable(chunkTableEntries, {
    variable: variableChunkTable
  });
  const chunkTableOffset = pointDataOffset + 8 + compressedPointDataByteLength;
  const arrayBuffer = new ArrayBuffer(chunkTableOffset + 8 + chunkTablePayload.byteLength);
  const bytes = new Uint8Array(arrayBuffer);
  const dataView = new DataView(arrayBuffer);

  writeHeader(dataView, {
    ...parameters,
    pointDataOffset,
    vlrCount: extraBytesVLR.byteLength ? 2 : 1,
    compressed: true
  });
  bytes.set(extraBytesVLR, parameters.headerLength);
  bytes.set(laszipVLR, parameters.headerLength + extraBytesVLR.byteLength);
  writeUint64Fallback(dataView, pointDataOffset, chunkTableOffset);
  let compressedOffset = pointDataOffset + 8;
  for (const chunk of compressedChunks) {
    bytes.set(chunk, compressedOffset);
    compressedOffset += chunk.byteLength;
  }
  dataView.setUint32(chunkTableOffset, 0, true);
  dataView.setUint32(chunkTableOffset + 4, chunkTableEntries.length, true);
  bytes.set(chunkTablePayload, chunkTableOffset + 8);
  return arrayBuffer;
}

/** Build validated Extra Bytes field descriptions from mesh attributes. */
function getExtraByteFields(
  mesh: Mesh,
  options: LASWriterOptions,
  vertexCount: number
): LASExtraByteField[] {
  const extraBytes = options.las?.extraBytes || [];
  const attributes = new Set<string>();
  return extraBytes.map(field => {
    if (attributes.has(field.attribute)) {
      throw new Error(`LASWriter: duplicate Extra Bytes attribute ${field.attribute}`);
    }
    attributes.add(field.attribute);
    const meshAttribute = mesh.attributes[field.attribute];
    if (!meshAttribute) {
      throw new Error(`LASWriter: Extra Bytes attribute ${field.attribute} is missing`);
    }
    if (![1, 3, 4].includes(meshAttribute.size)) {
      throw new Error(
        `LASWriter: Extra Bytes attribute ${field.attribute} must have size 1, 3, or 4`
      );
    }
    if (meshAttribute.value.length < vertexCount * meshAttribute.size) {
      throw new Error(`LASWriter: Extra Bytes attribute ${field.attribute} is too short`);
    }
    const dataType = getExtraBytesDataType(meshAttribute.value, meshAttribute.size);
    return {
      ...field,
      meshAttribute,
      dataType,
      byteLength: getExtraBytesDataTypeByteLength(dataType, meshAttribute.size),
      componentCount: meshAttribute.size
    };
  });
}

/** Return the LAS Extra Bytes data type code for a typed array and component count. */
function getExtraBytesDataType(values: MeshAttribute['value'], componentCount: number): number {
  let scalarDataType = 0;
  if (values instanceof Uint8Array) scalarDataType = 1;
  else if (values instanceof Int8Array) scalarDataType = 2;
  else if (values instanceof Uint16Array) scalarDataType = 3;
  else if (values instanceof Int16Array) scalarDataType = 4;
  else if (values instanceof Uint32Array) scalarDataType = 5;
  else if (values instanceof Int32Array) scalarDataType = 6;
  else if (values instanceof BigUint64Array) scalarDataType = 7;
  else if (values instanceof BigInt64Array) scalarDataType = 8;
  else if (values instanceof Float32Array) scalarDataType = 9;
  else if (values instanceof Float64Array) scalarDataType = 10;
  if (scalarDataType) {
    return scalarDataType + (componentCount === 3 ? 10 : componentCount === 4 ? 20 : 0);
  }
  throw new Error('LASWriter: Extra Bytes attributes require a supported typed array');
}

/** Return the byte width for a LAS Extra Bytes data type. */
function getExtraBytesDataTypeByteLength(dataType: number, componentCount: number): number {
  const scalarDataType = dataType > 20 ? dataType - 20 : dataType > 10 ? dataType - 10 : dataType;
  const scalarByteLength =
    scalarDataType <= 2
      ? 1
      : scalarDataType <= 4
        ? 2
        : scalarDataType <= 6 || scalarDataType === 9
          ? 4
          : 8;
  return scalarByteLength * componentCount;
}

/** Encode the LAS Extra Bytes VLR, or an empty buffer when no fields are configured. */
function encodeExtraBytesVLR(fields: readonly LASExtraByteField[]): Uint8Array {
  if (fields.length === 0) {
    return new Uint8Array(0);
  }
  const payload = new Uint8Array(fields.length * EXTRA_BYTES_DESCRIPTOR_LENGTH);
  const dataView = new DataView(payload.buffer);
  let byteOffset = 0;
  for (const field of fields) {
    dataView.setUint8(byteOffset + 2, field.dataType);
    writeString(dataView, byteOffset + 4, field.name || field.attribute, 32);
    writeString(dataView, byteOffset + 160, field.description || '', 32);
    byteOffset += EXTRA_BYTES_DESCRIPTOR_LENGTH;
  }
  const bytes = new Uint8Array(VLR_HEADER_LENGTH + payload.byteLength);
  const headerView = new DataView(bytes.buffer);
  writeString(headerView, 2, 'LASF_Spec', 16);
  headerView.setUint16(18, 4, true);
  headerView.setUint16(20, payload.byteLength, true);
  writeString(headerView, 22, 'Extra Bytes', 32);
  bytes.set(payload, VLR_HEADER_LENGTH);
  return bytes;
}

/** Validate the intentionally narrow LAZ container writer surface. */
function validateLAZOptions(
  version: string,
  pointDataRecordFormat: number,
  chunkSize?: number
): void {
  if (version !== '1.4') {
    throw new Error(`LASWriter: LAZ output requires LAS 1.4; received ${version}`);
  }
  if (![6, 7, 8].includes(pointDataRecordFormat)) {
    throw new Error(
      `LASWriter: LAZ output only supports point data record formats 6-8; received ${pointDataRecordFormat}`
    );
  }
  if (
    chunkSize !== undefined &&
    (!Number.isInteger(chunkSize) || chunkSize <= 0 || chunkSize > 0xffffffff)
  ) {
    throw new Error(`LASWriter: invalid LAZ chunk size ${chunkSize}`);
  }
}

/** Return mesh data as a Mesh, converting MeshArrowTable input first. */
function normalizeMesh(data: Mesh | MeshArrowTable): Mesh {
  if ('shape' in data && data.shape === 'arrow-table') {
    return convertTableToMesh(data);
  }
  return data as Mesh;
}

/** Return mesh data as a MeshArrowTable, converting plain Mesh data first. */
function normalizeMeshArrowTable(data: Mesh | MeshArrowTable): MeshArrowTable {
  return 'shape' in data && data.shape === 'arrow-table'
    ? data
    : convertMeshToTable(data as Mesh, 'arrow-table');
}

/** Merge buffered mesh batches for `encodeInBatches`. */
function mergeMeshBatches(batches: (Mesh | MeshArrowTable)[]): Mesh | MeshArrowTable {
  if (batches.length === 0) {
    throw new Error('LASWriter: at least one input batch is required');
  }
  if (batches.length === 1) {
    return batches[0];
  }

  const meshes = batches.map(batch => convertTableToMesh(normalizeMeshArrowTable(batch)));
  const firstMesh = meshes[0];
  const mergedAttributes: Mesh['attributes'] = {};

  for (const attributeName of Object.keys(firstMesh.attributes)) {
    const firstAttribute = firstMesh.attributes[attributeName];
    const values = meshes.map(mesh => mesh.attributes[attributeName]?.value);
    if (values.some(value => !value)) {
      continue;
    }
    const totalLength = values.reduce((length, value) => length + value!.length, 0);
    const Constructor = firstAttribute.value.constructor as new (
      length: number
    ) => typeof firstAttribute.value;
    const mergedValue = new Constructor(totalLength);
    let offset = 0;
    for (const value of values) {
      mergedValue.set(value!, offset);
      offset += value!.length;
    }
    mergedAttributes[attributeName] = {...firstAttribute, value: mergedValue};
  }

  return {
    ...firstMesh,
    attributes: mergedAttributes,
    header: {
      ...firstMesh.header,
      vertexCount:
        getRequiredAttribute({...firstMesh, attributes: mergedAttributes}, 'POSITION').value
          .length / 3
    }
  };
}

/** Return a required mesh attribute or throw a format-specific error. */
function getRequiredAttribute(mesh: Mesh, attributeName: string): MeshAttribute {
  const attribute = mesh.attributes[attributeName];
  if (!attribute) {
    throw new Error(`LASWriter: ${attributeName} attribute is required`);
  }
  return attribute;
}

/** Validate the required LAS position attribute shape. */
function validatePositionAttribute(attribute: MeshAttribute): void {
  if (attribute.size !== 3) {
    throw new Error(`LASWriter: POSITION attribute must have size 3`);
  }
  if (attribute.value.length % attribute.size !== 0) {
    throw new Error(`LASWriter: POSITION attribute length must be divisible by its size`);
  }
}

/** Write the LAS 1.2 public header block. */
function writeHeader(
  dataView: DataView,
  parameters: LASWriteParameters & {
    /** Absolute point-data byte offset. */
    pointDataOffset: number;
    /** Number of VLR records before point data. */
    vlrCount?: number;
    /** Whether the point format byte carries the LASzip compression flag. */
    compressed?: boolean;
  }
): void {
  const [versionMajor, versionMinor] = parameters.version.split('.').map(Number);
  writeString(dataView, 0, 'LASF', 4);
  dataView.setUint8(24, versionMajor);
  dataView.setUint8(25, versionMinor);
  writeString(dataView, 26, 'loaders.gl', 32);
  writeString(dataView, 58, 'loaders.gl', 32);
  dataView.setUint16(94, parameters.headerLength, true);
  dataView.setUint32(96, parameters.pointDataOffset, true);
  dataView.setUint32(100, parameters.vlrCount || 0, true);
  dataView.setUint8(104, parameters.pointDataRecordFormat | (parameters.compressed ? 0x80 : 0));
  dataView.setUint16(105, parameters.pointDataRecordLength, true);
  dataView.setUint32(107, parameters.version === '1.4' ? 0 : parameters.vertexCount, true);
  dataView.setUint32(111, parameters.version === '1.4' ? 0 : parameters.vertexCount, true);

  dataView.setFloat64(131, parameters.scale[0], true);
  dataView.setFloat64(139, parameters.scale[1], true);
  dataView.setFloat64(147, parameters.scale[2], true);
  dataView.setFloat64(155, parameters.offset[0], true);
  dataView.setFloat64(163, parameters.offset[1], true);
  dataView.setFloat64(171, parameters.offset[2], true);
  dataView.setFloat64(179, parameters.boundingBox[1][0], true);
  dataView.setFloat64(187, parameters.boundingBox[0][0], true);
  dataView.setFloat64(195, parameters.boundingBox[1][1], true);
  dataView.setFloat64(203, parameters.boundingBox[0][1], true);
  dataView.setFloat64(211, parameters.boundingBox[1][2], true);
  dataView.setFloat64(219, parameters.boundingBox[0][2], true);

  if (parameters.version === '1.4') {
    writeUint64Fallback(dataView, 247, parameters.vertexCount);
    writeUint64Fallback(dataView, 255, parameters.vertexCount);
  }
}

/** Write one LAS point record. */
function writePointRecord(
  dataView: DataView,
  pointOffset: number,
  vertexIndex: number,
  pointDataRecordFormat: number,
  basePointDataRecordLength: number,
  attributes: {
    intensityAttribute?: MeshAttribute;
    classificationAttribute?: MeshAttribute;
    nirAttribute?: MeshAttribute;
    colorAttribute?: MeshAttribute;
    gpsTimeAttribute?: MeshAttribute;
    scanAngleAttribute?: MeshAttribute;
    userDataAttribute?: MeshAttribute;
    pointSourceIdAttribute?: MeshAttribute;
    returnNumberAttribute?: MeshAttribute;
    numberOfReturnsAttribute?: MeshAttribute;
    scannerChannelAttribute?: MeshAttribute;
    scanDirectionFlagAttribute?: MeshAttribute;
    edgeOfFlightLineAttribute?: MeshAttribute;
    syntheticAttribute?: MeshAttribute;
    keyPointAttribute?: MeshAttribute;
    withheldAttribute?: MeshAttribute;
    overlapAttribute?: MeshAttribute;
    extraByteFields: readonly LASExtraByteField[];
  }
): void {
  dataView.setUint16(
    pointOffset + 12,
    getUInt16Attribute(attributes.intensityAttribute, vertexIndex),
    true
  );

  if (pointDataRecordFormat <= 5) {
    dataView.setUint8(pointOffset + 14, 0);
    dataView.setUint8(
      pointOffset + 15,
      getUInt8Attribute(attributes.classificationAttribute, vertexIndex) & 0x1f
    );
    dataView.setInt8(pointOffset + 16, 0);
    dataView.setUint8(
      pointOffset + 17,
      getUInt8Attribute(attributes.userDataAttribute, vertexIndex)
    );
    dataView.setUint16(pointOffset + 18, 0, true);
    if (pointDataRecordFormat === 1 || pointDataRecordFormat === 3 || pointDataRecordFormat >= 4) {
      dataView.setFloat64(pointOffset + 20, 0, true);
    }
  } else {
    const returnNumber = getUInt8Attribute(attributes.returnNumberAttribute, vertexIndex) & 0x0f;
    const numberOfReturns =
      getUInt8Attribute(attributes.numberOfReturnsAttribute, vertexIndex) & 0x0f;
    const scannerChannel = getUInt8Attribute(attributes.scannerChannelAttribute, vertexIndex) & 3;
    const returnFlags =
      returnNumber |
      (numberOfReturns << 4) |
      (getBooleanAttribute(attributes.syntheticAttribute, vertexIndex) ? 1 << 0 : 0) |
      (getBooleanAttribute(attributes.keyPointAttribute, vertexIndex) ? 1 << 1 : 0) |
      (getBooleanAttribute(attributes.withheldAttribute, vertexIndex) ? 1 << 2 : 0) |
      (getBooleanAttribute(attributes.overlapAttribute, vertexIndex) ? 1 << 3 : 0);
    const classificationFlags =
      (scannerChannel << 4) |
      (getBooleanAttribute(attributes.scanDirectionFlagAttribute, vertexIndex) ? 1 << 6 : 0) |
      (getBooleanAttribute(attributes.edgeOfFlightLineAttribute, vertexIndex) ? 1 << 7 : 0);
    dataView.setUint8(pointOffset + 14, returnFlags);
    dataView.setUint8(pointOffset + 15, classificationFlags);
    dataView.setUint8(
      pointOffset + 16,
      getUInt8Attribute(attributes.classificationAttribute, vertexIndex)
    );
    dataView.setUint8(
      pointOffset + 17,
      getUInt8Attribute(attributes.userDataAttribute, vertexIndex)
    );
    dataView.setInt16(
      pointOffset + 18,
      getInt16Attribute(attributes.scanAngleAttribute, vertexIndex),
      true
    );
    dataView.setUint16(
      pointOffset + 20,
      getUInt16Attribute(attributes.pointSourceIdAttribute, vertexIndex),
      true
    );
    dataView.setFloat64(
      pointOffset + 22,
      getAttributeValue(attributes.gpsTimeAttribute, vertexIndex),
      true
    );
  }

  writePointColor(
    dataView,
    pointOffset,
    vertexIndex,
    pointDataRecordFormat,
    attributes.colorAttribute
  );
  if (pointDataRecordFormat === 8) {
    dataView.setUint16(
      pointOffset + 36,
      getUInt16Attribute(attributes.nirAttribute, vertexIndex),
      true
    );
  }
  writeExtraBytes(
    dataView,
    pointOffset,
    vertexIndex,
    basePointDataRecordLength,
    attributes.extraByteFields
  );
}

/** Write configured Extra Bytes values into one raw LAS point record. */
function writeExtraBytes(
  dataView: DataView,
  pointOffset: number,
  vertexIndex: number,
  basePointDataRecordLength: number,
  fields: readonly LASExtraByteField[]
): void {
  let byteOffset = pointOffset;
  for (const field of fields) {
    byteOffset += basePointDataRecordLength;
    for (let componentIndex = 0; componentIndex < field.componentCount; componentIndex++) {
      writeExtraBytesValue(dataView, byteOffset, vertexIndex, componentIndex, field);
      byteOffset += field.byteLength / field.componentCount;
    }
  }
}

/** Write one typed Extra Bytes component using its LAS data type code. */
function writeExtraBytesValue(
  dataView: DataView,
  byteOffset: number,
  vertexIndex: number,
  componentIndex: number,
  field: LASExtraByteField
): void {
  const value = field.meshAttribute.value[vertexIndex * field.componentCount + componentIndex];
  const scalarDataType =
    field.dataType > 20
      ? field.dataType - 20
      : field.dataType > 10
        ? field.dataType - 10
        : field.dataType;
  switch (scalarDataType) {
    case 1:
      dataView.setUint8(byteOffset, Number(value));
      break;
    case 2:
      dataView.setInt8(byteOffset, Number(value));
      break;
    case 3:
      dataView.setUint16(byteOffset, Number(value), true);
      break;
    case 4:
      dataView.setInt16(byteOffset, Number(value), true);
      break;
    case 5:
      dataView.setUint32(byteOffset, Number(value), true);
      break;
    case 6:
      dataView.setInt32(byteOffset, Number(value), true);
      break;
    case 7:
      dataView.setBigUint64(byteOffset, BigInt(value), true);
      break;
    case 8:
      dataView.setBigInt64(byteOffset, BigInt(value), true);
      break;
    case 9:
      dataView.setFloat32(byteOffset, Number(value), true);
      break;
    case 10:
      dataView.setFloat64(byteOffset, Number(value), true);
      break;
    default:
      throw new Error(`LASWriter: unsupported Extra Bytes data type ${field.dataType}`);
  }
}

/** Write RGB values for point formats that include color. */
function writePointColor(
  dataView: DataView,
  pointOffset: number,
  vertexIndex: number,
  pointDataRecordFormat: number,
  colorAttribute?: MeshAttribute
): void {
  const colorOffset = getColorOffset(pointDataRecordFormat);
  if (colorOffset < 0 || !colorAttribute) {
    return;
  }
  dataView.setUint16(pointOffset + colorOffset, getLASColor(colorAttribute, vertexIndex, 0), true);
  dataView.setUint16(
    pointOffset + colorOffset + 2,
    getLASColor(colorAttribute, vertexIndex, 1),
    true
  );
  dataView.setUint16(
    pointOffset + colorOffset + 4,
    getLASColor(colorAttribute, vertexIndex, 2),
    true
  );
}

function getColorOffset(pointDataRecordFormat: number): number {
  switch (pointDataRecordFormat) {
    case 2:
      return 20;
    case 3:
      return 28;
    case 5:
      return 57;
    case 7:
    case 8:
      return 30;
    default:
      return -1;
  }
}

function getDefaultPointDataRecordFormat(
  options: LASWriterOptions,
  colorAttribute?: MeshAttribute
): number {
  if (options.las?.format === 'laz' || options.las?.version === '1.4') {
    return colorAttribute ? 7 : 6;
  }
  return colorAttribute ? 2 : 0;
}

function writeUint64Fallback(dataView: DataView, byteOffset: number, value: number): void {
  dataView.setUint32(byteOffset, value >>> 0, true);
  dataView.setUint32(byteOffset + 4, Math.floor(value / 2 ** 32), true);
}

/** Write a fixed-length ASCII string into a DataView. */
function writeString(
  dataView: DataView,
  byteOffset: number,
  text: string,
  byteLength: number
): void {
  for (let characterIndex = 0; characterIndex < byteLength; characterIndex++) {
    dataView.setUint8(byteOffset + characterIndex, text.charCodeAt(characterIndex) || 0);
  }
}

/** Return a single attribute component with 0 as the missing component fallback. */
function getComponent(
  attribute: MeshAttribute,
  vertexIndex: number,
  componentIndex: number
): number {
  return attribute.value[vertexIndex * attribute.size + componentIndex] || 0;
}

/** Return a LAS UInt16 attribute value. */
function getUInt16Attribute(attribute: MeshAttribute | undefined, vertexIndex: number): number {
  return attribute
    ? Math.max(0, Math.min(65535, Math.round(getComponent(attribute, vertexIndex, 0))))
    : 0;
}

/** Return a LAS UInt8 attribute value. */
function getUInt8Attribute(attribute: MeshAttribute | undefined, vertexIndex: number): number {
  return attribute
    ? Math.max(0, Math.min(255, Math.round(getComponent(attribute, vertexIndex, 0))))
    : 0;
}

/** Return a LAS signed 16-bit attribute value. */
function getInt16Attribute(attribute: MeshAttribute | undefined, vertexIndex: number): number {
  return attribute
    ? Math.max(-32768, Math.min(32767, Math.round(getComponent(attribute, vertexIndex, 0))))
    : 0;
}

/** Return a numeric point attribute value, using zero when it is absent. */
function getAttributeValue(attribute: MeshAttribute | undefined, vertexIndex: number): number {
  return attribute ? getComponent(attribute, vertexIndex, 0) : 0;
}

/** Return a point flag attribute as a boolean. */
function getBooleanAttribute(attribute: MeshAttribute | undefined, vertexIndex: number): boolean {
  return Boolean(getAttributeValue(attribute, vertexIndex));
}

/** Return one color component as a LAS UInt16 color value. */
function getLASColor(
  attribute: MeshAttribute,
  vertexIndex: number,
  componentIndex: number
): number {
  const value = getComponent(attribute, vertexIndex, componentIndex);
  if (attribute.normalized) {
    return scaleNormalizedColor(attribute, value);
  }

  if (value <= 1) {
    return clampUInt16(value * 65535);
  }

  if (value <= 255) {
    return clampUInt16(value * 257);
  }

  return clampUInt16(value);
}

/** Return a normalized color component scaled to the LAS UInt16 color range. */
function scaleNormalizedColor(attribute: MeshAttribute, value: number): number {
  const componentMaximum = getComponentMaximum(attribute.value);
  return clampUInt16((value / componentMaximum) * 65535);
}

/** Return the component maximum used by the color attribute's typed array. */
function getComponentMaximum(values: MeshAttribute['value']): number {
  if (values instanceof Uint8Array || values instanceof Uint8ClampedArray) {
    return 255;
  }
  if (values instanceof Uint16Array) {
    return 65535;
  }
  return 1;
}

/** Clamp a number to the LAS UInt16 range. */
function clampUInt16(value: number): number {
  return Math.max(0, Math.min(65535, Math.round(value)));
}

/** Compute a bounding box from position data. */
function getBoundingBox(
  positionAttribute: MeshAttribute,
  vertexCount: number
): [[number, number, number], [number, number, number]] {
  const minimum: [number, number, number] = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY
  ];
  const maximum: [number, number, number] = [
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY
  ];

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
      const value = getComponent(positionAttribute, vertexIndex, componentIndex);
      minimum[componentIndex] = Math.min(minimum[componentIndex], value);
      maximum[componentIndex] = Math.max(maximum[componentIndex], value);
    }
  }

  return [minimum, maximum];
}

/** Return LAS coordinate scale factors from options, metadata, or defaults. */
function getScale(mesh: Mesh, options: LASWriterOptions): [number, number, number] {
  return (
    options.las?.scale || getNumericTuple(mesh.schema.metadata?.las_scale) || [0.001, 0.001, 0.001]
  );
}

/** Return LAS coordinate offsets from options, metadata, or the mesh minimum position. */
function getOffset(
  mesh: Mesh,
  options: LASWriterOptions,
  boundingBox: [[number, number, number], [number, number, number]]
): [number, number, number] {
  return options.las?.offset || getNumericTuple(mesh.schema.metadata?.las_offset) || boundingBox[0];
}

/** Parse a three-number metadata tuple encoded as JSON. */
function getNumericTuple(value: unknown): [number, number, number] | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) &&
      parsedValue.length === 3 &&
      parsedValue.every(component => typeof component === 'number')
      ? [parsedValue[0], parsedValue[1], parsedValue[2]]
      : undefined;
  } catch {
    return undefined;
  }
}
