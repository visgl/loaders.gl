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
export function validateWorkerVersion(loader, coreVersion = VERSION) {
  assert(loader, 'no worker provided');

  let loaderVersion = loader.version;
  if (!coreVersion || !loaderVersion) {
    return;
  }

  coreVersion = parseVersion(coreVersion);
  loaderVersion = parseVersion(loaderVersion);

  // TODO enable when fix the __version__ injection
  // assert(
  //   coreVersion.major === loaderVersion.major && coreVersion.minor <= loaderVersion.minor,
  //   `loader: ${loader.name} is not compatible. ${coreVersion.major}.${
  //     coreVersion.minor
  //   }+ is required.`
  // );
}

function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {major: parts[0], minor: parts[1]};
}
