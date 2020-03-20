// Convert GeoJSON features to flat binary arrays
export function geojsonToBinary(features, options = {}) {
  const firstPassData = firstPass(features);
  return secondPass(features, firstPassData, options);
}

// Initial scan over GeoJSON features
// Counts number of coordinates of each geometry type and keeps track of the max coordinate
// dimensions
// eslint-disable-next-line complexity, max-statements
function firstPass(features) {
  // Counts the number of _positions_, so [x, y, z] counts as one
  let pointPositions = 0;
  let linePositions = 0;
  let linePaths = 0;
  let polygonPositions = 0;
  let polygonObjects = 0;
  let polygonRings = 0;
  const coordLengths = new Set();
  const numericProps = {};

  for (const feature of features) {
    const geometry = feature.geometry;
    switch (geometry.type) {
      case 'Point':
        pointPositions++;
        coordLengths.add(geometry.coordinates.length);
        break;
      case 'MultiPoint':
        pointPositions += geometry.coordinates.length;
        for (const point of geometry.coordinates) {
          coordLengths.add(point.length);
        }
        break;
      case 'LineString':
        linePositions += geometry.coordinates.length;
        linePaths++;

        for (const coord of geometry.coordinates) {
          coordLengths.add(coord.length);
        }
        break;
      case 'MultiLineString':
        for (const line of geometry.coordinates) {
          linePositions += line.length;
          linePaths++;

          // eslint-disable-next-line max-depth
          for (const coord of line) {
            coordLengths.add(coord.length);
          }
        }
        break;
      case 'Polygon':
        polygonObjects++;
        polygonRings += geometry.coordinates.length;
        polygonPositions += flatten(geometry.coordinates).length;

        for (const coord of flatten(geometry.coordinates)) {
          coordLengths.add(coord.length);
        }
        break;
      case 'MultiPolygon':
        for (const polygon of geometry.coordinates) {
          polygonObjects++;
          polygonRings += polygon.length;
          polygonPositions += flatten(polygon).length;

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
        numericProps[key] = numericProps[key] ? isNumeric(val) : numericProps[key];
      }
    }
  }

  return {
    pointPositions,
    linePositions,
    linePaths,
    coordLength: Math.max(...coordLengths),
    polygonPositions,
    polygonObjects,
    polygonRings,
    // Array of keys whose values are always numeric
    numericProps: Object.keys(numericProps).filter(k => numericProps[k])
  };
}

// Second scan over GeoJSON features
// Fills coordinates into pre-allocated typed arrays
function secondPass(features, firstPassData, options = {}) {
  const {
    pointPositions,
    linePositions,
    linePaths,
    coordLength,
    polygonPositions,
    polygonObjects,
    polygonRings,
    numericProps
  } = firstPassData;
  const {PositionDataType = Float32Array} = options;
  const points = {
    positions: new PositionDataType(pointPositions * coordLength),
    objectIds: new Uint32Array(pointPositions),
    numericProps: {}
  };
  const lines = {
    pathIndices: new Uint32Array(linePaths + 1),
    positions: new PositionDataType(linePositions * coordLength),
    objectIds: new Uint32Array(linePositions),
    numericProps: {}
  };
  const polygons = {
    polygonIndices: new Uint32Array(polygonObjects + 1),
    primitivePolygonIndices: new Uint32Array(polygonRings + 1),
    positions: new PositionDataType(polygonPositions * coordLength),
    objectIds: new Uint32Array(polygonPositions),
    numericProps: {}
  };

  // Instantiate numeric properties arrays; one value per vertex
  for (const object of [points, lines, polygons]) {
    for (const propName of numericProps) {
      object.numericProps[propName] = new Float32Array(object.positions.length / coordLength);
    }
  }
  // Set last element of path/polygon indices as positions length
  lines.pathIndices[linePaths] = linePositions;
  polygons.polygonIndices[polygonObjects] = polygonPositions;
  polygons.primitivePolygonIndices[polygonRings] = polygonPositions;

  const indexMap = {
    pointPosition: 0,
    linePosition: 0,
    linePath: 0,
    polygonPosition: 0,
    polygonObject: 0,
    polygonRing: 0,
    feature: 0
  };

  for (const feature of features) {
    const geometry = feature.geometry;
    const properties = feature.properties;

    switch (geometry.type) {
      case 'Point':
        handlePoint(geometry.coordinates, points, indexMap, coordLength, properties);
        break;
      case 'MultiPoint':
        handleMultiPoint(geometry.coordinates, points, indexMap, coordLength, properties);
        break;
      case 'LineString':
        handleLineString(geometry.coordinates, lines, indexMap, coordLength, properties);
        break;
      case 'MultiLineString':
        handleMultiLineString(geometry.coordinates, lines, indexMap, coordLength, properties);
        break;
      case 'Polygon':
        handlePolygon(geometry.coordinates, polygons, indexMap, coordLength, properties);
        break;
      case 'MultiPolygon':
        handleMultiPolygon(geometry.coordinates, polygons, indexMap, coordLength, properties);
        break;
      default:
        throw new Error('Invalid geometry type');
    }

    indexMap.feature++;
  }

  // Wrap each array in an accessor object with value and size keys
  return {
    points: {
      positions: {value: points.positions, size: coordLength},
      objectIds: {value: points.objectIds, size: 1}
    },
    lines: {
      pathIndices: {value: lines.pathIndices, size: 1},
      positions: {value: lines.positions, size: coordLength},
      objectIds: {value: lines.objectIds, size: 1}
    },
    polygons: {
      polygonIndices: {value: polygons.polygonIndices, size: 1},
      primitivePolygonIndices: {value: polygons.primitivePolygonIndices, size: 1},
      positions: {value: polygons.positions, size: coordLength},
      objectIds: {value: polygons.objectIds, size: 1}
    }
  };
}

// Fills Point coordinates into points object of arrays
function handlePoint(coords, points, indexMap, coordLength, properties) {
  points.positions.set(coords, indexMap.pointPosition * coordLength);
  points.objectIds[indexMap.pointPosition] = indexMap.feature;

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

  lines.positions.set(flatten(coords), indexMap.linePosition * coordLength);

  const nPositions = coords.length;
  fillNumericProperties(lines, properties, indexMap.linePosition, nPositions);

  lines.objectIds.set(new Uint32Array(nPositions).fill(indexMap.feature), indexMap.linePosition);
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

    polygons.positions.set(flatten(ring), indexMap.polygonPosition * coordLength);

    const nPositions = ring.length;
    fillNumericProperties(polygons, properties, indexMap.polygonPosition, nPositions);

    polygons.objectIds.set(
      new Uint32Array(nPositions).fill(indexMap.feature),
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

function flatten(arrays) {
  return [].concat(...arrays);
}

function isNumeric(x) {
  return Number.isFinite(x);
}
