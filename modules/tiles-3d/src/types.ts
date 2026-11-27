// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Vector3} from '@math.gl/core/matrix';
import type {Plane} from '@math.gl/geometry/culling';

export type BoundingRectangle = {
  width: number;
  height: number;
};

/** Deck.gl Viewport instance type.
 * We can't import it from Deck.gl to avoid circular reference */
export type Viewport = {
  id: string;
  cameraPosition: number[] | Vector3;
  height: number;
  width: number;
  zoom: number;
  /** Perspective vertical field of view in degrees, when exposed by the viewport. */
  fovy?: number;
  /** Whether this viewport uses an orthographic projection. */
  orthographic?: boolean;
  /**
   * World-space meters represented by one logical/CSS pixel at the viewport's current scale.
   * Orthographic 3D Tiles traversal requires a positive, finite value to calculate SSE.
   */
  metersPerPixel?: number;
  /** Optional world-space clipping planes used to cull renderable tile content. */
  clippingPlanes?: Plane[];
  distanceScales: {
    unitsPerMeter: number[];
    metersPerUnit: number[];
  };
  center: number[] | Vector3;
  unprojectPosition: (position: number[] | Vector3) => [number, number, number];
  project: (coorinates: number[] | Vector3) => number[];
};

/** Viewport used for 3D tileset traversal. */
export type TraversalViewport = Viewport & {
  /** Camera direction in common space, when supplied by the viewport. */
  cameraDirection?: number[];
  /** Camera up direction in common space, when supplied by the viewport. */
  cameraUp?: number[];
  /** Camera target offset in meters from longitude/latitude, including elevation. */
  position?: number[];
  /** Camera target longitude in degrees. Traversal unprojects `center` if it is missing. */
  longitude?: number;
  /** Camera target latitude in degrees. Traversal unprojects `center` if it is missing. */
  latitude?: number;
  /** Camera bearing in degrees. */
  bearing?: number;
  /**
   * Returns the same view with zero pitch for I3S tile sizing.
   * Supply this hook if the viewport cannot be rebuilt from geographic camera options.
   */
  getTopDownViewport?: () => TraversalViewport;
};

/** Traversal viewport with a geographic camera target and explicit orientation. */
export interface GeospatialViewport extends TraversalViewport {
  /** Camera direction in common space. */
  cameraDirection: [number, number, number];
  /** Camera up direction in common space. */
  cameraUp: [number, number, number];
  /** Camera target longitude in degrees. */
  longitude: number;
  /** Camera target latitude in degrees. */
  latitude: number;
  /** Camera bearing in degrees. */
  bearing: number;
  /** Returns the same geographic view with zero pitch. */
  getTopDownViewport?: () => GeospatialViewport;
}
