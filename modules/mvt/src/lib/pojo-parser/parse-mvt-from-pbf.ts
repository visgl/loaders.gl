// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// This code is inspired by https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import Protobuf from 'pbf';
import {Schema} from '@loaders.gl/schema';
import type {MVTTile, MVTLayer} from './mvt-types';
import * as MVT from './mvt-constants';

export type MVTLayerData = {
  /** Layer being built */
  layer: MVTLayer;
  currentFeature: number;
  /** list of all keys in layer: Temporary, used when building up the layer */
  keys: string[];
  /** single list of all values in all columns - Temporary values used when building up the layer */
  values: (string | number | boolean | null)[];
  types: number[];
  columnTypes: number[];
  columnNullable: boolean[];
  /** list of all feature start positions in the PBF - Temporary values used when building up the layer */
  featurePositions: number[];
  /** list of all geometry start positions in the PBF - Temporary values used when building up the layer */
  geometryPositions: number[];
};

const DEFAULT_LAYER = {
  version: 1,
  name: '',
  extent: 4096,
  length: 0,
  schema: {fields: [], metadata: {}},
  columns: {},
  idColumn: [],
  geometryTypeColumn: [],
  geometryColumn: []
} as const satisfies MVTLayer;

const DEFAULT_LAYER_DATA = {
  currentFeature: 0,
  keys: [],
  values: [],
  types: [],
  columnTypes: [],
  columnNullable: [],
  featurePositions: [],
  geometryPositions: []
};

/** Parse an MVT tile from an ArrayBuffer */
export function parseMVT(arrayBuffer: ArrayBuffer | Uint8Array): MVTTile {
  const pbf = new Protobuf(arrayBuffer);
  return parseMVTTile(pbf);
}

/** Parse an MVT tile from a PBF buffer */
export function parseMVTTile(pbf: Protobuf, end?: number): MVTTile {
  const tile = {layers: {}} satisfies MVTTile;
  try {
    pbf.readFields(readTileFieldFromPBF, tile, end);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error);
  }
  return tile;
}

/**
 * Protobuf read callback for a top-level tile object's PBF tags
 * @param tag
 * @param layers
 * @param pbf
 */
function readTileFieldFromPBF(tag: number, tile?: MVTTile, pbf?: Protobuf): void {
  if (!pbf || !tile) {
    return;
  }

  switch (tag as MVT.TileInfo) {
    case MVT.TileInfo.layers:
      // get the byte length and end of the layer
      const byteLength = pbf.readVarint();
      const end = byteLength + pbf.pos;

      const layer = parseLayer(pbf, end);
      tile.layers[layer.name] = layer;
      break;
    default:
    // ignore? log?
  }
}

/** Parse an MVT layer from BPF at current position */
export function parseLayer(pbf: Protobuf, end: number): MVTLayer {
  const layerData: MVTLayerData = {layer: {...DEFAULT_LAYER}, ...DEFAULT_LAYER_DATA};
  pbf.readFields(readLayerFieldFromPBF, layerData, end);

  // Read features
  for (let featureIndex = 0; featureIndex < layerData.featurePositions.length; featureIndex++) {
    // Determine start and end of feature in PBF
    const featurePosition = layerData.featurePositions[featureIndex];

    pbf.pos = featurePosition;
    const byteLength = pbf.readVarint();
    const end = byteLength + pbf.pos;

    layerData.currentFeature = featureIndex;
    pbf.readFields(readFeatureFieldFromPBF, layerData, end);
  }

  // Post processing
  const {layer} = layerData;
  layer.length = layerData.featurePositions.length;
  layer.schema = makeMVTSchema(layerData);
  return layer;
}

/**
 *
 * @param tag
 * @param layer
 * @param pbf
 */
function readLayerFieldFromPBF(tag: number, layerData?: MVTLayerData, pbf?: Protobuf): void {
  if (!layerData || !pbf) {
    return;
  }

  switch (tag as MVT.LayerInfo) {
    case MVT.LayerInfo.version:
      layerData.layer.version = pbf.readVarint();
      break;
    case MVT.LayerInfo.name:
      layerData.layer.name = pbf.readString();
      break;
    case MVT.LayerInfo.extent:
      layerData.layer.extent = pbf.readVarint();
      break;
    case MVT.LayerInfo.features:
      layerData.featurePositions.push(pbf.pos);
      break;
    case MVT.LayerInfo.keys:
      layerData.keys.push(pbf.readString());
      break;
    case MVT.LayerInfo.values:
      const [value, type] = parseValues(pbf);
      layerData.values.push(value);
      layerData.types.push(type);
      break;
    default:
    // ignore? Log?
  }
}

/**
 * @param pbf
 * @returns value
 */
function parseValues(pbf: Protobuf): [string | number | boolean | null, MVT.PropertyType] {
  const end = pbf.readVarint() + pbf.pos;

  let value: string | number | boolean | null = null;
  // not a valid property type so we use it to detect multiple values
  let type = -1 as MVT.PropertyType;

  // TODO - can we have multiple values?
  while (pbf.pos < end) {
    if (type !== (-1 as MVT.PropertyType)) {
      throw new Error('MVT: Multiple values not supported');
    }
    type = pbf.readVarint() >> 3;
    value = readValueFromPBF(pbf, type);
  }
  return [value, type];
}

/** Read a type tagged value from the protobuf at current position */
function readValueFromPBF(pbf: Protobuf, type: MVT.PropertyType): string | number | boolean | null {
  switch (type) {
    case MVT.PropertyType.string_value:
      return pbf.readString();
    case MVT.PropertyType.float_value:
      return pbf.readFloat();
    case MVT.PropertyType.double_value:
      return pbf.readDouble();
    case MVT.PropertyType.int_value:
      return pbf.readVarint64();
    case MVT.PropertyType.uint_value:
      return pbf.readVarint();
    case MVT.PropertyType.sint_value:
      return pbf.readSVarint();
    case MVT.PropertyType.bool_value:
      return pbf.readBoolean();
    default:
      return null;
  }
}

/**
 *
 * @param tag
 * @param feature
 * @param pbf
 */
function readFeatureFieldFromPBF(tag: number, layerData?: MVTLayerData, pbf?: Protobuf): void {
  if (!pbf || !layerData) {
    return;
  }
  switch (tag as MVT.FeatureInfo) {
    case MVT.FeatureInfo.id:
      const id = pbf.readVarint();
      layerData.layer.idColumn[layerData.currentFeature] = id;
      break;
    case MVT.FeatureInfo.tags:
      parseColumnValues(pbf, layerData);
      break;
    case MVT.FeatureInfo.type:
      const type = pbf.readVarint();
      layerData.layer.geometryTypeColumn[layerData.currentFeature] = type;
      break;
    case MVT.FeatureInfo.geometry:
      layerData.geometryPositions[layerData.currentFeature] = pbf.pos;
      break;
    default:
    // ignore? log?
  }
}

/**
 *
 * @param pbf
 * @param feature
 */
function parseColumnValues(pbf: Protobuf, layerData: MVTLayerData): void {
  const end = pbf.readVarint() + pbf.pos;

  while (pbf.pos < end) {
    const keyIndex = pbf.readVarint();
    const valueIndex = pbf.readVarint();
    const columnName = layerData.keys[keyIndex];
    const value = layerData.values[valueIndex];
    layerData.columnTypes[columnName] = layerData.types[valueIndex];
    layerData.columnNullable[columnName] ||= value === null;

    layerData.layer.columns[columnName] ||= [];
    layerData.layer.columns[columnName].push(value);
  }
}

// Schema Builder

function makeMVTSchema(layerData: MVTLayerData): Schema {
  const {keys, columnTypes, columnNullable} = layerData;
  const fields: Schema['fields'] = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const nullable = columnNullable[key];
    switch (columnTypes[key] as MVT.PropertyType) {
      case MVT.PropertyType.string_value:
        fields.push({name: keys[i], type: 'utf8', nullable});
        break;
      case MVT.PropertyType.float_value:
        fields.push({name: keys[i], type: 'float32', nullable});
        break;
      case MVT.PropertyType.double_value:
        fields.push({name: keys[i], type: 'float64', nullable});
        break;
      case MVT.PropertyType.int_value:
        fields.push({name: keys[i], type: 'int32', nullable});
        break;
      case MVT.PropertyType.uint_value:
        fields.push({name: keys[i], type: 'uint32', nullable});
        break;
      case MVT.PropertyType.sint_value:
        fields.push({name: keys[i], type: 'int32', nullable});
        break;
      case MVT.PropertyType.bool_value:
        fields.push({name: keys[i], type: 'bool', nullable});
        break;
      default:
      // ignore?
    }
  }

  return {fields, metadata: {}};
}
