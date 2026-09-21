// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CRSIdentifier} from '@math.gl/crs';

/** A CRS identifier accepted by OGC and ArcGIS services. */
export type ServiceCRS = CRSIdentifier | number;

/** Normalizes common OGC and ArcGIS CRS spellings to a stable identifier. */
export function normalizeServiceCRS(crs: ServiceCRS | undefined): string | undefined {
  if (crs === undefined || crs === null) return undefined;
  if (typeof crs === 'number') return `EPSG:${crs}`;
  const value = crs.trim();
  if (!value) return undefined;
  const upperValue = value.toUpperCase();
  if (upperValue === 'CRS:84' || upperValue.endsWith('/CRS84')) return 'CRS:84';
  const epsgMatch = /(?:EPSG[:/]|::)(?:\d+\/)?(\d+)$/i.exec(value);
  return epsgMatch ? `EPSG:${epsgMatch[1]}` : upperValue;
}

/** Returns whether two CRS identifiers refer to the same service coordinate system. */
export function areServiceCRSEquivalent(
  firstCRS: ServiceCRS | undefined,
  secondCRS: ServiceCRS | undefined
): boolean {
  const first = normalizeServiceCRS(firstCRS);
  const second = normalizeServiceCRS(secondCRS);
  if (!first || !second) return false;
  if (first === second) return true;
  const webMercatorCRS = new Set(['EPSG:3857', 'EPSG:900913', 'EPSG:102100', 'EPSG:102113']);
  return webMercatorCRS.has(first) && webMercatorCRS.has(second);
}

/** Selects the first supported CRS compatible with a requested CRS. */
export function selectServiceCRS(
  requestedCRS: ServiceCRS | undefined,
  supportedCRS: readonly ServiceCRS[]
): string | undefined {
  if (!supportedCRS.length) return normalizeServiceCRS(requestedCRS);
  return (
    supportedCRS.find(crs => areServiceCRSEquivalent(requestedCRS, crs)) || supportedCRS[0]
  ).toString();
}

/**
 * Returns the conventional axis order used on the service wire.
 *
 * Application bounding boxes and decoded geometry remain canonical `xy` (x/easting or longitude
 * first); callers use this result only when constructing protocol-specific request coordinates.
 * The rule intentionally covers the common WFS 1.1/2.0 EPSG:4326 case without claiming to be a
 * complete authority-axis registry.
 */
export function getServiceCRSAxisOrder(crs: ServiceCRS | undefined): 'xy' | 'yx' {
  return normalizeServiceCRS(crs) === 'EPSG:4326' ? 'yx' : 'xy';
}
