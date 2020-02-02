import assert from './env-utils/assert';

// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '';

// Returns `true` if the two versions are compatible
export function validateLoaderVersion(loader, coreVersion = VERSION) {
  assert(loader, 'no loader provided');

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
