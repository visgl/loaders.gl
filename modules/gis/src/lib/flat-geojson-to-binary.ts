/* eslint-disable indent */
import {earcut} from '@math.gl/polygon';
import type {
  BinaryAttribute,
  BinaryFeatures,
  BinaryPolygonFeatures,
  FlatFeature,
  FlatPoint,
  FlatLineString,
  FlatPolygon,
  GeojsonGeometryInfo,
  TypedArray
} from '@loaders.gl/schema';
import {PropArrayConstructor, Lines, Points, Polygons} from './flat-geojson-to-binary-types';

/**
 * Convert binary features to flat binary arrays. Similar to
 * `geojsonToBinary` helper function, except that it expects
 * a binary representation of the feature data, which enables
 * 2X-3X speed increase in parse speed, compared to using
 * geoJSON. See `binary-vector-tile/VectorTileFeature` for
 * data format detais
 *
 * @param features
 * @param geometryInfo
 * @param options
 * @returns filled arrays
 */
export function flatGeojsonToBinary(
  features: FlatFeature[],
  geometryInfo: GeojsonGeometryInfo,
  options?: FlatGeojsonToBinaryOptions
) {
  const propArrayTypes = extractNumericPropTypes(features);
  const numericPropKeys = Object.keys(propArrayTypes).filter((k) => propArrayTypes[k] !== Array);
  return fillArrays(
    features,
    {
      propArrayTypes,
      ...geometryInfo
    },
    {
      numericPropKeys: (options && options.numericPropKeys) || numericPropKeys,
      PositionDataType: options ? options.PositionDataType : Float32Array,
      triangulate: options ? options.triangulate : true
    }
  );
}

/**
 * Options for `flatGeojsonToBinary`
 */
export type FlatGeojsonToBinaryOptions = {
  numericPropKeys?: string[];
  PositionDataType?: Float32ArrayConstructor | Float64ArrayConstructor;
  triangulate?: boolean;
};

export const TEST_EXPORTS = {
  extractNumericPropTypes
};

/**
 * Extracts properties that are always numeric
 *
 * @param features
 * @returns object with numeric types
 */
function extractNumericPropTypes(features: FlatFeature[]): {
  [key: string]: PropArrayConstructor;
} {
  const propArrayTypes = {};
  for (const feature of features) {
    if (feature.properties) {
      for (const key in feature.properties) {
        // If property has not been seen before, or if property has been numeric
        // in all previous features, check if numeric in this feature
        // If not numeric, Array is stored to prevent rechecking in the future
        // Additionally, detects if 64 bit precision is required
        const val = feature.properties[key];
        propArrayTypes[key] = deduceArrayType(val, propArrayTypes[key]);
      }
    }
  }

  return propArrayTypes;
}

/**
 * Fills coordinates into pre-allocated typed arrays
 *
 * @param features
 * @param geometryInfo
 * @param options
 * @returns an accessor object with value and size keys
 */
// eslint-disable-next-line complexity
function fillArrays(
  features: FlatFeature[],
  geometryInfo: GeojsonGeometryInfo & {
    propArrayTypes: {[key: string]: PropArrayConstructor};
  },
  options: FlatGeojsonToBinaryOptions
) {
  const {
    pointPositionsCount,
    pointFeaturesCount,
    linePositionsCount,
    linePathsCount,
    lineFeaturesCount,
    polygonPositionsCount,
    polygonObjectsCount,
    polygonRingsCount,
    polygonFeaturesCount,
    propArrayTypes,
    coordLength
  } = geometryInfo;
  const {numericPropKeys = [], PositionDataType = Float32Array, triangulate = true} = options;
  const hasGlobalId = features[0] && 'id' in features[0];
  const GlobalFeatureIdsDataType = features.length > 65535 ? Uint32Array : Uint16Array;
  const points: Points = {
    type: 'Point',
    positions: new PositionDataType(pointPositionsCount * coordLength),
    globalFeatureIds: new GlobalFeatureIdsDataType(pointPositionsCount),
    featureIds:
      pointFeaturesCount > 65535
        ? new Uint32Array(pointPositionsCount)
        : new Uint16Array(pointPositionsCount),
    numericProps: {},
    properties: [],
    fields: []
  };
  const lines: Lines = {
    type: 'LineString',
    pathIndices:
      linePositionsCount > 65535
        ? new Uint32Array(linePathsCount + 1)
        : new Uint16Array(linePathsCount + 1),
    positions: new PositionDataType(linePositionsCount * coordLength),
    globalFeatureIds: new GlobalFeatureIdsDataType(linePositionsCount),
    featureIds:
      lineFeaturesCount > 65535
        ? new Uint32Array(linePositionsCount)
        : new Uint16Array(linePositionsCount),
    numericProps: {},
    properties: [],
    fields: []
  };
  const polygons: Polygons = {
    type: 'Polygon',
    polygonIndices:
      polygonPositionsCount > 65535
        ? new Uint32Array(polygonObjectsCount + 1)
        : new Uint16Array(polygonObjectsCount + 1),
    primitivePolygonIndices:
      polygonPositionsCount > 65535
        ? new Uint32Array(polygonRingsCount + 1)
        : new Uint16Array(polygonRingsCount + 1),
    positions: new PositionDataType(polygonPositionsCount * coordLength),
    globalFeatureIds: new GlobalFeatureIdsDataType(polygonPositionsCount),
    featureIds:
      polygonFeaturesCount > 65535
        ? new Uint32Array(polygonPositionsCount)
        : new Uint16Array(polygonPositionsCount),
    numericProps: {},
    properties: [],
    fields: []
  };

  if (triangulate) {
    polygons.triangles = [];
  }

  // Instantiate numeric properties arrays; one value per vertex
  for (const object of [points, lines, polygons]) {
    for (const propName of numericPropKeys) {
      // If property has been numeric in all previous features in which the property existed, check
      // if numeric in this feature
      const T = propArrayTypes[propName];
      object.numericProps[propName] = new T(object.positions.length / coordLength) as TypedArray;
    }
  }

  // Set last element of path/polygon indices as positions length
  lines.pathIndices[linePathsCount] = linePositionsCount;
  polygons.polygonIndices[polygonObjectsCount] = polygonPositionsCount;
  polygons.primitivePolygonIndices[polygonRingsCount] = polygonPositionsCount;

  const indexMap = {
    pointPosition: 0,
    pointFeature: 0,
    linePosition: 0,
    linePath: 0,
    lineFeature: 0,
    polygonPosition: 0,
    polygonObject: 0,
    polygonRing: 0,
    polygonFeature: 0,
    feature: 0
  };

  for (const feature of features) {
    const geometry = feature.geometry;
    const properties = feature.properties || {};

    switch (geometry.type) {
      case 'Point':
        handlePoint(geometry, points, indexMap, coordLength, properties);
        points.properties.push(keepStringProperties(properties, numericPropKeys));
        if (hasGlobalId) {
          points.fields.push({id: feature.id});
        }
        indexMap.pointFeature++;
        break;
      case 'LineString':
        handleLineString(geometry, lines, indexMap, coordLength, properties);
        lines.properties.push(keepStringProperties(properties, numericPropKeys));
        if (hasGlobalId) {
          lines.fields.push({id: feature.id});
        }
        indexMap.lineFeature++;
        break;
      case 'Polygon':
        handlePolygon(geometry, polygons, indexMap, coordLength, properties);
        polygons.properties.push(keepStringProperties(properties, numericPropKeys));
        if (hasGlobalId) {
          polygons.fields.push({id: feature.id});
        }
        indexMap.polygonFeature++;
        break;
      default:
        throw new Error('Invalid geometry type');
    }

    indexMap.feature++;
  }

  // Wrap each array in an accessor object with value and size keys
  return makeAccessorObjects(points, lines, polygons, coordLength);
}

/**
 * Fills (Multi)Point coordinates into points object of arrays
 *
 * @param geometry
 * @param points
 * @param indexMap
 * @param coordLength
 * @param properties
 */
function handlePoint(
  geometry: FlatPoint,
  points: Points,
  indexMap: {
    pointPosition: number;
    pointFeature: number;
    linePosition?: number;
    linePath?: number;
    lineFeature?: number;
    polygonPosition?: number;
    polygonObject?: number;
    polygonRing?: number;
    polygonFeature?: number;
    feature: number;
  },
  coordLength: number,
  properties: {[x: string]: string | number | boolean | null}
): void {
  points.positions.set(geometry.data, indexMap.pointPosition * coordLength);

  const nPositions = geometry.data.length / coordLength;
  fillNumericProperties(points, properties, indexMap.pointPosition, nPositions);
  points.globalFeatureIds.fill(
    indexMap.feature,
    indexMap.pointPosition,
    indexMap.pointPosition + nPositions
  );
  points.featureIds.fill(
    indexMap.pointFeature,
    indexMap.pointPosition,
    indexMap.pointPosition + nPositions
  );

  indexMap.pointPosition += nPositions;
}

/**
 * Fills (Multi)LineString coordinates into lines object of arrays
 *
 * @param geometry
 * @param lines
 * @param indexMap
 * @param coordLength
 * @param properties
 */
function handleLineString(
  geometry: FlatLineString,
  lines: Lines,
  indexMap: {
    pointPosition?: number;
    pointFeature?: number;
    linePosition: number;
    linePath: number;
    lineFeature: number;
    polygonPosition?: number;
    polygonObject?: number;
    polygonRing?: number;
    polygonFeature?: number;
    feature: number;
  },
  coordLength: number,
  properties: {[x: string]: string | number | boolean | null}
): void {
  lines.positions.set(geometry.data, indexMap.linePosition * coordLength);

  const nPositions = geometry.data.length / coordLength;
  fillNumericProperties(lines, properties, indexMap.linePosition, nPositions);

  lines.globalFeatureIds.fill(
    indexMap.feature,
    indexMap.linePosition,
    indexMap.linePosition + nPositions
  );
  lines.featureIds.fill(
    indexMap.lineFeature,
    indexMap.linePosition,
    indexMap.linePosition + nPositions
  );

  for (let i = 0, il = geometry.indices.length; i < il; ++i) {
    // Extract range of data we are working with, defined by start
    // and end indices (these index into the geometry.data array)
    const start = geometry.indices[i];
    const end =
      i === il - 1
        ? geometry.data.length // last line, so read to end of data
        : geometry.indices[i + 1]; // start index for next line

    lines.pathIndices[indexMap.linePath++] = indexMap.linePosition;
    indexMap.linePosition += (end - start) / coordLength;
  }
}

/**
 * Fills (Multi)Polygon coordinates into polygons object of arrays
 *
 * @param geometry
 * @param polygons
 * @param indexMap
 * @param coordLength
 * @param properties
 */
function handlePolygon(
  geometry: FlatPolygon,
  polygons: Polygons,
  indexMap: {
    pointPosition?: number;
    pointFeature?: number;
    linePosition?: number;
    linePath?: number;
    lineFeature?: number;
    polygonPosition: number;
    polygonObject: number;
    polygonRing: number;
    polygonFeature: number;
    feature: number;
  },
  coordLength: number,
  properties: {[x: string]: string | number | boolean | null}
): void {
  polygons.positions.set(geometry.data, indexMap.polygonPosition * coordLength);

  const nPositions = geometry.data.length / coordLength;
  fillNumericProperties(polygons, properties, indexMap.polygonPosition, nPositions);
  polygons.globalFeatureIds.fill(
    indexMap.feature,
    indexMap.polygonPosition,
    indexMap.polygonPosition + nPositions
  );
  polygons.featureIds.fill(
    indexMap.polygonFeature,
    indexMap.polygonPosition,
    indexMap.polygonPosition + nPositions
  );

  // Unlike Point & LineString geometry.indices is a 2D array
  for (let l = 0, ll = geometry.indices.length; l < ll; ++l) {
    const startPosition = indexMap.polygonPosition;
    polygons.polygonIndices[indexMap.polygonObject++] = startPosition;

    const areas = geometry.areas[l];
    const indices = geometry.indices[l];
    const nextIndices = geometry.indices[l + 1];

    for (let i = 0, il = indices.length; i < il; ++i) {
      const start = indices[i];
      const end =
        i === il - 1
          ? // last line, so either read to:
            nextIndices === undefined
            ? geometry.data.length // end of data (no next indices)
            : nextIndices[0] // start of first line in nextIndices
          : indices[i + 1]; // start index for next line

      polygons.primitivePolygonIndices[indexMap.polygonRing++] = indexMap.polygonPosition;
      indexMap.polygonPosition += (end - start) / coordLength;
    }

    const endPosition = indexMap.polygonPosition;
    triangulatePolygon(polygons, areas, indices, {startPosition, endPosition, coordLength});
  }
}

/**
 * Triangulate polygon using earcut
 *
 * @param polygons
 * @param areas
 * @param indices
 * @param param3
 */
function triangulatePolygon(
  polygons: Polygons,
  areas: number[],
  indices: number[],
  {
    startPosition,
    endPosition,
    coordLength
  }: {startPosition: number; endPosition: number; coordLength: number}
): void {
  if (!polygons.triangles) {
    return;
  }

  const start = startPosition * coordLength;
  const end = endPosition * coordLength;

  // Extract positions and holes for just this polygon
  const polygonPositions = polygons.positions.subarray(start, end);

  // Holes are referenced relative to outer polygon
  const offset = indices[0];
  const holes = indices.slice(1).map((n: number) => (n - offset) / coordLength);

  // Compute triangulation
  // @ts-expect-error TODO can earcut handle binary arrays? Add tests?
  const triangles = earcut(polygonPositions, holes, coordLength, areas);

  // Indices returned by triangulation are relative to start
  // of polygon, so we need to offset
  for (let t = 0, tl = triangles.length; t < tl; ++t) {
    polygons.triangles.push(startPosition + triangles[t]);
  }
}

/**
 * Wraps an object containing array into accessors
 *
 * @param obj
 * @param size
 */
function wrapProps(
  obj: {[key: string]: TypedArray},
  size: number
): {[key: string]: BinaryAttribute} {
  const returnObj = {};
  for (const key in obj) {
    returnObj[key] = {value: obj[key], size};
  }
  return returnObj;
}

/**
 * Wrap each array in an accessor object with value and size keys
 *
 * @param points
 * @param lines
 * @param polygons
 * @param coordLength
 * @returns object
 */
function makeAccessorObjects(
  points: Points,
  lines: Lines,
  polygons: Polygons,
  coordLength: number
): BinaryFeatures {
  const binaryFeatures = {
    points: {
      ...points,
      positions: {value: points.positions, size: coordLength},
      globalFeatureIds: {value: points.globalFeatureIds, size: 1},
      featureIds: {value: points.featureIds, size: 1},
      numericProps: wrapProps(points.numericProps, 1)
    },
    lines: {
      ...lines,
      positions: {value: lines.positions, size: coordLength},
      pathIndices: {value: lines.pathIndices, size: 1},
      globalFeatureIds: {value: lines.globalFeatureIds, size: 1},
      featureIds: {value: lines.featureIds, size: 1},
      numericProps: wrapProps(lines.numericProps, 1)
    },
    polygons: {
      ...polygons,
      positions: {value: polygons.positions, size: coordLength},
      polygonIndices: {value: polygons.polygonIndices, size: 1},
      primitivePolygonIndices: {value: polygons.primitivePolygonIndices, size: 1},
      globalFeatureIds: {value: polygons.globalFeatureIds, size: 1},
      featureIds: {value: polygons.featureIds, size: 1},
      numericProps: wrapProps(polygons.numericProps, 1)
    } as BinaryPolygonFeatures
  };

  if (polygons.triangles) {
    binaryFeatures.polygons.triangles = {value: new Uint32Array(polygons.triangles), size: 1};
  }

  return binaryFeatures;
}

/**
 * Add numeric properties to object
 *
 * @param object
 * @param properties
 * @param index
 * @param length
 */
function fillNumericProperties(
  object: Points | Lines | Polygons,
  properties: {[x: string]: string | number | boolean | null},
  index: number,
  length: number
): void {
  for (const numericPropName in object.numericProps) {
    if (numericPropName in properties) {
      const value = properties[numericPropName] as number;
      object.numericProps[numericPropName].fill(value, index, index + length);
    }
  }
}

/**
 * Keep string properties in object
 *
 * @param properties
 * @param numericKeys
 * @returns object
 */
function keepStringProperties(
  properties: {[x: string]: string | number | boolean | null},
  numericKeys: string[]
) {
  const props = {};
  for (const key in properties) {
    if (!numericKeys.includes(key)) {
      props[key] = properties[key];
    }
  }
  return props;
}

/**
 *
 * Deduce correct array constructor to use for a given value
 *
 * @param x value to test
 * @param constructor previous constructor deduced
 * @returns PropArrayConstructor
 */
function deduceArrayType(x: any, constructor: PropArrayConstructor): PropArrayConstructor {
  if (constructor === Array || !Number.isFinite(x)) {
    return Array;
  }

  // If this or previous value required 64bits use Float64Array
  return constructor === Float64Array || Math.fround(x) !== x ? Float64Array : Float32Array;
}
