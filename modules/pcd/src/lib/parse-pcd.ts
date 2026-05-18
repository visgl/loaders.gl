// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// PCD Loader, adapted from THREE.js (MIT license)
// Description: A loader for PCD ascii and binary files.
// Limitations: Compressed binary files are not supported.
//
// Attributions per original THREE.js source file:
// @author Filipe Caixeta / http://filipecaixeta.com.br
// @author Mugen87 / https://github.com/Mugen87

import {
  MeshAttribute,
  MeshAttributes,
  type MeshArrowTable,
  type PackedMeshArrowLayout
} from '@loaders.gl/schema';
import {getMeshBoundingBox, makePackedMeshArrowTable} from '@loaders.gl/schema-utils';
import {decompressLZF} from './decompress-lzf';
import {getPCDSchema} from './get-pcd-schema';
import type {PCDHeader, PCDMesh} from './pcd-types';

type MeshHeader = {
  vertexCount: number;
  boundingBox: [[number, number, number], [number, number, number]];
};

type NormalizedAttributes = {
  POSITION: {
    value: Float32Array;
    size: number;
  };
  NORMAL?: {
    value: Float32Array;
    size: number;
  };
  COLOR_0?: {
    value: Uint8Array;
    size: number;
  };
};

type HeaderAttributes = {
  [attributeName: string]: number[];
};

const LITTLE_ENDIAN: boolean = true;
type PackedPCDBoundingBox = [[number, number, number], [number, number, number]];

/**
 *
 * @param data
 * @returns
 */
export function parsePCD(data: ArrayBufferLike): PCDMesh {
  // parse header (always ascii format)
  const textData = new TextDecoder().decode(data);
  const pcdHeader = parsePCDHeader(textData);

  let attributes: any = {};

  // parse data
  switch (pcdHeader.data) {
    case 'ascii':
      attributes = parsePCDASCII(pcdHeader, textData);
      break;

    case 'binary':
      attributes = parsePCDBinary(pcdHeader, data);
      break;

    case 'binary_compressed':
      attributes = parsePCDBinaryCompressed(pcdHeader, data);
      break;

    default:
      throw new Error(`PCD: ${pcdHeader.data} files are not supported`);
  }

  attributes = getMeshAttributes(attributes);

  const header = getMeshHeader(pcdHeader, attributes);

  const schemaMetadata = Object.fromEntries([
    ['topology', 'point-list'],
    ['mode', '0'],
    ['boundingBox', JSON.stringify(header.boundingBox)]
  ]);

  const schema = getPCDSchema(pcdHeader, schemaMetadata);

  return {
    loader: 'pcd',
    loaderData: pcdHeader,
    header,
    schema,
    topology: 'point-list',
    mode: 0, // POINTS (deprecated)
    attributes
  };
}

/**
 * Parse PCD bytes directly into packed interleaved Mesh Arrow records.
 * @param data PCD file bytes.
 * @returns Packed-only Mesh Arrow table without temporary attribute arrays.
 */
export function parsePCDPackedArrowTable(data: ArrayBufferLike): MeshArrowTable {
  const textData = new TextDecoder().decode(data);
  const pcdHeader = parsePCDHeader(textData);
  const packedLayout = getPackedPCDLayout(pcdHeader);
  const packedBytes = new Uint8Array(pcdHeader.points * packedLayout.byteStride);
  const boundingBox = createPackedPCDBoundingBox();

  let vertexCount = 0;
  switch (pcdHeader.data) {
    case 'ascii':
      vertexCount = writePackedPCDASCIIRecords(
        pcdHeader,
        textData,
        packedBytes,
        packedLayout,
        boundingBox
      );
      break;

    case 'binary':
      vertexCount = writePackedPCDBinaryRecords(
        pcdHeader,
        data,
        packedBytes,
        packedLayout,
        boundingBox
      );
      break;

    case 'binary_compressed':
      vertexCount = writePackedPCDCompressedRecords(
        pcdHeader,
        data,
        packedBytes,
        packedLayout,
        boundingBox
      );
      break;

    default:
      throw new Error(`PCD: ${pcdHeader.data} files are not supported`);
  }

  return makePackedMeshArrowTable({
    bytes: packedBytes.subarray(0, vertexCount * packedLayout.byteStride),
    vertexCount,
    packedLayout,
    topology: 'point-list',
    mode: 0,
    boundingBox: finalizePackedPCDBoundingBox(boundingBox, vertexCount)
  });
}

/** Return packed PCD layout based on fields normalized by the existing loader. */
function getPackedPCDLayout(pcdHeader: PCDHeader): PackedMeshArrowLayout {
  const attributes: PackedMeshArrowLayout['attributes'] = [
    {attribute: 'POSITION', format: 'float32x3', byteOffset: 0}
  ];
  let byteOffset = 12;

  if (pcdHeader.offset.normal_x !== undefined) {
    attributes.push({attribute: 'NORMAL', format: 'float32x3', byteOffset});
    byteOffset += 12;
  }
  if (pcdHeader.offset.rgb !== undefined) {
    attributes.push({attribute: 'COLOR_0', format: 'unorm8x4', byteOffset});
    byteOffset += 4;
  }

  return {
    columnName: 'vertexData',
    bufferName: 'vertexData',
    byteStride: alignPackedPCDByteStride(byteOffset),
    attributes
  };
}

/** Write ASCII PCD rows directly into packed vertex storage. */
function writePackedPCDASCIIRecords(
  pcdHeader: PCDHeader,
  textData: string,
  packedBytes: Uint8Array,
  packedLayout: PackedMeshArrowLayout,
  boundingBox: PackedPCDBoundingBox
): number {
  const dataView = new DataView(packedBytes.buffer, packedBytes.byteOffset, packedBytes.byteLength);
  const positionByteOffset = getRequiredPackedPCDAttributeByteOffset(packedLayout, 'POSITION');
  const normalByteOffset = getPackedPCDAttributeByteOffset(packedLayout, 'NORMAL');
  const colorByteOffset = getPackedPCDAttributeByteOffset(packedLayout, 'COLOR_0');
  const sourceLines = textData
    .slice(pcdHeader.headerLen)
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0);
  let vertexIndex = 0;

  for (const sourceLine of sourceLines) {
    const values = sourceLine.trim().split(/\s+/);
    const recordByteOffset = vertexIndex * packedLayout.byteStride;
    const positionX = parseFloat(values[pcdHeader.offset.x]);
    const positionY = parseFloat(values[pcdHeader.offset.y]);
    const positionZ = parseFloat(values[pcdHeader.offset.z]);

    writePackedPCDPosition(
      dataView,
      recordByteOffset + positionByteOffset,
      positionX,
      positionY,
      positionZ,
      boundingBox
    );

    if (normalByteOffset !== undefined) {
      dataView.setFloat32(
        recordByteOffset + normalByteOffset,
        parseFloat(values[pcdHeader.offset.normal_x]),
        true
      );
      dataView.setFloat32(
        recordByteOffset + normalByteOffset + 4,
        parseFloat(values[pcdHeader.offset.normal_y]),
        true
      );
      dataView.setFloat32(
        recordByteOffset + normalByteOffset + 8,
        parseFloat(values[pcdHeader.offset.normal_z]),
        true
      );
    }

    if (colorByteOffset !== undefined) {
      const floatValue = parseFloat(values[pcdHeader.offset.rgb]);
      const binaryColor = new Float32Array([floatValue]);
      const colorView = new DataView(binaryColor.buffer, 0);
      const colorRecordByteOffset = recordByteOffset + colorByteOffset;
      packedBytes[colorRecordByteOffset] = colorView.getUint8(0);
      packedBytes[colorRecordByteOffset + 1] = colorView.getUint8(1);
      packedBytes[colorRecordByteOffset + 2] = colorView.getUint8(2);
      packedBytes[colorRecordByteOffset + 3] = 255;
    }

    vertexIndex++;
  }

  return vertexIndex;
}

/** Write binary PCD rows directly into packed vertex storage. */
function writePackedPCDBinaryRecords(
  pcdHeader: PCDHeader,
  data: ArrayBufferLike,
  packedBytes: Uint8Array,
  packedLayout: PackedMeshArrowLayout,
  boundingBox: PackedPCDBoundingBox
): number {
  const sourceView = new DataView(data, pcdHeader.headerLen);
  const packedView = new DataView(
    packedBytes.buffer,
    packedBytes.byteOffset,
    packedBytes.byteLength
  );
  const positionByteOffset = getRequiredPackedPCDAttributeByteOffset(packedLayout, 'POSITION');
  const normalByteOffset = getPackedPCDAttributeByteOffset(packedLayout, 'NORMAL');
  const colorByteOffset = getPackedPCDAttributeByteOffset(packedLayout, 'COLOR_0');

  for (let vertexIndex = 0, rowByteOffset = 0; vertexIndex < pcdHeader.points; vertexIndex++) {
    const recordByteOffset = vertexIndex * packedLayout.byteStride;
    const positionX = sourceView.getFloat32(rowByteOffset + pcdHeader.offset.x, LITTLE_ENDIAN);
    const positionY = sourceView.getFloat32(rowByteOffset + pcdHeader.offset.y, LITTLE_ENDIAN);
    const positionZ = sourceView.getFloat32(rowByteOffset + pcdHeader.offset.z, LITTLE_ENDIAN);

    writePackedPCDPosition(
      packedView,
      recordByteOffset + positionByteOffset,
      positionX,
      positionY,
      positionZ,
      boundingBox
    );

    if (normalByteOffset !== undefined) {
      packedView.setFloat32(
        recordByteOffset + normalByteOffset,
        sourceView.getFloat32(rowByteOffset + pcdHeader.offset.normal_x, LITTLE_ENDIAN),
        true
      );
      packedView.setFloat32(
        recordByteOffset + normalByteOffset + 4,
        sourceView.getFloat32(rowByteOffset + pcdHeader.offset.normal_y, LITTLE_ENDIAN),
        true
      );
      packedView.setFloat32(
        recordByteOffset + normalByteOffset + 8,
        sourceView.getFloat32(rowByteOffset + pcdHeader.offset.normal_z, LITTLE_ENDIAN),
        true
      );
    }

    if (colorByteOffset !== undefined) {
      const colorRecordByteOffset = recordByteOffset + colorByteOffset;
      packedBytes[colorRecordByteOffset] = sourceView.getUint8(
        rowByteOffset + pcdHeader.offset.rgb
      );
      packedBytes[colorRecordByteOffset + 1] = sourceView.getUint8(
        rowByteOffset + pcdHeader.offset.rgb + 1
      );
      packedBytes[colorRecordByteOffset + 2] = sourceView.getUint8(
        rowByteOffset + pcdHeader.offset.rgb + 2
      );
      packedBytes[colorRecordByteOffset + 3] = 255;
    }

    rowByteOffset += pcdHeader.rowSize;
  }

  return pcdHeader.points;
}

/** Write compressed-binary PCD rows directly into packed vertex storage. */
function writePackedPCDCompressedRecords(
  pcdHeader: PCDHeader,
  data: ArrayBufferLike,
  packedBytes: Uint8Array,
  packedLayout: PackedMeshArrowLayout,
  boundingBox: PackedPCDBoundingBox
): number {
  const sizes = new Uint32Array(data.slice(pcdHeader.headerLen, pcdHeader.headerLen + 8));
  const compressedSize = sizes[0];
  const decompressedSize = sizes[1];
  const decompressed = decompressLZF(
    new Uint8Array(data, pcdHeader.headerLen + 8, compressedSize),
    decompressedSize
  );
  const sourceView = new DataView(decompressed.buffer);
  const packedView = new DataView(
    packedBytes.buffer,
    packedBytes.byteOffset,
    packedBytes.byteLength
  );
  const positionByteOffset = getRequiredPackedPCDAttributeByteOffset(packedLayout, 'POSITION');
  const normalByteOffset = getPackedPCDAttributeByteOffset(packedLayout, 'NORMAL');
  const colorByteOffset = getPackedPCDAttributeByteOffset(packedLayout, 'COLOR_0');

  for (let vertexIndex = 0; vertexIndex < pcdHeader.points; vertexIndex++) {
    const recordByteOffset = vertexIndex * packedLayout.byteStride;
    const positionX = sourceView.getFloat32(
      getCompressedPCDFieldByteOffset(pcdHeader, 'x', vertexIndex),
      LITTLE_ENDIAN
    );
    const positionY = sourceView.getFloat32(
      getCompressedPCDFieldByteOffset(pcdHeader, 'y', vertexIndex),
      LITTLE_ENDIAN
    );
    const positionZ = sourceView.getFloat32(
      getCompressedPCDFieldByteOffset(pcdHeader, 'z', vertexIndex),
      LITTLE_ENDIAN
    );

    writePackedPCDPosition(
      packedView,
      recordByteOffset + positionByteOffset,
      positionX,
      positionY,
      positionZ,
      boundingBox
    );

    if (normalByteOffset !== undefined) {
      packedView.setFloat32(
        recordByteOffset + normalByteOffset,
        sourceView.getFloat32(
          getCompressedPCDFieldByteOffset(pcdHeader, 'normal_x', vertexIndex),
          LITTLE_ENDIAN
        ),
        true
      );
      packedView.setFloat32(
        recordByteOffset + normalByteOffset + 4,
        sourceView.getFloat32(
          getCompressedPCDFieldByteOffset(pcdHeader, 'normal_y', vertexIndex),
          LITTLE_ENDIAN
        ),
        true
      );
      packedView.setFloat32(
        recordByteOffset + normalByteOffset + 8,
        sourceView.getFloat32(
          getCompressedPCDFieldByteOffset(pcdHeader, 'normal_z', vertexIndex),
          LITTLE_ENDIAN
        ),
        true
      );
    }

    if (colorByteOffset !== undefined) {
      const sourceColorByteOffset = getCompressedPCDFieldByteOffset(pcdHeader, 'rgb', vertexIndex);
      const colorRecordByteOffset = recordByteOffset + colorByteOffset;
      packedBytes[colorRecordByteOffset] = sourceView.getUint8(sourceColorByteOffset);
      packedBytes[colorRecordByteOffset + 1] = sourceView.getUint8(sourceColorByteOffset + 1);
      packedBytes[colorRecordByteOffset + 2] = sourceView.getUint8(sourceColorByteOffset + 2);
      packedBytes[colorRecordByteOffset + 3] = 255;
    }
  }

  return pcdHeader.points;
}

/** Write one packed PCD position and extend the bounding box accumulator. */
function writePackedPCDPosition(
  dataView: DataView,
  byteOffset: number,
  positionX: number,
  positionY: number,
  positionZ: number,
  boundingBox: PackedPCDBoundingBox
): void {
  dataView.setFloat32(byteOffset, positionX, true);
  dataView.setFloat32(byteOffset + 4, positionY, true);
  dataView.setFloat32(byteOffset + 8, positionZ, true);
  boundingBox[0][0] = Math.min(boundingBox[0][0], positionX);
  boundingBox[0][1] = Math.min(boundingBox[0][1], positionY);
  boundingBox[0][2] = Math.min(boundingBox[0][2], positionZ);
  boundingBox[1][0] = Math.max(boundingBox[1][0], positionX);
  boundingBox[1][1] = Math.max(boundingBox[1][1], positionY);
  boundingBox[1][2] = Math.max(boundingBox[1][2], positionZ);
}

/** Return an initially empty PCD bounding box accumulator. */
function createPackedPCDBoundingBox(): PackedPCDBoundingBox {
  return [
    [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
    [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
  ];
}

/** Return stable final PCD bounds, including an empty-table fallback. */
function finalizePackedPCDBoundingBox(
  boundingBox: PackedPCDBoundingBox,
  vertexCount: number
): [number[], number[]] {
  if (vertexCount === 0) {
    return [
      [0, 0, 0],
      [0, 0, 0]
    ];
  }
  return boundingBox;
}

/** Resolve an optional packed PCD attribute byte offset. */
function getPackedPCDAttributeByteOffset(
  packedLayout: PackedMeshArrowLayout,
  attribute: string
): number | undefined {
  return packedLayout.attributes.find(layout => layout.attribute === attribute)?.byteOffset;
}

/** Resolve a required packed PCD attribute byte offset. */
function getRequiredPackedPCDAttributeByteOffset(
  packedLayout: PackedMeshArrowLayout,
  attribute: string
): number {
  const byteOffset = getPackedPCDAttributeByteOffset(packedLayout, attribute);
  if (byteOffset === undefined) {
    throw new Error(`PCDLoader: packed layout is missing attribute "${attribute}"`);
  }
  return byteOffset;
}

/** Round packed PCD record strides up to four-byte alignment. */
function alignPackedPCDByteStride(byteOffset: number): number {
  return Math.ceil(byteOffset / 4) * 4;
}

/** Return one compressed-binary PCD field byte offset for a point row. */
function getCompressedPCDFieldByteOffset(
  pcdHeader: PCDHeader,
  fieldName: string,
  vertexIndex: number
): number {
  return (
    pcdHeader.points * pcdHeader.offset[fieldName] +
    getPCDFieldSize(pcdHeader, fieldName) * vertexIndex
  );
}

/** Return the source byte width for one named PCD field. */
function getPCDFieldSize(pcdHeader: PCDHeader, fieldName: string): number {
  const fieldIndex = pcdHeader.fields.indexOf(fieldName);
  return fieldIndex >= 0 ? pcdHeader.size[fieldIndex] : 0;
}

// Create a header that contains common data for PointCloud category loaders
function getMeshHeader(pcdHeader: PCDHeader, attributes: NormalizedAttributes): MeshHeader {
  if (typeof pcdHeader.width === 'number' && typeof pcdHeader.height === 'number') {
    const pointCount = pcdHeader.width * pcdHeader.height; // Supports "organized" point sets
    return {
      vertexCount: pointCount,
      boundingBox: getMeshBoundingBox(attributes)
    };
  }
  return {
    vertexCount: pcdHeader.vertexCount,
    boundingBox: pcdHeader.boundingBox
  };
}

/**
 * @param attributes
 * @returns Normalized attributes
 */
function getMeshAttributes(attributes: HeaderAttributes): {[attributeName: string]: MeshAttribute} {
  const normalizedAttributes: MeshAttributes = {
    POSITION: {
      // Binary PCD is only 32 bit
      value: new Float32Array(attributes.position),
      size: 3
    }
  };

  if (attributes.normal && attributes.normal.length > 0) {
    normalizedAttributes.NORMAL = {
      value: new Float32Array(attributes.normal),
      size: 3
    };
  }

  if (attributes.color && attributes.color.length > 0) {
    // TODO - RGBA
    normalizedAttributes.COLOR_0 = {
      value: new Uint8Array(attributes.color),
      size: 3
    };
  }

  if (attributes.intensity && attributes.intensity.length > 0) {
    // TODO - RGBA
    normalizedAttributes.COLOR_0 = {
      value: new Uint8Array(attributes.color),
      size: 3
    };
  }

  if (attributes.label && attributes.label.length > 0) {
    // TODO - RGBA
    normalizedAttributes.COLOR_0 = {
      value: new Uint8Array(attributes.label),
      size: 3
    };
  }

  return normalizedAttributes;
}

/**
 * Incoming data parsing
 * @param data
 * @returns Header
 */
/* eslint-disable complexity, max-statements */
export function parsePCDHeader(data: string): PCDHeader {
  const result1 = data.search(/[\r\n]DATA\s(\S*)\s/i);
  const result2 = /[\r\n]DATA\s(\S*)\s/i.exec(data.substr(result1 - 1));

  const pcdHeader: any = {};
  pcdHeader.data = result2 && result2[1];
  if (result2 !== null) {
    pcdHeader.headerLen = (result2 && result2[0].length) + result1;
  }
  pcdHeader.str = data.substr(0, pcdHeader.headerLen);

  // remove comments

  pcdHeader.str = pcdHeader.str.replace(/\#.*/gi, '');

  // parse

  pcdHeader.version = /VERSION (.*)/i.exec(pcdHeader.str);
  pcdHeader.fields = /FIELDS (.*)/i.exec(pcdHeader.str);
  pcdHeader.size = /SIZE (.*)/i.exec(pcdHeader.str);
  pcdHeader.type = /TYPE (.*)/i.exec(pcdHeader.str);
  pcdHeader.count = /COUNT (.*)/i.exec(pcdHeader.str);
  pcdHeader.width = /WIDTH (.*)/i.exec(pcdHeader.str);
  pcdHeader.height = /HEIGHT (.*)/i.exec(pcdHeader.str);
  pcdHeader.viewpoint = /VIEWPOINT (.*)/i.exec(pcdHeader.str);
  pcdHeader.points = /POINTS (.*)/i.exec(pcdHeader.str);

  // evaluate

  if (pcdHeader.version !== null) {
    pcdHeader.version = parseFloat(pcdHeader.version[1]);
  }

  if (pcdHeader.fields !== null) {
    pcdHeader.fields = pcdHeader.fields[1].split(' ');
  }

  if (pcdHeader.type !== null) {
    pcdHeader.type = pcdHeader.type[1].split(' ');
  }

  if (pcdHeader.width !== null) {
    pcdHeader.width = parseInt(pcdHeader.width[1], 10);
  }

  if (pcdHeader.height !== null) {
    pcdHeader.height = parseInt(pcdHeader.height[1], 10);
  }

  if (pcdHeader.viewpoint !== null) {
    pcdHeader.viewpoint = pcdHeader.viewpoint[1];
  }

  if (pcdHeader.points !== null) {
    pcdHeader.points = parseInt(pcdHeader.points[1], 10);
  }

  if (
    pcdHeader.points === null &&
    typeof pcdHeader.width === 'number' &&
    typeof pcdHeader.height === 'number'
  ) {
    pcdHeader.points = pcdHeader.width * pcdHeader.height;
  }

  if (pcdHeader.size !== null) {
    pcdHeader.size = pcdHeader.size[1].split(' ').map(x => parseInt(x, 10));
  }

  if (pcdHeader.count !== null) {
    pcdHeader.count = pcdHeader.count[1].split(' ').map(x => parseInt(x, 10));
  } else {
    pcdHeader.count = [];
    if (pcdHeader.fields !== null) {
      for (let i = 0; i < pcdHeader.fields.length; i++) {
        pcdHeader.count.push(1);
      }
    }
  }

  pcdHeader.offset = {};

  let sizeSum = 0;
  for (let i = 0, l = pcdHeader.fields.length; i < l; i++) {
    if (pcdHeader.data === 'ascii') {
      pcdHeader.offset[pcdHeader.fields[i]] = i;
    } else {
      pcdHeader.offset[pcdHeader.fields[i]] = sizeSum;
      sizeSum += pcdHeader.size[i] * pcdHeader.count[i];
    }
  }

  // for binary only
  pcdHeader.rowSize = sizeSum;
  return pcdHeader;
}

/**
 * @param pcdHeader
 * @param textData
 * @returns [attributes]
 */
// eslint-enable-next-line complexity, max-statements
function parsePCDASCII(pcdHeader: PCDHeader, textData: string): HeaderAttributes {
  const position: number[] = [];
  const normal: number[] = [];
  const color: number[] = [];
  const intensity: number[] = [];
  const label: number[] = [];

  const offset = pcdHeader.offset;
  const pcdData = textData.substr(pcdHeader.headerLen);
  const lines = pcdData.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== '') {
      const line = lines[i].split(' ');

      if (offset.x !== undefined) {
        position.push(parseFloat(line[offset.x]));
        position.push(parseFloat(line[offset.y]));
        position.push(parseFloat(line[offset.z]));
      }

      if (offset.rgb !== undefined) {
        const floatValue = parseFloat(line[offset.rgb]);
        const binaryColor = new Float32Array([floatValue]);
        const dataview = new DataView(binaryColor.buffer, 0);
        color.push(dataview.getUint8(0));
        color.push(dataview.getUint8(1));
        color.push(dataview.getUint8(2));
        // TODO - handle alpha channel / RGBA?
      }

      if (offset.normal_x !== undefined) {
        normal.push(parseFloat(line[offset.normal_x]));
        normal.push(parseFloat(line[offset.normal_y]));
        normal.push(parseFloat(line[offset.normal_z]));
      }

      if (offset.intensity !== undefined) {
        intensity.push(parseFloat(line[offset.intensity]));
      }

      if (offset.label !== undefined) {
        label.push(parseInt(line[offset.label]));
      }
    }
  }

  return {position, normal, color};
}

/**
 * @param pcdHeader
 * @param data
 * @returns [attributes]
 */
function parsePCDBinary(pcdHeader: PCDHeader, data: ArrayBufferLike): HeaderAttributes {
  const position: number[] = [];
  const normal: number[] = [];
  const color: number[] = [];
  const intensity: number[] = [];
  const label: number[] = [];

  const dataview = new DataView(data, pcdHeader.headerLen);
  const offset = pcdHeader.offset;

  for (let i = 0, row = 0; i < pcdHeader.points; i++, row += pcdHeader.rowSize) {
    if (offset.x !== undefined) {
      position.push(dataview.getFloat32(row + offset.x, LITTLE_ENDIAN));
      position.push(dataview.getFloat32(row + offset.y, LITTLE_ENDIAN));
      position.push(dataview.getFloat32(row + offset.z, LITTLE_ENDIAN));
    }

    if (offset.rgb !== undefined) {
      color.push(dataview.getUint8(row + offset.rgb + 0));
      color.push(dataview.getUint8(row + offset.rgb + 1));
      color.push(dataview.getUint8(row + offset.rgb + 2));
    }

    if (offset.normal_x !== undefined) {
      normal.push(dataview.getFloat32(row + offset.normal_x, LITTLE_ENDIAN));
      normal.push(dataview.getFloat32(row + offset.normal_y, LITTLE_ENDIAN));
      normal.push(dataview.getFloat32(row + offset.normal_z, LITTLE_ENDIAN));
    }

    if (offset.intensity !== undefined) {
      intensity.push(dataview.getFloat32(row + offset.intensity, LITTLE_ENDIAN));
    }

    if (offset.label !== undefined) {
      label.push(dataview.getInt32(row + offset.label, LITTLE_ENDIAN));
    }
  }

  return {position, normal, color, intensity, label};
}

/** Parse compressed PCD data in in binary_compressed form ( https://pointclouds.org/documentation/tutorials/pcd_file_format.html)
 * from https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/PCDLoader.js
 * @license MIT (http://opensource.org/licenses/MIT)
 * @param pcdHeader
 * @param data
 * @returns [attributes]
 */
// eslint-enable-next-line complexity, max-statements
function parsePCDBinaryCompressed(pcdHeader: PCDHeader, data: ArrayBufferLike): HeaderAttributes {
  const position: number[] = [];
  const normal: number[] = [];
  const color: number[] = [];
  const intensity: number[] = [];
  const label: number[] = [];

  const sizes = new Uint32Array(data.slice(pcdHeader.headerLen, pcdHeader.headerLen + 8));
  const compressedSize = sizes[0];
  const decompressedSize = sizes[1];
  const decompressed = decompressLZF(
    new Uint8Array(data, pcdHeader.headerLen + 8, compressedSize),
    decompressedSize
  );
  const dataview = new DataView(decompressed.buffer);

  const offset = pcdHeader.offset;

  for (let i = 0; i < pcdHeader.points; i++) {
    if (offset.x !== undefined) {
      position.push(
        dataview.getFloat32(pcdHeader.points * offset.x + pcdHeader.size[0] * i, LITTLE_ENDIAN)
      );
      position.push(
        dataview.getFloat32(pcdHeader.points * offset.y + pcdHeader.size[1] * i, LITTLE_ENDIAN)
      );
      position.push(
        dataview.getFloat32(pcdHeader.points * offset.z + pcdHeader.size[2] * i, LITTLE_ENDIAN)
      );
    }

    if (offset.rgb !== undefined) {
      color.push(
        dataview.getUint8(pcdHeader.points * offset.rgb + pcdHeader.size[3] * i + 0) / 255.0
      );
      color.push(
        dataview.getUint8(pcdHeader.points * offset.rgb + pcdHeader.size[3] * i + 1) / 255.0
      );
      color.push(
        dataview.getUint8(pcdHeader.points * offset.rgb + pcdHeader.size[3] * i + 2) / 255.0
      );
    }

    if (offset.normal_x !== undefined) {
      normal.push(
        dataview.getFloat32(
          pcdHeader.points * offset.normal_x + pcdHeader.size[4] * i,
          LITTLE_ENDIAN
        )
      );
      normal.push(
        dataview.getFloat32(
          pcdHeader.points * offset.normal_y + pcdHeader.size[5] * i,
          LITTLE_ENDIAN
        )
      );
      normal.push(
        dataview.getFloat32(
          pcdHeader.points * offset.normal_z + pcdHeader.size[6] * i,
          LITTLE_ENDIAN
        )
      );
    }

    if (offset.intensity !== undefined) {
      const intensityIndex = pcdHeader.fields.indexOf('intensity');
      intensity.push(
        dataview.getFloat32(
          pcdHeader.points * offset.intensity + pcdHeader.size[intensityIndex] * i,
          LITTLE_ENDIAN
        )
      );
    }

    if (offset.label !== undefined) {
      const labelIndex = pcdHeader.fields.indexOf('label');
      label.push(
        dataview.getInt32(
          pcdHeader.points * offset.label + pcdHeader.size[labelIndex] * i,
          LITTLE_ENDIAN
        )
      );
    }
  }

  return {
    position,
    normal,
    color,
    intensity,
    label
  };
}
