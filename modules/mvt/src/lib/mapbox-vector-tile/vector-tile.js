// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import VectorTileLayer from './vector-tile-layer';

export default class VectorTile {
  constructor(pbf, end) {
    this.layers = pbf.readFields(readTile, {}, end);
  }
}

function readTile(tag, layers, pbf) {
  if (tag === 3) {
    const layer = new VectorTileLayer(pbf, pbf.readVarint() + pbf.pos);
    if (layer.length) {
      layers[layer.name] = layer;
    }
  }
}
