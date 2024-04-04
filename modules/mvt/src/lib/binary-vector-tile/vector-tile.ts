// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import {BinaryVectorTileLayer} from './vector-tile-layer';
import Protobuf from 'pbf';

export class BinaryVectorTile {
  layers: {[x: string]: BinaryVectorTileLayer};
  constructor(pbf: Protobuf, end?: number) {
    this.layers = pbf.readFields(readTile, {}, end);
  }
}

/**
 *
 * @param tag
 * @param layers
 * @param pbf
 */
function readTile(
  tag: number,
  layers?: {[x: string]: BinaryVectorTileLayer},
  pbf?: Protobuf
): void {
  if (tag === 3) {
    if (pbf) {
      const layer = new BinaryVectorTileLayer(pbf, pbf.readVarint() + pbf.pos);
      if (layer.length && layers) {
        layers[layer.name] = layer;
      }
    }
  }
}
