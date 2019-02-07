import {autoDetectLoader} from './auto-detect-loader';
import {parseWithLoader, parseWithLoaderSync} from './parse-with-loader';

export function parseFile(data, loaders, options, url) {
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  return parseWithLoader(data, loader, options, url);
}

export function parseFileSync(data, loaders, options, url) {
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  return parseWithLoaderSync(data, loader, options, url);
}
