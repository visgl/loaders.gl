// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  createBoundedMemoryTileConversionSink,
  TileConversionError
} from '@loaders.gl/tile-converter/v5/core';
import type {
  BrowserTileConversionFile,
  TileConversionSink
} from '@loaders.gl/tile-converter/v5/core';
import type {EncodedPointCloudSourceTile} from './point-cloud-source-encoder.js';

/** Output limits and geometric error for independent ECEF point tiles. */
export interface PointCloudTilesetSinkOptions {
  /** Maximum retained PNTS and tileset JSON bytes, excluding peak serialization memory. */
  readonly maxTotalBytes: number;
  /** Maximum independent tile placements retained by the sink. */
  readonly maxTiles: number;
  /** Leaf error in meters, including source sampling error and measured position rounding. */
  readonly geometricError: number;
}

/** Atomic flat 3D Tiles package suitable for the existing 3TZ archive adapter. */
export interface PointCloudTilesetSink extends TileConversionSink<EncodedPointCloudSourceTile> {
  /** Returns named PNTS files and tileset.json after successful finalization; empty after abort. */
  getFiles(): readonly BrowserTileConversionFile[];
}

/**
 * Packages independent point tiles as a bounded 3D Tiles 1.0 collection with an ADD root.
 * Requires unmodified encoder outputs in declared EPSG:4978 xyz meters and ellipsoidal heights,
 * cartesian positions, zero source origin and no additional placement transform. PNTS RTC_CENTER
 * is already encoded and is applied once to bounds. Geographic/projected/offset source frames
 * must be converted before this sink. This authors a flat partial dataset, not source LOD;
 * callers must select independent, non-overlapping samples and supply their sampling error.
 * Use createTileConversionArchive with format 3tz to package the finalized files.
 * @param options - Retained byte/tile limits and explicit leaf geometric error.
 * @returns A sink exposing the completed package atomically.
 */
export function createPointCloudTilesetSink(
  options: PointCloudTilesetSinkOptions
): PointCloudTilesetSink {
  const {maxTiles, geometricError} = options;
  if (
    !Number.isSafeInteger(maxTiles) ||
    maxTiles < 1 ||
    !Number.isFinite(geometricError) ||
    geometricError < 0
  ) {
    throw new TileConversionError(
      'POINT_CLOUD_TILESET_OPTIONS_INVALID',
      'Positive maxTiles and finite nonnegative geometricError are required'
    );
  }
  const memory = createBoundedMemoryTileConversionSink(options);
  const children: {
    boundingVolume: {box: number[]};
    geometricError: number;
    content: {uri: string};
  }[] = [];
  const identifiers = new Set<string>();
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  let state: 'open' | 'writing' | 'closed' = 'open';
  let completed = false;

  return {
    /** Exposes finalized files without exposing a partial package. */
    getFiles: () => (completed ? memory.getFiles() : []),
    /** Captures one validated placement and encoded PNTS resource. */
    async write(resource, signal) {
      signal?.throwIfAborted();
      if (state !== 'open')
        throw new TileConversionError(
          'POINT_CLOUD_TILESET_SINK_UNAVAILABLE',
          'Point sink is busy or closed'
        );
      if (!resource.id || identifiers.has(resource.id) || children.length >= maxTiles) {
        throw new TileConversionError(
          'POINT_CLOUD_TILESET_PLACEMENT_INVALID',
          'Placements require unique nonempty identifiers within maxTiles'
        );
      }
      const [lower, upper] = getPointTileBounds(resource, geometricError);
      const resourceId = `points/${children.length}.pnts`;
      state = 'writing';
      await memory.write(
        {resourceId, parts: [resource.pnts], contentType: 'application/octet-stream'},
        signal
      );
      if (state !== 'writing')
        throw new TileConversionError(
          'POINT_CLOUD_TILESET_SINK_UNAVAILABLE',
          'Point sink was aborted during writing'
        );
      children.push({
        boundingVolume: {box: createPointBoundsBox(lower, upper)},
        geometricError,
        content: {uri: resourceId}
      });
      identifiers.add(resource.id);
      for (let axis = 0; axis < 3; axis++) {
        minimum[axis] = Math.min(minimum[axis], lower[axis]);
        maximum[axis] = Math.max(maximum[axis], upper[axis]);
      }
      state = 'open';
    },
    /** Serializes the enclosing root after all placements have completed. */
    async finalize(report) {
      if (state !== 'open' || !children.length)
        throw new TileConversionError(
          'POINT_CLOUD_TILESET_SINK_INCOMPLETE',
          'Finalization requires successfully written point tiles'
        );
      state = 'writing';
      const rootError = Math.max(
        geometricError,
        Math.hypot(...minimum.map((value, axis) => maximum[axis] - value))
      );
      if (!Number.isFinite(rootError))
        throw new TileConversionError(
          'POINT_CLOUD_TILESET_BOUNDS_INVALID',
          'Enclosing bounds must have a finite diagonal'
        );
      const json = JSON.stringify({
        asset: {version: '1.0'},
        geometricError: rootError,
        root: {
          boundingVolume: {box: createPointBoundsBox(minimum, maximum)},
          geometricError: rootError,
          refine: 'ADD',
          children
        }
      });
      await memory.write({
        resourceId: 'tileset.json',
        parts: [json],
        contentType: 'application/json'
      });
      if (state !== 'writing')
        throw new TileConversionError(
          'POINT_CLOUD_TILESET_SINK_UNAVAILABLE',
          'Point sink was aborted during finalization'
        );
      await memory.finalize(report);
      if (state !== 'writing')
        throw new TileConversionError(
          'POINT_CLOUD_TILESET_SINK_UNAVAILABLE',
          'Point sink was aborted during finalization'
        );
      state = 'closed';
      completed = true;
    },
    /** Clears resource and hierarchy storage on failure or cancellation. */
    async abort(error) {
      state = 'closed';
      completed = false;
      children.length = 0;
      identifiers.clear();
      await memory.abort(error);
    }
  };
}

/** Validates the declared frame and returns bounds reconstructed from trusted encoded positions. */
function getPointTileBounds(resource: EncodedPointCloudSourceTile, geometricError: number) {
  const reference = resource.spatialReference;
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  if (
    !reference ||
    !['native', 'transformed'].includes(reference.status) ||
    (reference.targetCrs || reference.sourceCrs) !== 'EPSG:4978' ||
    (reference.targetHeightReference === 'native'
      ? reference.heightReference
      : reference.targetHeightReference) !== 'ellipsoidal' ||
    resource.coordinateSystem !== 'cartesian' ||
    resource.cartographicOrigin.length !== 3 ||
    resource.cartographicOrigin.some(value => value !== 0) ||
    (resource.modelMatrix &&
      (resource.modelMatrix.length !== 16 ||
        resource.modelMatrix.some((value, index) => value !== identity[index]))) ||
    (reference.status === 'native' &&
      (reference.coordinateFrame !== 'geocentric' ||
        reference.axisOrder !== 'xyz' ||
        reference.verticalUnitScale !== 1 ||
        reference.units?.some(unit => unit !== 'meter')))
  ) {
    throw new TileConversionError(
      'POINT_CLOUD_TILESET_FRAME_UNSUPPORTED',
      'Point tiles require declared EPSG:4978 xyz meters, ellipsoidal heights and no additional source placement'
    );
  }
  if (
    !Number.isFinite(resource.maximumPositionError) ||
    resource.maximumPositionError < 0 ||
    resource.maximumPositionError > geometricError
  ) {
    throw new TileConversionError(
      'POINT_CLOUD_GEOMETRIC_ERROR_INVALID',
      'geometricError must include measured position reconstruction error'
    );
  }
  const [minimum, maximum] = resource.localBoundingBox;
  const center = resource.rtcCenter;
  if (
    center.length !== 3 ||
    minimum.length !== 3 ||
    maximum.length !== 3 ||
    [...center, ...minimum, ...maximum].some(value => !Number.isFinite(value)) ||
    minimum.some((value, axis) => value > maximum[axis])
  ) {
    throw new TileConversionError(
      'POINT_CLOUD_TILESET_BOUNDS_INVALID',
      'RTC center and encoded xyz bounds must be finite and ordered'
    );
  }
  const lower = minimum.map((value, axis) => value + center[axis]);
  const upper = maximum.map((value, axis) => value + center[axis]);
  if ([...lower, ...upper].some(value => !Number.isFinite(value)))
    throw new TileConversionError(
      'POINT_CLOUD_TILESET_BOUNDS_INVALID',
      'Reconstructed ECEF bounds must be finite'
    );
  return [lower, upper] as const;
}

/** Creates an axis-aligned 3D Tiles box in the PNTS position frame without glTF axis rotation. */
function createPointBoundsBox(minimum: readonly number[], maximum: readonly number[]): number[] {
  const center = minimum.map((value, axis) => value / 2 + maximum[axis] / 2);
  const halfSize = minimum.map((value, axis) => maximum[axis] / 2 - value / 2);
  return [center[0], center[1], center[2], halfSize[0], 0, 0, 0, halfSize[1], 0, 0, 0, halfSize[2]];
}
