// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshGeometry} from '@loaders.gl/core/schema';
import type {
  GLTFWithBuffers,
  GLTFMeshPrimitive,
  GLTF_EXT_mesh_features,
  GLTF_EXT_structural_metadata_GLTF
} from '@loaders.gl/scene/gltf';
import {getGLTFAccessor, getGLTFAccessorValue} from '@loaders.gl/scene/gltf';
import type {I3SMeshFeatures} from '@loaders.gl/tiles-3d/i3s';
import {convertFeatureAttributesToArrowBatches} from './feature-arrow.js';
import type {FeatureArrowBatchOptions} from './feature-arrow.js';
import {createMeshSourceFeatureOptions} from './mesh-source-schema.js';
import type {MeshSourceSchemaOptions} from './mesh-source-schema.js';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';

/** Data-only rule for absent columns and decoded noData values. */
interface MeshSourcePropertyMapping {
  /** Value used for an absent column or a decoded noData cell. */
  readonly defaultValue: unknown;
  /** Decoded sentinel; omitted for absent-column defaults. */
  readonly noData?: unknown;
}

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
  gltf: GLTFWithBuffers,
  primitive: GLTFMeshPrimitive,
  payload: {
    batchTableJson?: Record<string, unknown>;
    header?: {batchLength?: number};
    featureTableJson?: Record<string, unknown>;
  },
  mesh: MeshGeometry,
  options?: MeshSourceFeatureOptions | MeshSourceSchemaOptions
): I3SMeshFeatures | undefined {
  const declarations = (
    primitive.extensions?.EXT_mesh_features as GLTF_EXT_mesh_features | undefined
  )?.featureIds;
  const metadata = gltf.json.extensions?.EXT_structural_metadata as
    | GLTF_EXT_structural_metadata_GLTF
    | undefined;
  const legacy = primitive.attributes._BATCHID;
  if (
    !declarations &&
    legacy === undefined &&
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
      'Feature extraction requires a class selection and a declared Arrow or inline source schema'
    );
  if (!options.metadataClass)
    throw new TileConversionError(
      'MESH_FEATURE_CLASS_REQUIRED',
      'Feature metadata class must be explicit'
    );
  const mapping =
    'schema' in options ? options : createMeshSourceFeatureOptions(gltf.json, options);
  const propertyMappings = new Map<string, MeshSourcePropertyMapping>();
  let count: number;
  let attributeReference = legacy;
  let properties: Record<string, ArrayLike<unknown>>;
  if (declarations) {
    if (
      legacy !== undefined ||
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
      typeof declaration.attribute !== 'number' ||
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
    attributeReference = primitive.attributes[`_FEATURE_ID_${declaration.attribute}`];
    const table = metadata.propertyTables[0];
    if (
      table.class !== options.metadataClass ||
      !Number.isSafeInteger(declaration.featureCount) ||
      declaration.featureCount <= 0 ||
      declaration.featureCount > table.count
    )
      throw new TileConversionError(
        'MESH_FEATURE_CLASS_MISMATCH',
        'Feature class must agree and declared feature count must fit the property table'
      );
    count = table.count;
    // Source tables may be shared by primitives; dense output indices are uint32.
    if (!Number.isSafeInteger(count) || count <= 0 || count > 0xffffffff) {
      throw new TileConversionError(
        'MESH_FEATURE_IDS_INVALID',
        'Feature row count must fit uint32 indices'
      );
    }
    properties = Object.create(null);
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
        required?: boolean;
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
        (property.noData !== undefined &&
          (property.normalized ||
            property.offset !== undefined ||
            property.scale !== undefined ||
            column?.offset !== undefined ||
            column?.scale !== undefined)) ||
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
      if (
        (column !== undefined && (data === undefined || data === null)) ||
        (data === undefined && property.required === true)
      )
        throw new TileConversionError(
          'MESH_FEATURE_PROPERTY_UNAVAILABLE',
          `Property ${name} has not been decoded`
        );
      const integer64 = ['INT64', 'UINT64'].includes(property.componentType || '');
      if (
        integer64 &&
        property.default !== undefined &&
        (typeof property.default !== 'number' || !Number.isSafeInteger(property.default))
      ) {
        throw new TileConversionError(
          'MESH_FEATURE_PROPERTY_UNSUPPORTED',
          `Property ${name} requires an exact 64-bit default`
        );
      }
      const defaultValue =
        integer64 && property.default !== undefined
          ? BigInt(property.default as number)
          : (property.default ?? null);
      const decoded = data;
      if (property.noData === undefined || data === undefined) {
        if (decoded !== undefined) properties[name] = decoded as ArrayLike<unknown>;
        else propertyMappings.set(name, {defaultValue});
        continue;
      }
      const sentinel = property.noData;
      if (
        (property.type === 'STRING'
          ? typeof sentinel !== 'string'
          : typeof sentinel !== 'number' ||
            !Number.isFinite(sentinel) ||
            (integer64 && !Number.isSafeInteger(sentinel))) ||
        !decoded ||
        (!Array.isArray(decoded) && !ArrayBuffer.isView(decoded)) ||
        (decoded as ArrayLike<unknown>).length !== count
      )
        throw new TileConversionError(
          'MESH_FEATURE_PROPERTY_UNSUPPORTED',
          `Property ${name} requires a valid decoded noData mapping`
        );
      const comparable = integer64 ? BigInt(sentinel as number) : sentinel;
      const values = decoded as ArrayLike<unknown>;
      properties[name] = values;
      propertyMappings.set(name, {noData: comparable, defaultValue});
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
  const accessor =
    attributeReference === undefined ? undefined : getGLTFAccessor(gltf, attributeReference);
  const attribute = accessor
    ? {
        ...accessor,
        components: accessor.type === 'SCALAR' ? 1 : Number(accessor.type.slice(3)),
        value: getGLTFAccessorValue(gltf, accessor)
      }
    : undefined;
  const vertexCount = mesh.attributes.POSITION.value.length / 3;
  if (
    !Number.isSafeInteger(count) ||
    count <= 0 ||
    !attribute ||
    attribute.components !== 1 ||
    attribute.normalized ||
    attribute.value.length !== vertexCount
  )
    throw new TileConversionError(
      'MESH_FEATURE_IDS_INVALID',
      'Feature IDs must be one valid property-table row index per vertex'
    );
  const vertexRows = declarations ? new Set<number>() : undefined;
  for (const value of attribute.value) {
    if (!Number.isSafeInteger(value) || value < 0 || value >= count)
      throw new TileConversionError(
        'MESH_FEATURE_IDS_INVALID',
        'Feature IDs must reference valid property-table rows'
      );
    vertexRows?.add(Number(value));
  }
  if (declarations && vertexRows!.size !== declarations[0].featureCount)
    throw new TileConversionError(
      'MESH_FEATURE_IDS_INVALID',
      'Declared feature count must match distinct vertex feature IDs'
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
        `Property ${name} must be a decoded column matching the feature row count`
      );
  }
  const sourceIdentifier = options.sourceFeatureIdProperty;
  if (sourceIdentifier && !properties[sourceIdentifier] && !propertyMappings.has(sourceIdentifier))
    throw new TileConversionError(
      'MESH_FEATURE_ID_PROPERTY_REQUIRED',
      'Stable source identifier property is missing'
    );
  const indices = mesh.indices?.value;
  const cornerCount = indices?.length ?? vertexCount;
  if (cornerCount % 3)
    throw new TileConversionError(
      'MESH_FEATURE_IDS_INVALID',
      'Triangle geometry requires complete triples'
    );
  const triangleFeatureIndices = new Uint32Array(cornerCount / 3);
  const referencedRows = new Set<number>();
  /** Reads a validated triangle corner without allocating per-triangle arrays. */
  const readFeatureRow = (corner: number): number => {
    if (!Number.isSafeInteger(corner) || corner < 0 || corner >= vertexCount)
      throw new TileConversionError(
        'MESH_FEATURE_IDS_INVALID',
        'Triangle indices must reference valid mesh vertices'
      );
    return Number(attribute.value[corner]);
  };
  for (let triangle = 0; triangle < triangleFeatureIndices.length; triangle++) {
    const firstCorner = indices?.[triangle * 3] ?? triangle * 3;
    const secondCorner = indices?.[triangle * 3 + 1] ?? triangle * 3 + 1;
    const thirdCorner = indices?.[triangle * 3 + 2] ?? triangle * 3 + 2;
    const firstRow = readFeatureRow(firstCorner);
    const secondRow = readFeatureRow(secondCorner);
    const thirdRow = readFeatureRow(thirdCorner);
    // Repeated-index strip connectors have no surface; retain the first corner's feature row.
    if (
      (firstRow !== secondRow || firstRow !== thirdRow) &&
      firstCorner !== secondCorner &&
      firstCorner !== thirdCorner &&
      secondCorner !== thirdCorner
    )
      throw new TileConversionError(
        'MESH_FEATURE_TRIANGLE_MIXED',
        'All vertices of a nondegenerate triangle must reference the same feature row'
      );
    triangleFeatureIndices[triangle] = firstRow;
    referencedRows.add(firstRow);
  }
  // Sort once to retain source table order, then materialize only geometry-owned rows.
  const selectedRows = [...referencedRows].sort((left, right) => left - right);
  const denseRows = new Map(selectedRows.map((row, index) => [row, index]));
  for (let triangle = 0; triangle < triangleFeatureIndices.length; triangle++) {
    triangleFeatureIndices[triangle] = denseRows.get(triangleFeatureIndices[triangle])!;
  }
  /** Reads one referenced source value without expanding defaults or noData columns. */
  const readProperty = (name: string, row: number): unknown => {
    const values = properties[name];
    const propertyMapping = propertyMappings.get(name);
    if (!values) return propertyMapping?.defaultValue;
    const value = values[row];
    return propertyMapping && value === propertyMapping.noData
      ? propertyMapping.defaultValue
      : value;
  };
  const propertyNames = [
    ...new Set([...Object.keys(properties), ...propertyMappings.keys()])
  ].filter(name => name !== sourceIdentifier);
  const batches = convertFeatureAttributesToArrowBatches(
    selectedRows.map(row => ({
      featureId: (sourceIdentifier ? readProperty(sourceIdentifier, row) : row) as
        | string
        | number
        | bigint,
      metadataClass: options.metadataClass,
      properties: Object.fromEntries(propertyNames.map(name => [name, readProperty(name, row)]))
    })),
    mapping
  );
  return {
    batches,
    triangleFeatureIndices,
    featureIdField: options.featureIdField || 'feature_id',
    integer64Encoding: options.integer64Encoding
  };
}
