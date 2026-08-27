// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Returns a conservative deck.gl device-pixel setting for the current device. */
export function getExampleDevicePixelRatio(): number {
  if (typeof window === 'undefined') {
    return 1;
  }

  const isConstrainedDevice = window.matchMedia('(max-width: 700px)').matches ||
    /iPad|iPhone|iPod/.test(window.navigator.userAgent);
  return isConstrainedDevice ? 1 : Math.min(window.devicePixelRatio || 1, 2);
}

/** Returns the maximum number of decoded geospatial rows for the current device. */
export function getExampleRowLimit(): number {
  return getExampleDevicePixelRatio() === 1 ? 500_000 : 1_800_000;
}

