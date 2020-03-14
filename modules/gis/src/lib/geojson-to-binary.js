export function featuresToBinary(features, options = {}) {
  const firstPassData = firstPass(features);
  return secondPass(features, firstPassData, options);
}

function firstPass(features) {
  // Counts the number of _positions_, so [x, y, z] counts as one
  let pointPositions = 0;
  let linePositions = 0;
  let linePaths = 0;
  let polygonPositions = 0;
  let polygonObjects = 0;
  let polygonRings = 0;
  let maxCoordLength = 2;

  features.forEach(feature => {
    const geometry = feature.geometry;
    switch (geometry.type) {
      case 'Point':
        pointPositions++;
        if (geometry.coordinates.length === 3) maxCoordLength = 3;
        break;
      case 'MultiPoint':
        pointPositions += geometry.coordinates.length;
        geometry.coordinates.forEach(point => {
          if (point.length === 3) maxCoordLength = 3;
        });
        break;
      case 'LineString':
        linePositions += geometry.coordinates.length;
        linePaths++;

        geometry.coordinates.forEach(coord => {
          if (coord.length === 3) maxCoordLength = 3;
        });
        break;
      case 'MultiLineString':
        geometry.coordinates.forEach(line => {
          linePositions += line.length;
          linePaths++;

          line.coordinates.forEach(coord => {
            if (coord.length === 3) maxCoordLength = 3;
          });
        });
        break;
      case 'Polygon':
        polygonObjects++;
        polygonRings += geometry.coordinates.length;
        polygonPositions += geometry.coordinates.flat(1).length;

        geometry.coordinates.flat().forEach(coord => {
          if (coord.length === 3) maxCoordLength = 3;
        });
        break;
      case 'MultiPolygon':
        geometry.coordinates.forEach(polygon => {
          polygonObjects++;
          polygonRings += polygon.length;
          polygonPositions += polygon.flat(1).length;

          geometry.coordinates.flat().forEach(coord => {
            if (coord.length === 3) maxCoordLength = 3;
          });
        });
        break;
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
  });

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

  features.forEach(feature => {
    const geometry = feature.geometry;

    switch (geometry.type) {
      case 'Point':
        handlePoint({coords: geometry.coordinates, points, index, coordLength});
        break;
      case 'MultiPoint':
        handleMultiPoint({coords: geometry.coordinates, points, index, coordLength});
        break;
      case 'LineString':
        handleLineString({coords: geometry.coordinates, lines, index, coordLength});
        break;
      case 'MultiLineString':
        handleMultiLineString({coords: geometry.coordinates, lines, index, coordLength});
        break;
      case 'Polygon':
        handlePolygon({coords: geometry.coordinates, polygons, index, coordLength});
        break;
      case 'MultiPolygon':
        handleMultiPolygon({coords: geometry.coordinates, polygons, index, coordLength});
        break;
      default:
        throw new Error('Invalid geometry type');
    }

    index.feature++;
  });

  return {
    points,
    lines,
    polygons
  };
}

function handlePoint({coords, points, index, coordLength}) {
  points.positions.set(coords, index.pointPosition * coordLength);
  points.objectIds[index.pointPosition] = index.feature;
  index.pointPosition++;
}

function handleMultiPoint({coords, points, index, coordLength}) {
  coords.forEach(point => {
    handlePoint({coords: point, points, index, coordLength});
  });
}

function handleLineString({coords, lines, index, coordLength}) {
  lines.pathIndices[index.linePath] = index.linePosition * coordLength;
  index.linePath++;

  // TODO: if coordLength is 3, check length of each geometry.coordinates array, filling
  // 3rd value if necessary?
  lines.positions.set(coords.flat(), index.linePosition * coordLength);

  const nPositions = coords.length;
  lines.objectIds.set(new Uint32Array(nPositions).fill(index.feature), index.linePosition);
  index.linePosition += nPositions;
}

function handleMultiLineString({coords, lines, index, coordLength}) {
  coords.forEach(line => {
    handleLineString({coords: line, lines, index, coordLength});
  });
}

function handlePolygon({coords, polygons, index, coordLength}) {
  polygons.polygonIndices[index.polygonObject] = index.polygonPosition * coordLength;
  index.polygonObject++;

  coords.forEach(() => {
    polygons.primitivePolygonIndices[index.polygonRing] = index.polygonPosition * coordLength;
    index.polygonRing++;
  });

  polygons.positions.set(coords.flat(2), index.polygonPosition * coordLength);

  const nPositions = coords.flat(1).length;
  polygons.objectIds.set(new Uint32Array(nPositions).fill(index.feature), index.polygonPosition);
  index.polygonPosition += nPositions;
}

function handleMultiPolygon({coords, lines, index, coordLength}) {
  coords.forEach(polygon => {
    handleLineString({coords: polygon, lines, index, coordLength});
  });
}
