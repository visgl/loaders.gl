// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geoid} from '@math.gl/geoid';
import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import type {ReadonlyCRSDefinition} from '@math.gl/crs';
import {Proj4Projection, toProj4CRSDefinition, type Proj4CRSDefinition} from '@math.gl/proj4';
import {getGeoidModel} from './spatial-resource-registry';
import {
  normalizeCrsIdentifier,
  WGS84_GEOCENTRIC_CRS,
  WGS84_GEOGRAPHIC_CRS
} from './normalize-crs-identifier';
import type {
  TilesetHeightReference,
  TilesetSpatialOptions,
  TilesetSpatialReference,
  TilesetTargetHeightReference
} from './spatial-types';
export {getSpatialCoordinateFrame} from './get-spatial-coordinate-frame';

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
          to: WGS84_GEOGRAPHIC_CRS,
          enforceAxis: false
        });
      }
      if (!this.outputIsGeographic && !this.outputIsGeocentric) {
        this.heightOutputProjection = new Proj4Projection({
          from: WGS84_GEOGRAPHIC_CRS,
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

  /** Transform a packed sequence of xyz positions, preserving the input array type only when safe. */
  transformPositions(positions: ArrayLike<number>): Float64Array {
    if (positions.length % 3 !== 0) {
      throw new Error('Packed spatial positions must contain a multiple of three components');
    }
    const transformedPositions = new Float64Array(positions.length);
    for (let index = 0; index < positions.length; index += 3) {
      const transformed = this.transformPosition([
        Number(positions[index]),
        Number(positions[index + 1]),
        Number(positions[index + 2])
      ]);
      transformedPositions[index] = transformed[0];
      transformedPositions[index + 1] = transformed[1];
      transformedPositions[index + 2] = transformed[2];
    }
    return transformedPositions;
  }

  /** Transform packed xyz normals using a local finite-difference tangent approximation. */
  transformNormals(normals: ArrayLike<number>, positions: ArrayLike<number>): Float32Array {
    if (normals.length !== positions.length || normals.length % 3 !== 0) {
      throw new Error('Spatial normals and positions must have matching xyz component counts');
    }
    const transformedNormals = new Float32Array(normals.length);
    const epsilon = 1e-5;
    for (let index = 0; index < normals.length; index += 3) {
      const position = [
        Number(positions[index]),
        Number(positions[index + 1]),
        Number(positions[index + 2])
      ];
      const normal = [
        Number(normals[index]),
        Number(normals[index + 1]),
        Number(normals[index + 2])
      ];
      const jacobian = getFiniteDifferenceJacobian(this, position, epsilon);
      const transformedNormal = inverseTransposeMultiply(jacobian, normal);
      const length = Math.hypot(...transformedNormal);
      if (length > 0 && Number.isFinite(length)) {
        transformedNormals[index] = transformedNormal[0] / length;
        transformedNormals[index + 1] = transformedNormal[1] / length;
        transformedNormals[index + 2] = transformedNormal[2] / length;
      } else {
        transformedNormals[index] = normal[0];
        transformedNormals[index + 1] = normal[1];
        transformedNormals[index + 2] = normal[2];
      }
    }
    return transformedNormals;
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

function getFiniteDifferenceJacobian(
  transformer: SpatialCoordinateTransformer,
  position: number[],
  epsilon: number
): number[][] {
  const columns: number[][] = [];
  for (let axis = 0; axis < 3; axis++) {
    const plus = position.slice();
    const minus = position.slice();
    plus[axis] += epsilon;
    minus[axis] -= epsilon;
    const plusPosition = transformer.transformPosition(plus);
    const minusPosition = transformer.transformPosition(minus);
    columns.push([
      (plusPosition[0] - minusPosition[0]) / (2 * epsilon),
      (plusPosition[1] - minusPosition[1]) / (2 * epsilon),
      (plusPosition[2] - minusPosition[2]) / (2 * epsilon)
    ]);
  }
  return columns;
}

function inverseTransposeMultiply(jacobianColumns: number[][], vector: number[]): number[] {
  const [a, b, c] = jacobianColumns;
  const determinant =
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    b[0] * (a[1] * c[2] - a[2] * c[1]) +
    c[0] * (a[1] * b[2] - a[2] * b[1]);
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-15) {
    return vector;
  }
  const inverseTranspose = [
    [b[1] * c[2] - b[2] * c[1], a[2] * c[1] - a[1] * c[2], a[1] * b[2] - a[2] * b[1]],
    [b[2] * c[0] - b[0] * c[2], a[0] * c[2] - a[2] * c[0], a[2] * b[0] - a[0] * b[2]],
    [b[0] * c[1] - b[1] * c[0], a[1] * c[0] - a[0] * c[1], a[0] * b[1] - a[1] * b[0]]
  ];
  return inverseTranspose.map(
    row => (row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2]) / determinant
  );
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
  return (
    typeof definition === 'string' && normalizeCrsIdentifier(definition) === WGS84_GEOCENTRIC_CRS
  );
}

/** Return whether a CRS definition uses conventional WGS84 longitude/latitude coordinates. */
function isWgs84Geographic(definition: unknown): boolean {
  if (typeof definition !== 'string') {
    return false;
  }
  const identifier = normalizeCrsIdentifier(definition);
  return (
    identifier === WGS84_GEOGRAPHIC_CRS || identifier === 'EPSG:4979' || identifier === 'OGC:CRS84'
  );
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
