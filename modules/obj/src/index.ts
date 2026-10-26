// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// OBJLoader

export {OBJFormat} from './obj-format';
export type {OBJLoaderOptions, OBJParsedBatch, OBJMeshBatch} from './obj-loader-types';
export {OBJLoader} from './obj-loader-types';
export type {OBJWriterOptions} from './obj-writer';
export {OBJWriter} from './obj-writer';

// MTLLoader

export {MTLFormat} from './mtl-format';
export type {MTLLoaderOptions} from './mtl-loader';
export {MTLLoader} from './mtl-loader';

// DEPRECATED EXPORTS
/** @deprecated Use OBJLoader. */
export {OBJWorkerLoader} from './obj-loader-types';
/** @deprecated Use MTLLoader. */
export {MTLWorkerLoader} from './mtl-loader';
