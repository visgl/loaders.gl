// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {I3SAttributeLoader} from '@loaders.gl/i3s';
import type {AttributeStorageInfo, I3STileContent, I3SMeshFeatures} from '@loaders.gl/i3s';
import type {TilesetContentTraversalItem, TilesetSourceMetadata} from '@loaders.gl/tiles';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import {convertFeatureAttributesToArrowBatches} from './feature-arrow.js';
import type {MeshSourceFeatureOptions} from './mesh-source-features.js';
import type {MeshTilesetSourceOptions} from './mesh-source.js';

/** Explicit mapping of scalar I3S attribute resources and their geometry identifiers. */
export interface I3SMeshSourceFeatureOptions extends MeshSourceFeatureOptions {
  /** Attribute column whose exact integer values identify the decoded geometry. */
  readonly objectIdProperty: string;
  /** Aggregate encoded attribute byte limit for each node, checked before parsing. */
  readonly maxAttributeBytes: number;
}

/** Reads exact scalar/string columns and constructs complete triangle-to-Arrow-row ownership. */
export async function extractI3SMeshFeatures(
  content: I3STileContent,
  item: TilesetContentTraversalItem,
  metadata: TilesetSourceMetadata,
  options: I3SMeshSourceFeatureOptions,
  readExternalResource: MeshTilesetSourceOptions['readExternalResource'],
  contentUri: string | undefined,
  signal?: AbortSignal
): Promise<I3SMeshFeatures> {
  const maximumAttributeBytes = options.maxAttributeBytes;
  const storage = metadata.tileset.attributeStorageInfo as AttributeStorageInfo[] | undefined;
  const attributeUrls = item.tile.header.attributeUrls as string[] | undefined;
  if (
    !options.metadataClass ||
    !options.objectIdProperty ||
    options.rawMetadataField ||
    !Number.isSafeInteger(maximumAttributeBytes) ||
    maximumAttributeBytes <= 0 ||
    !storage?.length ||
    attributeUrls?.length !== storage.length ||
    !readExternalResource ||
    new Set(storage.map(attribute => attribute.name)).size !== storage.length ||
    new Set(storage.map(attribute => attribute.key)).size !== storage.length ||
    !storage.some(attribute => attribute.name === options.objectIdProperty) ||
    (metadata.tileset.fields || []).some(
      (field: {name: string; domain?: unknown; type?: string}) =>
        field.domain ||
        field.type === 'esriFieldTypeDate' ||
        !storage.some(attribute => attribute.name === field.name)
    )
  ) {
    throw new TileConversionError(
      'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED',
      'I3S attributes require an explicit scalar schema, object ID column, byte budget and resource reader; domains/dates/raw metadata need a custom mapper'
    );
  }
  const attributeLoader = await I3SAttributeLoader.preload();
  const columns: Record<string, ArrayLike<unknown>> = Object.create(null);
  let inputBytes = 0;
  let count: number | undefined;
  for (const [index, attribute] of storage.entries()) {
    signal?.throwIfAborted();
    const values = attribute.objectIds ?? attribute.attributeValues;
    const type = values?.valueType;
    const expectedOrdering = attribute.objectIds
      ? ['objectIds']
      : type === 'String'
        ? ['attributeByteCounts', 'attributeValues']
        : ['attributeValues'];
    const expectedHeader =
      type === 'String'
        ? [
            {property: 'count', valueType: 'UInt32'},
            {property: 'attributeValuesByteCount', valueType: 'UInt32'}
          ]
        : [{property: 'count', valueType: 'UInt32'}];
    if (
      !type ||
      values?.valuesPerElement !== 1 ||
      (attribute.objectIds && attribute.attributeValues) ||
      attribute.header?.length !== expectedHeader.length ||
      expectedHeader.some(
        (value, headerIndex) =>
          attribute.header[headerIndex]?.property !== value.property ||
          attribute.header[headerIndex]?.valueType !== value.valueType
      ) ||
      (attribute.ordering &&
        JSON.stringify(
          attribute.ordering.map(value => (value === 'ObjectIds' ? 'objectIds' : value))
        ) !== JSON.stringify(expectedOrdering)) ||
      (type === 'String' &&
        (values.encoding !== 'UTF-8' ||
          attribute.attributeByteCounts?.valueType !== 'UInt32' ||
          attribute.attributeByteCounts.valuesPerElement !== 1)) ||
      !attributeUrls[index]
    ) {
      throw new TileConversionError(
        'I3S_MESH_SOURCE_ATTRIBUTE_UNSUPPORTED',
        `Attribute ${attribute.name} requires a standard scalar/string resource layout`
      );
    }
    const bytes = await readExternalResource(attributeUrls[index], contentUri, signal);
    signal?.throwIfAborted();
    inputBytes += bytes instanceof Uint8Array ? bytes.byteLength : Infinity;
    if (!(bytes instanceof Uint8Array) || inputBytes > maximumAttributeBytes) {
      throw new TileConversionError(
        'INPUT_RESOURCE_TOO_LARGE',
        'I3S node attributes exceed maxAttributeBytes'
      );
    }
    // Copy only this view: archive-backed readers may return a subview of a larger buffer.
    let parsed;
    try {
      parsed = await attributeLoader.parse(bytes.slice().buffer, {
        attributeName: attribute.name,
        attributeType: type,
        i3s: {attributeValues: 'exact'}
      });
    } catch (error) {
      throw new TileConversionError(
        'I3S_MESH_SOURCE_ATTRIBUTE_INVALID',
        `Invalid attribute ${attribute.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    const column = parsed[attribute.name];
    if (!column || (count !== undefined && column.length !== count) || !column.length) {
      throw new TileConversionError(
        'I3S_MESH_SOURCE_ATTRIBUTE_COUNT_INVALID',
        'Every attribute must have the same nonzero row count'
      );
    }
    if (
      Array.from(column as ArrayLike<unknown>).some(
        value => typeof value === 'number' && !Number.isFinite(value)
      )
    ) {
      throw new TileConversionError(
        'I3S_MESH_SOURCE_ATTRIBUTE_UNSUPPORTED',
        'Numeric noData values require an explicit custom mapper'
      );
    }
    count = column.length;
    columns[attribute.name] = column;
  }
  const identifiers = columns[options.objectIdProperty];
  const attributeRows = new Map<bigint, number>();
  for (let index = 0; index < count!; index++) {
    const identifier = identifiers[index];
    if (
      !(
        typeof identifier === 'bigint' ||
        (typeof identifier === 'number' && Number.isSafeInteger(identifier))
      ) ||
      attributeRows.has(BigInt(identifier as number | bigint))
    ) {
      throw new TileConversionError(
        'I3S_MESH_SOURCE_FEATURE_ID_UNSUPPORTED',
        'Object IDs must be unique exact integers'
      );
    }
    attributeRows.set(BigInt(identifier), index);
  }
  const vertexCount = content.vertexCount;
  const geometryIdentifiers = content.featureIds;
  const attribute = content.sourceAttributes?.id;
  if (
    geometryIdentifiers.length !== vertexCount ||
    attribute?.size !== 1 ||
    attribute.normalized ||
    attribute.value.length !== vertexCount ||
    Array.from(geometryIdentifiers).some((value, index) => value !== attribute.value[index])
  ) {
    throw new TileConversionError(
      'I3S_MESH_SOURCE_FEATURE_ID_UNSUPPORTED',
      'Geometry requires one exact unnormalized object ID per vertex'
    );
  }
  const indices = content.indices;
  const triangleFeatureIndices = new Uint32Array((indices?.length ?? vertexCount) / 3);
  if (content.drawRanges?.length) {
    const covered = new Uint8Array(triangleFeatureIndices.length);
    for (const range of content.drawRanges) {
      if (
        !Number.isSafeInteger(range.firstPrimitive) ||
        range.firstPrimitive < 0 ||
        !Number.isSafeInteger(range.primitiveCount) ||
        range.primitiveCount <= 0 ||
        range.firstPrimitive + range.primitiveCount > covered.length
      ) {
        throw new TileConversionError(
          'I3S_MESH_SOURCE_FEATURE_ASSOCIATION_INVALID',
          'Feature draw ranges must cover valid triangles'
        );
      }
      for (
        let triangle = range.firstPrimitive;
        triangle < range.firstPrimitive + range.primitiveCount;
        triangle++
      ) {
        const vertex = indices?.[triangle * 3] ?? triangle * 3;
        if (covered[triangle] || geometryIdentifiers[vertex] !== range.featureId) {
          throw new TileConversionError(
            'I3S_MESH_SOURCE_FEATURE_ASSOCIATION_INVALID',
            'Feature draw ranges must agree with decoded ownership without overlapping'
          );
        }
        covered[triangle] = 1;
      }
    }
    if (covered.some(value => value === 0)) {
      throw new TileConversionError(
        'I3S_MESH_SOURCE_FEATURE_ASSOCIATION_INVALID',
        'Feature draw ranges must cover every triangle'
      );
    }
  }
  const usedRows = new Set<number>();
  for (let triangle = 0; triangle < triangleFeatureIndices.length; triangle++) {
    const corners = [0, 1, 2].map(
      corner => indices?.[triangle * 3 + corner] ?? triangle * 3 + corner
    );
    const featureIds = corners.map(corner => geometryIdentifiers[corner]);
    const row = attributeRows.get(BigInt(featureIds[0]));
    if (row === undefined || featureIds.some(identifier => identifier !== featureIds[0])) {
      throw new TileConversionError(
        'I3S_MESH_SOURCE_FEATURE_ASSOCIATION_INVALID',
        'Each triangle must reference one declared attribute row'
      );
    }
    triangleFeatureIndices[triangle] = row;
    usedRows.add(row);
  }
  if (usedRows.size !== count) {
    throw new TileConversionError(
      'I3S_MESH_SOURCE_FEATURE_ASSOCIATION_INVALID',
      'Attribute rows without geometry require a separately qualified mapping'
    );
  }
  const stableProperty = options.sourceFeatureIdProperty ?? options.objectIdProperty;
  if (!Object.hasOwn(columns, stableProperty)) {
    throw new TileConversionError(
      'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED',
      'Stable identifier column is missing'
    );
  }
  const batches = convertFeatureAttributesToArrowBatches(
    Array.from({length: count!}, (_, index) => ({
      featureId: columns[stableProperty][index] as string | number | bigint,
      metadataClass: options.metadataClass,
      properties: Object.fromEntries(
        Object.entries(columns)
          .filter(([name]) => name !== options.objectIdProperty && name !== stableProperty)
          .map(([name, values]) => [name, values[index]])
      )
    })),
    options
  );
  const stableIds = new Set<string | number | bigint>();
  for (const batch of batches) {
    const column = batch.data.getChild(options.featureIdField || 'feature_id')!;
    for (let index = 0; index < column.length; index++) {
      const identifier = column.get(index);
      if (stableIds.has(identifier)) {
        throw new TileConversionError(
          'I3S_MESH_SOURCE_FEATURE_ID_UNSUPPORTED',
          'Stable IDs must be unique'
        );
      }
      stableIds.add(identifier);
    }
  }
  return {
    batches,
    triangleFeatureIndices,
    featureIdField: options.featureIdField || 'feature_id',
    integer64Encoding: options.integer64Encoding
  };
}
