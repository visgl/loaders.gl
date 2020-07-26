import CRC32 from './crc32';

export default class CRC32HashTransform {
  static async hash(input, options) {
    return CRC32HashTransform.hashSync(input, options);
  }

  static hashSync(input, options) {
    const transform = new CRC32HashTransform(options);
    return transform._hash
      .update(input)
      .finalize()
      .toString();
  }

  constructor(options) {
    this.options = options;
    this._hash = new CRC32();
  }

  /**
   * Pass-through. Update the hash and pass the chunk through unharmed
   */
  write(chunk) {
    this._hash.update(chunk);
    return chunk;
  }

  end() {
    const hash = this._hash.finalize().toString();
    if (this.options.onEnd) {
      this.options.onEnd({hash});
    }
    return null;
  }
}
