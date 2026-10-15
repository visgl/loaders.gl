// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Recognizes the common authority and PROJJSON descriptions of longitude/latitude WGS84. */
export function isLongitudeLatitudeCRS(coordinateSystem: unknown): boolean {
  if (typeof coordinateSystem === 'string') {
    return ['EPSG:4326', 'OGC:CRS84'].includes(coordinateSystem.toUpperCase());
  }
  const identifier = (coordinateSystem as {id?: {authority?: string; code?: string | number}})?.id;
  return (
    (identifier?.authority === 'EPSG' && Number(identifier.code) === 4326) ||
    (identifier?.authority === 'OGC' && identifier.code === 'CRS84')
  );
}
