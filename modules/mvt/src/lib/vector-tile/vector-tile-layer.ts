// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/* eslint-disable indent */
// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import Protobuf from 'pbf';
import {GeojsonGeometryInfo} from '@loaders.gl/schema';
import * as MVT from './mvt-constants';
import {VectorTileFeature} from './vector-tile-feature';

/** @deprecated Use MVTLayer */
export class VectorTileLayer {
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

    pbf.readFields(readLayerFromProtobuf, this, end);

    this.length = this._features.length;
  }

  /**
   * return feature `i` from this layer as a `VectorTileFeature`
   * @param index
   * @returns feature
   */
  getGeoJSONFeature(i: number): VectorTileFeature {
    if (i < 0 || i >= this._features.length) {
      throw new Error('feature index out of bounds');
    }

    this._pbf.pos = this._features[i];

    const end = this._pbf.readVarint() + this._pbf.pos;
    return new VectorTileFeature(this._pbf, end, this.extent, this._keys, this._values);
  }

  /**
   * return binary feature `i` from this layer as a `VectorTileFeature`
   *
   * @param index
   * @param geometryInfo
   * @returns binary feature
   */
  getBinaryFeature(i: number, geometryInfo: GeojsonGeometryInfo): VectorTileFeature {
    if (i < 0 || i >= this._features.length) {
      throw new Error('feature index out of bounds');
    }

    this._pbf.pos = this._features[i];

    const end = this._pbf.readVarint() + this._pbf.pos;
    return new VectorTileFeature(
      this._pbf,
      end,
      this.extent,
      this._keys,
      this._values,
      geometryInfo
    );
  }
}

/**
 *
 * @param tag
 * @param layer
 * @param pbf
 */
function readLayerFromProtobuf(tag: number, layer?: VectorTileLayer, pbf?: Protobuf): void {
  if (!layer || !pbf) {
    return;
  }

  switch (tag as MVT.LayerInfo) {
    case MVT.LayerInfo.version:
      layer.version = pbf.readVarint();
      break;
    case MVT.LayerInfo.name:
      layer.name = pbf.readString();
      break;
    case MVT.LayerInfo.extent:
      layer.extent = pbf.readVarint();
      break;
    case MVT.LayerInfo.features:
      layer._features.push(pbf.pos);
      break;
    case MVT.LayerInfo.keys:
      layer._keys.push(pbf.readString());
      break;
    case MVT.LayerInfo.values:
      layer._values.push(readValueMessage(pbf));
      break;
    default:
    // ignore? Log?
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

    // (string = 1), // string_value
    //   (float = 2), // float_value
    //   (double = 3), // double_value
    //   (int64 = 4), // int_value
    //   (uint64 = 5), // uint_value
    //   (sint64 = 6), // sint_value
    //   (bool = 7); // bool_value

    switch (tag as MVT.PropertyType) {
      case MVT.PropertyType.string_value:
        value = pbf.readString();
        break;
      case MVT.PropertyType.float_value:
        value = pbf.readFloat();
        break;
      case MVT.PropertyType.double_value:
        value = pbf.readDouble();
        break;
      case MVT.PropertyType.int_value:
        value = pbf.readVarint64();
        break;
      case MVT.PropertyType.uint_value:
        value = pbf.readVarint();
        break;
      case MVT.PropertyType.sint_value:
        value = pbf.readSVarint();
        break;
      case MVT.PropertyType.bool_value:
        value = pbf.readBoolean();
        break;
      default:
        value = null;
    }
  }

  return value;
}
