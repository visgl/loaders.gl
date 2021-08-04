import type {WorkerObject} from '../../types';
import {assert} from '../env-utils/assert';
import {VERSION} from '../env-utils/version';

/**
 * Check if worker is compatible with this library version
 * @param worker
 * @param libVersion
 * @returns `true` if the two versions are compatible
 */
export function validateWorkerVersion(
  worker: WorkerObject,
  coreVersion: string = VERSION
): boolean {
  assert(worker, 'no worker provided');

  const workerVersion = worker.version;
  if (!coreVersion || !workerVersion) {
    return false;
  }

  // TODO enable when fix the __version__ injection
  // const coreVersions = parseVersion(coreVersion);
  // const workerVersions = parseVersion(workerVersion);
  // assert(
  //   coreVersion.major === workerVersion.major && coreVersion.minor <= workerVersion.minor,
  //   `worker: ${worker.name} is not compatible. ${coreVersion.major}.${
  //     coreVersion.minor
  //   }+ is required.`
  // );

  return true;
}

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {major: parts[0], minor: parts[1]};
}
