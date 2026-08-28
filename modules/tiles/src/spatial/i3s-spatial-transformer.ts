// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4, Quaternion, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {
  getSpatialCoordinateFrame,
  SpatialCoordinateTransformer
} from './spatial-coordinate-transformer';
import {
  createTilesetSpatialReference,
  markTilesetSpatialReferenceTransformed
} from './spatial-types';
import type {
  TilesetCoordinateFrame,
  TilesetSpatialOptions,
  TilesetSpatialReference
} from './spatial-types';

/** Minimal I3S oriented bounding box required by the spatial adapter. */
export type I3SSpatialObb = {
  /** Center in source CRS coordinates. */
  center: ArrayLike<number>;
  /** Half lengths along the oriented axes. */
  halfSize: ArrayLike<number>;
  /** Orientation quaternion. */
  quaternion: ArrayLike<number>;
};

/** Input used to rebuild an I3S node bound in the selected output frame. */
export type I3SSpatialBounds = {
  /** Minimum bounding sphere encoded as source center plus radius. */
  mbs?: ArrayLike<number>;
  /** Oriented source bound, preferred when available. */
  obb?: I3SSpatialObb;
  /** Frame in which I3S vectors and quaternions are expressed. */
  normalReferenceFrame?: string;
};

/** Renderer-ready positions and metadata produced for an I3S geometry resource. */
export type I3STransformedPositions = {
  /** Float32 offsets from the stable target origin. */
  positions: Float32Array;
  /** Reconstructed absolute source positions retained for normal transformation. */
  sourcePositions: Float64Array;
  /** Stable origin in target CRS coordinates. */
  origin: [number, number, number];
  /** Origin used by geographic deck.gl coordinate systems. */
  cartographicOrigin: [number, number, number];
  /** Renderer coordinate-system discriminator. */
  coordinateSystem: 'cartesian' | 'lnglat-offsets';
  /** Translation matrix used for Cartesian target offsets. */
  modelMatrix: Matrix4;
};

/**
 * Applies one normalized I3S horizontal CRS operation consistently to geometry, normals, origins,
 * and node bounds.
 */
export class I3SSpatialTransformer {
  /** Descriptor attached to output after all adapter-owned spatial values have been transformed. */
  readonly spatialReference: TilesetSpatialReference;

  /** Broad coordinate frame of the selected output CRS. */
  readonly targetCoordinateFrame: TilesetCoordinateFrame;

  /** Source-to-target position operation. */
  private readonly positionTransformer: SpatialCoordinateTransformer;

  /** Source-to-WGS84 geographic operation used for vector-frame conversion. */
  private readonly sourceToGeographicTransformer: SpatialCoordinateTransformer;

  /** WGS84-geographic-to-target operation used for normal finite differences. */
  private readonly geographicToTargetTransformer: SpatialCoordinateTransformer;

  /** Source frame recorded by I3S metadata. */
  private readonly sourceCoordinateFrame: TilesetCoordinateFrame;

  /**
   * Creates an I3S spatial adapter.
   *
   * @param spatialReference - Transformable I3S spatial descriptor.
   * @param options - Registered geoid and custom resource options used by the shared transformer.
   */
  constructor(spatialReference: TilesetSpatialReference, options: TilesetSpatialOptions = {}) {
    if (spatialReference.status !== 'transformable' && spatialReference.status !== 'transformed') {
      throw new Error('I3SSpatialTransformer requires a requested, transformable spatial output');
    }
    const targetCrs = spatialReference.targetCrs || spatialReference.sourceCrs;
    if (!targetCrs) {
      throw new Error('I3S spatial transformation requires a target CRS');
    }

    this.positionTransformer = new SpatialCoordinateTransformer(spatialReference, options);
    this.sourceCoordinateFrame = spatialReference.coordinateFrame;
    this.targetCoordinateFrame = getSpatialCoordinateFrame(targetCrs);
    this.spatialReference = markTilesetSpatialReferenceTransformed(spatialReference);

    const sourceToGeographicReference = createTilesetSpatialReference(
      {
        sourceCrs: spatialReference.sourceCrs,
        heightReference: spatialReference.heightReference,
        coordinateFrame: spatialReference.coordinateFrame,
        axisOrder: spatialReference.axisOrder,
        provenance: spatialReference.provenance
      },
      {targetCrs: 'EPSG:4326'}
    );
    this.sourceToGeographicTransformer = new SpatialCoordinateTransformer(
      sourceToGeographicReference
    );

    const geographicToTargetReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        heightReference:
          spatialReference.targetHeightReference === 'native'
            ? spatialReference.heightReference
            : spatialReference.targetHeightReference,
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        provenance: 'format-default'
      },
      {targetCrs}
    );
    this.geographicToTargetTransformer = new SpatialCoordinateTransformer(
      geographicToTargetReference
    );
  }

  /** Transform one absolute I3S source position. */
  transformPosition(position: ArrayLike<number>): [number, number, number] {
    const transformed = this.positionTransformer.transformPosition([
      position[0],
      position[1],
      position[2]
    ]);
    return [transformed[0], transformed[1], transformed[2]];
  }

  /** Transform one absolute I3S source position to WGS84 longitude, latitude, and height. */
  transformSourcePositionToGeographic(position: ArrayLike<number>): [number, number, number] {
    const transformed = this.sourceToGeographicTransformer.transformPosition([
      position[0],
      position[1],
      position[2]
    ]);
    return [transformed[0], transformed[1], transformed[2]];
  }

  /**
   * Transform absolute Float64 positions and return stable Float32 offsets around a target origin.
   *
   * @param sourcePositions - Absolute positions in source CRS order.
   * @param sourceOrigin - Stable source origin, normally the node MBS or OBB center.
   */
  transformPositions(
    sourcePositions: ArrayLike<number>,
    sourceOrigin: ArrayLike<number>
  ): I3STransformedPositions {
    const origin = this.transformPosition(sourceOrigin);
    const positions = new Float32Array(sourcePositions.length);
    const absoluteSourcePositions = Float64Array.from(sourcePositions);

    for (let index = 0; index < sourcePositions.length; index += 3) {
      const transformed = this.transformPosition([
        sourcePositions[index],
        sourcePositions[index + 1],
        sourcePositions[index + 2]
      ]);
      positions[index] = transformed[0] - origin[0];
      positions[index + 1] = transformed[1] - origin[1];
      positions[index + 2] = transformed[2] - origin[2];
    }

    const isGeographic = this.targetCoordinateFrame === 'geographic';
    const modelMatrix = isGeographic ? new Matrix4() : new Matrix4().translate(origin);
    return {
      positions,
      sourcePositions: absoluteSourcePositions,
      origin,
      cartographicOrigin: isGeographic ? origin : [0, 0, 0],
      coordinateSystem: isGeographic ? 'lnglat-offsets' : 'cartesian',
      modelMatrix
    };
  }

  /**
   * Transform I3S normals into the selected target basis.
   *
   * Earth-centered normals are rotated directly. Vertex-reference-frame normals are first mapped
   * through the local east/north/up basis at each source position.
   *
   * @param normals - Three-component normal vectors.
   * @param sourcePositions - Absolute source position paired with each normal.
   * @param normalReferenceFrame - I3S normal frame declaration.
   */
  transformNormals(
    normals: ArrayLike<number>,
    sourcePositions: ArrayLike<number>,
    normalReferenceFrame = 'earth-centered'
  ): Float32Array {
    const transformedNormals = new Float32Array(normals.length);
    for (let index = 0; index < normals.length; index += 3) {
      const geographic = this.sourceToGeographicTransformer.transformPosition([
        sourcePositions[index],
        sourcePositions[index + 1],
        sourcePositions[index + 2]
      ]);
      const inputNormal = new Vector3([
        normals[index],
        normals[index + 1],
        normals[index + 2]
      ]).normalize();
      const ecefNormal =
        normalReferenceFrame === 'earth-centered'
          ? inputNormal
          : localEnuVectorToEcef(inputNormal, geographic);
      const outputNormal = this.transformEcefNormal(ecefNormal, geographic);
      transformedNormals.set(outputNormal, index);
    }
    return transformedNormals;
  }

  /**
   * Rebuild an I3S node bound from transformed corner or sphere-axis samples.
   *
   * @param bounds - Source MBS/OBB fields.
   * @returns A generic tile `region` for geographic output or axis-aligned `box` otherwise.
   */
  transformBoundingVolume(bounds: I3SSpatialBounds): {box?: number[]; region?: number[]} {
    const sourceSamples = getSourceBoundSamples(
      bounds,
      this.sourceCoordinateFrame,
      this.sourceToGeographicTransformer
    );
    if (!sourceSamples.length) {
      throw new Error('I3S spatial transformation requires an MBS or OBB bound');
    }
    const targetSamples = sourceSamples.map(position =>
      this.sourceCoordinateFrame === 'geographic'
        ? this.geographicToTargetTransformer.transformPosition(position)
        : this.transformPosition(position)
    );
    return this.targetCoordinateFrame === 'geographic'
      ? {region: getGeographicRegion(targetSamples)}
      : {box: getAxisAlignedBox(targetSamples)};
  }

  /** Transform one earth-centered normal to the selected target basis. */
  private transformEcefNormal(ecefNormal: Vector3, geographic: number[]): Vector3 {
    if (this.targetCoordinateFrame === 'geocentric') {
      return ecefNormal.normalize();
    }
    if (this.targetCoordinateFrame === 'geographic') {
      return ecefVectorToLocalEnu(ecefNormal, geographic).normalize();
    }

    const cartesian = Ellipsoid.WGS84.cartographicToCartesian(new Vector3(geographic));
    const displacedCartesian = new Vector3(cartesian).add(ecefNormal);
    const displacedGeographic = Ellipsoid.WGS84.cartesianToCartographic(displacedCartesian);
    const target = this.geographicToTargetTransformer.transformPosition(geographic);
    const displacedTarget =
      this.geographicToTargetTransformer.transformPosition(displacedGeographic);
    return new Vector3(displacedTarget).subtract(target).normalize();
  }
}

/** Generate source-frame samples that conservatively cover an I3S MBS or OBB. */
function getSourceBoundSamples(
  bounds: I3SSpatialBounds,
  sourceFrame: TilesetCoordinateFrame,
  sourceToGeographicTransformer: SpatialCoordinateTransformer
): number[][] {
  const obb = bounds.obb;
  if (obb) {
    const center = Array.from(obb.center).slice(0, 3);
    const halfSize = Array.from(obb.halfSize).slice(0, 3);
    const quaternion = new Quaternion().fromArray(Array.from(obb.quaternion));
    const axes = [
      new Vector3([halfSize[0], 0, 0]).transformByQuaternion(quaternion),
      new Vector3([0, halfSize[1], 0]).transformByQuaternion(quaternion),
      new Vector3([0, 0, halfSize[2]]).transformByQuaternion(quaternion)
    ];
    if (sourceFrame === 'geographic') {
      const geographicCenter = sourceToGeographicTransformer.transformPosition(center);
      const cartesianCenter = Ellipsoid.WGS84.cartographicToCartesian(
        new Vector3(geographicCenter)
      );
      const cartesianAxes =
        bounds.normalReferenceFrame === 'vertex-reference-frame'
          ? axes.map(axis => localEnuVectorToEcef(axis, geographicCenter))
          : axes;
      return getBoxSigns().map(signs => {
        const corner = new Vector3(cartesianCenter);
        for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
          corner.add(new Vector3(cartesianAxes[axisIndex]).scale(signs[axisIndex]));
        }
        return Array.from(Ellipsoid.WGS84.cartesianToCartographic(corner));
      });
    }
    return getBoxSigns().map(signs => {
      const corner = new Vector3(center);
      for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
        corner.add(new Vector3(axes[axisIndex]).scale(signs[axisIndex]));
      }
      return Array.from(corner);
    });
  }

  const mbs = bounds.mbs ? Array.from(bounds.mbs) : [];
  if (mbs.length < 4) {
    return [];
  }
  const center = mbs.slice(0, 3);
  const radius = mbs[3];
  if (sourceFrame === 'geographic') {
    const geographicCenter = sourceToGeographicTransformer.transformPosition(center);
    const cartesianCenter = Ellipsoid.WGS84.cartographicToCartesian(new Vector3(geographicCenter));
    return getAxisDirections().map(direction =>
      Array.from(
        Ellipsoid.WGS84.cartesianToCartographic(
          new Vector3(cartesianCenter).add(new Vector3(direction).scale(radius))
        )
      )
    );
  }
  return getAxisDirections().map(direction =>
    Array.from(new Vector3(center).add(new Vector3(direction).scale(radius)))
  );
}

/** Return the eight sign combinations of a box. */
function getBoxSigns(): number[][] {
  return [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => [x, y, z])));
}

/** Return positive and negative unit directions for three Cartesian axes. */
function getAxisDirections(): number[][] {
  return [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1]
  ];
}

/** Convert a local east/north/up vector into an earth-centered vector. */
function localEnuVectorToEcef(vector: ArrayLike<number>, geographic: ArrayLike<number>): Vector3 {
  const longitude = (geographic[0] * Math.PI) / 180;
  const latitude = (geographic[1] * Math.PI) / 180;
  const east = new Vector3([-Math.sin(longitude), Math.cos(longitude), 0]);
  const north = new Vector3([
    -Math.sin(latitude) * Math.cos(longitude),
    -Math.sin(latitude) * Math.sin(longitude),
    Math.cos(latitude)
  ]);
  const up = new Vector3([
    Math.cos(latitude) * Math.cos(longitude),
    Math.cos(latitude) * Math.sin(longitude),
    Math.sin(latitude)
  ]);
  return east.scale(vector[0]).add(north.scale(vector[1])).add(up.scale(vector[2]));
}

/** Convert an earth-centered vector into local east/north/up components. */
function ecefVectorToLocalEnu(vector: Vector3, geographic: ArrayLike<number>): Vector3 {
  const longitude = (geographic[0] * Math.PI) / 180;
  const latitude = (geographic[1] * Math.PI) / 180;
  const east = new Vector3([-Math.sin(longitude), Math.cos(longitude), 0]);
  const north = new Vector3([
    -Math.sin(latitude) * Math.cos(longitude),
    -Math.sin(latitude) * Math.sin(longitude),
    Math.cos(latitude)
  ]);
  const up = new Vector3([
    Math.cos(latitude) * Math.cos(longitude),
    Math.cos(latitude) * Math.sin(longitude),
    Math.sin(latitude)
  ]);
  return new Vector3([east.dot(vector), north.dot(vector), up.dot(vector)]);
}

/** Build a target-frame axis-aligned generic tile box. */
function getAxisAlignedBox(positions: number[][]): number[] {
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  for (const position of positions) {
    for (let component = 0; component < 3; component++) {
      minimum[component] = Math.min(minimum[component], position[component]);
      maximum[component] = Math.max(maximum[component], position[component]);
    }
  }
  const center = minimum.map((value, index) => (value + maximum[index]) / 2);
  const halfSize = minimum.map((value, index) => (maximum[index] - value) / 2);
  return [center[0], center[1], center[2], halfSize[0], 0, 0, 0, halfSize[1], 0, 0, 0, halfSize[2]];
}

/** Build a dateline-aware geographic tile region in radians. */
function getGeographicRegion(positions: number[][]): number[] {
  const referenceLongitude = positions[0][0];
  let minimumLongitude = Infinity;
  let maximumLongitude = -Infinity;
  let minimumLatitude = Infinity;
  let maximumLatitude = -Infinity;
  let minimumHeight = Infinity;
  let maximumHeight = -Infinity;
  for (const position of positions) {
    const longitude = referenceLongitude + normalizeLongitude(position[0] - referenceLongitude);
    minimumLongitude = Math.min(minimumLongitude, longitude);
    maximumLongitude = Math.max(maximumLongitude, longitude);
    minimumLatitude = Math.min(minimumLatitude, position[1]);
    maximumLatitude = Math.max(maximumLatitude, position[1]);
    minimumHeight = Math.min(minimumHeight, position[2]);
    maximumHeight = Math.max(maximumHeight, position[2]);
  }
  return [
    (normalizeLongitude(minimumLongitude) * Math.PI) / 180,
    (minimumLatitude * Math.PI) / 180,
    (normalizeLongitude(maximumLongitude) * Math.PI) / 180,
    (maximumLatitude * Math.PI) / 180,
    minimumHeight,
    maximumHeight
  ];
}

/** Normalize a longitude delta to the interval [-180, 180). */
function normalizeLongitude(longitude: number): number {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}
