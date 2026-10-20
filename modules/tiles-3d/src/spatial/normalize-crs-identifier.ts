// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Compact identifier for conventional WGS84 longitude/latitude coordinates. */
export const WGS84_GEOGRAPHIC_CRS = 'EPSG:4326';

/** Compact identifier for WGS84 Earth-centered, Earth-fixed coordinates. */
export const WGS84_GEOCENTRIC_CRS = 'EPSG:4978';

/**
 * Normalizes common OGC URL and URN CRS spellings to compact authority identifiers.
 *
 * This intentionally performs syntax normalization only. Authority lookup and semantic
 * equivalence remain outside the scope of `@math.gl/crs` and the tiles runtime.
 *
 * @param identifier - Serialized CRS identifier.
 * @returns Uppercase compact identifier when an OGC spelling is recognized.
 */
export function normalizeCrsIdentifier(identifier: string): string {
  const normalizedIdentifier = identifier.trim().toUpperCase();
  const ogcMatch = normalizedIdentifier.match(
    /(?:\/DEF\/CRS\/|URN:OGC:DEF:CRS:)([A-Z0-9_-]+)(?:\/|::)(?:[^/:]*[/:])?([A-Z0-9_.-]+)$/
  );
  return ogcMatch ? `${ogcMatch[1]}:${ogcMatch[2]}` : normalizedIdentifier;
}
