/**
 * Seedable Random number generator
 * Useful for testing as it can generated identical sequences on each run
 * @see https://stackoverflow.com/questions/424292/seedable-javascript-random-number-generator
 */
export default class RandomNumberGenerator {
  constructor(seed = 1000) {
    // LCG using GCC's constants
    this.m = 0x80000000; // 2**31;
    this.a = 1103515245;
    this.c = 12345;
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }

  getInt() {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
  }

  /**
   * returns in range [0,1]
   */
  getFloat() {
    return this.getInt() / (this.m - 1);
  }
  /**
   * returns in range [start, end): including start, excluding end
   * can't modulu getInt because of weak randomness in lower bits
   * @param {number} start
   * @param {number} end
   * @returns {number}
   */
  getRange(start, end) {
    const rangeSize = end - start;
    const randomUnder1 = this.getInt() / this.m;
    return start + Math.floor(randomUnder1 * rangeSize);
  }

  choice(array) {
    return array[this.getRange(0, array.length)];
  }
}
