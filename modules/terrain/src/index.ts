// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {TerrainLoaderOptions} from './terrain-loader';
export type {QuantizedMeshLoaderOptions} from './quantized-mesh-loader';

export {TerrainFormat, QuantizedMeshFormat} from './terrain-format';
export {TerrainLoader} from './terrain-loader';

export {parseTerrain} from './terrain-loader-with-parser';
export {TerrainArrowLoader} from './terrain-arrow-loader';
export {QuantizedMeshLoader} from './quantized-mesh-loader';
export {QuantizedMeshArrowLoader} from './quantized-mesh-arrow-loader';

export type {QuantizedMeshWriterOptions} from './quantized-mesh-writer';
export {QuantizedMeshWriter} from './quantized-mesh-writer';

// DEPRECATED EXPORTS
/** @deprecated Use TerrainLoader. */
export {TerrainLoader as TerrainWorkerLoader} from './terrain-loader';
/** @deprecated Use QuantizedMeshLoader. */
export {QuantizedMeshLoader as QuantizedMeshWorkerLoader} from './quantized-mesh-loader';
