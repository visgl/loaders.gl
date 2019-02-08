import {autoDetectLoader} from '../loader-utils/auto-detect-loader';
import {parseWithLoader, parseWithLoaderSync} from '../loader-utils/parse-with-loader';

export function parseFile(data, loaders, options, url) {
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  return parseWithLoader(data, loader, options, url);
}

export function parseFileSync(data, loaders, options, url) {
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  return parseWithLoaderSync(data, loader, options, url);
}
