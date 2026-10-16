// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TerrainHeightmap} from './terrain-heightmap-types';

/** Georeferencing supplied by a source, never inferred from a provider name. */
export type TerrainGridMetadata = {
  /** West, south, east, north in unwrapped EPSG:3857 meters; row zero is north. */
  readonly bounds: readonly [number, number, number, number];
  /** Pixel centers or samples including both footprint edges. */
  readonly registration: 'pixel-center' | 'grid-node';
  /** Physical height reference; this API does not convert vertical datums. */
  readonly verticalDatum: 'ellipsoidal' | 'orthometric' | 'unknown';
};

/** Physical source meters, independent of projection, display relief and mesh resolution. */
export type TerrainHeightGrid = TerrainHeightmap &
  TerrainGridMetadata & {
    /** One byte per sample: zero is missing; invalid heights are NaN. Alpha is not inferred. */
    readonly valid: Uint8Array;
  };

/** Ray coordinates must match the queried surface; direction need not be normalized. */
export type TerrainRay = {
  /** Absolute content-space origin, before camera or room-placement transforms. */
  readonly origin: readonly [number, number, number];
  /** Nonzero finite direction. */
  readonly direction: readonly [number, number, number];
};

/** Displayed triangle intersection retaining unexaggerated source elevation. */
export type TerrainSurfaceHit = {
  /** Displayed position in the surface coordinate system. */
  readonly position: readonly [number, number, number];
  /** Longitude/latitude degrees and physical source elevation meters, not displayed altitude. */
  readonly coordinate: readonly [number, number, number];
  /** Nonnegative distance in surface units, independent of input direction length. */
  readonly distance: number;
  /** Unit normal following displayed triangle winding. */
  readonly normal: readonly [number, number, number];
  /** Original triangle offset, not a feature ID. */
  readonly triangleIndex: number;
  /** Weights in the triangle's original vertex order. */
  readonly barycentric: readonly [number, number, number];
};

/** Conservative content-space envelope of every queryable triangle. */
export type TerrainSurfaceBounds = {
  /** Closed lower corner. */
  readonly minimum: readonly [number, number, number];
  /** Closed upper corner. */
  readonly maximum: readonly [number, number, number];
};

/**
 * Structural query boundary, without a renderer, deck viewport, loader or spatial-index owner.
 * Mercator XY and Z use meters. Globe coordinates are center-relative in caller-defined
 * common units; all rays, positions, bounds and distances must use those same units.
 */
export type TerrainSurface = {
  /** Surface coordinate convention; globe scale is defined by the host adapter. */
  readonly projection: 'web-mercator' | 'globe';
  /** Nearest displayed hit within inclusive maxDistance; null means no loaded hit, not coverage. */
  intersectRay(ray: TerrainRay, maxDistance?: number): TerrainSurfaceHit | null;
  /** Optional conservative envelope; null denotes an empty surface. */
  getBounds?(): TerrainSurfaceBounds | null;
};
