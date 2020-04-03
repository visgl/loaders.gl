// Simple file alias mechanisms for tests.

let pathPrefix = '';
const fileAliases = {};

/*
 * Set a relative path prefix
 */
export function setPathPrefix(prefix) {
  pathPrefix = prefix;
}

export function getPathPrefix() {
  return pathPrefix;
}

// Note: addAliases are an experimental export,
export function addAliases(aliases) {
  Object.assign(fileAliases, aliases);
}

export function resolvePath(filename) {
  for (const alias in fileAliases) {
    if (filename.startsWith(alias)) {
      const replacement = fileAliases[alias];
      filename = filename.replace(alias, replacement);
    }
  }
  if (!filename.startsWith('http://') && !filename.startsWith('https://')) {
    filename = `${pathPrefix}${filename}`;
  }
  return filename;
}
