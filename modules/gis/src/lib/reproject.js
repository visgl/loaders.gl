export function mapBinaryCoords(binaryFeatures, fn) {
  // Expect binaryFeatures to have points, lines, and polygons keys
  for (const binaryFeature of Object.values(binaryFeatures)) {
    const {positions} = binaryFeature;
    for (let i = 0; i < positions.value.length; i += positions.size) {
      const coord = Array.from(positions.value.subarray(i, i + positions.size));
      const transformedCoord = fn(coord);
      positions.value.set(transformedCoord, i);
    }
  }
  return binaryFeatures;
}

export function mapGeoJsonCoords(features, fn) {
  for (const feature of features) {
    feature.geometry.coordinates = coordMap(feature.geometry.coordinates, coord => fn(coord));
  }
  return features;
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
