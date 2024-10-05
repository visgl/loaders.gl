// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import type {MVTTile} from './mvt-types';
import {VectorTileLayer} from './vector-tile-layer';
import Protobuf from 'pbf';
import * as MVT from './mvt-constants';

export function parseTile(pbf: Protobuf, end?: number): MVTTile {
  const layers: Record<string, VectorTileLayer> = pbf.readFields(readTileFromProtobuf, {}, end);
  return {
    layers
  };
}

/**
 * Protobuf read callback for a top-level tile object
 * @param tag
 * @param layers
 * @param pbf
 */
function readTileFromProtobuf(
  tag: number,
  layers?: Record<string, VectorTileLayer>,
  pbf?: Protobuf
): void {
  if (!pbf) {
    return;
  }

  switch (tag as MVT.TileInfoType) {
    case MVT.TileInfoType.layers:
      const layer = new VectorTileLayer(pbf, pbf.readVarint() + pbf.pos);
      if (layer.length && layers) {
        layers[layer.name] = layer;
      }
      break;
    default:
    // ignore? log?
  }
}

// DEPRECATED

/** @deprecated Use MVTTile */
export class VectorTile {
  layers: Record<string, VectorTileLayer>;

  constructor(pbf: Protobuf, end?: number) {
    this.layers = pbf.readFields(readTileFromProtobuf, {}, end);
  }
}
