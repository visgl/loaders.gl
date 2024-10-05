// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/* eslint-disable indent */
// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import Protobuf from 'pbf';
import {GeojsonGeometryInfo} from '@loaders.gl/schema';
import type {MVTLayer} from './mvt-types';
import * as MVT from './mvt-constants';
import {VectorTileFeature} from './vector-tile-feature';

const DEFAULT_LAYER = {
  version: 1,
  name: '',
  extent: 4096,
  length: 0,
  _keys: [],
  _values: [],
  _features: []
} as const satisfies MVTLayer;

export function readLayer(pbf: Protobuf, end?): MVTLayer {
  const layer: MVTLayer = {...DEFAULT_LAYER};
  pbf.readFields(readLayerFromProtobuf, layer, end);
  return layer;
}

/**
 *
 * @param tag
 * @param layer
 * @param pbf
 */
function readLayerFromProtobuf(tag: number, layer?: MVTLayer, pbf?: Protobuf): void {
  if (!layer || !pbf) {
    return;
  }

  switch (tag as MVT.LayerInfoType) {
    case MVT.LayerInfoType.version:
      layer.version = pbf.readVarint();
      break;
    case MVT.LayerInfoType.name:
      layer.name = pbf.readString();
      break;
    case MVT.LayerInfoType.extent:
      layer.extent = pbf.readVarint();
      break;
    case MVT.LayerInfoType.features:
      layer._features.push(pbf.pos);
      break;
    case MVT.LayerInfoType.keys:
      layer._keys.push(pbf.readString());
      break;
    case MVT.LayerInfoType.values:
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
      case MVT.PropertyType.string:
        value = pbf.readString();
        break;
      case MVT.PropertyType.float:
        value = pbf.readFloat();
        break;
      case MVT.PropertyType.double:
        value = pbf.readDouble();
        break;
      case MVT.PropertyType.int64:
        value = pbf.readVarint64();
        break;
      case MVT.PropertyType.uint64:
        value = pbf.readVarint();
        break;
      case MVT.PropertyType.sint64:
        value = pbf.readSVarint();
        break;
      case MVT.PropertyType.bool:
        value = pbf.readBoolean();
        break;
      default:
        value = null;
    }
  }

  return value;
}

// DEPRECATED

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
