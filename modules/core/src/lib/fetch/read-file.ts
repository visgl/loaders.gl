// File read
import {isBrowser, resolvePath, fs, toArrayBuffer} from '@loaders.gl/loader-utils';
import {assert} from '@loaders.gl/loader-utils';

// TODO - this is not tested
// const isDataURL = (url) => url.startsWith('data:');

/**
 * In a few cases (data URIs, node.js) "files" can be read synchronously
 */
export function readFileSync(url: string, options: object = {}) {
  url = resolvePath(url);

  // Only support this if we can also support sync data URL decoding in browser
  // if (isDataURL(url)) {
  //   return decodeDataUri(url);
  // }

  if (!isBrowser) {
    const buffer = fs.readFileSync(url, options);
    return typeof buffer !== 'string' ? toArrayBuffer(buffer) : buffer;
  }

  // @ts-ignore
  if (!options.nothrow) {
    // throw new Error('Cant load URI synchronously');
    assert(false);
  }

  return null;
}
