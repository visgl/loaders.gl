// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assert} from '../env-utils/assert';

const workerURLCache = new Map();

/**
 * Creates a loadable URL from worker source or URL
 * that can be used to create `Worker` instances.
 * Due to CORS issues it may be necessary to wrap a URL in a small importScripts
 * @param props
 * @param props.source Worker source
 * @param props.url Worker URL
 * @returns loadable url
 */
export function getLoadableWorkerURL(props: {
  source?: string;
  url?: string;
  type?: 'classic' | 'module';
}) {
  assert((props.source && !props.url) || (!props.source && props.url)); // Either source or url must be defined

  const workerURLCacheKey = `${props.type || 'classic'}:${props.source || props.url}`;
  let workerURL = workerURLCache.get(workerURLCacheKey);
  if (!workerURL) {
    // Differentiate worker urls from worker source code
    if (props.url) {
      workerURL = getLoadableWorkerURLFromURL(props.url, props.type || 'classic');
      workerURLCache.set(workerURLCacheKey, workerURL);
    }

    if (props.source) {
      workerURL = getLoadableWorkerURLFromSource(props.source);
      workerURLCache.set(workerURLCacheKey, workerURL);
    }
  }

  assert(workerURL);
  return workerURL;
}

/**
 * Build a loadable worker URL from worker URL
 * @param url
 * @returns loadable URL
 */
function getLoadableWorkerURLFromURL(url: string, workerType: 'classic' | 'module'): string {
  // A local script url, we can use it to initialize a Worker directly
  if (!url.startsWith('http')) {
    return url;
  }

  // A remote script, we need to use `importScripts` to load from different origin
  const workerSource =
    workerType === 'module' ? buildModuleWorkerSource(url) : buildClassicWorkerSource(url);
  return getLoadableWorkerURLFromSource(workerSource);
}

/**
 * Build a loadable worker URL from worker source
 * @param workerSource
 * @returns loadable url
 */
function getLoadableWorkerURLFromSource(workerSource: string): string {
  const blob = new Blob([workerSource], {type: 'application/javascript'});
  return URL.createObjectURL(blob);
}

/**
 * Per spec, worker cannot be initialized with a script from a different origin
 * However a local worker script can still import scripts from other origins,
 * so we simply build a wrapper script.
 *
 * @param workerUrl
 * @returns source
 */
function buildClassicWorkerSource(workerUrl: string): string {
  return `\
try {
  importScripts('${workerUrl}');
} catch (error) {
  console.error(error);
  throw error;
}`;
}

function buildModuleWorkerSource(workerUrl: string): string {
  return `\
import '${workerUrl}';`;
}
