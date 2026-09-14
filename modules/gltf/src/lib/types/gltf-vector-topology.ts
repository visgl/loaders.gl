// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {NumericArray} from '@loaders.gl/loader-utils';

/** A contiguous run of primitive indices delimited by primitive-restart values. */
export type GLTFPrimitiveIndexRange = {
  /** Offset of the first index in the source accessor. */
  readonly offset: number;
  /** Number of indices in the run. */
  readonly count: number;
};

/** Loader-derived topology for a primitive using `KHR_mesh_primitive_restart`. */
export type GLTFPrimitiveRestartData = {
  /** Maximum component value used as the restart marker. */
  readonly restartIndex: number;
  /** Non-empty index runs in source-accessor coordinates. */
  readonly ranges: readonly GLTFPrimitiveIndexRange[];
};

/** One polygon decoded from `EXT_mesh_polygon`. */
export type GLTFPolygon = {
  /** Contiguous triangle-index range in the primitive's core indices accessor. */
  readonly triangleRange: GLTFPrimitiveIndexRange;
  /** Exterior ring followed by zero or more interior rings. */
  readonly loopRanges: readonly GLTFPrimitiveIndexRange[];
};

/** Loader-resolved accessor data attached to `EXT_mesh_polygon`. */
export type GLTFMeshPolygonData = {
  /** Polygon offsets into the primitive's core triangle indices. */
  readonly indicesOffsets: NumericArray;
  /** Original polygon loop indices, including primitive-restart markers. */
  readonly loopIndices: NumericArray;
  /** Polygon offsets into `loopIndices`. */
  readonly loopIndicesOffsets: NumericArray;
  /** Random-access ranges derived from the offset accessors and restart markers. */
  readonly polygons: readonly GLTFPolygon[];
};

/** Draft `EXT_mesh_polygon` mesh-primitive extension. */
export type GLTF_EXT_mesh_polygon = {
  /** Number of polygons encoded in the primitive. */
  count: number;
  /** Accessor index containing triangle-index offsets for each polygon. */
  indicesOffsets: number;
  /** Accessor index containing exterior and interior ring indices. */
  loopIndices: number;
  /** Accessor index containing loop-index offsets for each polygon. */
  loopIndicesOffsets: number;
  /** Loader-resolved topology. This property is not serialized by glTF. */
  data?: GLTFMeshPolygonData;
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/** Zero-allocation description of feature IDs assigned by vertex index. */
export type GLTFImplicitFeatureIdRange = {
  /** First implicit feature ID. */
  readonly start: 0;
  /** Number of consecutive feature IDs. */
  readonly count: number;
};
