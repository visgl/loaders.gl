// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Schema} from '@loaders.gl/schema';
import {getSchemaFromTileJSONLayer} from './get-schemas-from-tilejson';

export type TileJSONOptions = {
  /** max number of values. If not provided, include all values in the source tilestats */
  maxValues?: number;
};

/** Parsed and typed TileJSON, merges Tilestats information if present */
export type TileJSON = {
  /** Name of the tileset (for presentation in UI) */
  name?: string;
  /** A description of the contents or purpose of the tileset */
  description?: string;
  /** The version of the tileset */
  version?: string;

  tileFormat?: string;
  tilesetType?: string;

  /** Generating application. Tippecanoe adds this. */
  generator?: string;
  /** Generating application options. Tippecanoe adds this. */
  generatorOptions?: string;

  /** Tile indexing scheme */
  scheme?: 'xyz' | 'tms';
  /** Sharded URLs */
  tiles?: string[];
  /** `[[w, s], [e, n]]`, indicates the limits of the bounding box using the axis units and order of the specified CRS. */
  boundingBox?: [min: [w: number, s: number], max: [e: number, n: number]];
  /** May be set to the maxZoom of the first layer */
  maxZoom?: number | null;
  /** May be set to the minZoom of the first layer */
  minZoom?: number | null;
  center?: number[] | null;
  htmlAttribution?: string;
  htmlLegend?: string;

  // Combination of tilestats (if present) and tilejson layer information
  layers?: TileJSONLayer[];

  /** Any nested JSON metadata */
  metaJson?: any | null;
};

export type TileJSONLayer = {
  /** The name (id) of this layer (tilejson.vector_layers[].id / tilestats.layers[].layer) */
  name: string;

  /** The description of this layer (tilejson.layer.description) */
  description?: string;

  // tilestats

  /** The number of features in this layer (tilestats.layer.count) */
  featureCount?: number;
  /** The dominant geometry type in this layer (tilestats.layer.geometry) */
  dominantGeometry?: string;
  /** An array of details about the first 100 attributes in this layer */

  /**  */
  minZoom?: number;
  maxZoom?: number;
  fields: TileJSONField[];

  schema?: Schema;
};

export type TileJSONField = {
  /** The name of this attribute */
  name: string;
  description?: string;

  // tilestats

  type: string;
  /** min value (if there are *any* numbers in the values) */
  min?: number;
  /** max value (if there are *any* numbers in the values) */
  max?: number;
  /** Number of unique values across the tileset */
  uniqueValueCount?: number;
  /** An array of this attribute's first 100 unique values */
  values?: unknown[];
};

/**
 * The raw/unparsed tilestats layer type
 * @see https://github.com/mapbox/mapbox-geostats#output-the-stats
 */
type TilestatsLayer = {
  /** The name of this layer */
  layer: string;
  /** The number of features in this layer */
  count: number;
  /** The dominant geometry type in this layer */
  geometry: string;
  /** The number of unique attributes in this layer (max. 1000) */
  attributeCount: number;
  /** Fields for this layer */
  attributes?: TilestatsLayerAttribute[];
};

/**
 * The raw/unparsed tilestats attribute type
 * @see https://github.com/mapbox/mapbox-geostats#output-the-stats
 */
type TilestatsLayerAttribute = {
  /** The name of this layer */
  attribute?: string;
  /** Each attribute has one of the following types:
   * - 'string' if all its values are strings (or null).
   * - 'number' if all its values are numbers (or null).
   * - 'boolean' if all its values are booleans (or null).
   * - 'null' if its only value is null.
   * - 'mixed' if it has values of multiple types.
   * - Array and object values are coerced to strings.
   */
  type?: string;
  /** min value (if there are *any* numbers in the values) */
  min?: number;
  /** max value (if there are *any* numbers in the values) */
  max?: number;
  /** Number of unique values */
  count?: number;
  /** First 100 values */
  values?: unknown[];
};

const isObject: (x: unknown) => boolean = (x) => x !== null && typeof x === 'object';

/**
 * Parse TileJSON from metadata
 * @param jsonMetadata - metadata object
 * @param options - options
 * @returns - parsed TileJSON
 */
// eslint-disable-next-line complexity
export function parseTileJSON(jsonMetadata: any, options: TileJSONOptions): TileJSON | null {
  if (!jsonMetadata || !isObject(jsonMetadata)) {
    return null;
  }

  let tileJSON: TileJSON = {
    name: jsonMetadata.name || '',
    description: jsonMetadata.description || ''
  };

  // tippecanoe

  if (typeof jsonMetadata.generator === 'string') {
    tileJSON.generator = jsonMetadata.generator;
  }
  if (typeof jsonMetadata.generator_options === 'string') {
    tileJSON.generatorOptions = jsonMetadata.generator_options;
  }

  // Tippecanoe emits `antimeridian_adjusted_bounds` instead of `bounds`
  tileJSON.boundingBox =
    parseBounds(jsonMetadata.bounds) || parseBounds(jsonMetadata.antimeridian_adjusted_bounds);

  // TODO - can be undefined - we could set to center of bounds...
  tileJSON.center = parseCenter(jsonMetadata.center);
  // TODO - can be undefined, we could extract from layers...
  tileJSON.maxZoom = safeParseFloat(jsonMetadata.maxzoom);
  // TODO - can be undefined, we could extract from layers...
  tileJSON.minZoom = safeParseFloat(jsonMetadata.minzoom);

  // Look for nested metadata embedded in .json field
  // TODO - document what source this applies to, when is this needed?
  if (typeof jsonMetadata?.json === 'string') {
    // try to parse json
    try {
      tileJSON.metaJson = JSON.parse(jsonMetadata.json);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse tilejson.json field', error);
      // do nothing
    }
  }

  // Look for fields in tilestats

  const tilestats = jsonMetadata.tilestats || tileJSON.metaJson?.tilestats;
  const tileStatsLayers = parseTilestatsLayers(tilestats, options);
  const tileJSONlayers = parseTileJSONLayers(jsonMetadata.vector_layers); // eslint-disable-line camelcase
  // TODO - merge in description from tilejson
  const layers = mergeLayers(tileJSONlayers, tileStatsLayers);

  tileJSON = {
    ...tileJSON,
    layers
  };

  if (tileJSON.maxZoom === null && layers.length > 0) {
    tileJSON.maxZoom = layers[0].maxZoom || null;
  }

  if (tileJSON.minZoom === null && layers.length > 0) {
    tileJSON.minZoom = layers[0].minZoom || null;
  }

  return tileJSON;
}

function parseTileJSONLayers(layers: any[]): TileJSONLayer[] {
  // Look for fields in vector_layers
  if (!Array.isArray(layers)) {
    return [];
  }
  return layers.map((layer) => parseTileJSONLayer(layer));
}

function parseTileJSONLayer(layer: any): TileJSONLayer {
  const fields = Object.entries(layer.fields || []).map(([key, datatype]) => ({
    name: key,
    ...attributeTypeToFieldType(String(datatype))
  }));
  const layer2 = {...layer};
  delete layer2.fields;
  return {
    name: layer.id || '',
    ...layer2,
    fields
  };
}

/** parse Layers array from tilestats */
function parseTilestatsLayers(tilestats: any, options: TileJSONOptions): TileJSONLayer[] {
  if (isObject(tilestats) && Array.isArray(tilestats.layers)) {
    // we are in luck!
    return tilestats.layers.map((layer) => parseTilestatsForLayer(layer, options));
  }
  return [];
}

function parseTilestatsForLayer(layer: TilestatsLayer, options: TileJSONOptions): TileJSONLayer {
  const fields: TileJSONField[] = [];
  const indexedAttributes: {[key: string]: TilestatsLayerAttribute[]} = {};

  const attributes = layer.attributes || [];
  for (const attribute of attributes) {
    const name = attribute.attribute;
    if (typeof name === 'string') {
      // TODO - code copied from kepler.gl, need sample tilestats files to test
      if (name.split('|').length > 1) {
        // indexed field
        const fname = name.split('|')[0];
        indexedAttributes[fname] = indexedAttributes[fname] || [];
        indexedAttributes[fname].push(attribute);
        // eslint-disable-next-line no-console
        console.warn('ignoring tilestats indexed field', fname);
      } else if (!fields[name]) {
        fields.push(attributeToField(attribute, options));
      } else {
        // return (fields[name], attribute);
      }
    }
  }
  return {
    name: layer.layer || '',
    dominantGeometry: layer.geometry,
    fields
  };
}

function mergeLayers(layers: TileJSONLayer[], tilestatsLayers: TileJSONLayer[]): TileJSONLayer[] {
  return layers.map((layer: TileJSONLayer): TileJSONLayer => {
    const tilestatsLayer = tilestatsLayers.find((tsLayer) => tsLayer.name === layer.name);
    const fields = tilestatsLayer?.fields || layer.fields || [];
    const mergedLayer = {
      ...layer,
      ...tilestatsLayer,
      fields
    } as TileJSONLayer;
    mergedLayer.schema = getSchemaFromTileJSONLayer(mergedLayer);
    return mergedLayer;
  });
}

/**
 * bounds should be [minLng, minLat, maxLng, maxLat]
 *`[[w, s], [e, n]]`, indicates the limits of the bounding box using the axis units and order of the specified CRS.
 */
function parseBounds(
  bounds: string | number[]
): [[east: number, south: number], [west: number, north: number]] | undefined {
  // supported formats
  // string: "-96.657715,40.126127,-90.140061,43.516689",
  // array: [ -180, -85.05112877980659, 180, 85.0511287798066 ]
  const result = fromArrayOrString(bounds);
  // validate bounds
  if (
    Array.isArray(result) &&
    result.length === 4 &&
    [result[0], result[2]].every(isLng) &&
    [result[1], result[3]].every(isLat)
  ) {
    return [
      [result[0], result[1]],
      [result[2], result[3]]
    ];
  }
  return undefined;
}

function parseCenter(center: string | number[]): number[] | null {
  // supported formats
  // string: "-96.657715,40.126127,-90.140061,43.516689",
  // array: [-91.505127,41.615442,14]
  const result = fromArrayOrString(center);
  if (
    Array.isArray(result) &&
    result.length === 3 &&
    isLng(result[0]) &&
    isLat(result[1]) &&
    isZoom(result[2])
  ) {
    return result;
  }
  return null;
}

function safeParseFloat(input: unknown): number | null {
  const result =
    typeof input === 'string' ? parseFloat(input) : typeof input === 'number' ? input : null;
  return result === null || isNaN(result) ? null : result;
}

// https://github.com/mapbox/tilejson-spec/tree/master/2.2.0
function isLat(num: any): boolean {
  return Number.isFinite(num) && num <= 90 && num >= -90;
}
function isLng(num: any): boolean {
  return Number.isFinite(num) && num <= 180 && num >= -180;
}
function isZoom(num: any): boolean {
  return Number.isFinite(num) && num >= 0 && num <= 22;
}
function fromArrayOrString(data: string | number[]): number[] | null {
  if (typeof data === 'string') {
    return data.split(',').map(parseFloat);
  } else if (Array.isArray(data)) {
    return data;
  }
  return null;
}

// possible types https://github.com/mapbox/tippecanoe#modifying-feature-attributes
const attrTypeMap = {
  number: {
    type: 'float32'
  },
  numeric: {
    type: 'float32'
  },
  string: {
    type: 'utf8'
  },
  vachar: {
    type: 'utf8'
  },
  float: {
    type: 'float32'
  },
  int: {
    type: 'int32'
  },
  int4: {
    type: 'int32'
  },
  boolean: {
    type: 'boolean'
  },
  bool: {
    type: 'boolean'
  }
};

function attributeToField(
  attribute: TilestatsLayerAttribute = {},
  options: TileJSONOptions
): TileJSONField {
  const fieldTypes = attributeTypeToFieldType(attribute.type!);
  const field: TileJSONField = {
    name: attribute.attribute as string,
    // what happens if attribute type is string...
    // filterProps: getFilterProps(fieldTypes.type, attribute),
    ...fieldTypes
  };

  // attribute: "_season_peaks_color"
  // count: 1000
  // max: 0.95
  // min: 0.24375
  // type: "number"

  if (typeof attribute.min === 'number') {
    field.min = attribute.min;
  }
  if (typeof attribute.max === 'number') {
    field.max = attribute.max;
  }
  if (typeof attribute.count === 'number') {
    field.uniqueValueCount = attribute.count;
  }
  if (attribute.values) {
    // Too much data? Add option?
    field.values = attribute.values;
  }

  if (field.values && typeof options.maxValues === 'number') {
    // Too much data? Add option?
    field.values = field.values?.slice(0, options.maxValues);
  }

  return field;
}

function attributeTypeToFieldType(aType: string): {type: string} {
  const type = aType.toLowerCase();
  if (!type || !attrTypeMap[type]) {
    // console.warn(
    //   `cannot convert attribute type ${type} to loaders.gl data type, use string by default`
    // );
  }
  return attrTypeMap[type] || {type: 'string'};
}
