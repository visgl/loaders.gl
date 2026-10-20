// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFPostprocessed, GLTF_EXT_structural_metadata_ClassProperty} from '@loaders.gl/gltf';
import type {DataType, Field} from '@loaders.gl/core/schema';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {MeshSourceFeatureOptions} from './mesh-source-features.js';

/** Class and identifier selection for a mapping derived from an inline glTF schema. */
export type MeshSourceSchemaOptions = Omit<MeshSourceFeatureOptions, 'schema' | 'rawMetadataField'>;

/** Declared scalar storage widths; no property values participate in type selection. */
const SCALAR_TYPES: Readonly<Record<string, DataType>> = {
  INT8: 'int8',
  UINT8: 'uint8',
  INT16: 'int16',
  UINT16: 'uint16',
  INT32: 'int32',
  UINT32: 'uint32',
  INT64: 'int64',
  UINT64: 'uint64',
  FLOAT32: 'float32',
  FLOAT64: 'float64'
};

/**
 * Builds an explicit Arrow mapping from one inline structural-metadata class and property table.
 * Scalar widths, strings and optional/default/noData declarations are retained. The caller selects
 * the class and stable identifier property; otherwise identifiers are uint32 table row indices.
 * Arrays, enums, vectors, transformed numeric properties and external schemas fail explicitly.
 * This does not authorize destination type changes or loss of source class semantics.
 */
export function createMeshSourceFeatureOptions(
  gltf: GLTFPostprocessed,
  options: MeshSourceSchemaOptions
): MeshSourceFeatureOptions {
  const metadata = gltf.extensions?.EXT_structural_metadata;
  const table = metadata?.propertyTables?.[0];
  const properties = metadata?.schema?.classes?.[options.metadataClass]?.properties;
  if (
    !options.metadataClass ||
    metadata?.propertyTables?.length !== 1 ||
    table?.class !== options.metadataClass ||
    !properties ||
    !Number.isSafeInteger(table.count) ||
    table.count < 1 ||
    table.count > 0xffffffff ||
    metadata.propertyTextures?.length ||
    metadata.propertyAttributes?.length
  ) {
    throw new TileConversionError(
      'MESH_FEATURE_SCHEMA_REQUIRED',
      'Schema mapping requires one inline class, one matching property table and a positive uint32 row count'
    );
  }
  if (Object.keys(table.properties || {}).some(name => !Object.hasOwn(properties, name))) {
    throw new TileConversionError(
      'MESH_FEATURE_PROPERTY_UNMAPPED',
      'Property table columns must be declared in the selected class'
    );
  }
  const fields: Field[] = Object.entries(properties).map(([name, property]) => {
    const declaration = property as GLTF_EXT_structural_metadata_ClassProperty;
    const column = table.properties?.[name];
    if (
      declaration.array ||
      !['SCALAR', 'STRING'].includes(declaration.type) ||
      declaration.normalized ||
      declaration.offset !== undefined ||
      declaration.scale !== undefined ||
      column?.offset !== undefined ||
      column?.scale !== undefined ||
      (declaration.required &&
        (declaration.noData !== undefined || declaration.default !== undefined))
    ) {
      throw new TileConversionError(
        'MESH_FEATURE_PROPERTY_UNSUPPORTED',
        `Property ${name} requires an explicit separately qualified mapping`
      );
    }
    const type =
      declaration.type === 'STRING'
        ? 'utf8'
        : Object.hasOwn(SCALAR_TYPES, declaration.componentType || '')
          ? SCALAR_TYPES[declaration.componentType!]
          : undefined;
    if (!type) {
      throw new TileConversionError(
        'MESH_FEATURE_PROPERTY_UNSUPPORTED',
        `Property ${name} has no supported declared scalar width`
      );
    }
    return {
      name,
      type,
      nullable: declaration.required !== true,
      metadata: {'loaders.gl:structural-property': JSON.stringify(declaration)}
    };
  });
  const identifierName = options.featureIdField || 'feature_id';
  const sourceIdentifier = options.sourceFeatureIdProperty;
  const sourceField = sourceIdentifier
    ? fields.find(field => field.name === sourceIdentifier)
    : undefined;
  if (
    (sourceIdentifier && !sourceField) ||
    fields.some(field => field.name === identifierName && field !== sourceField) ||
    (sourceField &&
      !['utf8', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64'].includes(
        String(sourceField.type)
      ))
  ) {
    throw new TileConversionError(
      'MESH_FEATURE_ID_PROPERTY_REQUIRED',
      'Select a declared string/integer identifier and a distinct output identifier name'
    );
  }
  return {
    ...options,
    schema: {
      fields: [
        {
          ...sourceField,
          name: identifierName,
          type: sourceField?.type || 'uint32',
          nullable: false
        },
        ...fields.filter(field => field !== sourceField)
      ],
      metadata: {'loaders.gl:source-schema': JSON.stringify(metadata.schema)}
    }
  };
}
