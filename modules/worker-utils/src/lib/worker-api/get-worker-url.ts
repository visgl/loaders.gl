// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WorkerObject, WorkerOptions} from '../../types';
import {assert} from '../env-utils/assert';
import {isBrowser} from '../env-utils/globals';
import {VERSION} from '../env-utils/version';
import {NPM_TAG} from '../npm-tag';

const warnedWorkerVersionFallbacks = new Set<string>();

/**
 * Gets worker object's name (for debugging in Chrome thread inspector window)
 */
export function getWorkerName(worker: WorkerObject): string {
  const warning = worker.version !== VERSION ? ` (worker-utils@${VERSION})` : '';
  return `${worker.name}@${worker.version}${warning}`;
}

/**
 * Returns an explicitly configured, descriptor-provided, or test worker URL.
 * @param worker Worker descriptor to resolve.
 * @param options Worker options that can override the descriptor.
 * @returns A worker URL, or `null` when URL-based fallback resolution is still required.
 */
export function getCustomWorkerURL(
  worker: WorkerObject,
  options: WorkerOptions = {}
): string | null {
  const workerOptions = options[worker.id] || {};

  const workerFile = isBrowser
    ? `${worker.id}-worker.js`
    : worker.workerNode || `${worker.id}-worker-node.js`;

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
  if (!url && workerType === 'test') {
    if (isBrowser) {
      url = `modules/${worker.module}/dist/${workerFile}`;
    } else {
      // In the test environment the ts-node loader requires TypeScript code
      url = `modules/${worker.module}/src/workers/${worker.id}-worker-node.ts`;
    }
  }

  // A loader may publish a module-relative worker asset instead of relying on a CDN fallback.
  if (!url && typeof worker.worker === 'string') {
    url = worker.worker;
  }

  return url || null;
}

/**
 * Generates a worker URL using overrides first and the published CDN artifact as a fallback.
 * @param worker Worker descriptor to resolve.
 * @param options Worker options that can override the descriptor.
 * @returns A loadable worker URL.
 */
export function getWorkerURL(worker: WorkerObject, options: WorkerOptions = {}): string {
  const url = getCustomWorkerURL(worker, options) || getDefaultWorkerURL(worker, true);

  assert(url);

  // Allow user to override location
  return url;
}

/**
 * Returns the generated URL for a published pre-built worker.
 * @param worker Worker descriptor to resolve.
 * @param warn Whether to warn when an uninjected development version uses the npm tag.
 * @returns The CDN worker URL.
 */
export function getDefaultWorkerURL(worker: WorkerObject, warn: boolean = false): string {
  const workerFile = isBrowser
    ? `${worker.id}-worker.js`
    : worker.workerNode || `${worker.id}-worker-node.js`;
  let version = worker.version;
  if (version === 'latest') {
    version = NPM_TAG;
  }
  const versionTag = version ? `@${version}` : '';
  const url = `https://unpkg.com/@loaders.gl/${worker.module}${versionTag}/dist/${workerFile}`;
  if (warn) {
    warnIfUsingNpmTagFallback(worker, url);
  }
  return url;
}

/** Warn once when a worker falls back to the npm tag because __VERSION__ was not injected. */
function warnIfUsingNpmTagFallback(worker: WorkerObject, url: string): void {
  if (worker.version !== 'latest') {
    return;
  }

  const workerId = `${worker.module}:${worker.id}`;
  if (warnedWorkerVersionFallbacks.has(workerId)) {
    return;
  }

  warnedWorkerVersionFallbacks.add(workerId);
  // eslint-disable-next-line no-console
  console.warn(
    `loaders.gl: ${worker.name} loader worker version is "latest" because __VERSION__ was not injected. Fetching ${url} from CDN.`
  );
}
