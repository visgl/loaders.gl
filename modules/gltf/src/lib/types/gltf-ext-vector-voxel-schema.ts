// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/** Polygon topology metadata used by vector/CAD glTF primitives. */
export type GLTF_EXT_mesh_polygon = {
  /** Number of polygons encoded by the primitive. */
  count: number;
  /** Accessor containing loop vertex indices. */
  loopIndices: number;
  /** Accessor containing the first loop offset for each polygon. */
  loopIndicesOffsets: number;
  /** Accessor containing the first triangle offset for each polygon. */
  indicesOffsets: number;
};

/** Primitive-restart groups used by vector and CAD line/edge data. */
export type GLTF_EXT_mesh_primitive_restart = {
  /** Groups that share an index accessor and restart value. */
  primitiveGroups: Array<Record<string, unknown>>;
};

/** Edge visibility bitfield declaration preserved for vector/CAD renderers. */
export type GLTF_EXT_mesh_primitive_edge_visibility = {
  /** Accessor containing two-bit visibility values for triangle edges. */
  visibility: number;
  /** Optional edge material index. */
  material?: number;
};

/** Voxel primitive declaration. Values remain lazy and reference glTF accessors. */
export type GLTF_EXT_primitive_voxels = {
  /** Index of the shape declaration in KHR_implicit_shapes. */
  shape: number;
  /** Voxel-grid dimensions in shape space. */
  dimensions: number[];
  /** Optional padding around the voxel grid. */
  padding?: Record<string, number>;
  /** Per-attribute no-data sentinel values. */
  noData?: Record<string, number[]>;
};

/** Normalized, lazy descriptor for one voxel primitive. */
export type GLTFVoxelPrimitive = {
  meshIndex: number;
  primitiveIndex: number;
  attributes: Readonly<Record<string, number>>;
  extension: GLTF_EXT_primitive_voxels;
};
