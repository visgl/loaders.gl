// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Vector3} from '@math.gl/core';
import type {Plane} from '@math.gl/culling';

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

/**
 * Contain extra fields from WebMercatorViewport and FirstPersonViewport
 */
export type GeospatialViewport = Viewport & {
  /** @todo This field is not represented in Deck.gl viewports. Can be removed in the next version */
  cameraDirection: [number, number, number];
  /** @todo This field is not represented in Deck.gl viewports. Can be removed in the next version */
  cameraUp: [number, number, number];
  longitude: number;
  latitude: number;
  bearing: number;
};
