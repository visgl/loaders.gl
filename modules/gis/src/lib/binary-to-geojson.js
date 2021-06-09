export function binaryToGeoJson(data, type, format) {
  if (format === 'geometry') {
    return parseGeometry(data);
  }

  const dataArray = normalizeInput(data, type);

  switch (deduceReturnType(dataArray)) {
    case 'Geometry':
      return parseGeometry(dataArray[0]);
    case 'FeatureCollection':
      return parseFeatureCollection(dataArray);
    default:
      break;
  }

  return null;
}

// Normalize features
// Return an array of data objects, each of which have a type key
function normalizeInput(data, type) {
  const isHeterogeneousType = Boolean(data.points || data.lines || data.polygons);

  if (!isHeterogeneousType) {
    data.type = type || parseType(data);
    return [data];
  }

  const features = [];
  if (data.points) {
    data.points.type = 'Point';
    features.push(data.points);
  }
  if (data.lines) {
    data.lines.type = 'LineString';
    features.push(data.lines);
  }
  if (data.polygons) {
    data.polygons.type = 'Polygon';
    features.push(data.polygons);
  }
  return features;
}

// Determine whether a geometry or feature collection should be returned
// If the input data doesn't have property identifiers, returns a single geometry
function deduceReturnType(dataArray) {
  // If more than one item in dataArray, multiple geometry types, must be a featurecollection
  if (dataArray.length > 1) {
    return 'FeatureCollection';
  }

  const data = dataArray[0];
  if (!(data.featureIds || data.globalFeatureIds || data.numericProps || data.properties)) {
    return 'Geometry';
  }

  return 'FeatureCollection';
}

/** Parse input binary data and return an array of GeoJSON Features */
function parseFeatureCollection(dataArray) {
  const features = [];
  for (const data of dataArray) {
    if (data.featureIds.value.length === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }
    let lastIndex = 0;
    let lastValue = data.featureIds.value[0];

    // Need to deduce start, end indices of each feature
    for (let i = 0; i < data.featureIds.value.length; i++) {
      const currValue = data.featureIds.value[i];
      if (currValue === lastValue) {
        // eslint-disable-next-line no-continue
        continue;
      }

      features.push(parseFeature(data, lastIndex, i));
      lastIndex = i;
      lastValue = currValue;
    }

    // Last feature
    features.push(parseFeature(data, lastIndex, data.featureIds.value.length));
  }
  return features;
}

/** Parse input binary data and return a single GeoJSON Feature */
function parseFeature(data, startIndex, endIndex) {
  const geometry = parseGeometry(data, startIndex, endIndex);
  const properties = parseProperties(data, startIndex, endIndex);
  return {type: 'Feature', geometry, properties};
}

/** Parse input binary data and return an object of properties */
function parseProperties(data, startIndex, endIndex) {
  const properties = Object.assign(data.properties[data.featureIds.value[startIndex]]);
  for (const key in data.numericProps) {
    properties[key] = data.numericProps[key].value[startIndex];
  }
  return properties;
}

/** Parse input binary data and return a valid GeoJSON geometry object */
function parseGeometry(data, startIndex, endIndex) {
  switch (data.type) {
    case 'Point':
      return pointToGeoJson(data, startIndex, endIndex);
    case 'LineString':
      return lineStringToGeoJson(data, startIndex, endIndex);
    case 'Polygon':
      return polygonToGeoJson(data, startIndex, endIndex);
    default:
      throw new Error(`Unsupported geometry type: ${data.type}`);
  }
}

/** Parse binary data of type Polygon */
function polygonToGeoJson(data, startIndex = -Infinity, endIndex = Infinity) {
  const {positions} = data;
  const polygonIndices = data.polygonIndices.value.filter((x) => x >= startIndex && x <= endIndex);
  const primitivePolygonIndices = data.primitivePolygonIndices.value.filter(
    (x) => x >= startIndex && x <= endIndex
  );
  const multi = polygonIndices.length > 2;

  const coordinates = [];
  // Polygon
  if (!multi) {
    for (let i = 0; i < primitivePolygonIndices.length - 1; i++) {
      const startRingIndex = primitivePolygonIndices[i];
      const endRingIndex = primitivePolygonIndices[i + 1];
      const ringCoordinates = ringToGeoJson(positions, startRingIndex, endRingIndex);
      coordinates.push(ringCoordinates);
    }

    return {type: 'Polygon', coordinates};
  }

  // MultiPolygon
  for (let i = 0; i < polygonIndices.length - 1; i++) {
    const startPolygonIndex = polygonIndices[i];
    const endPolygonIndex = polygonIndices[i + 1];
    const polygonCoordinates = polygonToGeoJson(
      data,
      startPolygonIndex,
      endPolygonIndex
    ).coordinates;
    coordinates.push(polygonCoordinates);
  }

  return {type: 'MultiPolygon', coordinates};
}

/** Parse binary data of type LineString */
function lineStringToGeoJson(data, startIndex = -Infinity, endIndex = Infinity) {
  const {positions} = data;
  const pathIndices = data.pathIndices.value.filter((x) => x >= startIndex && x <= endIndex);
  const multi = pathIndices.length > 2;

  if (!multi) {
    const coordinates = ringToGeoJson(positions, pathIndices[0], pathIndices[1]);
    return {type: 'LineString', coordinates};
  }

  const coordinates = [];
  for (let i = 0; i < pathIndices.length - 1; i++) {
    const ringCoordinates = ringToGeoJson(positions, pathIndices[i], pathIndices[i + 1]);
    coordinates.push(ringCoordinates);
  }

  return {type: 'MultiLineString', coordinates};
}

/** Parse binary data of type Point */
function pointToGeoJson(data, startIndex, endIndex) {
  const {positions} = data;
  const coordinates = ringToGeoJson(positions, startIndex, endIndex);
  const multi = coordinates.length > 1;

  if (multi) {
    return {type: 'MultiPoint', coordinates};
  }

  return {type: 'Point', coordinates: coordinates[0]};
}

/**
 * Parse a linear ring of positions to a GeoJSON linear ring
 *
 * @param positions Positions TypedArray
 * @param  {number?} startIndex Start index to include in ring
 * @param  {number?} endIndex End index to include in ring
 * @return {number[][]} GeoJSON ring
 */
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

// Deduce geometry type of data object
function parseType(data) {
  if (data.pathIndices) {
    return 'LineString';
  }

  if (data.polygonIndices) {
    return 'Polygon';
  }

  return 'Point';
}
