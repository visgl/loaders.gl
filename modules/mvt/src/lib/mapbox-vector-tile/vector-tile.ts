// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import VectorTileLayer from './vector-tile-layer';
import Protobuf from 'pbf';

export default class VectorTile {
  layers: {[x: string]: VectorTileLayer};
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
function readTile(tag: number, layers?: {[x: string]: VectorTileLayer}, pbf?: Protobuf): void {
  if (tag === 3) {
    if (pbf) {
      const layer = new VectorTileLayer(pbf, pbf.readVarint() + pbf.pos);
      if (layer.length && layers) {
        layers[layer.name] = layer;
      }
    }
  }
}
