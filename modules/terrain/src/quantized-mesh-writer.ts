// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable, MeshAttribute} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import {VERSION} from './lib/utils/version';

const QUANTIZED_MESH_HEADER_LENGTH = 88;
const QUANTIZED_COORDINATE_RANGE = 32767;
const EMPTY_EDGE_INDICES_LENGTH = Uint32Array.BYTES_PER_ELEMENT * 4;

/** Options for `QuantizedMeshWriter`. */
export type QuantizedMeshWriterOptions = WriterOptions & {
  /** Quantized mesh-specific writer options. */
  'quantized-mesh'?: {
    /** Bounds used to map x/y positions to quantized u/v coordinates. */
    bounds?: [number, number, number, number];
  };
};

/**
 * Writer for the quantized mesh terrain format.
 */
export const QuantizedMeshWriter = {
  name: 'Quantized Mesh',
  id: 'quantized-mesh',
  module: 'terrain',
  version: VERSION,
  extensions: ['terrain'],
  mimeTypes: ['application/vnd.quantized-mesh'],
  dataType: null as unknown as Mesh | MeshArrowTable,
  batchType: null as never,
  options: {
    'quantized-mesh': {}
  },
  encode: async (data, options) => encodeQuantizedMeshSync(data, options),
  encodeSync: encodeQuantizedMeshSync
} as const satisfies WriterWithEncoder<Mesh | MeshArrowTable, never, QuantizedMeshWriterOptions>;

/** Encode mesh category data as quantized mesh terrain bytes. */
function encodeQuantizedMeshSync(
  data: Mesh | MeshArrowTable,
  options: QuantizedMeshWriterOptions = {}
): ArrayBuffer {
  const mesh = convertTableToMesh(normalizeMeshArrowTable(data));
  const positionAttribute = getRequiredAttribute(mesh, 'POSITION');
  const vertexCount = positionAttribute.value.length / positionAttribute.size;
  const boundingBox = getBoundingBox(positionAttribute, vertexCount);
  const bounds = options['quantized-mesh']?.bounds || [
    boundingBox[0][0],
    boundingBox[0][1],
    boundingBox[1][0],
    boundingBox[1][1]
  ];
  const triangleIndices = getTriangleIndices(mesh, vertexCount);
  const highWatermarkMesh = reorderMeshForHighWatermark(triangleIndices, vertexCount);
  const bytesPerIndex =
    vertexCount > 65536 ? Uint32Array.BYTES_PER_ELEMENT : Uint16Array.BYTES_PER_ELEMENT;
  const vertexDataLength =
    Uint32Array.BYTES_PER_ELEMENT + vertexCount * 3 * Uint16Array.BYTES_PER_ELEMENT;
  const triangleDataOffset = getAlignedOffset(
    QUANTIZED_MESH_HEADER_LENGTH + vertexDataLength,
    bytesPerIndex
  );
  const triangleDataLength = Uint32Array.BYTES_PER_ELEMENT + triangleIndices.length * bytesPerIndex;
  const arrayBuffer = new ArrayBuffer(
    triangleDataOffset + triangleDataLength + EMPTY_EDGE_INDICES_LENGTH
  );
  const dataView = new DataView(arrayBuffer);

  writeHeader(dataView, boundingBox);
  dataView.setUint32(QUANTIZED_MESH_HEADER_LENGTH, vertexCount, true);
  writeVertexData(dataView, QUANTIZED_MESH_HEADER_LENGTH + Uint32Array.BYTES_PER_ELEMENT, {
    positionAttribute,
    vertexCount,
    boundingBox,
    bounds,
    sourceVertexIndices: highWatermarkMesh.sourceVertexIndices
  });
  writeTriangleIndices(
    dataView,
    triangleDataOffset,
    highWatermarkMesh.triangleIndices,
    bytesPerIndex
  );
  writeEmptyEdgeIndices(dataView, triangleDataOffset + triangleDataLength);

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
    throw new Error(`QuantizedMeshWriter: ${attributeName} attribute is required`);
  }
  return attribute;
}

/** Write the fixed-length quantized mesh header. */
function writeHeader(
  dataView: DataView,
  boundingBox: [[number, number, number], [number, number, number]]
): void {
  const center = getCenter(boundingBox);
  const radius = getRadius(boundingBox, center);
  let byteOffset = 0;

  for (const value of center) {
    dataView.setFloat64(byteOffset, value, true);
    byteOffset += Float64Array.BYTES_PER_ELEMENT;
  }

  dataView.setFloat32(byteOffset, boundingBox[0][2], true);
  byteOffset += Float32Array.BYTES_PER_ELEMENT;
  dataView.setFloat32(byteOffset, boundingBox[1][2], true);
  byteOffset += Float32Array.BYTES_PER_ELEMENT;

  for (const value of center) {
    dataView.setFloat64(byteOffset, value, true);
    byteOffset += Float64Array.BYTES_PER_ELEMENT;
  }
  dataView.setFloat64(byteOffset, radius, true);
  byteOffset += Float64Array.BYTES_PER_ELEMENT;

  dataView.setFloat64(byteOffset, 0, true);
  dataView.setFloat64(byteOffset + 8, 0, true);
  dataView.setFloat64(byteOffset + 16, 0, true);
}

/** Write delta and zig-zag encoded u, v, and height vertex arrays. */
function writeVertexData(
  dataView: DataView,
  byteOffset: number,
  parameters: {
    positionAttribute: MeshAttribute;
    vertexCount: number;
    boundingBox: [[number, number, number], [number, number, number]];
    bounds: [number, number, number, number];
    sourceVertexIndices: number[];
  }
): void {
  const quantizedCoordinates = getQuantizedCoordinates(parameters);
  const arrayByteLength = parameters.vertexCount * Uint16Array.BYTES_PER_ELEMENT;

  writeDeltaEncodedArray(dataView, byteOffset, quantizedCoordinates.u);
  writeDeltaEncodedArray(dataView, byteOffset + arrayByteLength, quantizedCoordinates.v);
  writeDeltaEncodedArray(dataView, byteOffset + arrayByteLength * 2, quantizedCoordinates.height);
}

/** Return quantized u, v, and height arrays from positions. */
function getQuantizedCoordinates(parameters: {
  positionAttribute: MeshAttribute;
  vertexCount: number;
  boundingBox: [[number, number, number], [number, number, number]];
  bounds: [number, number, number, number];
  sourceVertexIndices: number[];
}): {u: Uint16Array; v: Uint16Array; height: Uint16Array} {
  const [minimumX, minimumY, maximumX, maximumY] = parameters.bounds;
  const heightMinimum = parameters.boundingBox[0][2];
  const heightMaximum = parameters.boundingBox[1][2];
  const u = new Uint16Array(parameters.vertexCount);
  const v = new Uint16Array(parameters.vertexCount);
  const height = new Uint16Array(parameters.vertexCount);

  for (let vertexIndex = 0; vertexIndex < parameters.vertexCount; vertexIndex++) {
    const sourceVertexIndex = parameters.sourceVertexIndices[vertexIndex];
    u[vertexIndex] = quantize(
      getComponent(parameters.positionAttribute, sourceVertexIndex, 0),
      minimumX,
      maximumX
    );
    v[vertexIndex] = quantize(
      getComponent(parameters.positionAttribute, sourceVertexIndex, 1),
      minimumY,
      maximumY
    );
    height[vertexIndex] = quantize(
      getComponent(parameters.positionAttribute, sourceVertexIndex, 2),
      heightMinimum,
      heightMaximum
    );
  }

  return {u, v, height};
}

/** Write a delta and zig-zag encoded Uint16 array. */
function writeDeltaEncodedArray(dataView: DataView, byteOffset: number, values: Uint16Array): void {
  let previousValue = 0;
  for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
    const value = values[valueIndex];
    const delta = value - previousValue;
    dataView.setUint16(
      byteOffset + valueIndex * Uint16Array.BYTES_PER_ELEMENT,
      encodeZigZag(delta),
      true
    );
    previousValue = value;
  }
}

/** Write high-watermark encoded triangle indices. */
function writeTriangleIndices(
  dataView: DataView,
  byteOffset: number,
  triangleIndices: number[],
  bytesPerIndex: number
): void {
  dataView.setUint32(byteOffset, triangleIndices.length / 3, true);
  let highestIndex = 0;
  let indexByteOffset = byteOffset + Uint32Array.BYTES_PER_ELEMENT;

  for (const triangleIndex of triangleIndices) {
    const code = highestIndex - triangleIndex;
    if (code < 0) {
      throw new Error('QuantizedMeshWriter: triangle indices must be high-watermark encodable');
    }

    if (bytesPerIndex === Uint16Array.BYTES_PER_ELEMENT) {
      dataView.setUint16(indexByteOffset, code, true);
    } else {
      dataView.setUint32(indexByteOffset, code, true);
    }

    if (code === 0) {
      highestIndex++;
    }
    indexByteOffset += bytesPerIndex;
  }
}

/** Write empty west, south, east, and north edge-index lists. */
function writeEmptyEdgeIndices(dataView: DataView, byteOffset: number): void {
  dataView.setUint32(byteOffset, 0, true);
  dataView.setUint32(byteOffset + 4, 0, true);
  dataView.setUint32(byteOffset + 8, 0, true);
  dataView.setUint32(byteOffset + 12, 0, true);
}

/** Return triangle indices for indexed or sequential triangle-list meshes. */
function getTriangleIndices(mesh: Mesh, vertexCount: number): number[] {
  if (mesh.indices?.value?.length) {
    return Array.from(mesh.indices.value);
  }

  if (mesh.mode !== 4 && mesh.topology !== 'triangle-list') {
    throw new Error('QuantizedMeshWriter: triangle-list mesh data is required');
  }

  const triangleIndices: number[] = [];
  for (let vertexIndex = 0; vertexIndex + 2 < vertexCount; vertexIndex += 3) {
    triangleIndices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
  }
  return triangleIndices;
}

/** Return vertices and indices reordered into first-reference order for high-watermark encoding. */
function reorderMeshForHighWatermark(
  triangleIndices: number[],
  vertexCount: number
): {triangleIndices: number[]; sourceVertexIndices: number[]} {
  const remappedVertexIndices = new Map<number, number>();
  const sourceVertexIndices: number[] = [];
  const remappedTriangleIndices = triangleIndices.map(triangleIndex => {
    if (!Number.isInteger(triangleIndex) || triangleIndex < 0 || triangleIndex >= vertexCount) {
      throw new Error('QuantizedMeshWriter: triangle index is out of range');
    }

    const existingIndex = remappedVertexIndices.get(triangleIndex);
    if (existingIndex !== undefined) {
      return existingIndex;
    }

    const nextIndex = sourceVertexIndices.length;
    remappedVertexIndices.set(triangleIndex, nextIndex);
    sourceVertexIndices.push(triangleIndex);
    return nextIndex;
  });

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    if (!remappedVertexIndices.has(vertexIndex)) {
      sourceVertexIndices.push(vertexIndex);
    }
  }

  return {triangleIndices: remappedTriangleIndices, sourceVertexIndices};
}

/** Return an aligned byte offset. */
function getAlignedOffset(byteOffset: number, byteAlignment: number): number {
  const remainder = byteOffset % byteAlignment;
  return remainder === 0 ? byteOffset : byteOffset + byteAlignment - remainder;
}

/** Return a single attribute component with 0 as the missing component fallback. */
function getComponent(
  attribute: MeshAttribute,
  vertexIndex: number,
  componentIndex: number
): number {
  return attribute.value[vertexIndex * attribute.size + componentIndex] || 0;
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

/** Return the center of a bounding box. */
function getCenter(
  boundingBox: [[number, number, number], [number, number, number]]
): [number, number, number] {
  return [
    (boundingBox[0][0] + boundingBox[1][0]) / 2,
    (boundingBox[0][1] + boundingBox[1][1]) / 2,
    (boundingBox[0][2] + boundingBox[1][2]) / 2
  ];
}

/** Return a bounding sphere radius that contains the bounding box. */
function getRadius(
  boundingBox: [[number, number, number], [number, number, number]],
  center: [number, number, number]
): number {
  const xDistance = Math.max(
    Math.abs(boundingBox[0][0] - center[0]),
    Math.abs(boundingBox[1][0] - center[0])
  );
  const yDistance = Math.max(
    Math.abs(boundingBox[0][1] - center[1]),
    Math.abs(boundingBox[1][1] - center[1])
  );
  const zDistance = Math.max(
    Math.abs(boundingBox[0][2] - center[2]),
    Math.abs(boundingBox[1][2] - center[2])
  );
  return Math.hypot(xDistance, yDistance, zDistance);
}

/** Quantize a value into the terrain coordinate range. */
function quantize(value: number, minimum: number, maximum: number): number {
  const range = maximum - minimum || 1;
  const quantizedValue = Math.round(((value - minimum) / range) * QUANTIZED_COORDINATE_RANGE);
  return Math.max(0, Math.min(QUANTIZED_COORDINATE_RANGE, quantizedValue));
}

/** Zig-zag encode a signed delta. */
function encodeZigZag(value: number): number {
  return (value << 1) ^ (value >> 31);
}
