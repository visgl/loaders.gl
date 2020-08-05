// Fork of https://github.com/briantbutton/md5-wasm under MIT license
// import {IncrementalTransform} from "@loaders.gl/loader-utils";
import md5WASM from './md5-wasm';
import {hexToBase64} from '../utils/base64-utils';

/**
 * A transform that MD5 compresses / deflates input bytes
 */
export default class MD5HashTransform {
  static async hash(input, options = {}) {
    const md5Promise = new Promise((resolve, reject) => {
      md5WASM(input)
        .then(resolve)
        .catch(reject);
    });
    const hex = await md5Promise;
    return hexToBase64(hex);
  }
}
