// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  deserializeArrowWorkerResult,
  serializeArrowWorkerResult
} from '@loaders.gl/arrow/transport';
import {ExcelLoader as ExcelLoaderMetadata} from './excel-loader-types';

export {ExcelFormat} from './excel-format';
export type {ExcelLoaderOptions} from './excel-loader-types';

/** Compatibility metadata loader retaining the original Arrow transport hooks. */
export const ExcelLoader = {
  ...ExcelLoaderMetadata,
  /** Serializes Arrow output for worker messages. */
  serializeWorkerResult: serializeArrowWorkerResult,
  /** Hydrates Arrow output returned by a worker. */
  deserializeWorkerResult: deserializeArrowWorkerResult
} as const;

/** @deprecated Use ExcelLoader. */
export const ExcelWorkerLoader = ExcelLoader;
