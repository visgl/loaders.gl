import type {WorkerObject, WorkerOptions} from '../../types';
import {assert} from '../env-utils/assert';
import {VERSION as __VERSION__} from '../env-utils/version';

const NPM_TAG = 'beta'; // Change to 'latest' on release-branch
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : NPM_TAG;

/**
 * Gets worker object's name (for debugging in Chrome thread inspector window)
 */
export function getWorkerName(worker: WorkerObject): string {
  const warning = worker.version !== VERSION ? ` (worker-utils@${VERSION})` : '';
  return `${worker.name}@${worker.version}${warning}`;
}

/**
 * Generate a worker URL based on worker object and options
 * @returns A URL to one of the following:
 * - a published worker on unpkg CDN
 * - a local test worker
 * - a URL provided by the user in options
 */
export function getWorkerURL(worker: WorkerObject, options: WorkerOptions = {}): string {
  const workerOptions = options[worker.id] || {};

  const workerFile = `${worker.id}-worker.js`;

  let url = workerOptions.workerUrl;

  // If URL is test, generate local loaders.gl url
  // @ts-ignore _workerType
  if (options._workerType === 'test') {
    url = `modules/${worker.module}/dist/${workerFile}`;
  }

  // If url override is not provided, generate a URL to published version on npm CDN unpkg.com
  if (!url) {
    // GENERATE
    let version = worker.version;
    // On master we need to load npm alpha releases published with the `beta` tag
    if (version === 'latest') {
      // throw new Error('latest worker version specified');
      version = NPM_TAG;
    }
    const versionTag = version ? `@${version}` : '';
    url = `https://unpkg.com/@loaders.gl/${worker.module}${versionTag}/dist/${workerFile}`;
  }

  assert(url);

  // Allow user to override location
  return url;
}
