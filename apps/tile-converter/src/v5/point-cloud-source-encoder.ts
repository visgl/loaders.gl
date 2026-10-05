// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  PointCloudBoundingVolume,
  PointCloudCoordinateSystem,
  PointCloudTilesetSource,
  TilesetSpatialReference
} from '@loaders.gl/tiles';
import {encodePointCloudTile} from './point-cloud.js';
import type {EncodePointCloudTileOptions} from './point-cloud.js';
import {traversePointCloudSource} from '@loaders.gl/tile-converter/v5/core';
import type {
  PointCloudSourceTile,
  TraversePointCloudSourceOptions
} from '@loaders.gl/tile-converter/v5/core';

/** Traversal and per-tile encoding options for a point-cloud source. */
export type EncodePointCloudSourceOptions = TraversePointCloudSourceOptions & {
  /** Select encoder options for each source tile with content, using its header and decoded data. */
  readonly getTileEncodingOptions?: (
    sourceTile: PointCloudSourceTile
  ) => EncodePointCloudTileOptions;
};

/** A PNTS resource paired with the source placement metadata needed to package its tile. */
export type EncodedPointCloudSourceTile = {
  /** Stable source tile identifier. */
  readonly id: string;
  /** Original source hierarchy and bounds. */
  readonly header: PointCloudSourceTile['header'];
  /** Encoded point-cloud tile content. */
  readonly pnts: ArrayBuffer;
  /** Number of point records encoded. */
  readonly pointCount: number;
  /** Coordinate system used by the returned point positions. */
  readonly coordinateSystem: PointCloudCoordinateSystem;
  /** Origin to add to source-relative point positions. */
  readonly cartographicOrigin: readonly number[];
  /** Optional placement transform supplied by the point-cloud source. */
  readonly modelMatrix?: readonly number[];
  /** Optional source or target CRS metadata. */
  readonly spatialReference?: TilesetSpatialReference;
  /** Optional output-frame tile bounds supplied by the source. */
  readonly spatialBoundingVolume?: PointCloudBoundingVolume;
};

/**
 * Encodes a point-cloud source as a stream of PNTS resources, one for each non-empty source tile.
 *
 * @param source - An I3S, COPC, or compatible point-cloud tileset source.
 * @param options - Optional traversal depth limit, cancellation signal, and per-tile encoder options.
 * @returns Encoded source tiles in deterministic depth-first order.
 */
export async function* encodePointCloudSource(
  source: PointCloudTilesetSource,
  options: EncodePointCloudSourceOptions = {}
): AsyncIterableIterator<EncodedPointCloudSourceTile> {
  for await (const sourceTile of traversePointCloudSource(source, options)) {
    const encodingOptions = sourceTile.content
      ? options.getTileEncodingOptions?.(sourceTile)
      : undefined;
    const encodedTile = encodePointCloudSourceTile(sourceTile, encodingOptions);
    if (encodedTile) {
      yield encodedTile;
    }
  }
}

/**
 * Encodes one decoded source tile as PNTS and retains its hierarchy and placement metadata.
 *
 * Positions use the source coordinate system, with an optional RTC center subtracted before float32
 * encoding and stored in the PNTS feature table. Source placement metadata is retained so callers
 * can assemble the output tileset. This function does not transform the source CRS.
 *
 * @param sourceTile - Tile header and decoded Arrow point content from `traversePointCloudSource`.
 * @param options - Optional RTC center, batch-table values, and constant color override.
 * @returns An encoded source tile, or null when the source tile has no content.
 */
export function encodePointCloudSourceTile(
  sourceTile: PointCloudSourceTile,
  options: EncodePointCloudTileOptions = {}
): EncodedPointCloudSourceTile | null {
  const {header, content} = sourceTile;
  if (!content) {
    return null;
  }

  return {
    id: header.id,
    header,
    pnts: encodePointCloudTile(content.data, {
      ...options,
      constantRGBA: options.constantRGBA ?? content.constantRGBA
    }),
    pointCount: content.pointCount,
    coordinateSystem: content.coordinateSystem,
    cartographicOrigin: [...content.cartographicOrigin],
    modelMatrix: content.modelMatrix ? Array.from(content.modelMatrix) : undefined,
    spatialReference: content.spatialReference,
    spatialBoundingVolume: content.spatialBoundingVolume || header.spatialBoundingVolume
  };
}
