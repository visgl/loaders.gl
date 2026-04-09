// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh, MeshAttributes} from '@loaders.gl/schema';
import {BrotliCompression} from '@loaders.gl/compression';
import type {Proj4Projection} from '@math.gl/proj4';

const COORDINATE_SYSTEM_CARTESIAN = 0;
const COORDINATE_SYSTEM_LNGLAT_OFFSETS = 3;

type Potree2NodeMesh = Mesh & {
  /** Point positions are relative to this origin. */
  cartographicOrigin: number[];
  /** deck.gl coordinate system identifier. */
  coordinateSystem: number;
};

export type Potree2Attribute = {
  /** Attribute name in metadata.json. */
  name: string;
  /** Primitive storage type. */
  type: string;
  /** Number of primitive values in the attribute. */
  numElements: number;
  /** Size of one primitive value in bytes. */
  elementSize: number;
  /** Size of the full attribute in bytes. */
  size: number;
  /** Metadata minimum. */
  min?: number[];
  /** Metadata maximum. */
  max?: number[];
};

export type Potree2Metadata = {
  /** PotreeConverter format version. */
  version: string;
  /** Dataset name. */
  name?: string;
  /** Total point count. */
  points: number;
  /** Attribute list. */
  attributes: Potree2Attribute[];
  /** Node hierarchy metadata. */
  hierarchy: {
    firstChunkSize: number;
    stepSize?: number;
    depth?: number;
  };
  /** Root bounding box. */
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  /** Tight point bounding box. */
  tightBoundingBox?: {
    min: [number, number, number];
    max: [number, number, number];
  };
  /** Coordinate scale. */
  scale: number | [number, number, number];
  /** Coordinate offset. */
  offset: [number, number, number];
  /** Root spacing. */
  spacing: number;
  /** Proj4 projection string. */
  projection?: string;
  /** Node payload encoding. */
  encoding?: 'DEFAULT' | 'BROTLI' | string;
};

export type Potree2Node = {
  /** Node name with leading r, for example r012. */
  name: string;
  /** Node type: 0 normal, 2 hierarchy proxy. */
  nodeType: number;
  /** Octree level. */
  level: number;
  /** Number of points in this node. */
  numPoints: number;
  /** Byte offset into octree.bin. */
  byteOffset: number;
  /** Byte length in octree.bin. */
  byteSize: number;
  /** Byte offset into hierarchy.bin for proxy nodes. */
  hierarchyByteOffset: number;
  /** Byte length in hierarchy.bin for proxy nodes. */
  hierarchyByteSize: number;
  /** Bounding box in metadata-relative coordinates. */
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  /** Child nodes indexed 0..7. */
  children: (Potree2Node | null)[];
  /** Parent node. */
  parent: Potree2Node | null;
};

/**
 * Returns true if the metadata object matches the PotreeConverter 2.x layout.
 */
export function isPotree2Metadata(metadata: unknown): metadata is Potree2Metadata {
  const potreeMetadata = metadata as Potree2Metadata;
  return Boolean(
    potreeMetadata &&
      Array.isArray(potreeMetadata.attributes) &&
      potreeMetadata.hierarchy?.firstChunkSize !== undefined &&
      potreeMetadata.boundingBox?.min &&
      potreeMetadata.boundingBox?.max
  );
}

/**
 * Creates the root proxy node for a Potree 2.x point cloud.
 */
export function createPotree2Root(metadata: Potree2Metadata): Potree2Node {
  return {
    name: 'r',
    nodeType: 2,
    level: 0,
    numPoints: 0,
    byteOffset: 0,
    byteSize: 0,
    hierarchyByteOffset: 0,
    hierarchyByteSize: metadata.hierarchy.firstChunkSize,
    boundingBox: {
      min: [0, 0, 0],
      max: [
        metadata.boundingBox.max[0] - metadata.boundingBox.min[0],
        metadata.boundingBox.max[1] - metadata.boundingBox.min[1],
        metadata.boundingBox.max[2] - metadata.boundingBox.min[2]
      ]
    },
    children: new Array(8).fill(null),
    parent: null
  };
}

/**
 * Parses one Potree 2.x hierarchy chunk and attaches nodes below the supplied proxy.
 */
export function parsePotree2HierarchyChunk(
  proxyNode: Potree2Node,
  arrayBuffer: ArrayBuffer,
  nodesByName: Map<string, Potree2Node>
): void {
  const view = new DataView(arrayBuffer);
  const bytesPerNode = 22;
  const nodes: Potree2Node[] = new Array(arrayBuffer.byteLength / bytesPerNode);
  nodes[0] = proxyNode;
  let nextNodeIndex = 1;

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
    const currentNode = nodes[nodeIndex];
    if (!currentNode) {
      throw new Error('Invalid Potree hierarchy chunk');
    }

    const rowOffset = nodeIndex * bytesPerNode;
    const nodeType = view.getUint8(rowOffset + 0);
    const childMask = view.getUint8(rowOffset + 1);
    const numPoints = view.getUint32(rowOffset + 2, true);
    const byteOffset = getSafeBigInt64(view, rowOffset + 6);
    const byteSize = getSafeBigInt64(view, rowOffset + 14);

    currentNode.nodeType = nodeType;
    currentNode.numPoints = byteSize === 0 ? 0 : numPoints;

    if (nodeType === 2) {
      currentNode.hierarchyByteOffset = byteOffset;
      currentNode.hierarchyByteSize = byteSize;
    } else {
      currentNode.byteOffset = byteOffset;
      currentNode.byteSize = byteSize;
    }

    if (currentNode.nodeType === 2) {
      continue;
    }

    for (let childIndex = 0; childIndex < 8; childIndex++) {
      if ((childMask & (1 << childIndex)) === 0) {
        continue;
      }

      const child = createPotree2ChildNode(currentNode, childIndex);
      currentNode.children[childIndex] = child;
      nodes[nextNodeIndex++] = child;
      nodesByName.set(child.name, child);
    }
  }
}

/**
 * Decodes one octree.bin node payload into a loaders.gl point-list mesh.
 */
export async function parsePotree2NodeContent(
  arrayBuffer: ArrayBuffer,
  node: Potree2Node,
  metadata: Potree2Metadata,
  projection: Proj4Projection | null
): Promise<Potree2NodeMesh> {
  const encoding = metadata.encoding || 'DEFAULT';
  if (encoding === 'BROTLI') {
    arrayBuffer = await new BrotliCompression({brotli: {useZlib: true}}).decompress(arrayBuffer);
  } else if (encoding !== 'DEFAULT') {
    throw new Error(`Unsupported Potree encoding: ${encoding}`);
  }

  const attributes =
    encoding === 'BROTLI'
      ? parseBrotliNodeAttributes(arrayBuffer, node, metadata, projection)
      : parseDefaultNodeAttributes(arrayBuffer, node, metadata, projection);

  const boundingBox = getNodeGlobalBoundingBox(node, metadata);
  const cartographicOrigin = getNodeCartographicOrigin(node, metadata, projection);

  const mesh: Potree2NodeMesh = {
    loader: 'potree',
    loaderData: {
      vertexCount: node.numPoints,
      attributes: metadata.attributes,
      encoding
    },
    schema: {fields: [], metadata: {}},
    header: {
      vertexCount: node.numPoints,
      boundingBox
    },
    attributes,
    topology: 'point-list',
    mode: 0,
    cartographicOrigin,
    coordinateSystem: projection ? COORDINATE_SYSTEM_LNGLAT_OFFSETS : COORDINATE_SYSTEM_CARTESIAN
  };

  return mesh;
}

/** Creates one child node and its octree bounding box. */
function createPotree2ChildNode(parent: Potree2Node, childIndex: number): Potree2Node {
  return {
    name: `${parent.name}${childIndex}`,
    nodeType: 0,
    level: parent.level + 1,
    numPoints: 0,
    byteOffset: 0,
    byteSize: 0,
    hierarchyByteOffset: 0,
    hierarchyByteSize: 0,
    boundingBox: getChildBoundingBox(parent.boundingBox, childIndex),
    children: new Array(8).fill(null),
    parent
  };
}

/** Parses interleaved `DEFAULT`-encoded point attributes. */
function parseDefaultNodeAttributes(
  arrayBuffer: ArrayBuffer,
  node: Potree2Node,
  metadata: Potree2Metadata,
  projection: Proj4Projection | null
): MeshAttributes {
  const view = new DataView(arrayBuffer);
  const attributes: MeshAttributes = {};
  const bytesPerPoint = getBytesPerPoint(metadata.attributes);
  let attributeOffset = 0;

  for (const attribute of metadata.attributes) {
    if (isPositionAttribute(attribute)) {
      addPositionsAttribute(
        attributes,
        decodeDefaultPositions(view, node, metadata, projection, attributeOffset, bytesPerPoint)
      );
    } else if (isColorAttribute(attribute)) {
      addColorsAttribute(
        attributes,
        decodeDefaultColors(view, node.numPoints, attribute, attributeOffset, bytesPerPoint)
      );
    } else {
      attributes[attribute.name] = {
        value: decodeDefaultScalarAttribute(
          view,
          node.numPoints,
          attribute,
          attributeOffset,
          bytesPerPoint
        ),
        size: attribute.numElements
      };
    }

    attributeOffset += attribute.size;
  }

  return attributes;
}

/** Parses Brotli-decompressed, attribute-major Potree point attributes. */
function parseBrotliNodeAttributes(
  arrayBuffer: ArrayBuffer,
  node: Potree2Node,
  metadata: Potree2Metadata,
  projection: Proj4Projection | null
): MeshAttributes {
  const view = new DataView(arrayBuffer);
  const attributes: MeshAttributes = {};
  let byteOffset = 0;

  for (const attribute of metadata.attributes) {
    if (isPositionAttribute(attribute)) {
      const result = decodeBrotliPositions(view, node, metadata, projection, byteOffset);
      addPositionsAttribute(attributes, result.value);
      byteOffset = result.byteOffset;
    } else if (isColorAttribute(attribute)) {
      const result = decodeBrotliColors(view, node.numPoints, byteOffset);
      addColorsAttribute(attributes, result.value);
      byteOffset = result.byteOffset;
    } else {
      const result = decodeBrotliScalarAttribute(view, node.numPoints, attribute, byteOffset);
      attributes[attribute.name] = {value: result.value, size: attribute.numElements};
      byteOffset = result.byteOffset;
    }
  }

  return attributes;
}

/** Decodes `DEFAULT`-encoded int32 positions into mesh-local float positions. */
function decodeDefaultPositions(
  view: DataView,
  node: Potree2Node,
  metadata: Potree2Metadata,
  projection: Proj4Projection | null,
  attributeOffset: number,
  bytesPerPoint: number
): Float32Array {
  const positions = new Float32Array(node.numPoints * 3);
  const scale = getScale(metadata);
  const nodeGlobalMin = getNodeGlobalMin(node, metadata);
  const cartographicOrigin = getNodeCartographicOrigin(node, metadata, projection);

  for (let pointIndex = 0; pointIndex < node.numPoints; pointIndex++) {
    const pointOffset = pointIndex * bytesPerPoint + attributeOffset;
    const position = [
      view.getInt32(pointOffset + 0, true) * scale[0] + metadata.offset[0],
      view.getInt32(pointOffset + 4, true) * scale[1] + metadata.offset[1],
      view.getInt32(pointOffset + 8, true) * scale[2] + metadata.offset[2]
    ];
    writePosition(positions, pointIndex, position, nodeGlobalMin, cartographicOrigin, projection);
  }

  return positions;
}

/** Decodes Brotli-mode Morton-coded positions into mesh-local float positions. */
function decodeBrotliPositions(
  view: DataView,
  node: Potree2Node,
  metadata: Potree2Metadata,
  projection: Proj4Projection | null,
  byteOffset: number
): {value: Float32Array; byteOffset: number} {
  const positions = new Float32Array(node.numPoints * 3);
  const scale = getScale(metadata);
  const nodeGlobalMin = getNodeGlobalMin(node, metadata);
  const cartographicOrigin = getNodeCartographicOrigin(node, metadata, projection);

  for (let pointIndex = 0; pointIndex < node.numPoints; pointIndex++) {
    const morton0 = view.getUint32(byteOffset + 4, true);
    const morton1 = view.getUint32(byteOffset + 0, true);
    const morton2 = view.getUint32(byteOffset + 12, true);
    const morton3 = view.getUint32(byteOffset + 8, true);
    byteOffset += 16;

    const gridX = decodeBrotliMortonCoordinate(morton0, morton1, morton2, morton3, 0);
    const gridY = decodeBrotliMortonCoordinate(morton0, morton1, morton2, morton3, 1);
    const gridZ = decodeBrotliMortonCoordinate(morton0, morton1, morton2, morton3, 2);

    const position = [
      gridX * scale[0] + metadata.offset[0],
      gridY * scale[1] + metadata.offset[1],
      gridZ * scale[2] + metadata.offset[2]
    ];
    writePosition(positions, pointIndex, position, nodeGlobalMin, cartographicOrigin, projection);
  }

  return {value: positions, byteOffset};
}

/** Decodes interleaved RGB/RGBA attributes into normalized RGBA bytes. */
function decodeDefaultColors(
  view: DataView,
  numPoints: number,
  attribute: Potree2Attribute,
  attributeOffset: number,
  bytesPerPoint: number
): Uint8Array {
  const colors = new Uint8Array(numPoints * 4);
  const isUint8 = attribute.type === 'uint8';

  for (let pointIndex = 0; pointIndex < numPoints; pointIndex++) {
    const pointOffset = pointIndex * bytesPerPoint + attributeOffset;
    const red = isUint8 ? view.getUint8(pointOffset) : view.getUint16(pointOffset, true);
    const green = isUint8 ? view.getUint8(pointOffset + 1) : view.getUint16(pointOffset + 2, true);
    const blue = isUint8 ? view.getUint8(pointOffset + 2) : view.getUint16(pointOffset + 4, true);

    writeColor(colors, pointIndex, red, green, blue);
  }

  return colors;
}

/** Decodes Brotli-mode Morton-coded colors into normalized RGBA bytes. */
function decodeBrotliColors(
  view: DataView,
  numPoints: number,
  byteOffset: number
): {value: Uint8Array; byteOffset: number} {
  const colors = new Uint8Array(numPoints * 4);

  for (let pointIndex = 0; pointIndex < numPoints; pointIndex++) {
    const morton0 = view.getUint32(byteOffset + 4, true);
    const morton1 = view.getUint32(byteOffset + 0, true);
    byteOffset += 8;

    const red =
      dealign24b((morton1 & 0x00ffffff) >>> 0) +
      dealign24b(((morton1 >>> 24) | (morton0 << 8)) >>> 0) * 256;
    const green =
      dealign24b((morton1 & 0x00ffffff) >>> 1) +
      dealign24b(((morton1 >>> 24) | (morton0 << 8)) >>> 1) * 256;
    const blue =
      dealign24b((morton1 & 0x00ffffff) >>> 2) +
      dealign24b(((morton1 >>> 24) | (morton0 << 8)) >>> 2) * 256;

    writeColor(colors, pointIndex, red, green, blue);
  }

  return {value: colors, byteOffset};
}

/** Decodes one interleaved scalar or scalar-vector attribute into float values. */
function decodeDefaultScalarAttribute(
  view: DataView,
  numPoints: number,
  attribute: Potree2Attribute,
  attributeOffset: number,
  bytesPerPoint: number
): Float32Array {
  const values = new Float32Array(numPoints * attribute.numElements);
  const getter = getAttributeGetter(view, attribute);

  for (let pointIndex = 0; pointIndex < numPoints; pointIndex++) {
    const pointOffset = pointIndex * bytesPerPoint + attributeOffset;
    for (let elementIndex = 0; elementIndex < attribute.numElements; elementIndex++) {
      values[pointIndex * attribute.numElements + elementIndex] = getter(
        pointOffset + elementIndex * attribute.elementSize
      );
    }
  }

  return values;
}

/** Decodes one attribute-major scalar or scalar-vector attribute into float values. */
function decodeBrotliScalarAttribute(
  view: DataView,
  numPoints: number,
  attribute: Potree2Attribute,
  byteOffset: number
): {value: Float32Array; byteOffset: number} {
  const values = new Float32Array(numPoints * attribute.numElements);
  const getter = getAttributeGetter(view, attribute);

  for (let pointIndex = 0; pointIndex < numPoints; pointIndex++) {
    for (let elementIndex = 0; elementIndex < attribute.numElements; elementIndex++) {
      values[pointIndex * attribute.numElements + elementIndex] = getter(byteOffset);
      byteOffset += attribute.elementSize;
    }
  }

  return {value: values, byteOffset};
}

/** Adds canonical upper-case and lower-case position attribute aliases. */
function addPositionsAttribute(attributes: MeshAttributes, positions: Float32Array): void {
  const attribute = {value: positions, size: 3};
  attributes.POSITION = attribute;
  attributes.positions = attribute;
}

/** Adds canonical color attribute aliases. */
function addColorsAttribute(attributes: MeshAttributes, colors: Uint8Array): void {
  const attribute = {value: colors, size: 4, normalized: true};
  attributes.COLOR_0 = attribute;
  attributes.colors = attribute;
}

/** Writes one absolute point as an offset from the node's output origin. */
function writePosition(
  positions: Float32Array,
  pointIndex: number,
  position: number[],
  nodeGlobalMin: [number, number, number],
  cartographicOrigin: number[],
  projection: Proj4Projection | null
): void {
  let x = position[0];
  let y = position[1];
  if (projection) {
    [x, y] = projection.project([x, y]);
  }

  positions[pointIndex * 3 + 0] = x - cartographicOrigin[0];
  positions[pointIndex * 3 + 1] = y - cartographicOrigin[1];
  positions[pointIndex * 3 + 2] =
    position[2] - (projection ? cartographicOrigin[2] : nodeGlobalMin[2]);
}

/** Writes one Potree color triple into an 8-bit RGBA attribute. */
function writeColor(
  colors: Uint8Array,
  pointIndex: number,
  red: number,
  green: number,
  blue: number
): void {
  colors[pointIndex * 4 + 0] = red > 255 ? red / 256 : red;
  colors[pointIndex * 4 + 1] = green > 255 ? green / 256 : green;
  colors[pointIndex * 4 + 2] = blue > 255 ? blue / 256 : blue;
  colors[pointIndex * 4 + 3] = 255;
}

/** Returns a DataView getter for a Potree primitive attribute type. */
function getAttributeGetter(
  view: DataView,
  attribute: Potree2Attribute
): (byteOffset: number) => number {
  switch (attribute.type) {
    case 'int8':
      return byteOffset => view.getInt8(byteOffset);
    case 'uint8':
      return byteOffset => view.getUint8(byteOffset);
    case 'int16':
      return byteOffset => view.getInt16(byteOffset, true);
    case 'uint16':
      return byteOffset => view.getUint16(byteOffset, true);
    case 'int32':
      return byteOffset => view.getInt32(byteOffset, true);
    case 'uint32':
      return byteOffset => view.getUint32(byteOffset, true);
    case 'float':
      return byteOffset => view.getFloat32(byteOffset, true);
    case 'double':
      return byteOffset => view.getFloat64(byteOffset, true);
    default:
      throw new Error(`Unsupported Potree attribute type: ${attribute.type}`);
  }
}

/** Computes the interleaved point-record size for `DEFAULT`-encoded nodes. */
function getBytesPerPoint(attributes: Potree2Attribute[]): number {
  return attributes.reduce((total, attribute) => total + attribute.size, 0);
}

/** Normalizes scalar or per-axis coordinate scale metadata. */
function getScale(metadata: Potree2Metadata): [number, number, number] {
  return Array.isArray(metadata.scale)
    ? metadata.scale
    : [metadata.scale, metadata.scale, metadata.scale];
}

/** Returns the node bounding box in the point cloud's source coordinate system. */
function getNodeGlobalBoundingBox(
  node: Potree2Node,
  metadata: Potree2Metadata
): [number[], number[]] {
  const rootMin = metadata.boundingBox.min;
  return [
    [
      rootMin[0] + node.boundingBox.min[0],
      rootMin[1] + node.boundingBox.min[1],
      rootMin[2] + node.boundingBox.min[2]
    ],
    [
      rootMin[0] + node.boundingBox.max[0],
      rootMin[1] + node.boundingBox.max[1],
      rootMin[2] + node.boundingBox.max[2]
    ]
  ];
}

/** Returns the node minimum corner in the point cloud's source coordinate system. */
function getNodeGlobalMin(node: Potree2Node, metadata: Potree2Metadata): [number, number, number] {
  const rootMin = metadata.boundingBox.min;
  return [
    rootMin[0] + node.boundingBox.min[0],
    rootMin[1] + node.boundingBox.min[1],
    rootMin[2] + node.boundingBox.min[2]
  ];
}

/** Returns the origin used for output positions. */
function getNodeCartographicOrigin(
  node: Potree2Node,
  metadata: Potree2Metadata,
  projection: Proj4Projection | null
): number[] {
  const boundingBox = getNodeGlobalBoundingBox(node, metadata);
  const min = boundingBox[0];
  const max = boundingBox[1];
  if (!projection) {
    return [min[0], min[1], min[2]];
  }

  const [minX, minY] = projection.project([min[0], min[1]]);
  const [maxX, maxY] = projection.project([max[0], max[1]]);
  return [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2, min[2] + (max[2] - min[2]) / 2];
}

/** Returns a child-octant bounding box in root-relative coordinates. */
function getChildBoundingBox(
  boundingBox: Potree2Node['boundingBox'],
  childIndex: number
): Potree2Node['boundingBox'] {
  const min: [number, number, number] = [...boundingBox.min];
  const max: [number, number, number] = [...boundingBox.max];
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];

  if ((childIndex & 0b0001) > 0) {
    min[2] += size[2] / 2;
  } else {
    max[2] -= size[2] / 2;
  }

  if ((childIndex & 0b0010) > 0) {
    min[1] += size[1] / 2;
  } else {
    max[1] -= size[1] / 2;
  }

  if ((childIndex & 0b0100) > 0) {
    min[0] += size[0] / 2;
  } else {
    max[0] -= size[0] / 2;
  }

  return {min, max};
}

/** Returns true if an attribute stores XYZ positions. */
function isPositionAttribute(attribute: Potree2Attribute): boolean {
  return attribute.name === 'position' || attribute.name === 'POSITION_CARTESIAN';
}

/** Returns true if an attribute stores RGB or RGBA color. */
function isColorAttribute(attribute: Potree2Attribute): boolean {
  return attribute.name === 'rgb' || attribute.name === 'rgba' || attribute.name === 'RGBA';
}

/** Reads an int64 byte offset and rejects values that cannot be addressed safely in JS. */
function getSafeBigInt64(view: DataView, byteOffset: number): number {
  const value = view.getBigInt64(byteOffset, true);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Potree byte offset exceeds Number.MAX_SAFE_INTEGER');
  }
  return Number(value);
}

/** Decodes one X/Y/Z component from the four uint32 Morton words used by Potree Brotli nodes. */
function decodeBrotliMortonCoordinate(
  morton0: number,
  morton1: number,
  morton2: number,
  morton3: number,
  component: 0 | 1 | 2
): number {
  let coordinate =
    dealign24b((morton3 & 0x00ffffff) >>> component) +
    dealign24b(((morton3 >>> 24) | (morton2 << 8)) >>> component) * 256;

  if (morton1 !== 0 || morton2 !== 0) {
    coordinate +=
      dealign24b((morton1 & 0x00ffffff) >>> component) * 65536 +
      dealign24b(((morton1 >>> 24) | (morton0 << 8)) >>> component) * 16777216;
  }

  return coordinate;
}

/** Compacts every third bit from a 24-bit Morton-code lane. */
function dealign24b(mortonCode: number): number {
  let value = mortonCode;
  value = ((value & 0x208208) >>> 2) | ((value & 0x041041) >>> 0);
  value = ((value & 0x0c00c0) >>> 4) | ((value & 0x000c03) >>> 0);
  value = ((value & 0x00f000) >>> 8) | ((value & 0x00000f) >>> 0);
  value = ((value & 0x000000) >>> 16) | ((value & 0x0000ff) >>> 0);
  return value;
}
