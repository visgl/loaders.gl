/* global URL, Blob */
import assert from '../env-utils/assert';

const workerURLCache = new Map();

/**
 * Creates a loadable URL from worker source or URL
 * that can be used to create `Worker` instances
 * @param {object} props
 * @param {string | undefined} [props.source] Worker source
 * @param {string | undefined} [props.url] Worker URL
 * @returns {string}
 */
export function buildWorkerURL({source, url}) {
  assert((source && !url) || (!source && url)); // Either source or url must be defined

  let workerURL = workerURLCache.get(source || url);
  if (!workerURL) {
    // Differentiate worker urls from worker source code
    if (url) {
      workerURL = getWorkerURLFromURL(url);
      workerURLCache.set(url, workerURL);
    }

    if (source) {
      workerURL = getWorkerURLFromSource(source);
      workerURLCache.set(source, workerURL);
    }
  }

  assert(workerURL);
  return workerURL;
}

/**
 * Build a loadable worker URL from worker URL
 * @param {string} url
 * @returns {string}
 */
function getWorkerURLFromURL(url) {
  // A local script url, we can use it to initialize a Worker directly
  if (!url.startsWith('http')) {
    return url;
  }

  // A remote script, we need to use `importScripts` to load from different origin
  const workerSource = buildScriptSource(url);
  return getWorkerURLFromSource(workerSource);
}

/**
 * Build a loadable worker URL from worker source
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
