export function mapBinaryCoords(binaryFeatures, fn) {
  // Expect binaryFeatures to have points, lines, and polygons keys
  for (const binaryFeature of Object.values(binaryFeatures)) {
    const {positions} = binaryFeature;
    for (let i = 0; i < positions.value.length; i += positions.size) {
      positions.value.set(fn(Array.from(positions.value.subarray(i, i + positions.size))), i);
    }
  }
  return binaryFeatures;
}

export function mapGeoJsonCoords(features, fn) {
  for (const feature of features) {
    feature.geometry = reprojectGeometry(feature.geometry, fn);
  }
  return features;
}

function reprojectGeometry(geometry, fn) {
  geometry.coordinates = coordMap(geometry.coordinates, coord => fn(coord));
  return geometry;
}

function coordMap(array, fn) {
  if (isCoord(array)) {
    return fn(array);
  }

  return array.map(item => {
    return coordMap(item, fn);
  });
}

function isCoord(array) {
  return Number.isFinite(array[0]) && Number.isFinite(array[1]);
}
