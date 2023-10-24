// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

/** Parsed and typed TileJSON, merges Tilestats information if present */
export type TileJSON = {
  name?: string;
  description?: string;
  version?: string;
  scheme?: 'xyz' | 'tms';
  tiles?: string[];
  /** `[[w, s], [e, n]]`, indicates the limits of the bounding box using the axis units and order of the specified CRS. */
  boundingBox?: [min: [w: number, s: number], max: [e: number, n: number]];
  center: number[] | null;
  maxZoom: number | null;
  minZoom: number | null;
  htmlAttribution?: string;
  htmlLegend?: string;
  layers?: TileJSONLayer[];
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
};

const isObject: (x: unknown) => boolean = (x) => x !== null && typeof x === 'object';

export function parseTileJSON(jsonMetadata: any): TileJSON | null {
  if (!jsonMetadata || !isObject(jsonMetadata)) {
    return null;
  }

  const boundingBox = parseBounds(jsonMetadata.bounds);
  const center = parseCenter(jsonMetadata.center);
  const maxZoom = safeParseFloat(jsonMetadata.maxzoom);
  const minZoom = safeParseFloat(jsonMetadata.minzoom);

  let tileJSON: TileJSON = {
    name: jsonMetadata.name || '',
    description: jsonMetadata.description || '',
    boundingBox,
    center,
    maxZoom,
    minZoom,
    layers: []
  };

  // try to parse json
  if (typeof jsonMetadata?.json === 'string') {
    try {
      tileJSON.metaJson = JSON.parse(jsonMetadata.json);
    } catch (err) {
      // do nothing
    }
  }

  let layers = parseTilestatsLayers(tileJSON.metaJson?.tilestats);
  // TODO - merge in description from tilejson
  if (layers.length === 0) {
    layers = parseTileJSONLayers(jsonMetadata.vector_layers); // eslint-disable-line camelcase
  }

  tileJSON = {
    ...tileJSON,
    layers
  };

  return tileJSON;
}

function parseTileJSONLayers(layers: any[]): TileJSONLayer[] {
  // Look for fields in vector_layers
  if (!Array.isArray(layers)) {
    return [];
  }
  return layers.map((layer) => ({
    name: layer.id || '',
    fields: Object.entries(layer.fields || []).map(([key, datatype]) => ({
      name: key,
      ...attributeTypeToFieldType(String(datatype))
    }))
  }));
}

/** parse Layers array from tilestats */
function parseTilestatsLayers(tilestats: any): TileJSONLayer[] {
  if (isObject(tilestats) && Array.isArray(tilestats.layers)) {
    // we are in luck!
    return tilestats.layers.map((layer) => parseTilestatsForLayer(layer));
  }
  return [];
}

function parseTilestatsForLayer(layer: TilestatsLayer): TileJSONLayer {
  const fields: TileJSONField[] = [];
  const indexedAttributes: {[key: string]: TilestatsLayerAttribute[]} = {};

  const attributes = layer.attributes || [];
  for (const attr of attributes) {
    const name = attr.attribute;
    if (typeof name === 'string') {
      if (name.split('|').length > 1) {
        // indexed field
        const fname = name.split('|')[0];
        indexedAttributes[fname] = indexedAttributes[fname] || [];
        indexedAttributes[fname].push(attr);
      } else if (!fields[name]) {
        fields[name] = attributeToField(attr);
      } else {
        // return (fields[name], attr);
      }
    }
  }
  return {
    name: layer.layer || '',
    dominantGeometry: layer.geometry,
    fields
  };
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

function attributeToField(attribute: TilestatsLayerAttribute = {}): TileJSONField {
  // attribute: "_season_peaks_color"
  // count: 1000
  // max: 0.95
  // min: 0.24375
  // type: "number"
  const fieldTypes = attributeTypeToFieldType(attribute.type!);
  return {
    name: attribute.attribute as string,
    // what happens if attribute type is string...
    // filterProps: getFilterProps(fieldTypes.type, attribute),
    ...fieldTypes
  };
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
