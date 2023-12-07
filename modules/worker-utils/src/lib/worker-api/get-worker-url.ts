// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WorkerObject, WorkerOptions} from '../../types';
import {assert} from '../env-utils/assert';
import {isBrowser} from '../env-utils/globals';
import {VERSION, NPM_TAG} from '../env-utils/version';

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

  const workerFile = isBrowser ? `${worker.id}-worker.js` : `${worker.id}-worker-node.js`;

  let url = workerOptions.workerUrl;

  // HACK: Allow for non-nested workerUrl for the CompressionWorker.
  // For the compression worker, workerOptions is currently not nested correctly. For most loaders,
  // you'd have options within an object, i.e. `{mvt: {coordinates: ...}}` but the CompressionWorker
  // puts options at the top level, not within a `compression` key (its `id`). For this reason, the
  // above `workerOptions` will always be a string (i.e. `'gzip'`) for the CompressionWorker. To not
  // break backwards compatibility, we allow the CompressionWorker to have options at the top level.
  if (!url && worker.id === 'compression') {
    url = options.workerUrl;
  }

  // If URL is test, generate local loaders.gl url
  // @ts-ignore _workerType
  if (options._workerType === 'test') {
    if (isBrowser) {
      url = `modules/${worker.module}/dist/${workerFile}`;
    } else {
      // In the test environment the ts-node loader requires TypeScript code
      url = `modules/${worker.module}/src/workers/${worker.id}-worker-node.ts`;
    }
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
