import type {WorkerObject} from '../../types';
import {assert} from '../env-utils/assert';

const NPM_TAG = 'beta'; // Change to 'latest' on release-branch

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : NPM_TAG;

/**
 * Generate a worker URL based on worker object and options
 * - a published worker on unpkg CDN
 * - a local test worker
 * - overridden by user
 */
export function getWorkerObjectURL(worker: WorkerObject, options: object): string {
  const topOptions = options || {};
  const workerOptions = topOptions[worker.id] || {};

  const workerFile = `${worker.id}-worker.js`;

  let url = workerOptions.workerUrl;

  // If URL is test, generate local loaders.gl url
  // @ts-ignore _workerType
  if (topOptions._workerType === 'test') {
    url = `modules/${worker.module}/dist/${workerFile}`;
  }

  // If url override is not provided, generate a URL to published version on npm CDN unpkg.com
  if (!url) {
    // GENERATE
    let version = worker.version;
    // On master we need to load npm alpha releases published with the `beta` tag
    if (version === 'latest') {
      version = NPM_TAG;
    }
    const versionTag = version ? `@${version}` : '';
    url = `https://unpkg.com/@loaders.gl/${worker.module}${versionTag}/dist/${workerFile}`;
  }

  assert(url);

  // Allow user to override location
  return url;
}

/**
 * Gets worker object's name (for debugging in Chrome thread inspector window)
 * @param worker
 * @param options
 */
export function getWorkerObjectName(worker: WorkerObject, options: object): string {
  const warning = worker.version !== VERSION ? ` (lib@${VERSION})` : '';
  return `${worker.name}-worker@${worker.version}${warning}`;
}

/**
 * Check if worker is compatible with this library version
 * @param worker
 * @param libVersion
 * @returns `true` if the two versions are compatible
 */
export function validateWorkerVersion(
  worker: WorkerObject,
  coreVersion: string = VERSION
): boolean {
  assert(worker, 'no worker provided');

  const workerVersion = worker.version;
  if (!coreVersion || !workerVersion) {
    return false;
  }

  const coreVersions = parseVersion(coreVersion);
  const workerVersions = parseVersion(workerVersion);

  // TODO enable when fix the __version__ injection
  // assert(
  //   coreVersion.major === workerVersion.major && coreVersion.minor <= workerVersion.minor,
  //   `worker: ${worker.name} is not compatible. ${coreVersion.major}.${
  //     coreVersion.minor
  //   }+ is required.`
  // );

  return true;
}

function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {major: parts[0], minor: parts[1]};
}

/**
 * Safely stringify JSON (drop non serializable values like functions and regexps)
 * @param value
 */
export function removeNontransferableOptions(object: object): object {
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
