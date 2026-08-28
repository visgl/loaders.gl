// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geoid} from '@math.gl/geoid';
import {Proj4Projection} from '@math.gl/proj4';
import type {Proj4CRSDefinition} from '@math.gl/proj4';
import {getGeoidModel} from './spatial-resource-registry';
import type {
  TilesetHeightReference,
  TilesetSpatialOptions,
  TilesetSpatialReference,
  TilesetTargetHeightReference
} from './spatial-types';

const GEOGRAPHIC_CRS = 'EPSG:4326';

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

    if (spatialReference.sourceCrs && spatialReference.targetCrs) {
      this.horizontalProjection = new Proj4Projection({
        from: spatialReference.sourceCrs as Proj4CRSDefinition,
        to: spatialReference.targetCrs as Proj4CRSDefinition,
        enforceAxis: false
      });
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
      this.geographicProjection = new Proj4Projection({
        from: spatialReference.sourceCrs as Proj4CRSDefinition,
        to: GEOGRAPHIC_CRS,
        enforceAxis: false
      });
      this.heightOutputProjection = new Proj4Projection({
        from: GEOGRAPHIC_CRS,
        to: (spatialReference.targetCrs || spatialReference.sourceCrs) as Proj4CRSDefinition,
        enforceAxis: false
      });
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
    if (requiresHeightTransformation(this.spatialReference)) {
      if (result.length < 3 || !Number.isFinite(result[2])) {
        throw new Error('Height conversion requires a finite z coordinate');
      }
      const geographic = this.geographicProjection!.project([result[0], result[1], result[2]]);
      const geoidUndulation = this.geoid!.getHeight(geographic[1], geographic[0]);
      geographic[2] = transformHeight(
        geographic[2],
        geoidUndulation,
        this.spatialReference.heightReference,
        this.spatialReference.targetHeightReference
      );
      const projected = this.heightOutputProjection!.project(geographic);
      result.splice(0, projected.length, ...projected);
      return result;
    }

    if (this.horizontalProjection) {
      const projected = this.horizontalProjection.project(result.slice(0, 3));
      result.splice(0, projected.length, ...projected);
    }
    return result;
  }
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
    requiresHeightTransformation(spatialReference) &&
    spatialReference.coordinateFrame === 'geocentric'
  ) {
    throw new Error(
      'Geocentric height conversion is not supported until the projection runtime can convert ' +
        'between geocentric coordinates and geographic ellipsoidal heights'
    );
  }
  if (spatialReference.status === 'unresolved') {
    throw new Error('The requested spatial output cannot be resolved from the available metadata');
  }
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
