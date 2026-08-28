// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CRSDefinition} from '@math.gl/crs';
import {createTilesetSpatialReference} from './spatial-types';
import type {TilesetSpatialReference} from './spatial-types';

/** ArcGIS/I3S spatial reference fields used without depending on the I3S package. */
type I3SSpatialReferenceLike = {
  wkid?: number;
  latestWkid?: number;
  vcsWkid?: number;
  latestVcsWkid?: number;
  wkt?: string;
};

/** I3S layer fields needed for spatial metadata discovery. */
type I3SLayerLike = {
  spatialReference?: I3SSpatialReferenceLike;
  fullExtent?: {spatialReference?: I3SSpatialReferenceLike};
  heightModelInfo?: {
    heightModel?: string;
    vertCRS?: CRSDefinition;
  };
  elevationInfo?: {mode?: string};
};

/** 3D Tiles metadata schema property used for semantic lookup. */
type Tiles3DMetadataProperty = {semantic?: string};

/** 3D Tiles document fields needed for CRS semantic discovery. */
type Tiles3DLike = {
  schema?: {
    classes?: Record<string, unknown>;
  };
  schemaUri?: string;
  metadata?: {class?: string; properties?: Record<string, unknown>};
  root?: {boundingVolume?: {region?: unknown}};
};

/**
 * Discovers normalized spatial metadata from an I3S scene-layer document.
 *
 * I3S encodes geographic coordinates in longitude/latitude wire order even for authority
 * definitions whose formal axis order differs.
 *
 * @param layer - Parsed I3S layer document.
 * @returns Normalized source spatial metadata.
 */
export function getI3SSpatialReference(layer: I3SLayerLike): TilesetSpatialReference {
  const spatialReference = layer.spatialReference || layer.fullExtent?.spatialReference;
  const sourceCrs = getI3SCrsDefinition(spatialReference);
  const verticalCrs =
    layer.heightModelInfo?.vertCRS || getI3SVerticalCrsDefinition(spatialReference);
  const heightModel = layer.heightModelInfo?.heightModel;
  const heightReference =
    heightModel === 'ellipsoidal'
      ? 'ellipsoidal'
      : heightModel === 'gravity_related_height'
        ? 'orthometric'
        : 'unknown';
  const sourceIdentifier = getCrsIdentifier(spatialReference);
  const coordinateFrame =
    sourceIdentifier === undefined
      ? getWktCoordinateFrame(spatialReference?.wkt)
      : getIdentifierCoordinateFrame(sourceIdentifier);
  const warnings: string[] = [];
  const elevationMode = layer.elevationInfo?.mode;
  if (elevationMode && elevationMode !== 'absoluteHeight') {
    warnings.push(
      `I3S elevation mode ${elevationMode} requires a terrain or scene elevation provider`
    );
  }

  return createTilesetSpatialReference({
    sourceCrs,
    verticalCrs,
    heightReference,
    coordinateFrame,
    axisOrder: sourceCrs ? 'xyz' : 'unknown',
    provenance: sourceCrs ? 'metadata' : 'unknown',
    warnings
  });
}

/**
 * Discovers the 3D Tiles geocentric CRS and coordinate epoch from structured metadata semantics.
 *
 * The method intentionally does not infer ECEF from coordinate magnitude. A root `region`
 * establishes the format's global ellipsoidal frame, while local tilesets without an explicit
 * semantic remain unknown.
 *
 * @param tileset - Parsed 3D Tiles tileset document.
 * @returns Normalized source spatial metadata.
 */
export function get3DTilesSpatialReference(tileset: Tiles3DLike): TilesetSpatialReference {
  const geocentricCrs = getTilesetSemanticValue(tileset, 'TILESET_CRS_GEOCENTRIC');
  const coordinateEpoch = getTilesetSemanticValue(tileset, 'TILESET_CRS_COORDINATE_EPOCH');
  const warnings: string[] = [];

  let sourceCrs: CRSDefinition | undefined;
  let provenance: TilesetSpatialReference['provenance'] = 'unknown';
  if (typeof geocentricCrs === 'string' && geocentricCrs.toUpperCase() !== 'UNKNOWN') {
    sourceCrs = geocentricCrs;
    provenance = 'metadata';
  } else if (geocentricCrs !== undefined) {
    warnings.push('3D Tiles geocentric CRS is explicitly unknown');
  } else if (tileset.root?.boundingVolume?.region) {
    sourceCrs = 'EPSG:4978';
    provenance = 'format-default';
  } else if (tileset.schemaUri && !tileset.schema) {
    warnings.push(
      'External 3D Tiles metadata schema must be loaded before CRS semantics can resolve'
    );
  }

  const epoch =
    typeof coordinateEpoch === 'number' && Number.isFinite(coordinateEpoch)
      ? coordinateEpoch
      : undefined;
  if (coordinateEpoch !== undefined && epoch === undefined) {
    warnings.push('3D Tiles coordinate epoch is not a finite number');
  }

  return createTilesetSpatialReference({
    sourceCrs,
    coordinateEpoch: epoch,
    heightReference: sourceCrs ? 'ellipsoidal' : 'unknown',
    coordinateFrame: sourceCrs ? 'geocentric' : 'unknown',
    axisOrder: sourceCrs ? 'xyz' : 'unknown',
    provenance,
    warnings
  });
}

/** Return an I3S horizontal CRS definition, preferring current WKID aliases over legacy values. */
function getI3SCrsDefinition(
  spatialReference?: I3SSpatialReferenceLike
): CRSDefinition | undefined {
  const identifier = getCrsIdentifier(spatialReference);
  if (identifier !== undefined) {
    return `EPSG:${identifier}`;
  }
  return spatialReference?.wkt;
}

/** Return an I3S vertical CRS definition. */
function getI3SVerticalCrsDefinition(
  spatialReference?: I3SSpatialReferenceLike
): CRSDefinition | undefined {
  const identifier = spatialReference?.latestVcsWkid ?? spatialReference?.vcsWkid;
  return identifier === undefined ? undefined : `EPSG:${identifier}`;
}

/** Return the preferred horizontal WKID. */
function getCrsIdentifier(spatialReference?: I3SSpatialReferenceLike): number | undefined {
  return spatialReference?.latestWkid ?? spatialReference?.wkid;
}

/** Classify common EPSG identifiers used by I3S into their coordinate frames. */
function getIdentifierCoordinateFrame(
  identifier: number
): TilesetSpatialReference['coordinateFrame'] {
  if (identifier === 4978) {
    return 'geocentric';
  }
  if (identifier === 4326 || identifier === 4490 || identifier === 4979) {
    return 'geographic';
  }
  return 'projected';
}

/**
 * Classify a WKT root coordinate system without guessing when the declaration is ambiguous.
 *
 * WKT2 uses `GEODCRS` for both geographic and geocentric systems, so its `CS` declaration is
 * inspected before assigning a frame.
 */
function getWktCoordinateFrame(wkt?: string): TilesetSpatialReference['coordinateFrame'] {
  if (!wkt) {
    return 'unknown';
  }

  const normalizedWkt = wkt.trim().toUpperCase();
  const rootKeyword = normalizedWkt.match(/^([A-Z][A-Z0-9_]*)\s*[\[(]/)?.[1];
  if (rootKeyword === 'GEOCCS') {
    return 'geocentric';
  }
  if (
    rootKeyword === 'GEOGCS' ||
    rootKeyword === 'GEOGRAPHICCRS' ||
    rootKeyword === 'GEOGRAPHIC2DCRS' ||
    rootKeyword === 'GEOGRAPHIC3DCRS'
  ) {
    return 'geographic';
  }
  if (rootKeyword === 'PROJCS' || rootKeyword === 'PROJCRS' || rootKeyword === 'PROJECTEDCRS') {
    return 'projected';
  }
  if (rootKeyword === 'GEODCRS' || rootKeyword === 'GEODETICCRS') {
    if (/\bCS\s*[\[(]\s*CARTESIAN\s*,\s*3\b/.test(normalizedWkt)) {
      return 'geocentric';
    }
    if (/\bCS\s*[\[(]\s*ELLIPSOIDAL\s*,\s*[23]\b/.test(normalizedWkt)) {
      return 'geographic';
    }
  }
  return 'unknown';
}

/** Resolve a tileset-wide structured metadata property by its standard semantic. */
function getTilesetSemanticValue(tileset: Tiles3DLike, semantic: string): unknown {
  const classIdentifier = tileset.metadata?.class;
  if (!classIdentifier) {
    return undefined;
  }
  const classDefinition = tileset.schema?.classes?.[classIdentifier] as
    | {properties?: Record<string, Tiles3DMetadataProperty>}
    | undefined;
  const propertyDefinitions = classDefinition?.properties;
  const propertyValues = tileset.metadata?.properties;
  for (const [propertyIdentifier, propertyDefinition] of Object.entries(
    propertyDefinitions || {}
  )) {
    if (propertyDefinition.semantic === semantic) {
      return propertyValues?.[propertyIdentifier];
    }
  }
  return undefined;
}
