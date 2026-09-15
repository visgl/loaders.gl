// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Structural subset implemented by math.gl bounding volumes used by tile renderers. */
export type Tile3DBoundingVolume = {
  distanceSquaredTo?(point: unknown): number;
  intersectPlane?(plane: unknown): number;
};

/** Renderer-neutral description of one ordered tile content entry. */
export type Tile3DContent = {
  /** Zero-based source order, stable across loading and unloading. */
  index: number;
  /** Resolved content URI when declared by the tileset. */
  uri?: string;
  /** Normalized tile content kind, when detected. */
  type?: string;
  /** Decoded payload, or null while unloaded/failed. */
  payload: unknown;
  /** Raw content metadata reference. */
  metadata: Record<string, unknown> | null;
  /** Transformed content volume, with tile-volume fallback. */
  boundingVolume: Tile3DBoundingVolume | null;
  /** Normalized feature-id declarations for this content. */
  featureIds: Tile3DFeatureIdSet[];
  /** Whether the payload can currently be rendered. */
  renderable: boolean;
};

/** Renderer-neutral feature-id declaration from a tile content payload. */
export type Tile3DFeatureIdSet = {
  /** Source of the feature identifiers. */
  source: 'attribute' | 'property-table' | 'constant';
  /** glTF attribute name for attribute-backed identifiers. */
  attribute?: string;
  /** Structural-metadata property-table index. */
  propertyTable?: number;
  /** Constant feature identifier. */
  constant?: number;
  /** Decoded identifier values, when supplied by a content loader. */
  values?: Uint32Array | Uint16Array | Uint8Array;
};

/** Raw metadata references inherited by a tile and its contents. */
export type Tile3DMetadataContext = {
  /** Tileset-level metadata entity. */
  tileset?: Record<string, unknown> | null;
  /** Group metadata entity. */
  group?: Record<string, unknown> | null;
  /** Tile metadata entity. */
  tile?: Record<string, unknown> | null;
  /** Content metadata entity. */
  content?: Record<string, unknown> | null;
  /** Implicit-subtree metadata entity. */
  subtree?: Record<string, unknown> | null;
};
