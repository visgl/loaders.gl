// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CSVLoader as MetadataCSVLoader,
  CSVWorkerLoader as MetadataCSVWorkerLoader
} from './csv-loader-types';
import {
  CSVArrowLoader as MetadataCSVArrowLoader,
  CSVArrowWorkerLoader as MetadataCSVArrowWorkerLoader
} from './csv-arrow-loader-types';

export type {CSVLoaderOptions} from './csv-loader-types';
export type {CSVArrowLoaderOptions} from './csv-arrow-loader-types';

/** Metadata-only CSV loader that dynamically imports its parser implementation. */
export const CSVLoader = MetadataCSVLoader;

/** @deprecated Use CSVLoader. */
export const CSVWorkerLoader = MetadataCSVWorkerLoader;

/** Metadata-only CSV Arrow loader that dynamically imports its parser implementation. */
export const CSVArrowLoader = MetadataCSVArrowLoader;

/** @deprecated Use CSVArrowLoader. */
export const CSVArrowWorkerLoader = MetadataCSVArrowWorkerLoader;
