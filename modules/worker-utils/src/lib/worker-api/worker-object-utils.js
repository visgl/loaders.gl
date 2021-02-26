/** @typedef {import('../../types').WorkerObject} WorkerObject */
import assert from '../env-utils/assert';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export function getWorkerObjectURL(worker, options) {
  const topOptions = options || {};
  const workerOptions = topOptions[worker.id] || {};

  const workerFile = `${worker.id}-worker.js`;

  let url = workerOptions.workerUrl;

  // If URL is test, generate local loaders.gl url
  if (topOptions._workerType === 'test') {
    url = `modules/${worker.module}/dist/${workerFile}`;
  }

  // If url not provided, load from CDN
  if (!url) {
    // GENERATE
    const version = worker.version ? `@${worker.version}` : '';
    url = `https://unpkg.com/@loaders.gl/${worker.module}${version}/dist/${workerFile}`;
  }

  assert(url);

  // Allow user to override location
  return url;
}

// Build worker name (for debugging)
export function getWorkerObjectName(worker) {
  const warning = worker.version !== VERSION ? ` (lib@${VERSION})` : '';
  return `${worker.name}-worker@${worker.version}${warning}`;
}

// Returns `true` if the two versions are compatible
export function validateWorkerVersion(worker, coreVersion = VERSION) {
  assert(worker, 'no worker provided');

  let workerVersion = worker.version;
  if (!coreVersion || !workerVersion) {
    return;
  }

  coreVersion = parseVersion(coreVersion);
  workerVersion = parseVersion(workerVersion);

  // TODO enable when fix the __version__ injection
  // assert(
  //   coreVersion.major === workerVersion.major && coreVersion.minor <= workerVersion.minor,
  //   `worker: ${worker.name} is not compatible. ${coreVersion.major}.${
  //     coreVersion.minor
  //   }+ is required.`
  // );
}

function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {major: parts[0], minor: parts[1]};
}

/**
 * @param {object} object
 * @returns {object}
 */
export function removeNontransferableOptions(object) {
  // options.log object contains functions which cannot be transferred
  // TODO - decide how to handle logging on workers
  // TODO - warn if options stringification is long
  return JSON.parse(stringifyJSON(object));
}

function stringifyJSON(v) {
  const cache = new Set();
  return JSON.stringify(v, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        // Circular reference found
        try {
          // If this value does not reference a parent it can be deduped
          return JSON.parse(JSON.stringify(value));
        } catch (err) {
          // discard key if value cannot be deduped
          return undefined;
        }
      }
      // Store value in our set
      cache.add(value);
    }
    return value;
  });
}
