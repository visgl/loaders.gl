// This dependency is too big
// import * as CryptoJS from 'crypto-js';

export default class CryptoHashTransform {
  static async hash(input, options) {
    return CryptoHashTransform.hashSync(input, options);
  }

  static hashSync(input, options = {}) {
    const {CryptoJS} = options;

    const transform = new CryptoHashTransform(options);
    const typedWordArray = CryptoJS.lib.WordArray.create(input);
    return transform._hash
      .update(typedWordArray)
      .finalize()
      .toString(CryptoJS.enc.Base64);
  }

  constructor(options) {
    options = options || {};
    options.crypto = options.crypto || {};

    const {CryptoJS} = options;
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
    if (this.options.onEnd) {
      this.options.onEnd({hash});
    }
    return null;
  }
}
