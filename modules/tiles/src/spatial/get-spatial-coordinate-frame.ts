// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadonlyCRSDefinition, SpatialReferenceCoordinateFrame} from '@math.gl/crs';

const GEOGRAPHIC_CRS = 'EPSG:4326';
const GEOCENTRIC_CRS = 'EPSG:4978';

/** Normalize common OGC URL and URN CRS spellings to authority identifiers. */
function normalizeCrsIdentifier(identifier: string): string {
  const normalizedIdentifier = identifier.trim().toUpperCase();
  const ogcMatch = normalizedIdentifier.match(
    /(?:\/DEF\/CRS\/|URN:OGC:DEF:CRS:)([A-Z0-9_-]+)(?:\/|::)(?:[^/:]*[/:])?([A-Z0-9_.-]+)$/
  );
  return ogcMatch ? `${ogcMatch[1]}:${ogcMatch[2]}` : normalizedIdentifier;
}

/**
 * Classify a CRS definition into the broad coordinate frame used by 3D format adapters.
 *
 * @param definition - CRS definition to classify.
 * @returns The broad geographic, geocentric, projected, local, or unknown frame.
 */
export function getSpatialCoordinateFrame(
  definition: ReadonlyCRSDefinition
): SpatialReferenceCoordinateFrame {
  if (typeof definition === 'string') {
    const normalized = normalizeCrsIdentifier(definition);
    if (normalized === GEOCENTRIC_CRS || /^GEOCCS\s*[\[(]/.test(normalized)) {
      return 'geocentric';
    }
    if (
      normalized === GEOGRAPHIC_CRS ||
      normalized === 'EPSG:4490' ||
      normalized === 'EPSG:4979' ||
      normalized === 'OGC:CRS84' ||
      normalized.includes('+PROJ=LONGLAT') ||
      normalized.includes('+PROJ=LATLONG') ||
      /^(?:GEOGCS|GEOGCRS|GEOGRAPHICCRS|GEOGRAPHIC2DCRS|GEOGRAPHIC3DCRS)\s*[\[(]/.test(normalized)
    ) {
      return 'geographic';
    }
    if (/^(?:GEODCRS|GEODETICCRS)\s*[\[(]/.test(normalized)) {
      return /CS\s*[\[(]\s*CARTESIAN/.test(normalized) ? 'geocentric' : 'geographic';
    }
    return 'projected';
  }

  const projJsonDefinition = definition as {
    type?: string;
    source_crs?: ReadonlyCRSDefinition;
    components?: readonly ReadonlyCRSDefinition[];
    coordinate_system?: {subtype?: string};
  };
  if (projJsonDefinition.type === 'BoundCRS' && projJsonDefinition.source_crs) {
    return getSpatialCoordinateFrame(projJsonDefinition.source_crs);
  }
  if (projJsonDefinition.type === 'CompoundCRS' && projJsonDefinition.components?.[0]) {
    return getSpatialCoordinateFrame(projJsonDefinition.components[0]);
  }
  if (String(projJsonDefinition.type).includes('Projected')) {
    return 'projected';
  }
  if (String(projJsonDefinition.type).includes('Geographic')) {
    return 'geographic';
  }
  if (String(projJsonDefinition.type).includes('Geodetic')) {
    return projJsonDefinition.coordinate_system?.subtype === 'Cartesian'
      ? 'geocentric'
      : 'geographic';
  }
  return 'projected';
}
