export function reprojectBinary(binaryFeatures, projection) {
  // Expect binaryFeatures to have points, lines, and polygons keys
  for (const binaryFeature of Object.values(binaryFeatures)) {
    const {positions} = binaryFeature;
    for (let i = 0; i < positions.value.length; i += positions.size) {
      positions.value.set(
        projection.project(Array.from(positions.value.subarray(i, i + positions.size))),
        i
      );
    }
  }
  return binaryFeatures;
}

export function reprojectGeoJson(features, projection) {
  for (const feature of features) {
    feature.geometry = reprojectGeometry(feature.geometry, projection);
  }
  return features;
}

function reprojectGeometry(geometry, projection) {
  geometry.coordinates = coordMap(geometry.coordinates, coord => projection.project(coord));
  return geometry;
}

function coordMap(array, fn) {
  return array.map(item => {
    if (isCoord(item)) {
      return fn(item);
    }

    return coordMap(item, fn);
  });
}

function isCoord(array) {
  return Number.isFinite(array[0]) && Number.isFinite(array[1]);
}
