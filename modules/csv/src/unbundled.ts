// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {CSVLoaderOptions} from './csv-loader';
export type {CSVArrowLoaderOptions} from './csv-arrow-loader';

/** Metadata-only CSV loader that dynamically imports its parser implementation. */
export {CSVLoader} from './csv-loader';

/** @deprecated Use CSVLoader. */
export {CSVLoader as CSVWorkerLoader} from './csv-loader';

/** Metadata-only CSV Arrow loader that dynamically imports its parser implementation. */
export {CSVArrowLoader} from './csv-arrow-loader';

/** @deprecated Use CSVArrowLoader. */
export {CSVArrowLoader as CSVArrowWorkerLoader} from './csv-arrow-loader';
