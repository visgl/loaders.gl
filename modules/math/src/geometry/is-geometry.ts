// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Checking if it is geometry
 * @param geometry
 */
export default function isGeometry(geometry: any): boolean {
  return (
    geometry &&
    typeof geometry === 'object' &&
    geometry.mode &&
    geometry.attributes &&
    typeof geometry.attributes === 'object'
  );
}
