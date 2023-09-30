// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import type {GeoJSONTile} from './tile';

/**
 * Transforms the coordinates of each feature in the given tile from
 * mercator-projected space into (extent x extent) tile space.
 */
export function transformTile(tile: GeoJSONTile, extent: number): GeoJSONTile {
  if (tile.transformed) {
    return tile;
  }

  const z2 = 1 << tile.z;
  const tx = tile.x;
  const ty = tile.y;

  for (const feature of tile.features) {
    const geometry = feature.geometry;
    const type = feature.type;

    feature.geometry = [];

    if (type === 1) {
      for (let j = 0; j < geometry.length; j += 2) {
        feature.geometry.push(transformPoint(geometry[j], geometry[j + 1], extent, z2, tx, ty));
      }
    } else {
      for (let j = 0; j < geometry.length; j++) {
        const ring: number[][] = [];
        for (let k = 0; k < geometry[j].length; k += 2) {
          ring.push(transformPoint(geometry[j][k], geometry[j][k + 1], extent, z2, tx, ty));
        }
        feature.geometry.push(ring);
      }
    }
  }

  tile.transformed = true;

  return tile;
}

// eslint-disable-next-line max-params
function transformPoint(
  x: number,
  y: number,
  extent: number,
  z2: number,
  tx: number,
  ty: number
): number[] {
  return [Math.round(extent * (x * z2 - tx)), Math.round(extent * (y * z2 - ty))];
}
