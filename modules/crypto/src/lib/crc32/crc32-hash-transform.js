import CRC32 from './crc32';
import {toHex, hexToBase64} from '../utils/digest-utils';

export default class CRC32HashTransform {
  static async hash(input, options) {
    return CRC32HashTransform.hashSync(input, options);
  }

  static hashSync(input, options) {
    const transform = new CRC32HashTransform(options);
    return transform._update(input)._finish();
  }

  constructor(options = {}) {
    this.options = {crypto: {}, ...options};
    this._hash = new CRC32();
  }

  /**
   * Pass-through. Update the hash and pass the chunk through unharmed
   */
  write(chunk) {
    this._update(chunk);
    return chunk;
  }

  end() {
    const hash = this._finish();
    if (this.options.crypto.onEnd) {
      this.options.crypto.onEnd({hash});
    }
    return null;
  }

  _update(chunk) {
    this._hash.update(chunk);
    return this;
  }

  _finish() {
    const hashValue = this._hash.finalize();
    const hex = toHex(hashValue);
    const hash = hexToBase64(hex);
    return hash;
  }
}
