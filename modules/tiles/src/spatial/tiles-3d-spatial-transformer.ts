// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SpatialCoordinateTransformer} from './spatial-coordinate-transformer';
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

  /** Creates a 3D Tiles transformer for a requested target CRS. */
  constructor(spatialReference: TilesetSpatialReference, options: TilesetSpatialOptions = {}) {
    this.coordinateTransformer = new SpatialCoordinateTransformer(spatialReference, options);
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
  transformBoundingVolume(volume: Tiles3DSpatialBoundingVolume): Tiles3DSpatialBoundingVolume {
    const samples = getVolumeSamples(volume);
    if (!samples.length) {
      return volume;
    }
    const transformed = samples.map(sample => this.coordinateTransformer.transformPosition(sample));
    return {box: createAxisAlignedBox(transformed)};
  }
}

function getVolumeSamples(volume: Tiles3DSpatialBoundingVolume): number[][] {
  if (volume.box && volume.box.length >= 12) {
    const center = volume.box.slice(0, 3);
    const axes = [volume.box.slice(3, 6), volume.box.slice(6, 9), volume.box.slice(9, 12)];
    const samples: number[][] = [];
    for (const first of [-1, 1]) {
      for (const second of [-1, 1]) {
        for (const third of [-1, 1]) {
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
    return [
      [x - radius, y, z],
      [x + radius, y, z],
      [x, y - radius, z],
      [x, y + radius, z],
      [x, y, z - radius],
      [x, y, z + radius]
    ];
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
  const center = [
    (minimum[0] + maximum[0]) / 2,
    (minimum[1] + maximum[1]) / 2,
    (minimum[2] + maximum[2]) / 2
  ];
  return [
    ...center,
    (maximum[0] - minimum[0]) / 2,
    0,
    0,
    0,
    (maximum[1] - minimum[1]) / 2,
    0,
    0,
    0,
    (maximum[2] - minimum[2]) / 2
  ];
}
