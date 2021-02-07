/* global URL, Blob */
/** @typedef {import('../../types').WorkerObject} WorkerObject */
import assert from '../env-utils/assert';

/**
 * Generate a worker URL:
 * - a published worker on unpkg CDN
 * - a local test worker
 * - overridden by user
 * @param {WorkerObject} worker
 * @param {object} options
 */
export function getURLfromWorkerObject(worker, options) {
  const workerOptions = (options && options[worker.id]) || {};

  const workerFile = `${worker.id}-worker.js`;

  // If url not provided, load from CDN
  if (!workerOptions.workerUrl) {
    // GENERATE
    return `https://unpkg.com/@loaders.gl/${worker.module}@${worker.version}/dist/${workerFile}`;
  }

  // If URL is test, generate local loaders.gl url
  if (workerOptions.workerUrl === 'test') {
    return `modules/${worker.module}/dist/${workerFile}`;
  }

  // Allow user to override location
  return workerOptions.workerUrl;
}

const workerURLCache = new Map();

/**
 * Creates a URL from worker source or URL that can be used to create `Worker` instances
 *
 * @param {string} workerSource - Worker source or URL
 * @returns {string}
 */
export function getWorkerURL(workerSource) {
  assert(typeof workerSource === 'string', 'worker source');

  let workerURL = workerURLCache.get(workerSource);
  if (workerURL) {
    return workerURL;
  }

  // CASE: url(./worker.js)
  // This pattern is used to differentiate worker urls from worker source code
  // Load from url is needed for testing, when using Webpack & webworker target
  const urlMatch = workerSource.match(/^url\((.*)\)$/);
  if (urlMatch) {
    const workerUrl = urlMatch[1];

    // A local script url, we can use it to initialize a Worker directly
    if (workerUrl && !workerUrl.startsWith('http')) {
      workerURLCache.set(workerSource, workerURL);
      return workerUrl;
    }

    workerSource = buildScriptSource(workerUrl);
  }

  workerURL = getWorkerURLFromSource(workerSource);
  workerURLCache.set(workerSource, workerURL);

  return workerURL;
}

/**
 * Build a worker URL from worker source
 * @param {string} workerSource
 * @returns {string}
 */
function getWorkerURLFromSource(workerSource) {
  assert(typeof workerSource === 'string', 'worker source');

  // NOTE: webworkify was previously used
  // const blob = webworkify(workerSource, {bare: true});
  const blob = new Blob([workerSource], {type: 'application/javascript'});
  return URL.createObjectURL(blob);
}

/**
 * Per spec, worker cannot be initialized with a script from a different origin
 * However a local worker script can still import scripts from other origins,
 * so we simply build a wrapper script.
 *
 * @param {string} workerUrl
 * @returns {string}
 */
function buildScriptSource(workerUrl) {
  return `\
try {
  importScripts('${workerUrl}');
} catch (error) {
  console.error(error);
  throw error;
}`;
}
