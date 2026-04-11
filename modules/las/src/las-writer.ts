// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable, MeshAttribute} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import {LASFormat} from './las-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const LAS_HEADER_LENGTH = 227;
const LAS_POINT_RECORD_LENGTH = 20;
const LAS_COLOR_POINT_RECORD_LENGTH = 26;

/** Options for `LASWriter`. */
export type LASWriterOptions = WriterOptions & {
  /** LAS-specific writer options. */
  las?: {
    /** Coordinate scale factors used to quantize positions into LAS integer coordinates. */
    scale?: [number, number, number];
    /** Coordinate offsets used to quantize positions into LAS integer coordinates. */
    offset?: [number, number, number];
  };
};

/**
 * Writer for uncompressed LAS point cloud data.
 */
export const LASWriter = {
  ...LASFormat,
  dataType: null as unknown as Mesh | MeshArrowTable,
  batchType: null as never,
  version: VERSION,
  extensions: ['las'],
  options: {
    las: {}
  },
  encode: async (data, options) => encodeLASSync(data, options),
  encodeSync: encodeLASSync
} as const satisfies WriterWithEncoder<Mesh | MeshArrowTable, never, LASWriterOptions>;

/** Encode mesh category data as uncompressed LAS bytes. */
function encodeLASSync(data: Mesh | MeshArrowTable, options: LASWriterOptions = {}): ArrayBuffer {
  const mesh = convertTableToMesh(normalizeMeshArrowTable(data));
  const positionAttribute = getRequiredAttribute(mesh, 'POSITION');
  const colorAttribute = mesh.attributes.COLOR_0;
  const intensityAttribute = mesh.attributes.intensity;
  const classificationAttribute = mesh.attributes.classification;
  const vertexCount = positionAttribute.value.length / positionAttribute.size;
  const boundingBox = getBoundingBox(positionAttribute, vertexCount);
  const scale = getScale(mesh, options);
  const offset = getOffset(mesh, options, boundingBox);
  const pointDataRecordFormat = colorAttribute ? 2 : 0;
  const pointDataRecordLength = colorAttribute
    ? LAS_COLOR_POINT_RECORD_LENGTH
    : LAS_POINT_RECORD_LENGTH;
  const arrayBuffer = new ArrayBuffer(LAS_HEADER_LENGTH + vertexCount * pointDataRecordLength);
  const dataView = new DataView(arrayBuffer);

  writeHeader(dataView, {
    vertexCount,
    boundingBox,
    scale,
    offset,
    pointDataRecordFormat,
    pointDataRecordLength
  });

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const pointOffset = LAS_HEADER_LENGTH + vertexIndex * pointDataRecordLength;
    dataView.setInt32(
      pointOffset,
      Math.round((getComponent(positionAttribute, vertexIndex, 0) - offset[0]) / scale[0]),
      true
    );
    dataView.setInt32(
      pointOffset + 4,
      Math.round((getComponent(positionAttribute, vertexIndex, 1) - offset[1]) / scale[1]),
      true
    );
    dataView.setInt32(
      pointOffset + 8,
      Math.round((getComponent(positionAttribute, vertexIndex, 2) - offset[2]) / scale[2]),
      true
    );
    dataView.setUint16(pointOffset + 12, getUInt16Attribute(intensityAttribute, vertexIndex), true);
    dataView.setUint8(pointOffset + 14, 0);
    dataView.setUint8(pointOffset + 15, getUInt8Attribute(classificationAttribute, vertexIndex));
    dataView.setInt8(pointOffset + 16, 0);
    dataView.setUint8(pointOffset + 17, 0);
    dataView.setUint16(pointOffset + 18, 0, true);

    if (colorAttribute) {
      dataView.setUint16(pointOffset + 20, getLASColor(colorAttribute, vertexIndex, 0), true);
      dataView.setUint16(pointOffset + 22, getLASColor(colorAttribute, vertexIndex, 1), true);
      dataView.setUint16(pointOffset + 24, getLASColor(colorAttribute, vertexIndex, 2), true);
    }
  }

  return arrayBuffer;
}

/** Return mesh data as a MeshArrowTable, converting plain Mesh data first. */
function normalizeMeshArrowTable(data: Mesh | MeshArrowTable): MeshArrowTable {
  if ('shape' in data && data.shape === 'arrow-table') {
    return data;
  }
  return convertMeshToTable(data as Mesh, 'arrow-table');
}

/** Return a required mesh attribute or throw a format-specific error. */
function getRequiredAttribute(mesh: Mesh, attributeName: string): MeshAttribute {
  const attribute = mesh.attributes[attributeName];
  if (!attribute) {
    throw new Error(`LASWriter: ${attributeName} attribute is required`);
  }
  return attribute;
}

/** Write the LAS 1.2 public header block. */
function writeHeader(
  dataView: DataView,
  parameters: {
    vertexCount: number;
    boundingBox: [[number, number, number], [number, number, number]];
    scale: [number, number, number];
    offset: [number, number, number];
    pointDataRecordFormat: number;
    pointDataRecordLength: number;
  }
): void {
  writeString(dataView, 0, 'LASF', 4);
  dataView.setUint8(24, 1);
  dataView.setUint8(25, 2);
  writeString(dataView, 26, 'loaders.gl', 32);
  writeString(dataView, 58, 'loaders.gl', 32);
  dataView.setUint16(94, LAS_HEADER_LENGTH, true);
  dataView.setUint32(96, LAS_HEADER_LENGTH, true);
  dataView.setUint8(104, parameters.pointDataRecordFormat);
  dataView.setUint16(105, parameters.pointDataRecordLength, true);
  dataView.setUint32(107, parameters.vertexCount, true);
  dataView.setUint32(111, parameters.vertexCount, true);

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
