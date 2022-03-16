import {WorkerFarm} from '@loaders.gl/worker-utils';
import {Writer, WriterOptions} from '../../types';
import {isBrowser} from '../env-utils/globals';

/**
 * Determines if a loader can parse with worker
 * @param loader
 * @param options
 */
export function canEncodeWithWorker(writer: Writer, options?: WriterOptions) {
  if (!WorkerFarm.isSupported()) {
    return false;
  }

  // Node workers are still experimental
  if (!isBrowser && !options?._nodeWorkers) {
    return false;
  }

  return writer.worker && options?.worker;
}
