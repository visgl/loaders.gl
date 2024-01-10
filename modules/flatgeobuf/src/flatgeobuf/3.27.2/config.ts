export default class Config {
  static global = new Config();

  private _extraRequestThreshold = 256 * 1024;

  /**
   * Fetch up to this many extra bytes if it will eliminate an extra request
   */
  public extraRequestThreshold(): number {
    return this._extraRequestThreshold;
  }

  public setExtraRequestThreshold(bytes: number): void {
    if (bytes < 0) {
      throw new Error('extraRequestThreshold cannot be negative');
    }
    this._extraRequestThreshold = bytes;
  }
}
