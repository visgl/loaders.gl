// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SpatialCoordinateTransformer} from './spatial-coordinate-transformer';
import {getSpatialCoordinateFrame} from './get-spatial-coordinate-frame';
import {Matrix4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import type {TilesetSpatialOptions, TilesetSpatialReference} from './spatial-types';

/** Structural 3D Tiles volume shape used by the source adapter. */
export type Tiles3DSpatialBoundingVolume = {
  box?: number[];
  sphere?: number[];
  region?: number[];
  [key: string]: unknown;
};

/**
 * Applies nonlinear CRS operations to 3D Tiles geometry bounds.
 *
 * Bounds are rebuilt from conservative samples. This intentionally produces an axis-aligned box
 * in the target frame; it is safe for culling and screen-space-error calculations even when the
 * source volume is rotated or the projection is nonlinear.
 */
export class Tiles3DSpatialTransformer {
  /** Normalized reference describing the completed operation. */
  readonly spatialReference: TilesetSpatialReference;
  private readonly coordinateTransformer: SpatialCoordinateTransformer;
  private readonly geographicCoordinateTransformer: SpatialCoordinateTransformer;

  /** Creates a 3D Tiles transformer for a requested target CRS. */
  constructor(spatialReference: TilesetSpatialReference, options: TilesetSpatialOptions = {}) {
    this.coordinateTransformer = new SpatialCoordinateTransformer(spatialReference, options);
    // 3D Tiles regions are always encoded as WGS84 longitude/latitude radians, independently
    // of the tileset's local CRS. Build a second pipeline for that fixed source frame.
    const geographicSpatialReference = {
      ...spatialReference,
      sourceCrs: 'EPSG:4326' as const,
      targetCrs: spatialReference.targetCrs || spatialReference.sourceCrs,
      coordinateFrame: 'geographic' as const,
      axisOrder: 'xy' as const
    };
    this.geographicCoordinateTransformer = new SpatialCoordinateTransformer(
      geographicSpatialReference,
      options
    );
    this.spatialReference = spatialReference;
  }

  /** Transform packed POSITION values into the target CRS. */
  transformPositions(positions: ArrayLike<number>): Float64Array {
    return this.coordinateTransformer.transformPositions(positions);
  }

  /** Transform packed NORMAL values using the corresponding source positions. */
  transformNormals(normals: ArrayLike<number>, positions: ArrayLike<number>): Float32Array {
    return this.coordinateTransformer.transformNormals(normals, positions);
  }

  /** Rebuild a conservative target-frame volume from a source volume. */
  transformBoundingVolume(
    volume: Tiles3DSpatialBoundingVolume,
    sourceTransform?: ArrayLike<number>
  ): Tiles3DSpatialBoundingVolume {
    const transform = sourceTransform ? new Matrix4(Array.from(sourceTransform)) : undefined;
    const samples = volume.region
      ? getRegionSamples(volume.region)
      : getVolumeSamples(volume).map(sample =>
          transform ? Array.from(transform.transformAsPoint(sample)) : sample
        );
    if (!samples.length) {
      return volume;
    }
    const transformed = volume.region
      ? samples.map(sample => this.transformRegionSample(sample))
      : samples.map(sample => this.coordinateTransformer.transformPosition(sample));
    return {box: createAxisAlignedBox(transformed)};
  }

  /** Transforms one WGS84 region sample into the selected output frame. */
  private transformRegionSample(sample: number[]): number[] {
    const [longitudeDegrees, latitudeDegrees, height] = sample;
    const targetCrs = this.spatialReference.targetCrs || this.spatialReference.sourceCrs;
    if (targetCrs && getSpatialCoordinateFrame(targetCrs) === 'geocentric') {
      const cartesian = Ellipsoid.WGS84.cartographicToCartesian([
        longitudeDegrees,
        latitudeDegrees,
        height
      ]);
      return Array.from(cartesian);
    }
    return this.geographicCoordinateTransformer.transformPosition(sample);
  }
}

/** Samples region corners, center lines, and both height planes in degrees/meters. */
function getRegionSamples(region: number[]): number[][] {
  if (region.length < 6 || region.some(value => !Number.isFinite(value))) {
    return [];
  }
  const [west, south, east, north, minimumHeight, maximumHeight] = region;
  const longitudeEnd = east < west ? east + Math.PI * 2 : east;
  const longitudes = getIntervalSamples(west, longitudeEnd);
  const latitudes = getIntervalSamples(south, north);
  const samples: number[][] = [];
  for (const longitude of longitudes) {
    for (const latitude of latitudes) {
      for (const height of [minimumHeight, maximumHeight]) {
        samples.push([(longitude * 180) / Math.PI, (latitude * 180) / Math.PI, height]);
      }
    }
  }
  return samples;
}

/** Includes interval endpoints and every quarter-turn where ECEF axes reach an extremum. */
function getIntervalSamples(start: number, end: number): number[] {
  const samples = [start, (start + end) / 2, end];
  const angularStep = Math.PI / 2;
  const firstCriticalIndex = Math.ceil(start / angularStep);
  const lastCriticalIndex = Math.floor(end / angularStep);
  for (
    let criticalIndex = firstCriticalIndex;
    criticalIndex <= lastCriticalIndex;
    criticalIndex++
  ) {
    samples.push(criticalIndex * angularStep);
  }
  return samples;
}

function getVolumeSamples(volume: Tiles3DSpatialBoundingVolume): number[][] {
  if (volume.box && volume.box.length >= 12) {
    const center = volume.box.slice(0, 3);
    const axes = [volume.box.slice(3, 6), volume.box.slice(6, 9), volume.box.slice(9, 12)];
    const samples: number[][] = [];
    for (let firstIndex = 0; firstIndex <= 4; firstIndex++) {
      for (let secondIndex = 0; secondIndex <= 4; secondIndex++) {
        for (let thirdIndex = 0; thirdIndex <= 4; thirdIndex++) {
          const first = firstIndex / 2 - 1;
          const second = secondIndex / 2 - 1;
          const third = thirdIndex / 2 - 1;
          samples.push([
            center[0] + first * axes[0][0] + second * axes[1][0] + third * axes[2][0],
            center[1] + first * axes[0][1] + second * axes[1][1] + third * axes[2][1],
            center[2] + first * axes[0][2] + second * axes[1][2] + third * axes[2][2]
          ]);
        }
      }
    }
    return samples;
  }
  if (volume.sphere && volume.sphere.length >= 4) {
    const [x, y, z, radius] = volume.sphere;
    const samples = [
      [x - radius, y, z],
      [x + radius, y, z],
      [x, y - radius, z],
      [x, y + radius, z],
      [x, y, z - radius],
      [x, y, z + radius]
    ];
    for (let longitudeIndex = 0; longitudeIndex < 16; longitudeIndex++) {
      const longitude = (longitudeIndex * Math.PI * 2) / 16;
      samples.push([x + radius * Math.cos(longitude), y + radius * Math.sin(longitude), z]);
    }
    return samples;
  }
  // Regions are already WGS84 geographic volumes. Keep them unchanged until a dedicated
  // geographic-region adapter can account for longitude wrapping and datum semantics.
  return [];
}

function createAxisAlignedBox(samples: number[][]): number[] {
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  for (const sample of samples) {
    for (let axis = 0; axis < 3; axis++) {
      minimum[axis] = Math.min(minimum[axis], sample[axis]);
      maximum[axis] = Math.max(maximum[axis], sample[axis]);
    }
  }
  const padding = [
    Math.max((maximum[0] - minimum[0]) * 0.01, 1e-9),
    Math.max((maximum[1] - minimum[1]) * 0.01, 1e-9),
    Math.max((maximum[2] - minimum[2]) * 0.01, 1e-9)
  ];
  const center = [
    (minimum[0] + maximum[0]) / 2,
    (minimum[1] + maximum[1]) / 2,
    (minimum[2] + maximum[2]) / 2
  ];
  return [
    ...center,
    (maximum[0] - minimum[0]) / 2 + padding[0],
    0,
    0,
    0,
    (maximum[1] - minimum[1]) / 2 + padding[1],
    0,
    0,
    0,
    (maximum[2] - minimum[2]) / 2 + padding[2]
  ];
}
