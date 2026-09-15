// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  inferCRSRepresentation,
  parsePROJString,
  parseWKTCRS,
  type ReadonlyCRSDefinition,
  type SpatialReferenceCoordinateFrame,
  type WKTCRSNode
} from '@math.gl/crs';
import {
  normalizeCrsIdentifier,
  WGS84_GEOCENTRIC_CRS,
  WGS84_GEOGRAPHIC_CRS
} from './normalize-crs-identifier';

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
    const representation = inferCRSRepresentation(definition);
    if (representation === 'wkt') {
      return getWktCoordinateFrame(definition);
    }
    if (representation === 'proj-string') {
      return getProjStringCoordinateFrame(definition);
    }
    return getKnownCrsIdentifierCoordinateFrame(definition) || 'projected';
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
  return 'unknown';
}

/**
 * Classifies authority identifiers for which the tiles runtime has explicit frame knowledge.
 *
 * Unlike {@link getSpatialCoordinateFrame}, this function does not assume that an unrecognized
 * authority identifier is projected. Draft formats use this strict result to avoid inventing
 * semantics for unknown authorities or registry codes.
 *
 * @param definition - Serialized CRS identifier.
 * @returns A known frame, or `undefined` when registry semantics are unavailable.
 */
export function getKnownCrsIdentifierCoordinateFrame(
  definition: ReadonlyCRSDefinition | undefined
): SpatialReferenceCoordinateFrame | undefined {
  if (typeof definition !== 'string') {
    return undefined;
  }
  const normalized = normalizeCrsIdentifier(definition);
  if (normalized === WGS84_GEOCENTRIC_CRS) {
    return 'geocentric';
  }
  if (normalized === WGS84_GEOGRAPHIC_CRS || normalized === 'OGC:CRS84') {
    return 'geographic';
  }
  const epsgMatch = /^EPSG:(\d+)$/.exec(normalized);
  if (!epsgMatch) {
    return undefined;
  }
  const identifier = Number(epsgMatch[1]);
  if (identifier === 7789) {
    return 'geocentric';
  }
  if (identifier === 4490 || identifier === 4979) {
    return 'geographic';
  }
  if (
    identifier === 3857 ||
    (identifier >= 32601 && identifier <= 32660) ||
    (identifier >= 32701 && identifier <= 32760)
  ) {
    return 'projected';
  }
  return undefined;
}

/** Classifies a WKT definition using the syntax tree parsed by `@math.gl/crs`. */
function getWktCoordinateFrame(definition: string): SpatialReferenceCoordinateFrame {
  let root: WKTCRSNode;
  try {
    root = parseWKTCRS(definition).root;
  } catch {
    return 'unknown';
  }
  switch (root.keyword.toUpperCase()) {
    case 'GEOCCS':
      return 'geocentric';
    case 'GEOGCS':
    case 'GEOGCRS':
    case 'GEOGRAPHICCRS':
    case 'GEOGRAPHIC2DCRS':
    case 'GEOGRAPHIC3DCRS':
      return 'geographic';
    case 'PROJCS':
    case 'PROJCRS':
    case 'PROJECTEDCRS':
      return 'projected';
    case 'GEODCRS':
    case 'GEODETICCRS': {
      const coordinateSystem = root.values.find(
        (value): value is WKTCRSNode =>
          value.type === 'node' && value.keyword.toUpperCase() === 'CS'
      );
      const subtype = coordinateSystem?.values[0];
      if (subtype?.type !== 'enumeration' && subtype?.type !== 'string') {
        return 'unknown';
      }
      return subtype.value.toUpperCase() === 'CARTESIAN'
        ? 'geocentric'
        : subtype.value.toUpperCase() === 'ELLIPSOIDAL'
          ? 'geographic'
          : 'unknown';
    }
    default:
      return 'unknown';
  }
}

/** Classifies a PROJ string using the syntax tree parsed by `@math.gl/crs`. */
function getProjStringCoordinateFrame(definition: string): SpatialReferenceCoordinateFrame {
  try {
    const projection = parsePROJString(definition).parameters.find(
      parameter => parameter.name.toLowerCase() === 'proj'
    )?.value;
    switch (projection?.toLowerCase()) {
      case 'longlat':
      case 'latlong':
        return 'geographic';
      case 'geocent':
        return 'geocentric';
      default:
        return projection ? 'projected' : 'unknown';
    }
  } catch {
    return 'unknown';
  }
}
