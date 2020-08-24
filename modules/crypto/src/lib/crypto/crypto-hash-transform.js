// This dependency is too big, application must provide it
// import * as CryptoJS from 'crypto-js';
import {assert} from '@loaders.gl/loader-utils';

const ERR_CRYPTO_LIBRARY_NOT_SUPPLIED = 'crypto-js lib must be supplied in options.module.CryptoJS';

export default class CryptoHashTransform {
  static async hash(input, options) {
    return CryptoHashTransform.hashSync(input, options);
  }

  static hashSync(input, options = {}) {
    const {CryptoJS} = options.modules || {};
    assert(CryptoJS, ERR_CRYPTO_LIBRARY_NOT_SUPPLIED);

    const transform = new CryptoHashTransform(options);
    const typedWordArray = CryptoJS.lib.WordArray.create(input);
    return transform._hash
      .update(typedWordArray)
      .finalize()
      .toString(CryptoJS.enc.Base64);
  }

  constructor(options = {}) {
    options = {crypto: {}, modules: {}, ...options};

    const {CryptoJS} = options.modules;
    assert(CryptoJS, ERR_CRYPTO_LIBRARY_NOT_SUPPLIED);

    const {algorithm = CryptoJS.algo.MD5} = options.crypto;

    this.options = options;
    this.CryptoJS = CryptoJS;
    this._hash = algorithm.create();
  }

  /**
   * Pass-through. Update the hash and pass the chunk through unharmed
   */
  write(chunk) {
    // https://stackoverflow.com/questions/25567468/how-to-decrypt-an-arraybuffer
    const typedWordArray = this.CryptoJS.lib.WordArray.create(chunk);
    this._hash.update(typedWordArray);
    return chunk;
  }

  end() {
    const hash = this._hash.finalize().toString(this.CryptoJS.enc.Base64);
    if (this.options.crypto.onEnd) {
      this.options.crypto.onEnd({hash});
    }
    return null;
  }
}
