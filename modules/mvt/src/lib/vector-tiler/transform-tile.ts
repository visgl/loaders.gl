// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import type {ProtoTile} from './proto-tile';

/**
 * Transforms the coordinates of each protoFeature in the given protoTile from
 * mercator-projected space into (extent x extent) protoTile space.
 */
export function transformTile(protoTile: ProtoTile, extent: number): ProtoTile {
  if (protoTile.transformed) {
    return protoTile;
  }

  const z2 = 1 << protoTile.z;
  const tx = protoTile.x;
  const ty = protoTile.y;

  for (const protoFeature of protoTile.protoFeatures) {
    const geom = protoFeature.geometry;
    const simplifiedType = protoFeature.simplifiedType;

    protoFeature.geometry = [];

    if (simplifiedType === 1) {
      for (let j = 0; j < geom.length; j += 2) {
        protoFeature.geometry.push(transformPoint(geom[j], geom[j + 1], extent, z2, tx, ty));
      }
    } else {
      for (let j = 0; j < geom.length; j++) {
        const ring: number[][] = [];
        for (let k = 0; k < geom[j].length; k += 2) {
          ring.push(transformPoint(geom[j][k], geom[j][k + 1], extent, z2, tx, ty));
        }
        protoFeature.geometry.push(ring);
      }
    }
  }

  protoTile.transformed = true;

  return protoTile;
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
