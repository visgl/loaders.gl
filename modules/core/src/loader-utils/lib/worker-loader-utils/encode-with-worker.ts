// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {canProcessOnWorker} from '@loaders.gl/core/worker-utils';
import {Writer, WriterOptions} from '../../writer-types';
import {isBrowser} from '../env-utils/globals';

/**
 * Determines if a loader can parse with worker
 * @param loader
 * @param options
 */
export function canEncodeWithWorker(writer: Writer, options?: WriterOptions) {
  const nodeWorkers = options?._nodeWorkers ?? options?.core?._nodeWorkers;
  const useWorkers = options?.worker ?? options?.core?.worker;

  // Node workers are still experimental
  if (!isBrowser && !nodeWorkers) {
    return false;
  }

  return canProcessOnWorker(
    {...writer, options: writer.options || {}},
    {worker: Boolean(useWorkers), _nodeWorkers: Boolean(nodeWorkers)}
  );
}
