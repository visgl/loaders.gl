// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {CSVLoaderOptions} from './csv-loader';
export {CSVFormat} from './csv-format';
export {CSVLoader} from './csv-loader';

export type {CSVWriterOptions} from './csv-writer';
export {CSVWriter} from './csv-writer';

export type {CSVArrowLoaderOptions} from './csv-arrow-loader';
export {CSVArrowLoader} from './csv-arrow-loader';

export type {CSVArrowWriterOptions} from './csv-arrow-writer';
export {CSVArrowWriter} from './csv-arrow-writer';

// DEPRECATED EXPORTS
/** @deprecated Use CSVLoader. */
export {CSVLoader as CSVWorkerLoader} from './csv-loader';
/** @deprecated Use CSVArrowLoader. */
export {CSVArrowLoader as CSVArrowWorkerLoader} from './csv-arrow-loader';
