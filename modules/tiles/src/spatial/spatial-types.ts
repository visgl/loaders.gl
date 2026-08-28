// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CRSDefinition} from '@math.gl/crs';
import type {Geoid} from '@math.gl/geoid';
import {
  createSpatialReference,
  inferSpatialReferenceRepresentation,
  type SpatialReference,
  type SpatialReferenceAlternative,
  type SpatialReferenceCoordinateFrame,
  type SpatialReferenceProvenance,
  type SpatialReferenceRepresentation,
  type SpatialReferenceState
} from '@loaders.gl/loader-utils';

/** How height values in a 3D dataset relate to the earth. */
export type TilesetHeightReference = 'native' | 'ellipsoidal' | 'orthometric' | 'unknown';

/** Height reference that an application may request for transformed output. */
export type TilesetTargetHeightReference = 'native' | 'ellipsoidal' | 'orthometric';

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
  targetCrs?: CRSDefinition;
  /** Height reference of transformed output coordinates. Defaults to `native`. */
  targetHeightReference?: TilesetTargetHeightReference;
  /** Output coordinate representation. Defaults to `auto`. */
  outputCoordinates?: TilesetOutputCoordinates;
  /** Expert override used when source metadata is absent or incorrect. */
  sourceCrs?: CRSDefinition;
  /** Expert override for a dynamic coordinate reference epoch. */
  coordinateEpoch?: number;
  /** Registered geoid model name or an already parsed geoid model. */
  geoidModel?: string | Geoid;
};

/**
 * Normalized, readonly spatial metadata discovered for a 3D tileset.
 *
 * This is diagnostic output. Applications normally do not construct it.
 */
export type TilesetSpatialReference = Omit<SpatialReference, 'heightReference'> & {
  /** Source horizontal or compound CRS, when it can be identified. */
  readonly sourceCrs?: CRSDefinition;
  /** Source vertical CRS, when independently identified. */
  readonly verticalCrs?: CRSDefinition;
  /** Coordinate epoch attached to the source coordinates. */
  readonly coordinateEpoch?: number;
  /** Source height interpretation. */
  readonly heightReference: TilesetHeightReference;
  /** Broad frame in which source coordinates are encoded. */
  readonly coordinateFrame: TilesetCoordinateFrame;
  /** Coordinate component order used by the format wire representation. */
  readonly axisOrder: 'xy' | 'yx' | 'xyz' | 'unknown';
  /** How the source CRS was established. */
  readonly provenance: TilesetSpatialReferenceProvenance;
  /** Target CRS selected by application options, if any. */
  readonly targetCrs?: CRSDefinition;
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
  sourceCrs?: CRSDefinition;
  /** Whether the source CRS was explicit, defaulted, unknown, or absent. */
  sourceCrsState?: SpatialReferenceState;
  /** Serialization or naming form used by the source CRS. */
  sourceCrsRepresentation?: SpatialReferenceRepresentation;
  /** Additional source CRS representations retained by the format. */
  sourceCrsAlternatives?: readonly SpatialReferenceAlternative[];
  /** Discovered vertical CRS. */
  verticalCrs?: CRSDefinition;
  /** Discovered coordinate epoch. */
  coordinateEpoch?: number;
  /** Discovered height interpretation. */
  heightReference?: TilesetHeightReference;
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
  const targetCrs =
    options.targetCrs ||
    (outputCoordinates === 'ecef' ? ('EPSG:4978' as CRSDefinition) : undefined);
  const targetHeightReference = options.targetHeightReference || 'native';
  const needsHeightTransform =
    targetHeightReference !== 'native' && targetHeightReference !== discovered.heightReference;
  const hasRequestedTransform =
    Boolean(targetCrs) || targetHeightReference !== 'native' || outputCoordinates !== 'auto';
  const hasRequiredTarget = outputCoordinates !== 'target-crs' || Boolean(targetCrs);
  const hasHeightMetadata =
    !needsHeightTransform || (discovered.heightReference || 'unknown') !== 'unknown';
  const canTransform =
    Boolean(sourceCrs) &&
    hasRequestedTransform &&
    hasRequiredTarget &&
    hasHeightMetadata &&
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
            inferSpatialReferenceRepresentation(sourceCrs),
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
          representation: inferSpatialReferenceRepresentation(discovered.verticalCrs),
          provenance: discovered.provenance || 'metadata'
        }
      : undefined,
    coordinateEpoch: options.coordinateEpoch ?? discovered.coordinateEpoch,
    coordinateFrame: discovered.coordinateFrame,
    coordinateOrder: getCoordinateOrder(discovered.axisOrder),
    heightReference: discovered.heightReference,
    warnings: discovered.warnings
  });

  return Object.freeze({
    ...spatialReference,
    sourceCrs,
    verticalCrs: discovered.verticalCrs,
    coordinateEpoch: options.coordinateEpoch ?? discovered.coordinateEpoch,
    heightReference: discovered.heightReference || 'unknown',
    coordinateFrame: discovered.coordinateFrame || 'unknown',
    axisOrder: discovered.axisOrder || 'unknown',
    provenance,
    targetCrs,
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
      coordinateEpoch: discovered?.coordinateEpoch,
      heightReference: discovered?.heightReference,
      coordinateFrame: discovered?.coordinateFrame,
      axisOrder: discovered?.axisOrder,
      provenance: discovered?.provenance,
      warnings: discovered?.warnings
    },
    options
  );
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
