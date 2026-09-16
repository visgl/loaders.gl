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
  source: 'attribute' | 'property-table' | 'constant' | 'texture' | 'implicit';
  /** glTF attribute name for attribute-backed identifiers. */
  attribute?: string;
  /** Structural-metadata property-table index. */
  propertyTable?: number;
  /** Constant feature identifier. */
  constant?: number;
  /** Texture-backed identifier declaration, when present. */
  texture?: Record<string, unknown>;
  /** Implicit identifier declaration, when present. */
  implicit?: Record<string, unknown>;
  /** Decoded identifier values, when supplied by a content loader. */
  values?: Uint32Array | Uint16Array | Uint8Array;
  /** Unrecognized source fields preserved for forward compatibility. */
  details?: Record<string, unknown>;
};

/** Raw metadata references inherited by a tile and its contents. */
export type Tile3DMetadataContext = {
  /** Tileset-level metadata entity. */
  tileset?: Record<string, unknown> | null;
  /** Group metadata entity selected for the tile's primary content. */
  group?: Record<string, unknown> | null;
  /** All tileset groups, used to resolve a selected content entry's group. */
  groups?: readonly (Record<string, unknown> | null)[];
  /** Tile metadata entity. */
  tile?: Record<string, unknown> | null;
  /** Content metadata entity. */
  content?: Record<string, unknown> | null;
  /** Implicit-subtree metadata entity. */
  subtree?: Record<string, unknown> | null;
};

/** Extracts mesh-feature declarations from a decoded glTF-like payload. */
export function getTile3DFeatureIdSets(payload: unknown): Tile3DFeatureIdSet[] {
  const featureIdSets: Tile3DFeatureIdSet[] = [];
  const visited = new Set<object>();
  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') {
      return;
    }
    if (visited.has(value as object)) {
      return;
    }
    visited.add(value as object);
    const record = value as Record<string, any>;
    const declarations = record.extensions?.EXT_mesh_features?.featureIds;
    if (Array.isArray(declarations)) {
      for (const declaration of declarations) {
        if (!declaration || typeof declaration !== 'object') {
          continue;
        }
        const source = declaration.texture
          ? 'texture'
          : declaration.implicit
            ? 'implicit'
            : declaration.attribute !== undefined
              ? 'attribute'
              : declaration.propertyTable !== undefined
                ? 'property-table'
                : 'constant';
        featureIdSets.push({
          source,
          attribute: declaration.attribute,
          propertyTable: declaration.propertyTable,
          constant: declaration.constant,
          texture: declaration.texture,
          implicit: declaration.implicit,
          values: declaration.values,
          details: declaration
        });
      }
    }
    for (const child of Object.values(record)) {
      visit(child);
    }
  };
  visit(payload);
  return featureIdSets;
}
