// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';

/** Explicit source-name mapping and authorized semantic losses. */
export interface PointCloudAttributeMapping {
  /** Destination attribute name to source attribute name. Values and normalization remain unchanged. */
  readonly attributes: Readonly<Record<string, string>>;
  /** Source attributes intentionally omitted, each with a nonempty reason. */
  readonly drop?: Readonly<Record<string, string>>;
}

/** Decoded mapped rows and a record of every authorized omission. */
export interface MappedPointCloud {
  /** Mesh with renamed attributes sharing immutable source values. */
  readonly mesh: Mesh;
  /** Explicit source-name/reason pairs, sorted deterministically. */
  readonly droppedAttributes: Readonly<Record<string, string>>;
}

/** Maps decoded point attributes without implicit aliases, casts, projection or silent omissions. */
export function mapPointCloudAttributes(
  input: Mesh | MeshArrowTable,
  mapping: PointCloudAttributeMapping
): MappedPointCloud {
  const mesh = getPointCloudMesh(input);
  const attributes: Mesh['attributes'] = Object.create(null);
  const selected = new Set<string>();
  for (const [target, source] of Object.entries(mapping.attributes)) {
    if (
      !target ||
      ['__proto__', 'constructor', 'prototype'].includes(target) ||
      !Object.hasOwn(mesh.attributes, source)
    )
      throw new TileConversionError(
        'POINT_CLOUD_MAPPING_INVALID',
        `Invalid point attribute mapping ${target}: ${source}`
      );
    if (Object.hasOwn(mapping.drop || {}, source))
      throw new TileConversionError(
        'POINT_CLOUD_MAPPING_INVALID',
        `Point attribute ${source} is both selected and dropped`
      );
    attributes[target] = {...mesh.attributes[source]};
    selected.add(source);
  }
  const droppedAttributes: Record<string, string> = Object.create(null);
  for (const [source, reason] of Object.entries(mapping.drop || {}).sort(([left], [right]) =>
    left.localeCompare(right)
  )) {
    if (!Object.hasOwn(mesh.attributes, source) || typeof reason !== 'string' || !reason.trim())
      throw new TileConversionError(
        'POINT_CLOUD_MAPPING_INVALID',
        `Invalid loss declaration for ${source}`
      );
    droppedAttributes[source] = reason;
  }
  const unmapped = Object.keys(mesh.attributes).filter(
    name => !selected.has(name) && !Object.hasOwn(droppedAttributes, name)
  );
  if (unmapped.length || !attributes.POSITION)
    throw new TileConversionError(
      'POINT_CLOUD_MAPPING_REQUIRED',
      `Map POSITION and explicitly retain or drop every attribute: ${unmapped.join(', ')}`
    );
  return {
    mesh: {...mesh, attributes, schema: {fields: [], metadata: {...mesh.schema?.metadata}}},
    droppedAttributes
  };
}

/** Converts decoded point input after optional retained-buffer accounting and null validation. */
export function getPointCloudMesh(input: Mesh | MeshArrowTable, maxInputBytes = Infinity): Mesh {
  const buffers = new Set<ArrayBufferLike>();
  let bytes = 0;
  /** Counts distinct retained buffers rather than narrow views. */
  const countBuffer = (buffer: ArrayBufferLike): void => {
    if (!buffers.has(buffer)) {
      buffers.add(buffer);
      bytes += buffer.byteLength;
    }
    if (bytes > maxInputBytes)
      throw new TileConversionError('POINT_CLOUD_INPUT_BUDGET', 'Point input byte budget exceeded');
  };
  if ('shape' in input) {
    /** Validates nullable nested Arrow columns before conversion. */
    type ArrowColumn = MeshArrowTable['data']['batches'][number]['data']['children'][number];
    const checkColumn = (column: ArrowColumn): void => {
      if (column.nullCount)
        throw new TileConversionError(
          'POINT_CLOUD_NULL_UNSUPPORTED',
          'Null point values require an explicit preprocessing step'
        );
      for (const buffer of Object.values(column.buffers)) if (buffer) countBuffer(buffer.buffer);
      for (const view of column.variadicBuffers) countBuffer(view.buffer);
      for (const child of column.children) checkColumn(child);
      for (const dictionary of column.dictionary?.data || []) checkColumn(dictionary);
    };
    for (const batch of input.data.batches) checkColumn(batch.data);
  } else
    for (const attribute of Object.values(input.attributes)) countBuffer(attribute.value.buffer);
  const mesh = 'shape' in input ? convertTableToMesh(input) : input;
  if (mesh.topology !== 'point-list' || mesh.indices)
    throw new TileConversionError(
      'POINT_CLOUD_INPUT_INVALID',
      'Decoded unindexed point-list input is required'
    );
  return mesh;
}
