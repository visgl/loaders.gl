// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RecordBatch, Table} from 'apache-arrow';
import {convertColorArrayToFloat16, convertColorArrayToFloat32} from '@loaders.gl/core/schema';
import {
  convertMeshToArrowTable,
  convertTableToMesh,
  deduceMeshSchema,
  isNativeArrowTable,
  makeArrowMetadataBatch,
  refineArrowTableBatches
} from '@loaders.gl/core/schema-utils';
import type {PLYLoaderOptions} from '../ply-loader-types';
import type {PLYHeader, PLYMesh} from './ply-types';
import {PLY_HEADER_KEY} from './get-ply-schema';
import {parsePLY, parsePLYHeader, parsePLYToArrowTable} from './parse-ply';
import {convertPLYElementTablesToMeshArrowTable, parsePLYToElementTables} from './parse-ply-arrow';
import {parsePLYInBatches} from './parse-ply-in-batches';

/** Decodes a PLY file to native Arrow, preserving its complete header. */
export function parsePLYTable(data: ArrayBuffer | string, options?: PLYLoaderOptions): Table {
  if (options?.ply?._useLegacyParser) {
    const mesh = parsePLY(data, options.ply);
    return attachPLYHeader(
      formatPLYTableColors(convertMeshToArrowTable(mesh), options),
      mesh.loaderData
    );
  }
  const table = parsePLYToArrowTable(data, options?.ply);
  if (table) {
    return attachPLYHeader(
      formatPLYTableColors(table, options),
      parsePLYHeader(data, options?.ply)
    );
  }
  const elements = parsePLYToElementTables(data, options?.ply);
  return attachPLYHeader(
    formatPLYTableColors(convertPLYElementTablesToMeshArrowTable(elements), options),
    elements.header
  );
}

/** Converts parsed Arrow columns to the requested normalized color storage. */
function formatPLYTableColors(table: Table, options?: PLYLoaderOptions): Table {
  const colorFormat = options?.ply?.colorFormat || 'uint8norm';
  if (colorFormat === 'uint8norm' || !table.getChild('COLOR_0')) return table;
  return convertMeshToArrowTable(
    formatPLYMeshColors(convertTableToMesh(table) as PLYMesh, colorFormat)
  );
}

/** Stores the PLY header in table and batch schema metadata. */
function attachPLYHeader(table: Table, header: PLYHeader): Table {
  const encoded = JSON.stringify(header);
  table.schema.metadata.set(PLY_HEADER_KEY, encoded);
  for (const batch of table.batches) batch.schema.metadata.set(PLY_HEADER_KEY, encoded);
  return table;
}

/** Reconstructs the legacy PLY mesh, including its original header. */
export function convertPLYTableToMesh(table: Table): PLYMesh {
  const header = table.schema.metadata.get(PLY_HEADER_KEY);
  return {
    ...(convertTableToMesh(table) as PLYMesh),
    loader: 'ply',
    loaderData: header ? JSON.parse(header) : {comments: [], elements: []}
  };
}

/** Emits native Arrow batches with cumulative schema metadata and batch-local bounds. */
export async function* parsePLYNativeBatches(
  input:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: PLYLoaderOptions
): AsyncIterable<RecordBatch> {
  const parserOptions = {
    ...options?.ply,
    batchSize: options?.core?.batchSize
  };
  async function* readTables() {
    for await (const value of parsePLYInBatches(input, parserOptions)) {
      yield isNativeArrowTable(value)
        ? formatPLYTableColors(value, options)
        : attachPLYHeader(
            formatPLYTableColors(convertMeshToArrowTable(value), options),
            value.loaderData
          );
    }
  }
  for await (const table of refineArrowTableBatches(readTables())) {
    if (table.batches.length) yield* table.batches;
    else yield makeArrowMetadataBatch(table.schema);
  }
}

/** Apply the requested normalized color representation to a decoded PLY mesh. */
function formatPLYMeshColors(
  mesh: PLYMesh,
  colorFormat: 'uint8norm' | 'float16' | 'float32'
): PLYMesh {
  const colorAttribute = mesh.attributes.COLOR_0;
  if (!colorAttribute) {
    return mesh;
  }

  const sourceScale = colorAttribute.value instanceof Uint16Array ? 65535 : 255;
  const value =
    colorFormat === 'float16'
      ? convertColorArrayToFloat16(colorAttribute.value, sourceScale)
      : convertColorArrayToFloat32(colorAttribute.value, sourceScale);
  const attributes = {...mesh.attributes};
  for (const [attributeName, attribute] of Object.entries(attributes)) {
    if (attribute.value === colorAttribute.value) {
      attributes[attributeName] = {
        ...attribute,
        value,
        normalized: false,
        ...(colorFormat === 'float16' ? {componentType: 'float16' as const} : {})
      };
    }
  }
  return {
    ...mesh,
    attributes,
    schema: deduceMeshSchema(attributes, mesh.schema.metadata)
  };
}
