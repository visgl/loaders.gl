// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {CSVLoaderOptions} from './csv-loader-with-parser';
export type {CSVArrowLoaderOptions} from './csv-arrow-loader-with-parser';

export {CSVLoaderWithParser as CSVLoader} from './csv-loader-with-parser';
export {CSVArrowLoaderWithParser as CSVArrowLoader} from './csv-arrow-loader-with-parser';

/** @deprecated Use CSVLoader. */
export {CSVLoaderWithParser as CSVWorkerLoader} from './csv-loader-with-parser';

/** @deprecated Use CSVArrowLoader. */
export {CSVArrowLoaderWithParser as CSVArrowWorkerLoader} from './csv-arrow-loader-with-parser';
