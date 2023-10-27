// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

/**
 *  Update bounds from geoarrow sample data
 *
 * @param flatCoords the flattend coordinates array from one chunk of geoarrow column
 * @param nDim the number of dimensions of the coordinates
 * @param bounds the bounds to be updated
 * @param sampleSize how many samples to be used to update the bounds, default is 1000 per chunk
 * @returns the updated bounds
 */
export function updateBoundsFromGeoArrowSamples(
  flatCoords: Float64Array,
  nDim: number,
  bounds: [number, number, number, number],
  sampleSize: number = 100
): [number, number, number, number] {
  const numberOfFeatures = flatCoords.length / nDim;
  const sampleStep = Math.max(Math.floor(numberOfFeatures / sampleSize), 1);

  const newBounds: [number, number, number, number] = [...bounds];
  for (let i = 0; i < numberOfFeatures; i += sampleStep) {
    const lng = flatCoords[i * nDim];
    const lat = flatCoords[i * nDim + 1];
    if (lng < bounds[0]) {
      newBounds[0] = lng;
    }
    if (lat < newBounds[1]) {
      newBounds[1] = lat;
    }
    if (lng > newBounds[2]) {
      newBounds[2] = lng;
    }
    if (lat > newBounds[3]) {
      newBounds[3] = lat;
    }
  }

  return newBounds;
}
