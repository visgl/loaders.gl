// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CRSDefinition} from '@math.gl/crs';

/** Serialization or naming form in which a CRS definition was supplied. */
export type SpatialReferenceRepresentation =
  | 'identifier'
  | 'wkt'
  | 'proj-string'
  | 'projjson'
  | 'implicit'
  | 'opaque';

/** Whether a CRS was declared, supplied by a format default, unknown, or absent. */
export type SpatialReferenceState = 'explicit' | 'default' | 'unknown' | 'absent';

/** Origin of one normalized CRS value. */
export type SpatialReferenceProvenance =
  | 'metadata'
  | 'format-default'
  | 'caller-override'
  | 'legacy-assumption'
  | 'unknown';

/** Broad coordinate frame used by a spatial dataset. */
export type SpatialReferenceCoordinateFrame =
  | 'geographic'
  | 'geocentric'
  | 'projected'
  | 'local'
  | 'unknown';

/** How a stored height relates to the earth or another elevation surface. */
export type SpatialReferenceHeightReference =
  | 'native'
  | 'ellipsoidal'
  | 'orthometric'
  | 'terrain-relative'
  | 'scene-relative'
  | 'unknown';

/** One alternate serialization of the same source CRS retained by the format. */
export type SpatialReferenceAlternative = Readonly<{
  /** Original alternate CRS definition. */
  definition: CRSDefinition;
  /** Representation used by the alternate definition. */
  representation: SpatialReferenceRepresentation;
}>;

/** A known CRS and its source representation. */
export type KnownSpatialReferenceCRS = Readonly<{
  /** A known definition is either explicitly declared or established by a format default. */
  state: 'explicit' | 'default';
  /** Preferred definition selected without discarding alternate source representations. */
  definition: CRSDefinition;
  /** Representation used by the preferred definition. */
  representation: SpatialReferenceRepresentation;
  /** How the preferred definition was established. */
  provenance: SpatialReferenceProvenance;
  /** Additional equivalent serializations carried by the source metadata. */
  alternatives?: readonly SpatialReferenceAlternative[];
}>;

/** An unknown or absent CRS that must not be replaced by an implicit WGS84 assumption. */
export type UnresolvedSpatialReferenceCRS = Readonly<{
  /** `unknown` preserves an explicit unknown value; `absent` means no value was supplied. */
  state: 'unknown' | 'absent';
  /** How the unresolved state was established. */
  provenance: SpatialReferenceProvenance;
}>;

/** Normalized CRS state, discriminated without comparing definition strings. */
export type SpatialReferenceCRS = KnownSpatialReferenceCRS | UnresolvedSpatialReferenceCRS;

/**
 * Format-neutral source spatial-reference metadata.
 *
 * This descriptor reports discovery only. It deliberately does not claim that returned
 * coordinates were transformed. Format-specific metadata remains responsible for lossless
 * preservation of fields that cannot yet be normalized.
 */
export type SpatialReference = Readonly<{
  /** Primary horizontal or compound CRS state. */
  crs: SpatialReferenceCRS;
  /** Independently declared vertical CRS state. */
  vertical?: SpatialReferenceCRS;
  /** Coordinate epoch associated with source coordinates, expressed as a decimal year. */
  coordinateEpoch?: number;
  /** Broad frame in which source coordinates are stored. */
  coordinateFrame: SpatialReferenceCoordinateFrame;
  /** Component order used by stored coordinate arrays, independent of authority axis order. */
  coordinateOrder: readonly string[];
  /** Per-component units when declared by the format. */
  units?: readonly string[];
  /** Interpretation of stored height values. */
  heightReference: SpatialReferenceHeightReference;
  /** Non-fatal discovery qualifications. */
  warnings: readonly string[];
}>;

/** Values accepted by {@link createSpatialReference}. */
export type CreateSpatialReferenceOptions = Readonly<{
  /** Primary horizontal or compound CRS state. Defaults to absent. */
  crs?: SpatialReferenceCRS;
  /** Independently declared vertical CRS state. */
  vertical?: SpatialReferenceCRS;
  /** Coordinate epoch associated with source coordinates. */
  coordinateEpoch?: number;
  /** Broad stored coordinate frame. Defaults to unknown. */
  coordinateFrame?: SpatialReferenceCoordinateFrame;
  /** Stored component order. Defaults to an empty, unknown order. */
  coordinateOrder?: readonly string[];
  /** Per-component units. */
  units?: readonly string[];
  /** Source height interpretation. Defaults to unknown. */
  heightReference?: SpatialReferenceHeightReference;
  /** Non-fatal discovery qualifications. */
  warnings?: readonly string[];
}>;

/**
 * Creates an immutable format-neutral spatial-reference descriptor.
 *
 * @param options - Format discovery results to normalize.
 * @returns A readonly descriptor with cloned arrays and nested CRS metadata.
 */
export function createSpatialReference(
  options: CreateSpatialReferenceOptions = {}
): SpatialReference {
  if (options.coordinateEpoch !== undefined && !Number.isFinite(options.coordinateEpoch)) {
    throw new Error('Spatial reference coordinate epoch must be a finite decimal year');
  }

  return Object.freeze({
    crs: freezeSpatialReferenceCRS(options.crs || {state: 'absent', provenance: 'unknown'}),
    vertical: options.vertical ? freezeSpatialReferenceCRS(options.vertical) : undefined,
    coordinateEpoch: options.coordinateEpoch,
    coordinateFrame: options.coordinateFrame || 'unknown',
    coordinateOrder: Object.freeze([...(options.coordinateOrder || [])]),
    units: options.units ? Object.freeze([...options.units]) : undefined,
    heightReference: options.heightReference || 'unknown',
    warnings: Object.freeze([...(options.warnings || [])])
  });
}

/**
 * Infers a CRS representation from the runtime shape without parsing or resolving its meaning.
 *
 * Format adapters should pass an explicit representation when their metadata identifies one.
 *
 * @param definition - CRS definition to classify syntactically.
 * @returns The apparent serialized representation.
 */
export function inferSpatialReferenceRepresentation(
  definition: CRSDefinition
): SpatialReferenceRepresentation {
  if (typeof definition === 'object') {
    return 'projjson';
  }
  const text = definition.trim();
  if (text.startsWith('+')) {
    return 'proj-string';
  }
  if (/^[A-Z][A-Z0-9_]*\s*[\[(]/i.test(text)) {
    return 'wkt';
  }
  return 'identifier';
}

/** Clone and freeze one CRS state without mutating caller-owned definition objects. */
function freezeSpatialReferenceCRS(crs: SpatialReferenceCRS): SpatialReferenceCRS {
  if (crs.state === 'explicit' || crs.state === 'default') {
    return Object.freeze({
      ...crs,
      definition: cloneAndFreezeDefinition(crs.definition),
      alternatives: crs.alternatives
        ? Object.freeze(
            crs.alternatives.map(alternative =>
              Object.freeze({
                ...alternative,
                definition: cloneAndFreezeDefinition(alternative.definition)
              })
            )
          )
        : undefined
    });
  }
  return Object.freeze({...crs});
}

/** Clone and recursively freeze a JSON CRS object while leaving string definitions unchanged. */
function cloneAndFreezeDefinition(definition: CRSDefinition): CRSDefinition {
  return typeof definition === 'string'
    ? definition
    : (cloneAndFreezeJsonValue(definition) as CRSDefinition);
}

/** Clone and freeze the JSON-compatible values used by PROJJSON definitions. */
function cloneAndFreezeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(item => cloneAndFreezeJsonValue(item)));
  }
  if (value && typeof value === 'object') {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, cloneAndFreezeJsonValue(item)])
      )
    );
  }
  return value;
}
