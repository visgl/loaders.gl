// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {Table} from 'apache-arrow';
import {
  serializeNativeArrowWorkerResult,
  deserializeNativeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';
import type {MVTLoaderOptions} from '../mvt-loader';

/** Transfers native vector tile columns while preserving other parser outputs. */
export function serializeMVTWorkerResult(result: unknown, options?: MVTLoaderOptions): unknown {
  return result instanceof Table
    ? serializeNativeArrowWorkerResult(result, {
        copy: options?.core?.workerTransferBufferCopy ?? 'all'
      })
    : result;
}

/** Restores a native Arrow tile on the caller. */
export function deserializeMVTWorkerResult(result: unknown): unknown {
  return (result as {transport?: string} | null)?.transport === 'arrow-table-columns'
    ? deserializeNativeArrowWorkerResult(result)
    : result;
}
