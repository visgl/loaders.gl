// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Color stops for the default single-band raster ramp. */
const COLOR_STOPS = [
  [8, 29, 88],
  [32, 83, 150],
  [39, 145, 140],
  [100, 189, 99],
  [252, 217, 98]
] as const;

/** Samples the default ramp at a normalized value and returns RGB bytes. */
export function sampleColorRamp(value: number): [number, number, number] {
  const scaledIndex = Math.max(0, Math.min(1, value)) * (COLOR_STOPS.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(COLOR_STOPS.length - 1, lowerIndex + 1);
  const mix = scaledIndex - lowerIndex;
  return [0, 1, 2].map(channel =>
    Math.round(
      COLOR_STOPS[lowerIndex][channel] +
        (COLOR_STOPS[upperIndex][channel] - COLOR_STOPS[lowerIndex][channel]) * mix
    )
  ) as [number, number, number];
}
