// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// PLY Loader
import {
  makeTableScanBatch,
  type Loader,
  type LoaderWithParser,
  type LoaderOptions
} from '@loaders.gl/loader-utils';
import {convertColorArrayToFloat16, convertColorArrayToFloat32} from '@loaders.gl/schema';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {
  deserializeArrowWorkerResult,
  serializeArrowWorkerResult
} from '@loaders.gl/arrow/transport';
import type {PLYHeader, PLYMesh} from './lib/ply-types';
import type {ParsePLYOptions} from './lib/parse-ply';
import {convertMeshToTable, convertTableToMesh, deduceMeshSchema} from '@loaders.gl/schema-utils';
import {parsePLY, parsePLYHeader, parsePLYToArrowTable} from './lib/parse-ply';
import {
  convertPLYElementTablesToMeshArrowTable,
  parsePLYToElementTables
} from './lib/parse-ply-arrow';
import {parsePLYInBatches} from './lib/parse-ply-in-batches';
import {PLYWorkerLoader as PLYWorkerLoaderMetadata} from './ply-loader';
import {PLYLoader as PLYLoaderMetadata} from './ply-loader';

const {preload: _PLYWorkerLoaderPreload, ...PLYWorkerLoaderMetadataWithoutPreload} =
  PLYWorkerLoaderMetadata;
const {preload: _PLYLoaderPreload, ...PLYLoaderMetadataWithoutPreload} = PLYLoaderMetadata;

export type PLYLoaderOptions = LoaderOptions & {
  ply?: ParsePLYOptions & {
    /** Output shape. Defaults to a Mesh Arrow table. */
    shape?: 'mesh' | 'arrow-table';
    /** Color storage format. Defaults to uint8norm for backwards compatibility. */
    colorFormat?: 'uint8norm' | 'float16' | 'float32';
    /** Treat PLY data as a point cloud by reading only the leading vertex element. */
    pointCloud?: boolean;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

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
 * Worker loader for PLY - Polygon File Format (aka Stanford Triangle Format)'
 * links: ['http://paulbourke.net/dataformats/ply/',
 * 'https://en.wikipedia.org/wiki/PLY_(file_format)']
 */
export const PLYWorkerLoaderWithParser = {
  ...PLYWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<PLYMesh | MeshArrowTable, never, LoaderOptions>;

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
  serializeWorkerBatch: serializeArrowWorkerResult,
  deserializeWorkerBatch: deserializeArrowWorkerResult
} as const satisfies LoaderWithParser<PLYMesh | MeshArrowTable, any, PLYLoaderOptions>;

/** Return requested public PLY shape from the parser's Arrow table. */
function convertPLYTable(
  table: MeshArrowTable,
  options?: PLYLoaderOptions,
  header?: PLYHeader
): PLYMesh | MeshArrowTable {
  const result =
    options?.ply?.shape === 'arrow-table'
      ? table
      : {
          ...(convertTableToMesh(table) as PLYMesh),
          loader: 'ply',
          loaderData: header || {comments: [], elements: []}
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
    ? convertMeshToTable(formattedMesh, 'arrow-table')
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
