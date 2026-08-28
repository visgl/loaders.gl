// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  createSpatialReference,
  inferCRSRepresentation,
  type ReadonlyCRSDefinition,
  type SpatialReference,
  type SpatialReferenceAlternative,
  type SpatialReferenceCoordinateFrame,
  type SpatialReferenceProvenance,
  type SpatialReferenceRepresentation,
  type SpatialReferenceState
} from '@math.gl/crs';
import type {Geoid} from '@math.gl/geoid';

/** How height values in a 3D dataset relate to the earth. */
export type TilesetHeightReference = 'native' | 'ellipsoidal' | 'orthometric' | 'unknown';

/** Height reference that an application may request for transformed output. */
export type TilesetTargetHeightReference = 'native' | 'ellipsoidal' | 'orthometric';

/** I3S placement rule applied after source-height interpretation. */
export type TilesetElevationMode =
  | 'absoluteHeight'
  | 'onTheGround'
  | 'relativeToGround'
  | 'relativeToScene';

/** One WGS84 longitude/latitude location requested from an elevation provider. */
export type TilesetElevationSample = readonly [longitude: number, latitude: number];

/**
 * Application-owned source of terrain or scene-surface heights.
 *
 * Providers receive WGS84 longitude/latitude locations and may batch asynchronous requests. They
 * never need to transform horizontal coordinates. Returned heights default to meters in the
 * layer's source height reference unless `unit` or `heightReference` says otherwise.
 */
export type TilesetElevationProvider = {
  /** Height reference used by sampled values. Omit to use the layer's source height reference. */
  readonly heightReference?: Exclude<TilesetHeightReference, 'native' | 'unknown'>;
  /** Linear unit used by sampled values. Defaults to `meter`. */
  readonly unit?: string;
  /**
   * Samples one height for every supplied location, preserving input order.
   * @param positions - WGS84 longitude/latitude locations.
   * @returns Finite heights with the same length and order as `positions`.
   */
  sampleElevations(
    positions: readonly TilesetElevationSample[]
  ): readonly number[] | Promise<readonly number[]>;
};

/** Coordinate representation requested from a 3D tileset. */
export type TilesetOutputCoordinates = 'auto' | 'ecef' | 'local-enu' | 'target-crs';

/** Broad coordinate frame used by a 3D dataset. */
export type TilesetCoordinateFrame = SpatialReferenceCoordinateFrame;

/** Origin of a normalized spatial-reference value. */
export type TilesetSpatialReferenceProvenance = SpatialReferenceProvenance;

/**
 * Simple application-facing spatial options shared by 3D Tiles and I3S.
 *
 * Source CRS details are normally discovered from dataset metadata. The source overrides are
 * expert recovery controls for incomplete or non-standard datasets.
 */
export type TilesetSpatialOptions = {
  /** CRS of transformed output coordinates. Omit to retain the format's natural world frame. */
  targetCrs?: ReadonlyCRSDefinition;
  /** Height reference of transformed output coordinates. Defaults to `native`. */
  targetHeightReference?: TilesetTargetHeightReference;
  /** Output coordinate representation. Defaults to `auto`. */
  outputCoordinates?: TilesetOutputCoordinates;
  /** Expert override used when source metadata is absent or incorrect. */
  sourceCrs?: ReadonlyCRSDefinition;
  /** Expert override for a dynamic coordinate reference epoch. */
  coordinateEpoch?: number;
  /** Registered geoid model name or an already parsed geoid model. */
  geoidModel?: string | Geoid;
  /** Terrain heights used by I3S `onTheGround` and `relativeToGround` placement. */
  terrainElevationProvider?: TilesetElevationProvider;
  /** Scene-surface heights used by I3S `relativeToScene` placement. */
  sceneElevationProvider?: TilesetElevationProvider;
};

/**
 * Normalized, readonly spatial metadata discovered for a 3D tileset.
 *
 * This is diagnostic output. Applications normally do not construct it.
 */
export type TilesetSpatialReference = SpatialReference & {
  /** Source horizontal or compound CRS, when it can be identified. */
  readonly sourceCrs?: ReadonlyCRSDefinition;
  /** Source vertical CRS, when independently identified. */
  readonly verticalCrs?: ReadonlyCRSDefinition;
  /** Number of meters represented by one source Z unit. */
  readonly verticalUnitScale: number;
  /** Coordinate epoch attached to the source coordinates. */
  readonly coordinateEpoch?: number;
  /** Source height interpretation. */
  readonly heightReference: TilesetHeightReference;
  /** I3S placement rule, when the source layer declares one. */
  readonly elevationMode?: TilesetElevationMode;
  /** Declared I3S elevation offset before unit normalization. */
  readonly elevationOffset?: number;
  /** Unit of the I3S elevation offset. Defaults to `meter` when a mode is declared. */
  readonly elevationUnit?: string;
  /** Number of meters represented by one elevation-offset unit. */
  readonly elevationUnitScale: number;
  /** Broad frame in which source coordinates are encoded. */
  readonly coordinateFrame: TilesetCoordinateFrame;
  /** Coordinate component order used by the format wire representation. */
  readonly axisOrder: 'xy' | 'yx' | 'xyz' | 'unknown';
  /** How the source CRS was established. */
  readonly provenance: TilesetSpatialReferenceProvenance;
  /** Target CRS selected by application options, if any. */
  readonly targetCrs?: ReadonlyCRSDefinition;
  /** Target height interpretation selected by application options. */
  readonly targetHeightReference: TilesetTargetHeightReference;
  /** Output representation selected by application options. */
  readonly outputCoordinates: TilesetOutputCoordinates;
  /** Whether coordinates are native, ready to transform, transformed, or unresolved. */
  readonly status: 'native' | 'transformable' | 'transformed' | 'unresolved';
  /** Non-fatal qualifications retained for diagnostics and user interfaces. */
  readonly warnings: readonly string[];
};

/** Input used by format adapters to create normalized spatial metadata. */
export type CreateTilesetSpatialReferenceOptions = {
  /** Discovered source CRS. */
  sourceCrs?: ReadonlyCRSDefinition;
  /** Whether the source CRS was explicit, defaulted, unknown, or absent. */
  sourceCrsState?: SpatialReferenceState;
  /** Serialization or naming form used by the source CRS. */
  sourceCrsRepresentation?: SpatialReferenceRepresentation;
  /** Additional source CRS representations retained by the format. */
  sourceCrsAlternatives?: readonly SpatialReferenceAlternative[];
  /** Discovered vertical CRS. */
  verticalCrs?: ReadonlyCRSDefinition;
  /** Per-component source units, aligned with the stored coordinate order. */
  units?: readonly string[];
  /** Number of meters represented by one discovered source Z unit. */
  verticalUnitScale?: number;
  /** Discovered coordinate epoch. */
  coordinateEpoch?: number;
  /** Discovered height interpretation. */
  heightReference?: TilesetHeightReference;
  /** Format-specific elevation placement rule. */
  elevationMode?: TilesetElevationMode;
  /** Format-specific elevation offset before unit normalization. */
  elevationOffset?: number;
  /** Unit of the format-specific elevation offset. */
  elevationUnit?: string;
  /** Number of meters represented by one elevation-offset unit. */
  elevationUnitScale?: number;
  /** Discovered broad coordinate frame. */
  coordinateFrame?: TilesetCoordinateFrame;
  /** Format wire-axis order. */
  axisOrder?: 'xy' | 'yx' | 'xyz' | 'unknown';
  /** Metadata provenance. */
  provenance?: TilesetSpatialReferenceProvenance;
  /** Non-fatal discovery qualifications. */
  warnings?: readonly string[];
};

/**
 * Combines format discovery with the intentionally small application option surface.
 *
 * @param discovered - Values derived from dataset metadata and format defaults.
 * @param options - Application target options and expert recovery overrides.
 * @returns Normalized immutable spatial metadata.
 */
export function createTilesetSpatialReference(
  discovered: CreateTilesetSpatialReferenceOptions,
  options: TilesetSpatialOptions = {}
): TilesetSpatialReference {
  const hasSourceCrsOverride = options.sourceCrs !== undefined;
  const sourceCrs = options.sourceCrs || discovered.sourceCrs;
  const outputCoordinates = options.outputCoordinates || 'auto';
  const targetCrs = options.targetCrs || (outputCoordinates === 'ecef' ? 'EPSG:4978' : undefined);
  const targetHeightReference = options.targetHeightReference || 'native';
  const verticalUnitScale = discovered.verticalUnitScale ?? 1;
  const elevationUnitScale = discovered.elevationUnitScale ?? 1;
  const elevationOffset = discovered.elevationOffset || 0;
  const requiresSurface =
    discovered.elevationMode === 'onTheGround' ||
    discovered.elevationMode === 'relativeToGround' ||
    discovered.elevationMode === 'relativeToScene';
  const hasElevationProvider =
    discovered.elevationMode === 'relativeToScene'
      ? Boolean(options.sceneElevationProvider)
      : !requiresSurface || Boolean(options.terrainElevationProvider);
  const hasFormatVerticalOperation =
    verticalUnitScale !== 1 ||
    elevationUnitScale !== 1 ||
    (discovered.elevationMode !== undefined &&
      (requiresSurface ||
        (discovered.elevationMode === 'absoluteHeight' && elevationOffset !== 0)));
  const needsHeightTransform =
    targetHeightReference !== 'native' && targetHeightReference !== discovered.heightReference;
  const hasRequestedTransform =
    Boolean(targetCrs) ||
    targetHeightReference !== 'native' ||
    outputCoordinates !== 'auto' ||
    hasFormatVerticalOperation;
  const hasRequiredTarget = outputCoordinates !== 'target-crs' || Boolean(targetCrs);
  const hasHeightMetadata =
    !needsHeightTransform || (discovered.heightReference || 'unknown') !== 'unknown';
  const hasVerticalUnits =
    Number.isFinite(verticalUnitScale) &&
    verticalUnitScale > 0 &&
    Number.isFinite(elevationUnitScale) &&
    elevationUnitScale > 0;
  const canTransform =
    Boolean(sourceCrs) &&
    hasRequestedTransform &&
    hasRequiredTarget &&
    hasHeightMetadata &&
    hasVerticalUnits &&
    hasElevationProvider &&
    outputCoordinates !== 'local-enu';

  const provenance = hasSourceCrsOverride ? 'caller-override' : discovered.provenance || 'unknown';
  const sourceCrsState = hasSourceCrsOverride
    ? 'explicit'
    : discovered.sourceCrsState ||
      (sourceCrs ? (provenance === 'format-default' ? 'default' : 'explicit') : 'absent');
  const spatialReference = createSpatialReference({
    crs: sourceCrs
      ? {
          state: sourceCrsState === 'default' ? 'default' : 'explicit',
          definition: sourceCrs,
          representation:
            (!hasSourceCrsOverride && discovered.sourceCrsRepresentation) ||
            inferCRSRepresentation(sourceCrs),
          provenance,
          alternatives: hasSourceCrsOverride ? undefined : discovered.sourceCrsAlternatives
        }
      : {
          state: sourceCrsState === 'unknown' ? 'unknown' : 'absent',
          provenance
        },
    vertical: discovered.verticalCrs
      ? {
          state: 'explicit',
          definition: discovered.verticalCrs,
          representation: inferCRSRepresentation(discovered.verticalCrs),
          provenance: discovered.provenance || 'metadata'
        }
      : undefined,
    coordinateEpoch: options.coordinateEpoch ?? discovered.coordinateEpoch,
    coordinateFrame: discovered.coordinateFrame,
    coordinateOrder: getCoordinateOrder(discovered.axisOrder),
    units: discovered.units
  });
  const normalizedSourceCrs = getKnownCRSDefinition(spatialReference.crs);
  const normalizedVerticalCrs = spatialReference.vertical
    ? getKnownCRSDefinition(spatialReference.vertical)
    : undefined;
  const normalizedTargetCrs = targetCrs ? cloneReadonlyCRSDefinition(targetCrs) : undefined;

  return Object.freeze({
    ...spatialReference,
    sourceCrs: normalizedSourceCrs,
    verticalCrs: normalizedVerticalCrs,
    verticalUnitScale,
    coordinateEpoch: options.coordinateEpoch ?? discovered.coordinateEpoch,
    heightReference: discovered.heightReference || 'unknown',
    elevationMode: discovered.elevationMode,
    elevationOffset: discovered.elevationOffset,
    elevationUnit: discovered.elevationUnit,
    elevationUnitScale,
    coordinateFrame: discovered.coordinateFrame || 'unknown',
    axisOrder: discovered.axisOrder || 'unknown',
    provenance,
    targetCrs: normalizedTargetCrs,
    targetHeightReference,
    outputCoordinates,
    status: hasRequestedTransform ? (canTransform ? 'transformable' : 'unresolved') : 'native',
    warnings: Object.freeze([...(discovered.warnings || [])])
  });
}

/**
 * Applies application target and recovery options to format-discovered spatial metadata.
 *
 * @param discovered - Readonly metadata returned by a format adapter.
 * @param options - Application target options and expert recovery overrides.
 * @returns A new normalized immutable descriptor.
 */
export function applyTilesetSpatialOptions(
  discovered: TilesetSpatialReference | undefined,
  options: TilesetSpatialOptions = {}
): TilesetSpatialReference {
  return createTilesetSpatialReference(
    {
      sourceCrs: discovered?.sourceCrs,
      sourceCrsState: discovered?.crs.state,
      sourceCrsRepresentation:
        discovered?.crs.state === 'explicit' || discovered?.crs.state === 'default'
          ? discovered.crs.representation
          : undefined,
      sourceCrsAlternatives:
        discovered?.crs.state === 'explicit' || discovered?.crs.state === 'default'
          ? discovered.crs.alternatives
          : undefined,
      verticalCrs: discovered?.verticalCrs,
      units: discovered?.units,
      verticalUnitScale: discovered?.verticalUnitScale,
      coordinateEpoch: discovered?.coordinateEpoch,
      heightReference: discovered?.heightReference,
      elevationMode: discovered?.elevationMode,
      elevationOffset: discovered?.elevationOffset,
      elevationUnit: discovered?.elevationUnit,
      elevationUnitScale: discovered?.elevationUnitScale,
      coordinateFrame: discovered?.coordinateFrame,
      axisOrder: discovered?.axisOrder,
      provenance: discovered?.provenance,
      warnings: discovered?.warnings
    },
    options
  );
}

/** Return a known definition from a canonical CRS reference. */
function getKnownCRSDefinition(
  reference: SpatialReference['crs']
): ReadonlyCRSDefinition | undefined {
  return reference.state === 'explicit' || reference.state === 'default'
    ? reference.definition
    : undefined;
}

/** Clone and deeply freeze a target CRS through the canonical math.gl constructor. */
function cloneReadonlyCRSDefinition(definition: ReadonlyCRSDefinition): ReadonlyCRSDefinition {
  const spatialReference = createSpatialReference({
    crs: {
      state: 'explicit',
      definition,
      representation: inferCRSRepresentation(definition),
      provenance: 'caller-override'
    }
  });
  const clonedDefinition = getKnownCRSDefinition(spatialReference.crs);
  if (!clonedDefinition) {
    throw new Error('Failed to normalize a known target CRS definition');
  }
  return clonedDefinition;
}

/** Convert the legacy tileset axis label to the common stored-coordinate order. */
function getCoordinateOrder(
  axisOrder: CreateTilesetSpatialReferenceOptions['axisOrder']
): readonly string[] {
  switch (axisOrder) {
    case 'xy':
      return ['x', 'y'];
    case 'yx':
      return ['y', 'x'];
    case 'xyz':
      return ['x', 'y', 'z'];
    default:
      return [];
  }
}

/**
 * Marks a normalized descriptor after every returned coordinate and bound has entered its target
 * frame.
 *
 * @param spatialReference - Transformable spatial descriptor.
 * @returns An immutable descriptor with `status: 'transformed'`.
 */
export function markTilesetSpatialReferenceTransformed(
  spatialReference: TilesetSpatialReference
): TilesetSpatialReference {
  if (spatialReference.status !== 'transformable' && spatialReference.status !== 'transformed') {
    throw new Error('Only a transformable spatial reference can be marked as transformed');
  }
  return Object.freeze({...spatialReference, status: 'transformed'});
}
