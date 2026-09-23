// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MapViewState} from '@deck.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

/** Creates a camera target at the tileset center while preserving explicit example placement. */
export function createTilesetViewState(
  tileset: {
    /** Geographic viewing target; its elevation is not necessarily terrain height. */
    cartographicCenter: ArrayLike<number>;
    /** Initial zoom estimated from the tileset bounds. */
    zoom: number;
  },
  defaultViewState: MapViewState,
  preferredViewState: Partial<MapViewState> = {}
): MapViewState & Required<Pick<MapViewState, 'bearing' | 'pitch'>> {
  const {cartographicCenter, zoom} = tileset;
  // Tiles3DSource uses this finite sentinel when a global root's Cartesian center is [0, 0, 0].
  const elevation =
    Number.isFinite(cartographicCenter[2]) && cartographicCenter[2] !== -Ellipsoid.WGS84.radii[0]
      ? cartographicCenter[2]
      : 0;
  return {
    ...defaultViewState,
    longitude: cartographicCenter[0],
    latitude: cartographicCenter[1],
    position: preferredViewState.position ?? [0, 0, elevation],
    zoom: preferredViewState.zoom ?? zoom,
    bearing: preferredViewState.bearing ?? defaultViewState.bearing ?? 0,
    pitch: preferredViewState.pitch ?? defaultViewState.pitch ?? 0
  };
}
