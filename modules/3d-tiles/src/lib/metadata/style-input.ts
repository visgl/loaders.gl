// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Tile3DContent, Tile3DMetadataContext} from '@loaders.gl/tiles';

/** Origin of a property exposed to a renderer-neutral style input. */
export type Tile3DStylePropertySource =
  | 'batch-table'
  | 'content-metadata'
  | 'tile-metadata'
  | 'group-metadata'
  | 'tileset-metadata';

/** A read-only property bag that a renderer may use as style input. */
export type Tile3DStyleInput = {
  /** Feature identifier used for batch-table lookup, when one is known. */
  readonly featureId?: number;
  /** Raw metadata context inherited by the tile. */
  readonly metadata: Tile3DMetadataContext;
  /** Merged properties, ordered from least-specific to most-specific. */
  readonly properties: Readonly<Record<string, unknown>>;
  /** Source of each merged property, using the same precedence as `properties`. */
  readonly propertySources: Readonly<Record<string, Tile3DStylePropertySource>>;
};

/** Options for constructing a renderer-neutral style input. */
export type Tile3DStyleInputOptions = {
  /** Feature identifier used to select one batch-table row. */
  featureId?: number;
  /** Parsed batch table associated with the content payload. */
  batchTable?: Tile3DBatchTableLike | null;
};

/**
 * Minimal batch-table surface required by the style-input adapter.
 *
 * Keeping this structural makes the adapter usable with legacy and application-owned batch-table
 * implementations while preserving hierarchy-aware `getProperty` behavior.
 */
export type Tile3DBatchTableLike = {
  /** Returns a property value for one feature, including inherited hierarchy values. */
  getProperty(batchId: number, name: string): unknown;
  /** Returns property names visible for one feature, including inherited hierarchy names. */
  getPropertyNames(batchId: number, results?: string[]): string[];
};

/**
 * Copies one feature's batch-table row into a plain property bag.
 *
 * The batch-table implementation performs range checks and hierarchy traversal. This helper does
 * not decode styling expressions or mutate the batch table.
 *
 * @param batchTable - Batch table exposing hierarchy-aware property access.
 * @param featureId - Zero-based feature identifier.
 * @returns A new property bag containing defined properties for the feature.
 */
export function getTile3DBatchTableProperties(
  batchTable: Tile3DBatchTableLike | null | undefined,
  featureId: number
): Record<string, unknown> {
  if (!batchTable) {
    return {};
  }

  const properties: Record<string, unknown> = {};
  for (const propertyName of batchTable.getPropertyNames(featureId)) {
    const value = batchTable.getProperty(featureId, propertyName);
    if (value !== undefined) {
      properties[propertyName] = value;
    }
  }
  return properties;
}

/**
 * Creates immutable-style input from raw metadata and one ordered content descriptor.
 *
 * Metadata properties are merged from tileset, group, tile, and content scope in that order.
 * Batch-table properties, when a valid feature identifier and parsed table are supplied, take
 * precedence over metadata. The result is a snapshot: callers may add renderer-specific style
 * evaluation without changing loader state.
 *
 * @param content - Ordered content descriptor from `Tile3D.contentEntries`.
 * @param metadata - Raw metadata context inherited by the tile.
 * @param options - Optional feature and batch-table lookup settings.
 * @returns A renderer-neutral style input with merged properties and source diagnostics.
 */
export function createTile3DStyleInput(
  content: Tile3DContent,
  metadata: Tile3DMetadataContext,
  options: Tile3DStyleInputOptions = {}
): Tile3DStyleInput {
  const properties: Record<string, unknown> = {};
  const propertySources: Record<string, Tile3DStylePropertySource> = {};

  const addMetadataProperties = (
    entity: Record<string, unknown> | null | undefined,
    source: Tile3DStylePropertySource
  ): void => {
    const entityProperties = entity?.properties;
    if (!entityProperties || typeof entityProperties !== 'object') {
      return;
    }
    for (const [propertyName, value] of Object.entries(entityProperties)) {
      properties[propertyName] = value;
      propertySources[propertyName] = source;
    }
  };

  addMetadataProperties(metadata.tileset, 'tileset-metadata');
  addMetadataProperties(metadata.group, 'group-metadata');
  addMetadataProperties(metadata.tile, 'tile-metadata');
  addMetadataProperties(content.metadata, 'content-metadata');

  const featureId = options.featureId;
  if (options.batchTable && Number.isInteger(featureId) && featureId >= 0) {
    for (const [propertyName, value] of Object.entries(
      getTile3DBatchTableProperties(options.batchTable, featureId)
    )) {
      properties[propertyName] = value;
      propertySources[propertyName] = 'batch-table';
    }
  }

  return {
    featureId: options.featureId,
    metadata,
    properties,
    propertySources
  };
}

/**
 * Reads one property from a style-input snapshot.
 *
 * This is deliberately a direct lookup. Styling expression parsing, type coercion, and GPU upload
 * remain renderer responsibilities.
 *
 * @param styleInput - Style-input snapshot created by `createTile3DStyleInput`.
 * @param propertyName - Property name to read.
 * @returns The merged property value, or `undefined` when absent.
 */
export function getTile3DStyleProperty(
  styleInput: Tile3DStyleInput,
  propertyName: string
): unknown {
  return styleInput.properties[propertyName];
}
