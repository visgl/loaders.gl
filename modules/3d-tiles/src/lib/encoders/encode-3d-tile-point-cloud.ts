// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {MAGIC_ARRAY} from '../constants';
import {encode3DTileHeader, encode3DTileByteLength} from './helpers/encode-3d-tile-header';
import {
  padStringToByteAlignment,
  copyStringToDataView,
  copyBinaryToDataView
} from '@loaders.gl/loader-utils';

const DEFAULT_FEATURE_TABLE_JSON = {
  POINTS_LENGTH: 1,
  POSITIONS: {
    byteOffset: 0
  }
};

export function encodePointCloud3DTile(tile, dataView, byteOffset, options) {
  const pointData = getPointCloudFeatureTable(tile);
  const featureTableJsonString = padStringToByteAlignment(JSON.stringify(pointData.json), 4);
  const featureTableJsonByteLength =
    tile.featureTableJsonByteLength ?? featureTableJsonString.length;
  const featureTableBinary = pointData.binary;
  const featureTableBinaryByteLength = featureTableBinary.byteLength;
  const batchTableJsonString = tile.batchTableJson ? JSON.stringify(tile.batchTableJson) : '';
  const batchTableJsonByteLength = batchTableJsonString
    ? padStringToByteAlignment(batchTableJsonString, 4).length
    : 0;
  const paddedBatchTableJsonString = batchTableJsonByteLength
    ? padStringToByteAlignment(batchTableJsonString, 4)
    : '';
  const batchTableBinary = tile.batchTableBinary || new Uint8Array();

  // Add default magic for this tile type
  tile = {magic: MAGIC_ARRAY.POINT_CLOUD, ...tile};

  const byteOffsetStart = byteOffset;

  byteOffset = encode3DTileHeader(tile, dataView, byteOffset);

  if (dataView) {
    dataView.setUint32(byteOffset + 0, featureTableJsonByteLength, true); // featureTableJsonByteLength
    dataView.setUint32(byteOffset + 4, featureTableBinaryByteLength, true); // featureTableBinaryByteLength
    dataView.setUint32(byteOffset + 8, batchTableJsonByteLength, true); // batchTableJsonByteLength
    dataView.setUint32(byteOffset + 12, batchTableBinary.byteLength, true); // batchTableBinaryByteLength
  }
  byteOffset += 16;

  byteOffset = copyStringToDataView(
    dataView,
    byteOffset,
    featureTableJsonString,
    featureTableJsonByteLength
  );
  byteOffset = copyBinaryToDataView(
    dataView,
    byteOffset,
    featureTableBinary,
    featureTableBinaryByteLength
  );
  if (batchTableJsonByteLength > 0) {
    byteOffset = copyStringToDataView(
      dataView,
      byteOffset,
      paddedBatchTableJsonString,
      batchTableJsonByteLength
    );
  }
  byteOffset = copyBinaryToDataView(
    dataView,
    byteOffset,
    batchTableBinary,
    batchTableBinary.byteLength
  );

  // Go "back" and rewrite the tile's `byteLength` now that we know the value
  encode3DTileByteLength(dataView, byteOffsetStart, byteOffset - byteOffsetStart);

  return byteOffset;
}

/** Creates a PNTS feature table from decoded point attributes. */
function getPointCloudFeatureTable(tile): {json: Record<string, unknown>; binary: Uint8Array} {
  const positions = tile.attributes?.positions;
  if (!positions) {
    const json = tile.featureTableJson || DEFAULT_FEATURE_TABLE_JSON;
    return {json, binary: new Uint8Array(12)};
  }
  if (positions.length === 0 || positions.length % 3 !== 0) {
    throw new Error('3D Tiles point cloud positions must contain one or more xyz triples');
  }

  const pointCount = positions.length / 3;
  const properties: Array<{name: string; alignment: number; bytes: Uint8Array}> = [];
  properties.push({name: 'POSITION', alignment: 4, bytes: encodeFloat32Array(positions)});

  const colors = tile.attributes?.colors;
  if (colors) {
    const colorValues = Array.isArray(colors) ? colors : colors.value;
    const colorSize = Array.isArray(colors) ? colorValues.length / pointCount : colors.size;
    if (colorSize !== 3 && colorSize !== 4) {
      throw new Error('3D Tiles point cloud colors must contain RGB or RGBA values');
    }
    const colorBytes = encodeColorBytes(
      colorValues,
      !Array.isArray(colors) && colors.normalized,
      pointCount,
      colorSize
    );
    properties.push({name: colorSize === 4 ? 'RGBA' : 'RGB', alignment: 1, bytes: colorBytes});
  }

  const normals = tile.attributes?.normals;
  if (normals) {
    const normalValues = Array.isArray(normals) ? normals : normals.value;
    if (normalValues.length !== pointCount * 3) {
      throw new Error('3D Tiles point cloud normal count does not match the position count');
    }
    properties.push({name: 'NORMAL', alignment: 4, bytes: encodeFloat32Array(normalValues)});
  }

  const batchIds = tile.attributes?.batchIds;
  let batchLength = 0;
  if (batchIds) {
    if (batchIds.length !== pointCount) {
      throw new Error('3D Tiles point cloud batch ID count does not match the position count');
    }
    const batchIdValues = new Uint16Array(batchIds.length);
    for (let index = 0; index < batchIds.length; index++) {
      const batchId = batchIds[index];
      if (!Number.isInteger(batchId) || batchId < 0 || batchId > 65_535) {
        throw new Error('3D Tiles point cloud batch IDs must be unsigned 16-bit integers');
      }
      batchIdValues[index] = batchId;
      batchLength = Math.max(batchLength, batchId + 1);
    }
    const batchIdBytes = new Uint8Array(batchIdValues.length * 2);
    const dataView = new DataView(batchIdBytes.buffer);
    for (let index = 0; index < batchIdValues.length; index++) {
      dataView.setUint16(index * 2, batchIdValues[index], true);
    }
    properties.push({name: 'BATCH_ID', alignment: 2, bytes: batchIdBytes});
  }

  const json: Record<string, unknown> = {
    ...(tile.featureTableJson || {}),
    POINTS_LENGTH: pointCount
  };
  if (batchIds) {
    json.BATCH_LENGTH = batchLength;
  }
  const binaryByteLength = getPointCloudFeatureTableByteLength(properties);
  const binary = new Uint8Array(binaryByteLength);
  let byteOffset = 0;
  for (const property of properties) {
    byteOffset = align(byteOffset, property.alignment);
    json[property.name] = {byteOffset};
    binary.set(property.bytes, byteOffset);
    byteOffset += property.bytes.byteLength;
  }
  return {json, binary};
}

/** Measures the aligned feature-table binary payload. */
function getPointCloudFeatureTableByteLength(
  properties: readonly {alignment: number; bytes: Uint8Array}[]
): number {
  let byteLength = 0;
  for (const property of properties) {
    byteLength = align(byteLength, property.alignment) + property.bytes.byteLength;
  }
  return byteLength;
}

/** Aligns a binary property offset to its component width. */
function align(byteOffset: number, alignment: number): number {
  return Math.ceil(byteOffset / alignment) * alignment;
}

/** Encodes position and normal components as little-endian float32 values. */
function encodeFloat32Array(values: ArrayLike<number>): Uint8Array {
  const bytes = new Uint8Array(values.length * 4);
  const dataView = new DataView(bytes.buffer);
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (!Number.isFinite(value)) {
      throw new Error('3D Tiles point cloud attributes must contain finite values');
    }
    dataView.setFloat32(index * 4, value, true);
  }
  return bytes;
}

/** Converts normalized or byte color components to the PNTS uint8 representation. */
function encodeColorBytes(
  colors: ArrayLike<number>,
  normalized: boolean,
  pointCount: number,
  colorSize: number
): Uint8Array {
  if (colors.length !== pointCount * colorSize) {
    throw new Error('3D Tiles point cloud color count does not match the position count');
  }
  const bytes = new Uint8Array(colors.length);
  for (let index = 0; index < colors.length; index++) {
    const value = colors[index];
    const scaledValue = normalized ? value * 255 : value;
    if (!Number.isFinite(scaledValue) || scaledValue < 0 || scaledValue > 255) {
      throw new Error('3D Tiles point cloud color components must be between 0 and 255');
    }
    bytes[index] = Math.round(scaledValue);
  }
  return bytes;
}
