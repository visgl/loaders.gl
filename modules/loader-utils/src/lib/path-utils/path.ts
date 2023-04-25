// Beginning of a minimal implementation of the Node.js path API, that doesn't pull in big polyfills.

import {getCWD} from './get-cwd';

/**
 * Replacement for Node.js path.filename
 * @param url
 */
export function filename(url: string): string {
  const slashIndex = url ? url.lastIndexOf('/') : -1;
  return slashIndex >= 0 ? url.substr(slashIndex + 1) : '';
}

/**
 * Replacement for Node.js path.dirname
 * @param url
 */
export function dirname(url: string): string {
  const slashIndex = url ? url.lastIndexOf('/') : -1;
  return slashIndex >= 0 ? url.substr(0, slashIndex) : '';
}

/**
 * Replacement for Node.js path.join
 * @param parts
 */
export function join(...parts: string[]): string {
  const separator = '/';
  parts = parts.map((part, index) => {
    if (index) {
      part = part.replace(new RegExp(`^${separator}`), '');
    }
    if (index !== parts.length - 1) {
      part = part.replace(new RegExp(`${separator}$`), '');
    }
    return part;
  });
  return parts.join(separator);
}

/* eslint-disable no-continue */

/**
 * https://nodejs.org/api/path.html#path_path_resolve_paths
 * @param paths A sequence of paths or path segments.
 * @return resolved path
 * Forked from BTOdell/path-resolve under MIT license
 * @see https://github.com/BTOdell/path-resolve/blob/master/LICENSE
 */
export function resolve(...components: string[]): string {
  const paths: string[] = [];
  for (let _i = 0; _i < components.length; _i++) {
    paths[_i] = components[_i];
  }
  let resolvedPath = '';
  let resolvedAbsolute = false;
  let cwd: string | undefined;
  for (let i = paths.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    let path: string | undefined;
    if (i >= 0) {
      path = paths[i];
    } else {
      if (cwd === undefined) {
        cwd = getCWD();
      }
      path = cwd;
    }
    // Skip empty entries
    if (path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = path.charCodeAt(0) === SLASH;
  }
  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)
  // Normalize the path (removes leading slash)
  resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute) {
    return `/${resolvedPath}`;
  } else if (resolvedPath.length > 0) {
    return resolvedPath;
  }
  return '.';
}

const SLASH = 47;
const DOT = 46;

/**
 * Resolves . and .. elements in a path with directory names
 * Forked from BTOdell/path-resolve under MIT license
 * @see https://github.com/BTOdell/path-resolve/blob/master/LICENSE
 */
/* eslint-disable max-depth */
// eslint-disable-next-line complexity, max-statements
function normalizeStringPosix(path: string, allowAboveRoot: boolean): string {
  let res = '';
  let lastSlash = -1;
  let dots = 0;
  let code: number | undefined;
  let isAboveRoot = false;

  for (let i = 0; i <= path.length; ++i) {
    if (i < path.length) {
      code = path.charCodeAt(i);
    } else if (code === SLASH) {
      break;
    } else {
      code = SLASH;
    }
    if (code === SLASH) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (
          res.length < 2 ||
          !isAboveRoot ||
          res.charCodeAt(res.length - 1) !== DOT ||
          res.charCodeAt(res.length - 2) !== DOT
        ) {
          if (res.length > 2) {
            const start = res.length - 1;
            let j = start;
            for (; j >= 0; --j) {
              if (res.charCodeAt(j) === SLASH) {
                break;
              }
            }
            if (j !== start) {
              res = j === -1 ? '' : res.slice(0, j);
              lastSlash = i;
              dots = 0;
              isAboveRoot = false;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSlash = i;
            dots = 0;
            isAboveRoot = false;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) {
            res += '/..';
          } else {
            res = '..';
          }
          isAboveRoot = true;
        }
      } else {
        const slice = path.slice(lastSlash + 1, i);
        if (res.length > 0) {
          res += `/${slice}`;
        } else {
          res = slice;
        }
        isAboveRoot = false;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
