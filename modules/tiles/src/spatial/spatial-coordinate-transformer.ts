// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geoid} from '@math.gl/geoid';
import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import type {ReadonlyCRSDefinition} from '@math.gl/crs';
import {Proj4Projection, toProj4CRSDefinition, type Proj4CRSDefinition} from '@math.gl/proj4';
import {getGeoidModel} from './spatial-resource-registry';
import type {
  TilesetHeightReference,
  TilesetSpatialOptions,
  TilesetSpatialReference,
  TilesetTargetHeightReference
} from './spatial-types';
export {getSpatialCoordinateFrame} from './get-spatial-coordinate-frame';

const GEOGRAPHIC_CRS = 'EPSG:4326';
const GEOCENTRIC_CRS = 'EPSG:4978';

/**
 * Deterministic coordinate transformer used by 3D tile format adapters.
 *
 * The transformer uses conventional `[x, y, z]` array order at its boundary. Format adapters are
 * responsible for mapping authority-axis order into their documented wire order. Requested
 * transformations fail when required definitions or geoid resources are unavailable.
 */
export class SpatialCoordinateTransformer {
  /** Normalized spatial metadata describing this transformation. */
  readonly spatialReference: TilesetSpatialReference;

  /** Projection from the source CRS directly to the requested horizontal target CRS. */
  private readonly horizontalProjection?: Proj4Projection;

  /** Projection from the source CRS to geographic longitude, latitude, and ellipsoidal height. */
  private readonly geographicProjection?: Proj4Projection;

  /** Projection from adjusted geographic coordinates to the requested output CRS. */
  private readonly heightOutputProjection?: Proj4Projection;

  /** Whether source coordinates use the WGS84 geocentric frame handled by math.gl. */
  private readonly sourceIsGeocentric: boolean;

  /** Whether output coordinates use the WGS84 geocentric frame handled by math.gl. */
  private readonly outputIsGeocentric: boolean;

  /** Whether source coordinates already use conventional WGS84 longitude/latitude order. */
  private readonly sourceIsGeographic: boolean;

  /** Whether output coordinates use conventional WGS84 longitude/latitude order. */
  private readonly outputIsGeographic: boolean;

  /** Geoid model used to convert between ellipsoidal and orthometric heights. */
  private readonly geoid?: Geoid;

  /**
   * Creates a coordinate transformer.
   *
   * @param spatialReference - Format-discovered and option-normalized spatial metadata.
   * @param options - Application options containing an optional geoid model.
   */
  constructor(spatialReference: TilesetSpatialReference, options: TilesetSpatialOptions = {}) {
    this.spatialReference = spatialReference;
    validateTransformRequest(spatialReference);
    const outputCrs = spatialReference.targetCrs || spatialReference.sourceCrs;
    this.sourceIsGeocentric = isWgs84Geocentric(spatialReference.sourceCrs);
    this.outputIsGeocentric = isWgs84Geocentric(outputCrs);
    this.sourceIsGeographic = isWgs84Geographic(spatialReference.sourceCrs);
    this.outputIsGeographic = isWgs84Geographic(outputCrs);

    if (
      spatialReference.sourceCrs &&
      spatialReference.targetCrs &&
      !this.sourceIsGeocentric &&
      !this.outputIsGeocentric
    ) {
      this.horizontalProjection = new Proj4Projection({
        from: getHorizontalProj4Definition(spatialReference.sourceCrs),
        to: getHorizontalProj4Definition(spatialReference.targetCrs),
        enforceAxis: false
      });
    }

    if (
      requiresHeightTransformation(spatialReference) ||
      this.sourceIsGeocentric ||
      this.outputIsGeocentric
    ) {
      if (!this.sourceIsGeographic && !this.sourceIsGeocentric) {
        this.geographicProjection = new Proj4Projection({
          from: getHorizontalProj4Definition(spatialReference.sourceCrs),
          to: GEOGRAPHIC_CRS,
          enforceAxis: false
        });
      }
      if (!this.outputIsGeographic && !this.outputIsGeocentric) {
        this.heightOutputProjection = new Proj4Projection({
          from: GEOGRAPHIC_CRS,
          to: getHorizontalProj4Definition(outputCrs),
          enforceAxis: false
        });
      }
    }

    if (requiresHeightTransformation(spatialReference)) {
      this.geoid = resolveGeoid(options.geoidModel);
      if (!this.geoid) {
        const modelName = typeof options.geoidModel === 'string' ? ` "${options.geoidModel}"` : '';
        throw new Error(
          `Height conversion requires a registered geoid model${modelName}; ` +
            'call registerGeoidModel() or pass a parsed Geoid instance'
        );
      }
    }
  }

  /**
   * Transforms one `[x, y, z?]` coordinate while retaining additional components.
   *
   * @param coordinate - Source coordinate in the format adapter's normalized `x/y/z` order.
   * @returns A new transformed coordinate array.
   */
  transformPosition(coordinate: readonly number[]): number[] {
    if (coordinate.length < 2) {
      throw new Error('A spatial coordinate must contain at least x and y components');
    }

    const result = [...coordinate];
    if (
      requiresHeightTransformation(this.spatialReference) ||
      this.sourceIsGeocentric ||
      this.outputIsGeocentric
    ) {
      if (result.length < 3 || !Number.isFinite(result[2])) {
        throw new Error('Three-dimensional CRS conversion requires a finite z coordinate');
      }
      const geographic = this.toGeographic(result);
      if (requiresHeightTransformation(this.spatialReference)) {
        const geoidUndulation = this.geoid!.getHeight(geographic[1], geographic[0]);
        geographic[2] = transformHeight(
          geographic[2],
          geoidUndulation,
          this.spatialReference.heightReference,
          this.spatialReference.targetHeightReference
        );
      }
      const projected = this.fromGeographic(geographic);
      result.splice(0, projected.length, ...projected);
      return result;
    }

    if (this.horizontalProjection) {
      const projected = this.horizontalProjection.project(result.slice(0, 3));
      result.splice(0, projected.length, ...projected);
    }
    return result;
  }

  /** Convert one source coordinate to conventional WGS84 longitude, latitude, and height. */
  private toGeographic(coordinate: number[]): number[] {
    if (this.sourceIsGeocentric) {
      return Array.from(Ellipsoid.WGS84.cartesianToCartographic(new Vector3(coordinate)));
    }
    if (this.sourceIsGeographic) {
      return coordinate.slice(0, 3);
    }
    return this.geographicProjection!.project(coordinate.slice(0, 3));
  }

  /** Convert one conventional WGS84 geographic coordinate to the selected output CRS. */
  private fromGeographic(coordinate: number[]): number[] {
    if (this.outputIsGeocentric) {
      return Array.from(Ellipsoid.WGS84.cartographicToCartesian(new Vector3(coordinate)));
    }
    if (this.outputIsGeographic) {
      return coordinate.slice(0, 3);
    }
    return this.heightOutputProjection!.project(coordinate.slice(0, 3));
  }
}

/** Select the horizontal component that the proj4js runtime can execute. */
function getHorizontalProj4Definition(
  definition: ReadonlyCRSDefinition | undefined
): Proj4CRSDefinition {
  if (!definition) {
    throw new Error('Cannot construct a projection because the CRS is unknown');
  }
  return toProj4CRSDefinition(definition, {mode: 'horizontal'});
}

/** Validate that all requested operations can be represented by the current runtime. */
function validateTransformRequest(spatialReference: TilesetSpatialReference): void {
  if (spatialReference.outputCoordinates === 'local-enu') {
    throw new Error(
      'local-enu output requires a dataset-derived local origin and must be created by a tileset source'
    );
  }
  if (spatialReference.outputCoordinates === 'target-crs' && !spatialReference.targetCrs) {
    throw new Error('target-crs output requires targetCrs');
  }
  if (!spatialReference.sourceCrs && spatialReference.status === 'unresolved') {
    throw new Error('Cannot transform coordinates because the source CRS is unknown');
  }
  if (
    requiresHeightTransformation(spatialReference) &&
    spatialReference.heightReference === 'unknown'
  ) {
    throw new Error('Cannot convert heights because the source height reference is unknown');
  }
  if (
    spatialReference.coordinateFrame === 'geocentric' &&
    !isWgs84Geocentric(spatialReference.sourceCrs)
  ) {
    throw new Error(
      'Only EPSG:4978 geocentric coordinates are supported by the current spatial transformer'
    );
  }
  if (spatialReference.status === 'unresolved') {
    throw new Error('The requested spatial output cannot be resolved from the available metadata');
  }
}

/** Return whether a CRS definition identifies the WGS84 geocentric frame. */
function isWgs84Geocentric(definition: unknown): boolean {
  return typeof definition === 'string' && normalizeCrsIdentifier(definition) === GEOCENTRIC_CRS;
}

/** Return whether a CRS definition uses conventional WGS84 longitude/latitude coordinates. */
function isWgs84Geographic(definition: unknown): boolean {
  if (typeof definition !== 'string') {
    return false;
  }
  const identifier = normalizeCrsIdentifier(definition);
  return identifier === GEOGRAPHIC_CRS || identifier === 'EPSG:4979' || identifier === 'OGC:CRS84';
}

/** Normalize common OGC URL and URN CRS spellings to authority identifiers. */
function normalizeCrsIdentifier(identifier: string): string {
  const normalizedIdentifier = identifier.trim().toUpperCase();
  const ogcMatch = normalizedIdentifier.match(
    /(?:\/DEF\/CRS\/|URN:OGC:DEF:CRS:)([A-Z0-9_-]+)(?:\/|::)(?:[^/:]*[/:])?([A-Z0-9_.-]+)$/
  );
  return ogcMatch ? `${ogcMatch[1]}:${ogcMatch[2]}` : normalizedIdentifier;
}

/** Return whether source and target height interpretations differ. */
function requiresHeightTransformation(spatialReference: TilesetSpatialReference): boolean {
  const target = spatialReference.targetHeightReference;
  return target !== 'native' && target !== spatialReference.heightReference;
}

/** Resolve an inline or registered geoid model. */
function resolveGeoid(model: string | Geoid | undefined): Geoid | undefined {
  return typeof model === 'string' ? getGeoidModel(model) : model;
}

/** Apply the GeographicLib geoid undulation convention, h = H + N. */
function transformHeight(
  height: number,
  geoidUndulation: number,
  source: TilesetHeightReference,
  target: TilesetTargetHeightReference
): number {
  if (source === target || target === 'native') {
    return height;
  }
  if (source === 'orthometric' && target === 'ellipsoidal') {
    return height + geoidUndulation;
  }
  if (source === 'ellipsoidal' && target === 'orthometric') {
    return height - geoidUndulation;
  }
  throw new Error(`Unsupported height conversion from ${source} to ${target}`);
}
