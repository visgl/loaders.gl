// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Updates bounds using a sample of the coordinates in a GeoArrow chunk.
 * @param flatCoordinates Interleaved coordinate values.
 * @param numberOfDimensions Number of values per coordinate.
 * @param bounds Bounds to update.
 * @param sampleSize Maximum number of coordinate samples.
 * @returns Updated bounds.
 */
export function updateBoundsFromGeoArrowSamples(
  flatCoordinates: Float64Array,
  numberOfDimensions: number,
  bounds: [number, number, number, number],
  sampleSize: number = 100
): [number, number, number, number] {
  const numberOfCoordinates = flatCoordinates.length / numberOfDimensions;
  const sampleStep = Math.max(Math.floor(numberOfCoordinates / sampleSize), 1);
  const updatedBounds: [number, number, number, number] = [...bounds];

  for (
    let coordinateIndex = 0;
    coordinateIndex < numberOfCoordinates;
    coordinateIndex += sampleStep
  ) {
    const longitude = flatCoordinates[coordinateIndex * numberOfDimensions];
    const latitude = flatCoordinates[coordinateIndex * numberOfDimensions + 1];
    updatedBounds[0] = Math.min(updatedBounds[0], longitude);
    updatedBounds[1] = Math.min(updatedBounds[1], latitude);
    updatedBounds[2] = Math.max(updatedBounds[2], longitude);
    updatedBounds[3] = Math.max(updatedBounds[3], latitude);
  }

  return updatedBounds;
}
