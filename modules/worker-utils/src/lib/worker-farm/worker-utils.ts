import {assert} from '../env-utils/assert';

const workerURLCache = new Map();

/**
 * Creates a URL from worker source that can be used to create `Worker` instances
 */
export function getWorkerURL(workerSource) {
  assert(typeof workerSource === 'string', 'worker source');

  // url(./worker.js)
  // This pattern is used to differentiate worker urls from worker source code
  // Load from url is needed for testing, when using Webpack & webworker target
  if (workerSource.startsWith('url(') && workerSource.endsWith(')')) {
    return workerSource.match(/^url\((.*)\)$/)[1];
  }

  let workerURL = workerURLCache.get(workerSource);

  if (!workerURL) {
    const blob = new Blob([workerSource], {type: 'application/javascript'});
    // const blob = webworkify(workerSource, {bare: true});
    workerURL = URL.createObjectURL(blob);
    workerURLCache.set(workerSource, workerURL);
  }

  return workerURL;
}
