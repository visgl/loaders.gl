// Convert GeoJSON features to flat binary arrays
export function geojsonToBinary(features, options = {}) {
  const firstPassData = firstPass(features);
  return secondPass(features, firstPassData, options);
}

// Initial scan over GeoJSON features
// Counts number of coordinates of each geometry type and keeps track of the max coordinate
// dimensions
// eslint-disable-next-line complexity
function firstPass(features) {
  // Counts the number of _positions_, so [x, y, z] counts as one
  let pointPositions = 0;
  let linePositions = 0;
  let linePaths = 0;
  let polygonPositions = 0;
  let polygonObjects = 0;
  let polygonRings = 0;
  let maxCoordLength = 2;

  for (const feature of features) {
    const geometry = feature.geometry;
    switch (geometry.type) {
      case 'Point':
        pointPositions++;
        if (geometry.coordinates.length === 3) maxCoordLength = 3;
        break;
      case 'MultiPoint':
        pointPositions += geometry.coordinates.length;
        for (const point of geometry.coordinates) {
          // eslint-disable-next-line max-depth
          if (point.length === 3) maxCoordLength = 3;
        }
        break;
      case 'LineString':
        linePositions += geometry.coordinates.length;
        linePaths++;

        for (const coord of geometry.coordinates) {
          // eslint-disable-next-line max-depth
          if (coord.length === 3) maxCoordLength = 3;
        }
        break;
      case 'MultiLineString':
        for (const line of geometry.coordinates) {
          linePositions += line.length;
          linePaths++;

          // eslint-disable-next-line max-depth
          for (const coord of line.coordinates) {
            // eslint-disable-next-line max-depth
            if (coord.length === 3) maxCoordLength = 3;
          }
        }
        break;
      case 'Polygon':
        polygonObjects++;
        polygonRings += geometry.coordinates.length;
        polygonPositions += geometry.coordinates.flat(1).length;

        for (const coord of geometry.coordinates.flat()) {
          // eslint-disable-next-line max-depth
          if (coord.length === 3) maxCoordLength = 3;
        }
        break;
      case 'MultiPolygon':
        for (const polygon of geometry.coordinates) {
          polygonObjects++;
          polygonRings += polygon.length;
          polygonPositions += polygon.flat(1).length;

          // eslint-disable-next-line max-depth
          for (const coord of geometry.coordinates.flat()) {
            // eslint-disable-next-line max-depth
            if (coord.length === 3) maxCoordLength = 3;
          }
        }
        break;
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
  }

  return {
    pointPositions,
    linePositions,
    linePaths,
    coordLength: maxCoordLength,
    polygonPositions,
    polygonObjects,
    polygonRings
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
    polygonRings
  } = firstPassData;
  const {PositionDataType = Float32Array} = options;
  const points = {
    positions: new PositionDataType(pointPositions * coordLength),
    objectIds: new Uint32Array(pointPositions)
  };
  const lines = {
    pathIndices: new Uint32Array(linePaths),
    positions: new PositionDataType(linePositions * coordLength),
    objectIds: new Uint32Array(linePositions)
  };
  const polygons = {
    polygonIndices: new Uint32Array(polygonObjects),
    primitivePolygonIndices: new Uint32Array(polygonRings),
    positions: new PositionDataType(polygonPositions * coordLength),
    objectIds: new Uint32Array(polygonPositions)
  };

  const index = {
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

    switch (geometry.type) {
      case 'Point':
        handlePoint(geometry.coordinates, points, index, coordLength);
        break;
      case 'MultiPoint':
        handleMultiPoint(geometry.coordinates, points, index, coordLength);
        break;
      case 'LineString':
        handleLineString(geometry.coordinates, lines, index, coordLength);
        break;
      case 'MultiLineString':
        handleMultiLineString(geometry.coordinates, lines, index, coordLength);
        break;
      case 'Polygon':
        handlePolygon(geometry.coordinates, polygons, index, coordLength);
        break;
      case 'MultiPolygon':
        handleMultiPolygon(geometry.coordinates, polygons, index, coordLength);
        break;
      default:
        throw new Error('Invalid geometry type');
    }

    index.feature++;
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
function handlePoint(coords, points, index, coordLength) {
  points.positions.set(coords, index.pointPosition * coordLength);
  points.objectIds[index.pointPosition] = index.feature;
  index.pointPosition++;
}

// Fills MultiPoint coordinates into points object of arrays
function handleMultiPoint(coords, points, index, coordLength) {
  for (const point of coords) {
    handlePoint(point, points, index, coordLength);
  }
}

// Fills LineString coordinates into lines object of arrays
function handleLineString(coords, lines, index, coordLength) {
  lines.pathIndices[index.linePath] = index.linePosition * coordLength;
  index.linePath++;

  lines.positions.set(coords.flat(), index.linePosition * coordLength);

  const nPositions = coords.length;
  lines.objectIds.set(new Uint32Array(nPositions).fill(index.feature), index.linePosition);
  index.linePosition += nPositions;
}

// Fills MultiLineString coordinates into lines object of arrays
function handleMultiLineString(coords, lines, index, coordLength) {
  for (const line of coords) {
    handleLineString(line, lines, index, coordLength);
  }
}

// Fills Polygon coordinates into polygons object of arrays
function handlePolygon(coords, polygons, index, coordLength) {
  polygons.polygonIndices[index.polygonObject] = index.polygonPosition * coordLength;
  index.polygonObject++;

  for (const {} of coords) {
    polygons.primitivePolygonIndices[index.polygonRing] = index.polygonPosition * coordLength;
    index.polygonRing++;
  }

  polygons.positions.set(coords.flat(2), index.polygonPosition * coordLength);

  const nPositions = coords.flat(1).length;
  polygons.objectIds.set(new Uint32Array(nPositions).fill(index.feature), index.polygonPosition);
  index.polygonPosition += nPositions;
}

// Fills MultiPolygon coordinates into polygons object of arrays
function handleMultiPolygon(coords, polygons, index, coordLength) {
  for (const polygon of coords) {
    handlePolygon(polygon, polygons, index, coordLength);
  }
}
