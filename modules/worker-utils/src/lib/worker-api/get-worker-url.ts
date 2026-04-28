// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WorkerObject, WorkerOptions, WorkerType} from '../../types';
import {assert} from '../env-utils/assert';
import {isBrowser} from '../env-utils/globals';
import {VERSION} from '../env-utils/version';
import {NPM_TAG} from '../npm-tag';

/**
 * Gets worker object's name (for debugging in Chrome thread inspector window)
 */
export function getWorkerName(worker: WorkerObject): string {
  const warning = worker.version !== VERSION ? ` (worker-utils@${VERSION})` : '';
  return `${worker.name}@${worker.version}${warning}`;
}

/**
 * Gets worker object's pool name.
 * Combined module workers should share a pool across loaders in the same module.
 */
export function getWorkerPoolName(worker: WorkerObject, options: WorkerOptions = {}): string {
  const workerOptions = options[worker.id] || {};
  const customUrl =
    workerOptions.workerUrl || (worker.id === 'compression' ? options.workerUrl : undefined);
  if (customUrl) {
    return `${worker.id}:${customUrl}`;
  }

  const workerFile = getWorkerFile(worker, options);
  return workerFile === getDefaultWorkerFile(worker, options)
    ? worker.id
    : `${getWorkerPackage(worker)}/${workerFile}`;
}

/** Gets the worker script type for Worker construction. */
export function getWorkerType(worker: WorkerObject, options: WorkerOptions = {}): WorkerType {
  const workerOptions = options[worker.id] || {};
  const workerType = workerOptions.workerType || options.workerType || options.core?.workerType;
  if (workerType) {
    return workerType;
  }

  const customUrl =
    workerOptions.workerUrl || (worker.id === 'compression' ? options.workerUrl : undefined);
  if (customUrl) {
    return 'classic';
  }

  return worker.workerType || 'classic';
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
  const workerFile = getWorkerFile(worker, options);

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
  const workerType = (options as any)._workerType || (options as any)?.core?._workerType;
  if (workerType === 'test') {
    if (isBrowser) {
      url = `modules/${getWorkerPackage(worker)}/dist/${workerFile}`;
    } else if (worker.workerNodeFile) {
      url = `modules/${getWorkerPackage(worker)}/dist/${workerFile}`;
    } else {
      // In the test environment the ts-node loader requires TypeScript code
      url = `modules/${getWorkerPackage(worker)}/src/workers/${worker.id}-worker-node.ts`;
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
    url = `https://unpkg.com/@loaders.gl/${getWorkerPackage(worker)}${versionTag}/dist/${workerFile}`;
  }

  assert(url);

  // Allow user to override location
  return url;
}

function getWorkerFile(worker: WorkerObject, options: WorkerOptions): string {
  if (!isBrowser) {
    return worker.workerNodeFile || getDefaultWorkerFile(worker, options);
  }

  const workerType = getWorkerType(worker, options);
  if (workerType === 'module' && worker.workerModuleFile) {
    return worker.workerModuleFile;
  }

  return worker.workerFile || getDefaultWorkerFile(worker, options);
}

function getDefaultWorkerFile(worker: WorkerObject, options: WorkerOptions): string {
  return isBrowser ? `${worker.id}-worker.js` : `${worker.id}-worker-node.js`;
}

function getWorkerPackage(worker: WorkerObject): string {
  return worker.workerPackage || worker.module;
}
