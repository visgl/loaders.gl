// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Updates bounds using a sample of the coordinates in a GeoArrow chunk.
 * NaN ordinates leave their respective bounds unchanged, preserving empty-point behavior.
 * @param flatCoordinates Interleaved coordinate values.
 * @param numberOfDimensions Number of values per coordinate.
 * @param bounds Bounds to update.
 * @param sampleSize Target number of coordinate samples.
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
    if (longitude < updatedBounds[0]) {
      updatedBounds[0] = longitude;
    }
    if (latitude < updatedBounds[1]) {
      updatedBounds[1] = latitude;
    }
    if (longitude > updatedBounds[2]) {
      updatedBounds[2] = longitude;
    }
    if (latitude > updatedBounds[3]) {
      updatedBounds[3] = latitude;
    }
  }

  return updatedBounds;
}
