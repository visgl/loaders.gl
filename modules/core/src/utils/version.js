import assert from './assert'; // __VERSION__ is injected by babel-plugin-version-inline

// Returns `true` if the two versions are compatible
/* global __VERSION__ */ export function validateLoaderVersion(loader) {
  let coreVersion = typeof __VERSION__ === 'undefined' ? '' : __VERSION__;
  let loaderVersion = loader.version;
  if (!coreVersion || !loaderVersion) {
    return;
  }

  coreVersion = parseVersion(coreVersion);
  loaderVersion = parseVersion(loaderVersion);

  assert(
    coreVersion.major === loaderVersion.major && coreVersion.minor <= loaderVersion.minor,
    `loader: ${loader.name} is not compatible. ${coreVersion.major}.${
      coreVersion.minor
    }+ is required.`
  );
}

function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {major: parts[0], minor: parts[1]};
}
