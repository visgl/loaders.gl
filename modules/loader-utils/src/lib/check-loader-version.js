// Returns `true` if the two versions are compatible
export function validateLoaderVersion(coreVersion, loader) {
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

// Replacement for the external assert method to reduce bundle size
// Note: We don't use the second "message" argument in calling code,
// so no need to support it here
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'loader assertion failed.');
  }
}
