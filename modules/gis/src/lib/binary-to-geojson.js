export function binaryToGeoJson(data, type) {
  const isFeature = Boolean(
    data.featureIds || data.globalFeatureIds || data.numericProps || data.properties
  );

  // If not a feature, return only the geometry
  if (!isFeature) {
    return parseGeometry(data, type);
  }

  // TODO parse binary features, incl properties
  return parseFeature(data, type);
}

function parseFeature(data, type) {
  const geometry = parseGeometry(data, type);
  return {type: 'Feature', geometry};
}

function parseGeometry(data, type) {
  switch (type || parseType(data)) {
    case 'point':
      return pointToGeoJson(data);
    case 'lineString':
      return lineStringToGeoJson(data);
    case 'polygon':
      return polygonToGeoJson(data);
    default:
      throw new Error('Invalid type');
  }
}

function parseType(data) {
  if (data.pathIndices) {
    return 'lineString';
  }

  if (data.polygonIndices) {
    return 'polygon';
  }

  return 'point';
}

function polygonToGeoJson(data) {
  const {
    positions,
    polygonIndices: {value: polygonIndices},
    primitivePolygonIndices: {value: primitivePolygonIndices}
  } = data;
  const multi = polygonIndices.length > 2;

  const coordinates = [];
  if (!multi) {
    for (let i = 0; i < primitivePolygonIndices.length - 1; i++) {
      const ringCoordinates = ringToGeoJson(
        positions,
        primitivePolygonIndices[i],
        primitivePolygonIndices[i + 1]
      );
      coordinates.push(ringCoordinates);
    }

    return {type: 'Polygon', coordinates};
  }

  // TODO handle MultiPolygon
  return {type: 'MultiPolygon', coordinates};
}

function lineStringToGeoJson(data) {
  const {
    positions,
    pathIndices: {value: pathIndices}
  } = data;
  const multi = pathIndices.length > 2;

  if (!multi) {
    const coordinates = ringToGeoJson(positions);
    return {type: 'LineString', coordinates};
  }

  const coordinates = [];
  for (let i = 0; i < pathIndices.length - 1; i++) {
    const ringCoordinates = ringToGeoJson(positions, pathIndices[i], pathIndices[i + 1]);
    coordinates.push(ringCoordinates);
  }

  return {type: 'MultiLineString', coordinates};
}

function pointToGeoJson(data) {
  const {positions} = data;
  const multi = positions.value.length / positions.size > 1;
  const coordinates = ringToGeoJson(positions);

  if (multi) {
    return {type: 'MultiPoint', coordinates};
  }

  return {type: 'Point', coordinates: coordinates[0]};
}

function ringToGeoJson(positions, startIndex, endIndex) {
  startIndex = startIndex || 0;
  endIndex = endIndex || positions.value.length / positions.size;

  const ringCoordinates = [];
  for (let j = startIndex; j < endIndex; j++) {
    ringCoordinates.push(
      Array.from(positions.value.subarray(j * positions.size, (j + 1) * positions.size))
    );
  }
  return ringCoordinates;
}
