// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadonlyCRSDefinition} from '@math.gl/crs';
import {getI3SLinearUnitScale, getI3SVerticalUnitScale} from './i3s-elevation';
import {createTilesetSpatialReference} from './spatial-types';
import type {TilesetElevationMode, TilesetSpatialReference} from './spatial-types';

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
    vertCRS?: ReadonlyCRSDefinition;
    heightUnit?: string;
  };
  ZFactor?: number;
  elevationInfo?: {mode?: string; offset?: number; unit?: string};
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
  const verticalUnit = layer.heightModelInfo?.heightUnit;
  const verticalUnitScale = getI3SVerticalUnitScale(verticalUnit, layer.ZFactor);
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
  const units = getI3SCoordinateUnits(coordinateFrame, verticalUnit, layer.ZFactor);
  const warnings: string[] = [];
  const elevationMode = getI3SElevationMode(layer.elevationInfo?.mode);
  const elevationUnit = layer.elevationInfo ? layer.elevationInfo.unit || 'meter' : undefined;
  const elevationUnitScale = getI3SLinearUnitScale(elevationUnit);
  if (verticalUnitScale === undefined) {
    warnings.push(
      layer.ZFactor !== undefined
        ? `I3S ZFactor ${layer.ZFactor} is not a positive finite conversion factor`
        : `Unsupported I3S vertical unit ${verticalUnit}`
    );
  }
  if (layer.elevationInfo && elevationUnitScale === undefined) {
    warnings.push(`Unsupported I3S elevation unit ${elevationUnit}`);
  }
  if (layer.elevationInfo?.mode && !elevationMode) {
    warnings.push(`Unsupported I3S elevation mode ${layer.elevationInfo.mode}`);
  }
  if (elevationMode && elevationMode !== 'absoluteHeight') {
    warnings.push(
      `I3S elevation mode ${elevationMode} requires a terrain or scene elevation provider`
    );
  }

  return createTilesetSpatialReference({
    sourceCrs,
    sourceCrsRepresentation:
      sourceIdentifier !== undefined ? 'identifier' : sourceCrs ? 'wkt' : undefined,
    sourceCrsAlternatives:
      sourceIdentifier !== undefined && spatialReference?.wkt
        ? [{definition: spatialReference.wkt, representation: 'wkt'}]
        : undefined,
    verticalCrs,
    units,
    verticalUnitScale: verticalUnitScale ?? Number.NaN,
    heightReference,
    elevationMode,
    elevationOffset: layer.elevationInfo?.offset,
    elevationUnit,
    elevationUnitScale:
      layer.elevationInfo?.mode && !elevationMode
        ? Number.NaN
        : (elevationUnitScale ?? (layer.elevationInfo ? Number.NaN : 1)),
    coordinateFrame,
    axisOrder: sourceCrs ? 'xyz' : 'unknown',
    provenance: sourceCrs ? 'metadata' : 'unknown',
    warnings
  });
}

/** Return per-component I3S units only when their coordinate association is unambiguous. */
function getI3SCoordinateUnits(
  coordinateFrame: TilesetSpatialReference['coordinateFrame'],
  verticalUnit: string | undefined,
  zFactor: number | undefined
): readonly string[] | undefined {
  if (coordinateFrame === 'geocentric') {
    return ['meter', 'meter', 'meter'];
  }
  if (coordinateFrame === 'geographic' && (verticalUnit || zFactor === undefined)) {
    return ['degree', 'degree', verticalUnit || 'meter'];
  }
  return undefined;
}

/** Return a supported I3S elevation mode without widening the public descriptor. */
function getI3SElevationMode(mode: string | undefined): TilesetElevationMode | undefined {
  switch (mode) {
    case 'absoluteHeight':
    case 'onTheGround':
    case 'relativeToGround':
    case 'relativeToScene':
      return mode;
    default:
      return undefined;
  }
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

  let sourceCrs: ReadonlyCRSDefinition | undefined;
  let provenance: TilesetSpatialReference['provenance'] = 'unknown';
  let sourceCrsState: 'explicit' | 'default' | 'unknown' | 'absent' | undefined;
  if (typeof geocentricCrs === 'string' && geocentricCrs.toUpperCase() !== 'UNKNOWN') {
    sourceCrs = geocentricCrs;
    provenance = 'metadata';
    sourceCrsState = 'explicit';
  } else if (geocentricCrs !== undefined) {
    warnings.push('3D Tiles geocentric CRS is explicitly unknown');
    provenance = 'metadata';
    sourceCrsState = 'unknown';
  } else if (tileset.root?.boundingVolume?.region) {
    sourceCrs = 'EPSG:4978';
    provenance = 'format-default';
    sourceCrsState = 'default';
  } else if (tileset.schemaUri && !tileset.schema) {
    warnings.push(
      'External 3D Tiles metadata schema must be loaded before CRS semantics can resolve'
    );
  }

  const epoch = parseCoordinateEpoch(coordinateEpoch);
  if (coordinateEpoch !== undefined && epoch === undefined) {
    warnings.push('3D Tiles coordinate epoch is not a finite decimal year');
  }

  return createTilesetSpatialReference({
    sourceCrs,
    sourceCrsState,
    sourceCrsRepresentation: sourceCrs ? 'identifier' : undefined,
    coordinateEpoch: epoch,
    heightReference: sourceCrs ? 'ellipsoidal' : 'unknown',
    coordinateFrame: sourceCrs ? 'geocentric' : 'unknown',
    axisOrder: sourceCrs ? 'xyz' : 'unknown',
    provenance,
    warnings
  });
}

/** Parse the 3D Tiles decimal-year string while tolerating legacy numeric producer output. */
function parseCoordinateEpoch(value: unknown): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }
  if (typeof value === 'string' && !value.trim()) {
    return undefined;
  }
  const epoch = Number(value);
  return Number.isFinite(epoch) ? epoch : undefined;
}

/** Return an I3S horizontal CRS definition, preferring current WKID aliases over legacy values. */
function getI3SCrsDefinition(
  spatialReference?: I3SSpatialReferenceLike
): ReadonlyCRSDefinition | undefined {
  const identifier = getCrsIdentifier(spatialReference);
  if (identifier !== undefined) {
    return `EPSG:${identifier}`;
  }
  return spatialReference?.wkt;
}

/** Return an I3S vertical CRS definition. */
function getI3SVerticalCrsDefinition(
  spatialReference?: I3SSpatialReferenceLike
): ReadonlyCRSDefinition | undefined {
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
