// @ts-nocheck
import {earcut} from '@math.gl/polygon';

/**
 * Convert binary features to flat binary arrays. Similar to
 * `geojsonToBinary` helper function, except that it expects
 * a binary representation of the feature data, which enables
 * 2X-3X speed increase in parse speed, compared to using
 * geoJSON. See `binary-vector-tile/VectorTileFeature` for
 * data format detais
 */
export function featuresToBinary(features, firstPassData, options = {}) {
  return fillArrays(features, firstPassData, {
    numericPropKeys: options.numericPropKeys || extractNumericPropKeys(features),
    PositionDataType: options.PositionDataType || Float32Array
  });
}

export const TEST_EXPORTS = {
  extractNumericPropKeys,
  fillArrays
};

// Extracts properties that are always numeric
// eslint-disable-next-line complexity, max-statements
function extractNumericPropKeys(features) {
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

  return Object.keys(numericPropKeys).filter(k => numericPropKeys[k]);
}

// Fills coordinates into pre-allocated typed arrays
// eslint-disable-next-line complexity
function fillArrays(features, firstPassData = {}, options = {}) {
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
  const points = {
    positions: new PositionDataType(pointPositionsCount * coordLength),
    globalFeatureIds: new GlobalFeatureIdsDataType(pointPositionsCount),
    featureIds:
      pointFeaturesCount > 65535
        ? new Uint32Array(pointPositionsCount)
        : new Uint16Array(pointPositionsCount),
    numericProps: {},
    properties: []
  };
  const lines = {
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
  const polygons = {
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
function handlePoint(geometry, points, indexMap, coordLength, properties) {
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
function handleLineString(geometry, lines, indexMap, coordLength, properties) {
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
function handlePolygon(geometry, polygons, indexMap, coordLength, properties) {
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
function triangulatePolygon(polygons, areas, lines, {startPosition, endPosition, coordLength}) {
  const start = startPosition * coordLength;
  const end = endPosition * coordLength;

  // Extract positions and holes for just this polygon
  const polygonPositions = polygons.positions.subarray(start, end);

  // Holes are referenced relative to outer polygon
  const offset = lines[0];
  const holes = lines.slice(1).map(n => (n - offset) / coordLength);

  // Compute triangulation
  const indices = earcut(polygonPositions, holes, coordLength, areas);

  // Indices returned by triangulation are relative to start
  // of polygon, so we need to offset
  for (let t = 0, tl = indices.length; t < tl; ++t) {
    polygons.triangles.push(startPosition + indices[t]);
  }
}

// Wrap each array in an accessor object with value and size keys
function makeAccessorObjects(points, lines, polygons, coordLength) {
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
function fillNumericProperties(object, properties, index, length) {
  for (const numericPropName in object.numericProps) {
    if (numericPropName in properties) {
      object.numericProps[numericPropName].fill(properties[numericPropName], index, index + length);
    }
  }
}

// Keep string properties in object
function keepStringProperties(properties, numericKeys) {
  const props = {};
  for (const key in properties) {
    if (!numericKeys.includes(key)) {
      props[key] = properties[key];
    }
  }
  return props;
}

function isNumeric(x) {
  return Number.isFinite(x);
}
