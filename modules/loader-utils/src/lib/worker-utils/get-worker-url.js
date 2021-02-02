/* global URL, Blob */
import assert from '../env-utils/assert';

const workerURLCache = new Map();

// Creates a URL from worker source that can be used to create `Worker` instances
// Packages (and then caches) the result of `webworkify` as an "Object URL"
export function getWorkerURL(workerSource, workerName = 'Worker') {
  assert(typeof workerSource === 'string', 'worker source');

  // CASE: url(./worker.js)
  // This pattern is used to differentiate worker urls from worker source code
  // Load from url is needed for testing, when using Webpack & webworker target
  if (workerSource.startsWith('url(') && workerSource.endsWith(')')) {
    const workerUrl = workerSource.match(/^url\((.*)\)$/)[1];

    // A local script url, we can use it to initialize a Worker directly
    if (workerUrl && !workerUrl.startsWith('http')) {
      return workerUrl;
    }

    // Per spec, worker cannot be initialized with a script from a different origin
    // However a local worker script can still import scripts from other origins,
    // so we simply build a wrapper script
    workerSource = buildScript(workerUrl);
  }

  let workerURL = workerURLCache.get(workerSource);

  if (!workerURL) {
    // NOTE: webworkify was previously used
    // const blob = webworkify(workerSource, {bare: true});
    const blob = new Blob([workerSource], {type: 'application/javascript'});
    workerURL = URL.createObjectURL(blob);
    workerURLCache.set(workerSource, workerURL);
  }

  return workerURL;
}

// Only use trusted sources!
function buildScript(workerUrl) {
  return `\
try {
  importScripts('${workerUrl}');
} catch (error) {
  console.error(error);
}`;
}
