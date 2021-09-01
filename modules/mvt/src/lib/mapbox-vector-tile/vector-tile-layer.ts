/* eslint-disable indent */
// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import Protobuf from 'pbf';
import VectorTileFeature from './vector-tile-feature';

export default class VectorTileLayer {
  version: number;
  name: string;
  extent: number;
  length: number;
  _pbf: Protobuf;
  _keys: string[];
  _values: (string | number | boolean | null)[];
  _features: number[];
  constructor(pbf: Protobuf, end: number) {
    // Public
    this.version = 1;
    this.name = '';
    this.extent = 4096;
    this.length = 0;

    // Private
    this._pbf = pbf;
    this._keys = [];
    this._values = [];
    this._features = [];

    pbf.readFields(readLayer, this, end);

    this.length = this._features.length;
  }

  /**
   * return feature `i` from this layer as a `VectorTileFeature`
   * @param index
   * @returns feature
   */

  feature(i: number): VectorTileFeature {
    if (i < 0 || i >= this._features.length) {
      throw new Error('feature index out of bounds');
    }

    this._pbf.pos = this._features[i];

    const end = this._pbf.readVarint() + this._pbf.pos;
    return new VectorTileFeature(this._pbf, end, this.extent, this._keys, this._values);
  }
}

/**
 *
 * @param tag
 * @param layer
 * @param pbf
 */
function readLayer(tag: number, layer?: VectorTileLayer, pbf?: Protobuf): void {
  if (layer && pbf) {
    if (tag === 15) layer.version = pbf.readVarint();
    else if (tag === 1) layer.name = pbf.readString();
    else if (tag === 5) layer.extent = pbf.readVarint();
    else if (tag === 2) layer._features.push(pbf.pos);
    else if (tag === 3) layer._keys.push(pbf.readString());
    else if (tag === 4) layer._values.push(readValueMessage(pbf));
  }
}

/**
 *
 * @param pbf
 * @returns value
 */
function readValueMessage(pbf: Protobuf) {
  let value: string | number | boolean | null = null;
  const end = pbf.readVarint() + pbf.pos;

  while (pbf.pos < end) {
    const tag = pbf.readVarint() >> 3;

    value =
      tag === 1
        ? pbf.readString()
        : tag === 2
        ? pbf.readFloat()
        : tag === 3
        ? pbf.readDouble()
        : tag === 4
        ? pbf.readVarint64()
        : tag === 5
        ? pbf.readVarint()
        : tag === 6
        ? pbf.readSVarint()
        : tag === 7
        ? pbf.readBoolean()
        : null;
  }

  return value;
}
