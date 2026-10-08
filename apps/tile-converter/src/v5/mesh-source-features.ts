// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshGeometry} from '@loaders.gl/schema';
import type {GLTFPostprocessed, GLTFMeshPrimitivePostprocessed} from '@loaders.gl/gltf';
import type {I3SMeshFeatures} from '@loaders.gl/i3s';
import {convertFeatureAttributesToArrowBatches} from './feature-arrow.js';
import type {FeatureArrowBatchOptions} from './feature-arrow.js';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';

/** Explicit source feature mapping; target type changes must be authorized separately. */
export interface MeshSourceFeatureOptions extends FeatureArrowBatchOptions {
  /** Batch-table class label, or the exact structural-metadata class to select. */
  readonly metadataClass: string;
  /** Optional source property providing stable identifiers; otherwise row indices are stable within the content. */
  readonly sourceFeatureIdProperty?: string;
  /** Explicit I3S representation for 64-bit integers; omission rejects those target fields. */
  readonly integer64Encoding?: 'decimal-string';
}

/** Extracts legacy batch tables or one decoded modern property table and validates geometry ownership. */
export function extractMeshFeatures(
  gltf: GLTFPostprocessed,
  primitive: GLTFMeshPrimitivePostprocessed,
  payload: {
    batchTableJson?: Record<string, unknown>;
    header?: {batchLength?: number};
    featureTableJson?: Record<string, unknown>;
  },
  mesh: MeshGeometry,
  options?: MeshSourceFeatureOptions
): I3SMeshFeatures | undefined {
  const declarations = primitive.extensions?.EXT_mesh_features?.featureIds;
  const metadata = gltf.extensions?.EXT_structural_metadata;
  const legacy = primitive.attributes._BATCHID;
  if (
    !declarations &&
    !legacy &&
    !metadata &&
    !Object.keys(payload.batchTableJson || {}).length &&
    !payload.header?.batchLength
  ) {
    if (Object.keys(primitive.attributes).some(name => /^_FEATURE_ID_\d+$/.test(name)))
      throw new TileConversionError(
        'MESH_FEATURE_MAPPING_REQUIRED',
        'Feature attributes require an EXT_mesh_features declaration'
      );
    return undefined;
  }
  if (!options)
    throw new TileConversionError(
      'MESH_FEATURE_SCHEMA_REQUIRED',
      'Feature extraction requires an explicit Arrow schema and class mapping'
    );
  if (!options.metadataClass)
    throw new TileConversionError(
      'MESH_FEATURE_CLASS_REQUIRED',
      'Feature metadata class must be explicit'
    );
  let count: number;
  let attribute = legacy;
  let properties: Record<string, ArrayLike<unknown>>;
  if (declarations) {
    if (
      legacy ||
      declarations.length !== 1 ||
      metadata?.propertyTables?.length !== 1 ||
      metadata.propertyTextures?.length ||
      metadata.propertyAttributes?.length
    )
      throw new TileConversionError(
        'MESH_FEATURE_MAPPING_UNSUPPORTED',
        'Only one attribute-backed feature set and one property table are supported'
      );
    const declaration = declarations[0];
    if (
      !Number.isInteger(declaration.attribute) ||
      declaration.attribute < 0 ||
      declaration.propertyTable !== 0 ||
      declaration.texture ||
      declaration.implicit ||
      declaration.nullFeatureId !== undefined
    )
      throw new TileConversionError(
        'MESH_FEATURE_MAPPING_UNSUPPORTED',
        'Features require an attribute and property table 0 without null/texture/implicit IDs'
      );
    attribute = primitive.attributes[`_FEATURE_ID_${declaration.attribute}`];
    const table = metadata.propertyTables[0];
    if (table.class !== options.metadataClass || table.count !== declaration.featureCount)
      throw new TileConversionError(
        'MESH_FEATURE_CLASS_MISMATCH',
        'Feature class and declared table counts must agree'
      );
    count = table.count;
    properties = {};
    const classProperties = metadata.schema?.classes?.[table.class]?.properties;
    if (!classProperties)
      throw new TileConversionError(
        'MESH_FEATURE_SCHEMA_REQUIRED',
        'A decoded inline structural metadata class is required'
      );
    if (Object.keys(table.properties || {}).some(name => !Object.hasOwn(classProperties, name)))
      throw new TileConversionError(
        'MESH_FEATURE_PROPERTY_UNMAPPED',
        'Property table columns must be declared in the metadata class'
      );
    for (const [name, property] of Object.entries(classProperties) as [
      string,
      {
        type: string;
        componentType?: string;
        array?: boolean;
        noData?: unknown;
        default?: unknown;
        normalized?: boolean;
        offset?: unknown;
        scale?: unknown;
      }
    ][]) {
      const column = table.properties?.[name];
      if (
        !['SCALAR', 'STRING'].includes(property.type) ||
        property.array ||
        property.noData !== undefined ||
        (['INT64', 'UINT64'].includes(property.componentType || '') &&
          (property.normalized ||
            property.offset !== undefined ||
            property.scale !== undefined ||
            column?.offset !== undefined ||
            column?.scale !== undefined))
      )
        throw new TileConversionError(
          'MESH_FEATURE_PROPERTY_UNSUPPORTED',
          `Property ${name} requires a separately qualified semantic mapping`
        );
      const data = column?.data;
      if (data === undefined && property.default === undefined)
        throw new TileConversionError(
          'MESH_FEATURE_PROPERTY_UNAVAILABLE',
          `Property ${name} has not been decoded`
        );
      properties[name] = data ?? Array.from({length: count}, () => property.default);
    }
  } else {
    if (metadata)
      throw new TileConversionError(
        'MESH_FEATURE_MAPPING_UNSUPPORTED',
        'Structural metadata requires an attribute-backed feature declaration'
      );
    count = payload.header?.batchLength ?? Number(payload.featureTableJson?.BATCH_LENGTH);
    properties = (payload.batchTableJson as Record<string, ArrayLike<unknown>>) || {};
  }
  const vertexCount = mesh.attributes.POSITION.value.length / 3;
  if (
    !Number.isSafeInteger(count) ||
    count <= 0 ||
    !attribute ||
    attribute.components !== 1 ||
    attribute.normalized ||
    attribute.value.length !== vertexCount ||
    Array.from(attribute.value as ArrayLike<number>).some(
      value => !Number.isSafeInteger(value) || value < 0 || value >= count
    )
  )
    throw new TileConversionError(
      'MESH_FEATURE_IDS_INVALID',
      'Feature IDs must be one valid property-table row index per vertex'
    );
  const selectedAttribute = declarations ? `_FEATURE_ID_${declarations[0].attribute}` : '_BATCHID';
  if (
    Object.keys(primitive.attributes).some(
      name => (name === '_BATCHID' || /^_FEATURE_ID_\d+$/.test(name)) && name !== selectedAttribute
    )
  )
    throw new TileConversionError(
      'MESH_FEATURE_MAPPING_UNSUPPORTED',
      'Additional feature ID sets require separate mappings'
    );
  for (const [name, values] of Object.entries(properties)) {
    if (
      !values ||
      (!Array.isArray(values) && !ArrayBuffer.isView(values)) ||
      values.length !== count
    )
      throw new TileConversionError(
        'MESH_FEATURE_PROPERTY_UNAVAILABLE',
        `Property ${name} must be a decoded column matching the table count`
      );
  }
  const sourceIdentifier = options.sourceFeatureIdProperty;
  if (sourceIdentifier && !properties[sourceIdentifier])
    throw new TileConversionError(
      'MESH_FEATURE_ID_PROPERTY_REQUIRED',
      'Stable source identifier property is missing'
    );
  const batches = convertFeatureAttributesToArrowBatches(
    Array.from({length: count}, (_, index) => ({
      featureId: (sourceIdentifier ? properties[sourceIdentifier][index] : index) as
        | string
        | number
        | bigint,
      metadataClass: options.metadataClass,
      properties: Object.fromEntries(
        Object.entries(properties)
          .filter(([name]) => name !== sourceIdentifier)
          .map(([name, values]) => [name, values[index]])
      )
    })),
    options
  );
  const indices = mesh.indices?.value;
  const triangleFeatureIndices = new Uint32Array((indices?.length ?? vertexCount) / 3);
  for (let triangle = 0; triangle < triangleFeatureIndices.length; triangle++) {
    const corners = [0, 1, 2].map(
      corner => indices?.[triangle * 3 + corner] ?? triangle * 3 + corner
    );
    const rows = corners.map(corner => attribute.value[corner]);
    // Repeated-index strip connectors have no surface; retain the first corner's feature row.
    if (rows.some(row => row !== rows[0]) && new Set(corners).size === 3)
      throw new TileConversionError(
        'MESH_FEATURE_TRIANGLE_MIXED',
        'All vertices of a nondegenerate triangle must reference the same feature row'
      );
    triangleFeatureIndices[triangle] = Number(rows[0]);
  }
  return {
    batches,
    triangleFeatureIndices,
    featureIdField: options.featureIdField || 'feature_id',
    integer64Encoding: options.integer64Encoding
  };
}
