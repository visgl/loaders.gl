// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// OBJLoader

export {OBJFormat} from './obj-format';
export type {OBJLoaderOptions} from './obj-loader';
export {OBJLoader} from './obj-loader';
export {OBJArrowLoader} from './obj-arrow-loader';
export type {OBJWriterOptions} from './obj-writer';
export {OBJWriter} from './obj-writer';

// MTLLoader

export {MTLFormat} from './mtl-format';
export type {MTLLoaderOptions} from './mtl-loader';
export {MTLLoader} from './mtl-loader';

// DEPRECATED EXPORTS
/** @deprecated Use OBJLoader. */
export {OBJWorkerLoader} from './obj-loader';
/** @deprecated Use MTLLoader. */
export {MTLWorkerLoader} from './mtl-loader';
