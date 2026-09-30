// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Tile3DWriter, TILE3D_TYPE} from '@loaders.gl/3d-tiles';
import type {Mesh, MeshArrowTable, MeshAttribute} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {TileConversionError} from './conversion-api.js';

/** Options for encoding one Arrow or mesh point batch as a 3D Tiles point tile. */
export interface EncodePointCloudTileOptions {
  /** Optional origin subtracted from absolute positions and stored as the PNTS RTC_CENTER. */
  readonly rtcCenter?: readonly [number, number, number];
  /** Optional source-wide RGBA color stored as the PNTS CONSTANT_RGBA property. */
  readonly constantRGBA?: readonly number[];
  /** Optional per-point values indexed by the tile's `BATCH_ID` attribute. */
  readonly batchTableJson?: Readonly<Record<string, readonly (string | number)[]>>;
}

/**
 * Encodes one mesh or Mesh Arrow point batch as a PNTS resource.
 *
 * The input position field must be named `POSITION` and contain xyz values. `COLOR_0` or `COLOR`
 * is written when present; `constantRGBA` supplies a fallback PNTS `CONSTANT_RGBA` feature-table
 * property. `NORMAL` and `BATCH_ID` are also written when present. Arrow batches should be passed
 * one at a time so callers can bound memory and apply their own tiling and output policy.
 * Unsupported attributes, including a second color attribute, fail instead of being discarded.
 *
 * @param pointBatch - Point data produced by a LAS, COPC, I3S, or other point source.
 * @param options - Optional RTC center and batch-table values.
 * @returns A 3D Tiles PNTS resource.
 */
export function encodePointCloudTile(
  pointBatch: Mesh | MeshArrowTable,
  options: EncodePointCloudTileOptions = {}
): ArrayBuffer {
  const mesh = 'attributes' in pointBatch ? pointBatch : convertTableToMesh(pointBatch);
  validatePointAttributes(mesh.attributes);
  const positionAttribute = mesh.attributes.POSITION;
  if (!positionAttribute || positionAttribute.size !== 3) {
    throw new TileConversionError(
      'POINT_CLOUD_POSITION_REQUIRED',
      'Point cloud batches must contain a three-component POSITION attribute'
    );
  }

  const positions = getPositionValues(positionAttribute, options.rtcCenter);
  const pointCount = positions.length / 3;
  if (pointCount === 0 || !Number.isInteger(pointCount)) {
    throw new TileConversionError(
      'POINT_CLOUD_POSITION_COUNT_INVALID',
      'Point cloud POSITION must contain one or more xyz triples'
    );
  }

  const colors = getColorAttribute(mesh.attributes.COLOR_0 || mesh.attributes.COLOR, pointCount);
  const constantRGBA = colors ? null : getConstantRgba(options.constantRGBA);
  const normals = getNormalAttribute(mesh.attributes.NORMAL, pointCount);
  const batchIds = getBatchIds(mesh.attributes.BATCH_ID, pointCount);
  const batchTableJson = validateBatchTable(options.batchTableJson, batchIds);

  return Tile3DWriter.encodeSync(
    {
      type: TILE3D_TYPE.POINT_CLOUD,
      featureTableJson:
        options.rtcCenter || constantRGBA
          ? {
              ...(options.rtcCenter ? {RTC_CENTER: [...options.rtcCenter]} : {}),
              ...(constantRGBA ? {CONSTANT_RGBA: constantRGBA} : {})
            }
          : undefined,
      batchTableJson,
      attributes: {positions, colors, normals, batchIds}
    },
    {}
  );
}

/** Rejects attributes that this PNTS encoder would otherwise silently discard. */
function validatePointAttributes(attributes: Mesh['attributes']): void {
  const supportedAttributes = new Set([
    'POSITION',
    'NORMAL',
    'BATCH_ID',
    attributes.COLOR_0 ? 'COLOR_0' : 'COLOR'
  ]);
  const unsupportedAttributes = Object.keys(attributes).filter(
    name => !supportedAttributes.has(name)
  );
  if (unsupportedAttributes.length > 0) {
    throw new TileConversionError(
      'POINT_CLOUD_ATTRIBUTE_UNSUPPORTED',
      `PNTS encoding does not support these point attributes: ${unsupportedAttributes.join(', ')}`
    );
  }
}

/** Validates an optional source-wide PNTS RGBA color. */
function getConstantRgba(
  constantRGBA?: readonly number[]
): [number, number, number, number] | null {
  if (!constantRGBA) {
    return null;
  }
  if (
    constantRGBA.length !== 4 ||
    constantRGBA.some(value => !Number.isInteger(value) || value < 0 || value > 255)
  ) {
    throw new TileConversionError(
      'POINT_CLOUD_CONSTANT_RGBA_INVALID',
      'Point cloud constantRGBA must contain four unsigned byte values'
    );
  }
  return [constantRGBA[0], constantRGBA[1], constantRGBA[2], constantRGBA[3]];
}

/** Decodes positions and offsets them relative to the optional RTC center. */
function getPositionValues(
  attribute: MeshAttribute,
  rtcCenter?: readonly [number, number, number]
): Float32Array {
  if (rtcCenter && (rtcCenter.length !== 3 || rtcCenter.some(value => !Number.isFinite(value)))) {
    throw new TileConversionError(
      'POINT_CLOUD_RTC_CENTER_INVALID',
      'Point cloud RTC_CENTER must contain three finite values'
    );
  }
  const values = attribute.value;
  const result = new Float32Array(values.length);
  const transform = attribute.transform;
  for (let index = 0; index < values.length; index++) {
    const component = index % 3;
    const value = values[index];
    const absoluteValue =
      transform?.type === 'quantization'
        ? transform.origin[component] + (value / (2 ** transform.bits - 1)) * transform.range
        : value;
    result[index] = absoluteValue - (rtcCenter?.[component] ?? 0);
  }
  return result;
}

/** Converts an optional mesh color attribute into the byte colors accepted by PNTS. */
function getColorAttribute(
  attribute: MeshAttribute | undefined,
  pointCount: number
): {type: number; value: Uint8Array; size: number; normalized: boolean} | null {
  if (!attribute) {
    return null;
  }
  if (attribute.size !== 3 && attribute.size !== 4) {
    throw new TileConversionError(
      'POINT_CLOUD_COLOR_SIZE_UNSUPPORTED',
      'Point cloud color attributes must contain three or four components'
    );
  }
  if (attribute.value.length !== pointCount * attribute.size) {
    throw new TileConversionError(
      'POINT_CLOUD_COLOR_COUNT_MISMATCH',
      'Point cloud color count does not match the POSITION count'
    );
  }

  const colors = new Uint8Array(attribute.value.length);
  const maximum = getIntegerColorMaximum(attribute.value);
  for (let index = 0; index < attribute.value.length; index++) {
    const value = attribute.value[index];
    const scaledValue = maximum ? (value / maximum) * 255 : value <= 1 ? value * 255 : value;
    if (!Number.isFinite(scaledValue) || scaledValue < 0 || scaledValue > 255) {
      throw new TileConversionError(
        'POINT_CLOUD_COLOR_VALUE_INVALID',
        'Point cloud color components must be finite values from 0 through 255'
      );
    }
    colors[index] = Math.round(scaledValue);
  }
  return {type: 5121, value: colors, size: attribute.size, normalized: false};
}

/** Returns the maximum value represented by an integer color component array. */
function getIntegerColorMaximum(values: ArrayLike<number>): number | null {
  if (values instanceof Uint8Array || values instanceof Uint8ClampedArray) {
    return 255;
  }
  if (values instanceof Uint16Array) {
    return 65_535;
  }
  if (values instanceof Uint32Array) {
    return 4_294_967_295;
  }
  return null;
}

/** Returns float normals and rejects unsupported component shapes. */
function getNormalAttribute(
  attribute: MeshAttribute | undefined,
  pointCount: number
): {type: number; value: Float32Array; size: number} | null {
  if (!attribute) {
    return null;
  }
  if (attribute.size !== 3 || attribute.value.length !== pointCount * 3) {
    throw new TileConversionError(
      'POINT_CLOUD_NORMAL_COUNT_MISMATCH',
      'Point cloud normals must contain one xyz triple per position'
    );
  }
  return {type: 5126, value: Float32Array.from(attribute.value), size: 3};
}

/** Validates optional stable feature IDs for the PNTS uint16 batch-ID field. */
function getBatchIds(attribute: MeshAttribute | undefined, pointCount: number): Uint16Array | null {
  if (!attribute) {
    return null;
  }
  if (attribute.size !== 1 || attribute.value.length !== pointCount) {
    throw new TileConversionError(
      'POINT_CLOUD_BATCH_ID_COUNT_MISMATCH',
      'Point cloud BATCH_ID must contain one value per position'
    );
  }
  const batchIds = new Uint16Array(pointCount);
  for (let index = 0; index < pointCount; index++) {
    const batchId = attribute.value[index];
    if (!Number.isInteger(batchId) || batchId < 0 || batchId > 65_535) {
      throw new TileConversionError(
        'POINT_CLOUD_BATCH_ID_OUT_OF_RANGE',
        'Point cloud BATCH_ID values must be unsigned 16-bit integers'
      );
    }
    batchIds[index] = batchId;
  }
  return batchIds;
}

/** Checks that each batch-table property is indexable by the batch IDs used by this tile. */
function validateBatchTable(
  batchTableJson: EncodePointCloudTileOptions['batchTableJson'],
  batchIds: Uint16Array | null
): Record<string, (string | number)[]> | undefined {
  if (!batchTableJson) {
    if (batchIds) {
      throw new TileConversionError(
        'POINT_CLOUD_BATCH_TABLE_REQUIRED',
        'BATCH_ID values require matching batchTableJson properties'
      );
    }
    return undefined;
  }
  if (!batchIds) {
    throw new TileConversionError(
      'POINT_CLOUD_BATCH_ID_REQUIRED',
      'batchTableJson requires a BATCH_ID attribute'
    );
  }
  let batchLength = 0;
  for (const batchId of batchIds) {
    batchLength = Math.max(batchLength, batchId + 1);
  }
  const normalizedBatchTable: Record<string, (string | number)[]> = {};
  for (const [name, values] of Object.entries(batchTableJson)) {
    if (values.length !== batchLength) {
      throw new TileConversionError(
        'POINT_CLOUD_BATCH_TABLE_LENGTH_MISMATCH',
        `Batch table property "${name}" must contain ${batchLength} values`
      );
    }
    normalizedBatchTable[name] = [...values];
  }
  return normalizedBatchTable;
}
