// Convert GeoJSON features to flat binary arrays
// @ts-nocheck

import type {BinaryFeaturesData} from '../types';

export function geojsonToBinary(features: object[], options: object = {}): BinaryFeaturesData {
  const firstPassData = firstPass(features);
  return secondPass(features, firstPassData, {
    coordLength: options.coordLength || firstPassData.coordLength || 2,
    numericPropKeys: options.numericPropKeys || firstPassData.numericPropKeys,
    PositionDataType: options.PositionDataType || Float32Array
  });
}

export const TEST_EXPORTS = {
  firstPass,
  secondPass
};

// Initial scan over GeoJSON features
// Counts number of coordinates of each geometry type and keeps track of the max coordinate
// dimensions
// eslint-disable-next-line complexity, max-statements
function firstPass(features) {
  // Counts the number of _positions_, so [x, y, z] counts as one
  let pointPositionsCount = 0;
  let pointFeaturesCount = 0;
  let linePositionsCount = 0;
  let linePathsCount = 0;
  let lineFeaturesCount = 0;
  let polygonPositionsCount = 0;
  let polygonObjectsCount = 0;
  let polygonRingsCount = 0;
  let polygonFeaturesCount = 0;
  const coordLengths = new Set();
  const numericPropKeys = {};

  for (const feature of features) {
    const geometry = feature.geometry;
    switch (geometry.type) {
      case 'Point':
        pointFeaturesCount++;
        pointPositionsCount++;
        coordLengths.add(geometry.coordinates.length);
        break;
      case 'MultiPoint':
        pointFeaturesCount++;
        pointPositionsCount += geometry.coordinates.length;
        for (const point of geometry.coordinates) {
          coordLengths.add(point.length);
        }
        break;
      case 'LineString':
        lineFeaturesCount++;
        linePositionsCount += geometry.coordinates.length;
        linePathsCount++;

        for (const coord of geometry.coordinates) {
          coordLengths.add(coord.length);
        }
        break;
      case 'MultiLineString':
        lineFeaturesCount++;
        for (const line of geometry.coordinates) {
          linePositionsCount += line.length;
          linePathsCount++;

          // eslint-disable-next-line max-depth
          for (const coord of line) {
            coordLengths.add(coord.length);
          }
        }
        break;
      case 'Polygon':
        polygonFeaturesCount++;
        polygonObjectsCount++;
        polygonRingsCount += geometry.coordinates.length;
        polygonPositionsCount += flatten(geometry.coordinates).length;

        for (const coord of flatten(geometry.coordinates)) {
          coordLengths.add(coord.length);
        }
        break;
      case 'MultiPolygon':
        polygonFeaturesCount++;
        for (const polygon of geometry.coordinates) {
          polygonObjectsCount++;
          polygonRingsCount += polygon.length;
          polygonPositionsCount += flatten(polygon).length;

          // eslint-disable-next-line max-depth
          for (const coord of flatten(polygon)) {
            coordLengths.add(coord.length);
          }
        }
        break;
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }

    if (feature.properties) {
      for (const key in feature.properties) {
        const val = feature.properties[key];

        // If property has not been seen before, or if property has been numeric
        // in all previous features, check if numeric in this feature
        // If not numeric, false is stored to prevent rechecking in the future
        numericPropKeys[key] =
          numericPropKeys[key] || numericPropKeys[key] === undefined
            ? isNumeric(val)
            : numericPropKeys[key];
      }
    }
  }

  return {
    pointPositionsCount,
    pointFeaturesCount,
    linePositionsCount,
    linePathsCount,
    lineFeaturesCount,
    coordLength: coordLengths.size > 0 && Math.max(...coordLengths),
    polygonPositionsCount,
    polygonObjectsCount,
    polygonRingsCount,
    polygonFeaturesCount,
    // Array of keys whose values are always numeric
    numericPropKeys: Object.keys(numericPropKeys).filter((k) => numericPropKeys[k])
  };
}

// Second scan over GeoJSON features
// Fills coordinates into pre-allocated typed arrays
// eslint-disable-next-line complexity
function secondPass(features, firstPassData = {}, options = {}) {
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
  const {coordLength, numericPropKeys, PositionDataType = Float32Array} = options;
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
        handlePoint(geometry.coordinates, points, indexMap, coordLength, properties);
        points.properties.push(keepStringProperties(properties, numericPropKeys));
        indexMap.pointFeature++;
        break;
      case 'MultiPoint':
        handleMultiPoint(geometry.coordinates, points, indexMap, coordLength, properties);
        points.properties.push(keepStringProperties(properties, numericPropKeys));
        indexMap.pointFeature++;
        break;
      case 'LineString':
        handleLineString(geometry.coordinates, lines, indexMap, coordLength, properties);
        lines.properties.push(keepStringProperties(properties, numericPropKeys));
        indexMap.lineFeature++;
        break;
      case 'MultiLineString':
        handleMultiLineString(geometry.coordinates, lines, indexMap, coordLength, properties);
        lines.properties.push(keepStringProperties(properties, numericPropKeys));
        indexMap.lineFeature++;
        break;
      case 'Polygon':
        handlePolygon(geometry.coordinates, polygons, indexMap, coordLength, properties);
        polygons.properties.push(keepStringProperties(properties, numericPropKeys));
        indexMap.polygonFeature++;
        break;
      case 'MultiPolygon':
        handleMultiPolygon(geometry.coordinates, polygons, indexMap, coordLength, properties);
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

// Fills Point coordinates into points object of arrays
function handlePoint(coords, points, indexMap, coordLength, properties) {
  points.positions.set(coords, indexMap.pointPosition * coordLength);
  points.globalFeatureIds[indexMap.pointPosition] = indexMap.feature;
  points.featureIds[indexMap.pointPosition] = indexMap.pointFeature;

  fillNumericProperties(points, properties, indexMap.pointPosition, 1);
  indexMap.pointPosition++;
}

// Fills MultiPoint coordinates into points object of arrays
function handleMultiPoint(coords, points, indexMap, coordLength, properties) {
  for (const point of coords) {
    handlePoint(point, points, indexMap, coordLength, properties);
  }
}

// Fills LineString coordinates into lines object of arrays
function handleLineString(coords, lines, indexMap, coordLength, properties) {
  lines.pathIndices[indexMap.linePath] = indexMap.linePosition;
  indexMap.linePath++;

  fillCoords(lines.positions, coords, indexMap.linePosition, coordLength);

  const nPositions = coords.length;
  fillNumericProperties(lines, properties, indexMap.linePosition, nPositions);

  lines.globalFeatureIds.set(
    new Uint32Array(nPositions).fill(indexMap.feature),
    indexMap.linePosition
  );
  lines.featureIds.set(
    new Uint32Array(nPositions).fill(indexMap.lineFeature),
    indexMap.linePosition
  );
  indexMap.linePosition += nPositions;
}

// Fills MultiLineString coordinates into lines object of arrays
function handleMultiLineString(coords, lines, indexMap, coordLength, properties) {
  for (const line of coords) {
    handleLineString(line, lines, indexMap, coordLength, properties);
  }
}

// Fills Polygon coordinates into polygons object of arrays
function handlePolygon(coords, polygons, indexMap, coordLength, properties) {
  polygons.polygonIndices[indexMap.polygonObject] = indexMap.polygonPosition;
  indexMap.polygonObject++;

  for (const ring of coords) {
    polygons.primitivePolygonIndices[indexMap.polygonRing] = indexMap.polygonPosition;
    indexMap.polygonRing++;

    fillCoords(polygons.positions, ring, indexMap.polygonPosition, coordLength);

    const nPositions = ring.length;
    fillNumericProperties(polygons, properties, indexMap.polygonPosition, nPositions);

    polygons.globalFeatureIds.set(
      new Uint32Array(nPositions).fill(indexMap.feature),
      indexMap.polygonPosition
    );
    polygons.featureIds.set(
      new Uint32Array(nPositions).fill(indexMap.polygonFeature),
      indexMap.polygonPosition
    );
    indexMap.polygonPosition += nPositions;
  }
}

// Fills MultiPolygon coordinates into polygons object of arrays
function handleMultiPolygon(coords, polygons, indexMap, coordLength, properties) {
  for (const polygon of coords) {
    handlePolygon(polygon, polygons, indexMap, coordLength, properties);
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
      object.numericProps[numericPropName].set(
        new Array(length).fill(properties[numericPropName]),
        index
      );
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

// coords is expected to be a list of arrays, each with length 2-3
function fillCoords(array, coords, startVertex, coordLength) {
  let index = startVertex * coordLength;
  for (const coord of coords) {
    array.set(coord, index);
    index += coordLength;
  }
}

function flatten(arrays) {
  return [].concat(...arrays);
}

function isNumeric(x) {
  return Number.isFinite(x);
}
