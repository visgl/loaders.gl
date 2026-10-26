// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PLYLoaderOptions} from './ply-loader-types';

// PLY Loader
import {makeTableScanBatch, type LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {convertColorArrayToFloat16, convertColorArrayToFloat32} from '@loaders.gl/core/schema';
import type {MeshArrowTable, ArrowTableBatch} from '@loaders.gl/core/schema';
import {
  deserializeArrowIPCWorkerResult,
  serializeArrowIPCWorkerResult
} from '@loaders.gl/core/schema-utils/arrow-transport';
import type {PLYHeader, PLYMesh} from './lib/ply-types';
import {
  convertMeshToTable,
  convertTableToMesh,
  deduceMeshSchema
} from '@loaders.gl/core/schema-utils';
import {parsePLY, parsePLYHeader, parsePLYToArrowTable} from './lib/parse-ply';
import {
  convertPLYElementTablesToMeshArrowTable,
  parsePLYToElementTables
} from './lib/parse-ply-arrow';
import {parsePLYInBatches} from './lib/parse-ply-in-batches';
import {PLYLoader as PLYLoaderMetadata} from './ply-loader-types';

const {preload: _PLYLoaderPreload, ...PLYLoaderMetadataWithoutPreload} = PLYLoaderMetadata;

function convertPLYMesh(mesh: PLYMesh, options?: PLYLoaderOptions): PLYMesh | MeshArrowTable {
  const table = convertMeshToTable(mesh, 'arrow-table');
  return convertPLYTable(table, options, mesh.loaderData);
}

/** Parse PLY data using a direct Arrow path when requested and supported. */
function parsePLYData(
  data: ArrayBuffer | string,
  options?: PLYLoaderOptions
): PLYMesh | MeshArrowTable {
  if (options?.ply?._useLegacyParser) {
    return convertPLYMesh(parsePLY(data, options?.ply), options);
  }

  const arrowTable = parsePLYToArrowTable(data, options?.ply);
  if (arrowTable) {
    return convertPLYTable(arrowTable, options, parsePLYHeader(data, options?.ply));
  }

  const elementTables = parsePLYToElementTables(data, options?.ply);
  return convertPLYTable(
    convertPLYElementTablesToMeshArrowTable(elementTables),
    options,
    elementTables.header
  );
}

/**
 * Loader for PLY - Polygon File Format
 */
export const PLYLoaderWithParser = {
  ...PLYLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) => parsePLYData(arrayBuffer, options),
  parseTextSync: (arrayBuffer, options) => parsePLYData(arrayBuffer, options),
  parseSync: (arrayBuffer, options) => parsePLYData(arrayBuffer, options),
  parseInBatches: async function* (
    arrayBuffer:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options
  ) {
    const plyOptions = {
      ...options?.ply,
      batchSize: options?.batchSize ?? options?.core?.batchSize
    };
    for await (const meshOrTable of parsePLYInBatches(arrayBuffer, plyOptions)) {
      const convertedData = isMeshArrowTable(meshOrTable)
        ? convertPLYTable(meshOrTable, options)
        : convertPLYMesh(meshOrTable, options);
      yield isMeshArrowTable(convertedData) ? makeTableScanBatch(convertedData) : convertedData;
    }
  },
  serializeWorkerResult: serializeArrowIPCWorkerResult,
  deserializeWorkerResult: deserializePLYWorkerResult,
  serializeWorkerBatch: serializeArrowIPCWorkerResult,
  deserializeWorkerBatch: deserializePLYWorkerBatch
} as const satisfies LoaderWithParser<
  PLYMesh | MeshArrowTable,
  PLYMesh | ArrowTableBatch,
  PLYLoaderOptions
>;

/** Return requested public PLY shape from the parser's Arrow table. */
function convertPLYTable(
  table: MeshArrowTable & {
    /** Original source header retained by the streaming parser. */
    loaderData?: PLYHeader;
  },
  options?: PLYLoaderOptions,
  header?: PLYHeader
): PLYMesh | MeshArrowTable {
  const loaderData = header || table.loaderData || {comments: [], elements: []};
  const result =
    options?.ply?.shape === 'arrow-table'
      ? {...table, loader: 'ply' as const, loaderData}
      : {
          ...(convertTableToMesh(table) as PLYMesh),
          loader: 'ply',
          loaderData
        };
  const colorFormat = options?.ply?.colorFormat || 'uint8norm';
  if (colorFormat === 'uint8norm') {
    return result as PLYMesh | MeshArrowTable;
  }

  const resultData = result as PLYMesh | MeshArrowTable;
  const formattedMesh = formatPLYMeshColors(
    (isMeshArrowTable(resultData) ? convertTableToMesh(resultData) : resultData) as PLYMesh,
    colorFormat
  );
  return options?.ply?.shape === 'arrow-table'
    ? {
        ...convertMeshToTable(formattedMesh, 'arrow-table'),
        loader: 'ply' as const,
        loaderData
      }
    : (formattedMesh as PLYMesh);
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

/** Return true if a parsed PLY batch is already a Mesh Arrow table. */
function isMeshArrowTable(data: PLYMesh | MeshArrowTable): data is MeshArrowTable {
  return 'shape' in data && data.shape === 'arrow-table';
}

/** Hydrates worker columns and applies the requested PLY shape on the caller. */
function deserializePLYWorkerResult(
  result: unknown,
  options?: PLYLoaderOptions
): PLYMesh | MeshArrowTable {
  const table = deserializeArrowIPCWorkerResult(result);
  if (table?.shape !== 'arrow-table') return table;
  return options?.ply?.shape === 'mesh'
    ? {...convertTableToMesh(table), loader: 'ply', loaderData: table.loaderData}
    : table;
}

/** Converts mesh batches only after the Arrow IPC payload reaches the caller. */
function deserializePLYWorkerBatch(
  result: unknown,
  options?: PLYLoaderOptions
): PLYMesh | ArrowTableBatch {
  return deserializePLYWorkerResult(result, options) as PLYMesh | ArrowTableBatch;
}
