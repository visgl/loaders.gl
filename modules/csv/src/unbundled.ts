// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {CSVLoaderOptions} from './csv-loader';

/** Metadata-only CSV loader that dynamically imports its parser implementation. */
export {CSVLoader} from './csv-loader';

/** @deprecated Use CSVLoader. */
export {CSVLoader as CSVWorkerLoader} from './csv-loader';
