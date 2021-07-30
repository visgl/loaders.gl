import {earcut} from '@math.gl/polygon';
import {MvtBinaryOptions, MvtFirstPassedData, MvtLines, MvtPoints, MvtPolygons} from '../types';

/**
 * Convert binary features to flat binary arrays. Similar to
 * `geojsonToBinary` helper function, except that it expects
 * a binary representation of the feature data, which enables
 * 2X-3X speed increase in parse speed, compared to using
 * geoJSON. See `binary-vector-tile/VectorTileFeature` for
 * data format detais
 */

/**
 *
 * @param features
 * @param firstPassData
 * @param options
 * @returns filled arrays
 */
export function featuresToBinary(
  features: any[],
  firstPassData: MvtFirstPassedData,
  options?: MvtBinaryOptions
) {
  return fillArrays(features, firstPassData, {
    numericPropKeys: options ? options.numericPropKeys : extractNumericPropKeys(features),
    PositionDataType: options ? options.PositionDataType : Float32Array
  });
}

export const TEST_EXPORTS = {
  extractNumericPropKeys,
  fillArrays
};

// Extracts properties that are always numeric
/**
 *
 * @param features
 * @returns object with numeric keys
 */

// eslint-disable-next-line complexity, max-statements
function extractNumericPropKeys(features: any) {
  const numericPropKeys = {};
  for (const feature of features) {
    if (feature.properties) {
      for (const key in feature.properties) {
        // If property has not been seen before, or if property has been numeric
        // in all previous features, check if numeric in this feature
        // If not numeric, false is stored to prevent rechecking in the future
        const numericSoFar = numericPropKeys[key];
        // eslint-disable-next-line max-depth
        if (numericSoFar || numericSoFar === undefined) {
          const val = feature.properties[key];
          numericPropKeys[key] = isNumeric(val);
        }
      }
    }
  }

  return Object.keys(numericPropKeys).filter((k) => numericPropKeys[k]);
}

// Fills coordinates into pre-allocated typed arrays

/**
 *
 * @param features
 * @param firstPassData
 * @param options
 * @returns an accessor object with value and size keys
 */
// eslint-disable-next-line complexity
function fillArrays(
  features: string | any[],
  firstPassData: MvtFirstPassedData,
  options: MvtBinaryOptions
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
    polygonFeaturesCount
  } = firstPassData;
  const {numericPropKeys, PositionDataType = Float32Array} = options;
  const coordLength = 2;
  const GlobalFeatureIdsDataType = features.length > 65535 ? Uint32Array : Uint16Array;
  const points: MvtPoints = {
    positions: new PositionDataType(pointPositionsCount * coordLength),
    globalFeatureIds: new GlobalFeatureIdsDataType(pointPositionsCount),
    featureIds:
      pointFeaturesCount > 65535
        ? new Uint32Array(pointPositionsCount)
        : new Uint16Array(pointPositionsCount),
    numericProps: {},
    properties: []
  };
  const lines: MvtLines = {
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
    properties: []
  };
  const polygons: MvtPolygons = {
    polygonIndices:
      polygonPositionsCount > 65535
        ? new Uint32Array(polygonObjectsCount + 1)
        : new Uint16Array(polygonObjectsCount + 1),
    primitivePolygonIndices:
      polygonPositionsCount > 65535
        ? new Uint32Array(polygonRingsCount + 1)
        : new Uint16Array(polygonRingsCount + 1),
    positions: new PositionDataType(polygonPositionsCount * coordLength),
    triangles: [],
    globalFeatureIds: new GlobalFeatureIdsDataType(polygonPositionsCount),
    featureIds:
      polygonFeaturesCount > 65535
        ? new Uint32Array(polygonPositionsCount)
        : new Uint16Array(polygonPositionsCount),
    numericProps: {},
    properties: []
  };

  // Instantiate numeric properties arrays; one value per vertex
  for (const object of [points, lines, polygons]) {
    for (const propName of numericPropKeys) {
      // If property has been numeric in all previous features in which the property existed, check
      // if numeric in this feature
      object.numericProps[propName] = new Float32Array(object.positions.length / coordLength);
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
      case 'MultiPoint':
        handlePoint(geometry, points, indexMap, coordLength, properties);
        points.properties.push(keepStringProperties(properties, numericPropKeys));
        indexMap.pointFeature++;
        break;
      case 'LineString':
      case 'MultiLineString':
        handleLineString(geometry, lines, indexMap, coordLength, properties);
        lines.properties.push(keepStringProperties(properties, numericPropKeys));
        indexMap.lineFeature++;
        break;
      case 'Polygon':
      case 'MultiPolygon':
        handlePolygon(geometry, polygons, indexMap, coordLength, properties);
        polygons.properties.push(keepStringProperties(properties, numericPropKeys));
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

// Fills (Multi)Point coordinates into points object of arrays
/**
 *
 * @param geometry
 * @param points
 * @param indexMap
 * @param coordLength
 * @param properties
 * @returns {void}
 */
function handlePoint(
  geometry: {data: string | any[]},
  points: MvtPoints,
  indexMap: {
    pointPosition: any;
    pointFeature: any;
    linePosition?: number;
    linePath?: number;
    lineFeature?: number;
    polygonPosition?: number;
    polygonObject?: number;
    polygonRing?: number;
    polygonFeature?: number;
    feature: any;
  },
  coordLength: number,
  properties: any
) {
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

// Fills (Multi)LineString coordinates into lines object of arrays
/**
 *
 * @param geometry
 * @param lines
 * @param indexMap
 * @param coordLength
 * @param properties
 * @returns {void}
 */
function handleLineString(
  geometry: {data: string | any[]; lines: string | any[]},
  lines: MvtLines,
  indexMap: {
    pointPosition?: number;
    pointFeature?: number;
    linePosition: any;
    linePath: any;
    lineFeature: any;
    polygonPosition?: number;
    polygonObject?: number;
    polygonRing?: number;
    polygonFeature?: number;
    feature: any;
  },
  coordLength: number,
  properties: any
) {
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

  for (let i = 0, il = geometry.lines.length; i < il; ++i) {
    // Extract range of data we are working with, defined by start
    // and end indices (these index into the geometry.data array)
    const start = geometry.lines[i];
    const end =
      i === il - 1
        ? geometry.data.length // last line, so read to end of data
        : geometry.lines[i + 1]; // start index for next line

    lines.pathIndices[indexMap.linePath++] = indexMap.linePosition;
    indexMap.linePosition += (end - start) / coordLength;
  }
}

// Fills (Multi)Polygon coordinates into polygons object of arrays
/**
 *
 * @param geometry
 * @param polygons
 * @param indexMap
 * @param coordLength
 * @param properties
 * @returns {void}
 */
function handlePolygon(
  geometry: {data: string | any[]; lines: string | any[]; areas: any[]},
  polygons: MvtPolygons,
  indexMap: {
    pointPosition?: number;
    pointFeature?: number;
    linePosition?: number;
    linePath?: number;
    lineFeature?: number;
    polygonPosition: any;
    polygonObject: any;
    polygonRing: any;
    polygonFeature: any;
    feature: any;
  },
  coordLength: number,
  properties: any
) {
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

  // Unlike Point & LineString geometry.lines is a 2D array
  for (let l = 0, ll = geometry.lines.length; l < ll; ++l) {
    const startPosition = indexMap.polygonPosition;
    polygons.polygonIndices[indexMap.polygonObject++] = startPosition;

    const areas = geometry.areas[l];
    const lines = geometry.lines[l];
    const nextLines = geometry.lines[l + 1];

    for (let i = 0, il = lines.length; i < il; ++i) {
      const start = lines[i];
      const end =
        i === il - 1
          ? // last line, so either read to:
            nextLines === undefined
            ? geometry.data.length // end of data (no next lines)
            : nextLines[0] // start of first line in nextLines
          : lines[i + 1]; // start index for next line

      polygons.primitivePolygonIndices[indexMap.polygonRing++] = indexMap.polygonPosition;
      indexMap.polygonPosition += (end - start) / coordLength;
    }

    const endPosition = indexMap.polygonPosition;
    triangulatePolygon(polygons, areas, lines, {startPosition, endPosition, coordLength});
  }
}

/**
 * Triangulate polygon using earcut
 */
/**
 *
 * @param polygons
 * @param areas
 * @param lines
 * @param param3
 * @returns {void}
 */
function triangulatePolygon(
  polygons: {positions: {subarray: (arg0: number, arg1: number) => any}; triangles: any[]},
  areas: any,
  lines: any[],
  {
    startPosition,
    endPosition,
    coordLength
  }: {startPosition: any; endPosition: any; coordLength: any}
) {
  const start = startPosition * coordLength;
  const end = endPosition * coordLength;

  // Extract positions and holes for just this polygon
  const polygonPositions = polygons.positions.subarray(start, end);

  // Holes are referenced relative to outer polygon
  const offset = lines[0];
  const holes = lines.slice(1).map((n: number) => (n - offset) / coordLength);

  // Compute triangulation
  const indices = earcut(polygonPositions, holes, coordLength, areas);

  // Indices returned by triangulation are relative to start
  // of polygon, so we need to offset
  for (let t = 0, tl = indices.length; t < tl; ++t) {
    polygons.triangles.push(startPosition + indices[t]);
  }
}

// Wrap each array in an accessor object with value and size keys
/**
 *
 * @param points
 * @param lines
 * @param polygons
 * @param coordLength
 * @returns object
 */
function makeAccessorObjects(
  points: {
    positions: any;
    globalFeatureIds: any;
    featureIds: any;
    numericProps: any;
    properties: any;
  },
  lines: {
    pathIndices: any;
    positions: any;
    globalFeatureIds: any;
    featureIds: any;
    numericProps: any;
    properties: any;
  },
  polygons: {
    polygonIndices: any;
    primitivePolygonIndices: any;
    positions: any;
    triangles: any;
    globalFeatureIds: any;
    featureIds: any;
    numericProps: any;
    properties: any;
  },
  coordLength: number
) {
  const returnObj = {
    points: {
      positions: {value: points.positions, size: coordLength},
      globalFeatureIds: {value: points.globalFeatureIds, size: 1},
      featureIds: {value: points.featureIds, size: 1},
      numericProps: points.numericProps,
      properties: points.properties
    },
    lines: {
      pathIndices: {value: lines.pathIndices, size: 1},
      positions: {value: lines.positions, size: coordLength},
      globalFeatureIds: {value: lines.globalFeatureIds, size: 1},
      featureIds: {value: lines.featureIds, size: 1},
      numericProps: lines.numericProps,
      properties: lines.properties
    },
    polygons: {
      polygonIndices: {value: polygons.polygonIndices, size: 1},
      primitivePolygonIndices: {value: polygons.primitivePolygonIndices, size: 1},
      positions: {value: polygons.positions, size: coordLength},
      triangles: {value: new Uint32Array(polygons.triangles), size: 1},
      globalFeatureIds: {value: polygons.globalFeatureIds, size: 1},
      featureIds: {value: polygons.featureIds, size: 1},
      numericProps: polygons.numericProps,
      properties: polygons.properties
    }
  };

  for (const geomType in returnObj) {
    for (const numericProp in returnObj[geomType].numericProps) {
      returnObj[geomType].numericProps[numericProp] = {
        value: returnObj[geomType].numericProps[numericProp],
        size: 1
      };
    }
  }
  return returnObj;
}

// Add numeric properties to object
/**
 *
 * @param object
 * @param properties
 * @param index
 * @param length
 * @returns {void}
 */
function fillNumericProperties(
  object: MvtPoints,
  properties: {[x: string]: any},
  index: any,
  length: number
) {
  for (const numericPropName in object.numericProps) {
    if (numericPropName in properties) {
      object.numericProps[numericPropName].fill(properties[numericPropName], index, index + length);
    }
  }
}

// Keep string properties in object
/**
 *
 * @param properties
 * @param numericKeys
 * @returns object
 */
function keepStringProperties(properties: {[x: string]: any}, numericKeys: string | string[]) {
  const props = {};
  for (const key in properties) {
    if (!numericKeys.includes(key)) {
      props[key] = properties[key];
    }
  }
  return props;
}

function isNumeric(x: unknown) {
  return Number.isFinite(x);
}
