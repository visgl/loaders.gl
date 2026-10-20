// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const AC_MIN_LENGTH = 0x01000000;
const AC_MAX_LENGTH = 0xffffffff;
const BM_LENGTH_SHIFT = 13;
const BM_MAX_COUNT = 1 << BM_LENGTH_SHIFT;
const BM_DISTRIBUTION_DIVISOR = 2 ** (31 - BM_LENGTH_SHIFT);
const DM_LENGTH_SHIFT = 15;
const DM_MAX_COUNT = 1 << DM_LENGTH_SHIFT;
const DM_DISTRIBUTION_DIVISOR = 2 ** (31 - DM_LENGTH_SHIFT);

/** Adaptive symbol model used by the LASzip arithmetic encoder. */
export class ArithmeticModel {
  /** Number of symbols represented by this model. */
  readonly symbols: number;
  /** Cumulative symbol distribution scaled to the arithmetic interval. */
  readonly distribution: Uint32Array;
  /** Adaptive occurrence count for each symbol. */
  readonly symbolCount: Uint32Array;
  /** Index of the final symbol, whose upper bound is the interval length. */
  readonly lastSymbol: number;
  /** Total observations represented by the current distribution. */
  totalCount = 0;
  /** Number of observations added at the next model update. */
  updateCycle: number;
  /** Symbols remaining before the next model update. */
  symbolsUntilUpdate: number;

  /** Create a uniformly initialized symbol model. */
  constructor(symbols: number) {
    if (symbols < 2 || symbols > 1 << 11) {
      throw new Error(`Invalid arithmetic model symbol count ${symbols}`);
    }
    this.symbols = symbols;
    this.lastSymbol = symbols - 1;
    this.distribution = new Uint32Array(symbols);
    this.symbolCount = new Uint32Array(symbols);
    this.symbolCount.fill(1);
    this.updateCycle = symbols;
    this.symbolsUntilUpdate = symbols;
    this.update();
    this.symbolsUntilUpdate = this.updateCycle = (symbols + 6) >> 1;
  }

  /** Recompute the scaled cumulative distribution from adaptive counts. */
  update(): void {
    this.totalCount += this.updateCycle;
    if (this.totalCount > DM_MAX_COUNT) {
      this.totalCount = 0;
      for (let symbol = 0; symbol < this.symbols; symbol++) {
        this.symbolCount[symbol] = (this.symbolCount[symbol] + 1) >> 1;
        this.totalCount += this.symbolCount[symbol];
      }
    }

    let sum = 0;
    const scale = (0x80000000 / this.totalCount) | 0;
    for (let symbol = 0; symbol < this.symbols; symbol++) {
      this.distribution[symbol] = ((scale * sum) / DM_DISTRIBUTION_DIVISOR) | 0;
      sum += this.symbolCount[symbol];
    }

    this.updateCycle = (5 * this.updateCycle) >> 2;
    const maxCycle = (this.symbols + 6) << 3;
    if (this.updateCycle > maxCycle) {
      this.updateCycle = maxCycle;
    }
    this.symbolsUntilUpdate = this.updateCycle;
  }
}

/** Adaptive binary model used by the LASzip arithmetic encoder. */
export class ArithmeticBitModel {
  /** Number of observations added at the next model update. */
  updateCycle = 4;
  /** Bits remaining before the next model update. */
  bitsUntilUpdate = 4;
  /** Scaled probability of a zero bit. */
  bit0Probability = 1 << (BM_LENGTH_SHIFT - 1);
  /** Number of zero bits observed. */
  bit0Count = 1;
  /** Total number of bits observed. */
  bitCount = 2;

  /** Recompute the scaled zero-bit probability from adaptive counts. */
  update(): void {
    this.bitCount += this.updateCycle;
    if (this.bitCount > BM_MAX_COUNT) {
      this.bitCount = (this.bitCount + 1) >> 1;
      this.bit0Count = (this.bit0Count + 1) >> 1;
      if (this.bit0Count === this.bitCount) {
        this.bitCount++;
      }
    }
    const scale = (0x80000000 / this.bitCount) | 0;
    this.bit0Probability = ((this.bit0Count * scale) / BM_DISTRIBUTION_DIVISOR) | 0;
    this.updateCycle = (5 * this.updateCycle) >> 2;
    if (this.updateCycle > 64) {
      this.updateCycle = 64;
    }
    this.bitsUntilUpdate = this.updateCycle;
  }
}

/** In-memory arithmetic encoder compatible with LASzip's FastAC streams. */
export class ArithmeticEncoder {
  /** Encoded output bytes. */
  private readonly bytes: number[] = [];
  /** Lower bound of the current arithmetic interval. */
  private base = 0;
  /** Length of the current arithmetic interval. */
  private length = AC_MAX_LENGTH;
  /** Whether the final synchronization bytes have been written. */
  private finished = false;

  /** Encode one bit using an adaptive binary model. */
  encodeBit(model: ArithmeticBitModel, symbol: number): void {
    const split = model.bit0Probability * (this.length >>> BM_LENGTH_SHIFT);
    if (symbol === 0) {
      this.length = split >>> 0;
      model.bit0Count++;
    } else if (symbol === 1) {
      this.addToBase(split);
      this.length = (this.length - split) >>> 0;
    } else {
      throw new Error(`Invalid arithmetic bit ${symbol}`);
    }

    this.renormalizeIfNeeded();
    if (--model.bitsUntilUpdate === 0) {
      model.update();
    }
  }

  /** Encode one symbol using an adaptive symbol model. */
  encodeSymbol(model: ArithmeticModel, symbol: number): void {
    if (!Number.isInteger(symbol) || symbol < 0 || symbol > model.lastSymbol) {
      throw new Error(`Invalid arithmetic symbol ${symbol}`);
    }

    let interval = this.length;
    let lower: number;
    if (symbol === model.lastSymbol) {
      lower = model.distribution[symbol] * (interval >>> DM_LENGTH_SHIFT);
      this.addToBase(lower);
      this.length = (interval - lower) >>> 0;
    } else {
      interval >>>= DM_LENGTH_SHIFT;
      lower = model.distribution[symbol] * interval;
      this.addToBase(lower);
      this.length = (model.distribution[symbol + 1] * interval - lower) >>> 0;
    }

    this.renormalizeIfNeeded();
    model.symbolCount[symbol]++;
    if (--model.symbolsUntilUpdate === 0) {
      model.update();
    }
  }

  /** Encode an unsigned value in a fixed number of arithmetic-coded bits. */
  writeBits(bitCount: number, symbol: number): void {
    if (!Number.isInteger(bitCount) || bitCount < 1 || bitCount > 32) {
      throw new Error(`Invalid arithmetic bit count ${bitCount}`);
    }
    if (bitCount > 19) {
      this.writeShort(symbol & 0xffff);
      symbol >>>= 16;
      bitCount -= 16;
    }
    const interval = this.length >>> bitCount;
    this.addToBase(symbol * interval);
    this.length = interval >>> 0;
    this.renormalizeIfNeeded();
  }

  /** Encode a raw unsigned 16-bit integer. */
  writeShort(symbol: number): void {
    const interval = this.length >>> 16;
    this.addToBase((symbol & 0xffff) * interval);
    this.length = interval >>> 0;
    this.renormalizeIfNeeded();
  }

  /** Encode a raw unsigned 32-bit integer in LASzip word order. */
  writeInt(symbol: number): void {
    this.writeShort(symbol & 0xffff);
    this.writeShort(symbol >>> 16);
  }

  /** Finish the stream and return its synchronization-padded bytes. */
  finish(): Uint8Array {
    if (this.finished) {
      return Uint8Array.from(this.bytes);
    }
    this.finished = true;

    const initialBase = this.base;
    let anotherByte = true;
    if (this.length > 2 * AC_MIN_LENGTH) {
      this.base = (this.base + AC_MIN_LENGTH) >>> 0;
      this.length = AC_MIN_LENGTH >>> 1;
    } else {
      this.base = (this.base + (AC_MIN_LENGTH >>> 1)) >>> 0;
      this.length = AC_MIN_LENGTH >>> 9;
      anotherByte = false;
    }
    if (initialBase > this.base) {
      this.propagateCarry();
    }
    this.renormalize();
    this.bytes.push(0, 0);
    if (anotherByte) {
      this.bytes.push(0);
    }
    return Uint8Array.from(this.bytes);
  }

  /** Add to the interval base and propagate unsigned overflow. */
  private addToBase(increment: number): void {
    const initialBase = this.base;
    this.base = (this.base + increment) >>> 0;
    if (initialBase > this.base) {
      this.propagateCarry();
    }
  }

  /** Increment the last non-0xff output byte after interval overflow. */
  private propagateCarry(): void {
    let index = this.bytes.length - 1;
    while (index >= 0 && this.bytes[index] === 0xff) {
      this.bytes[index--] = 0;
    }
    if (index < 0) {
      throw new Error('LASzip arithmetic carry precedes encoded output');
    }
    this.bytes[index]++;
  }

  /** Renormalize the arithmetic interval when it is too short. */
  private renormalizeIfNeeded(): void {
    if (this.length < AC_MIN_LENGTH) {
      this.renormalize();
    }
  }

  /** Emit leading interval bytes until the interval is large enough. */
  private renormalize(): void {
    do {
      this.bytes.push(this.base >>> 24);
      this.base = (this.base << 8) >>> 0;
      this.length = (this.length << 8) >>> 0;
    } while (this.length < AC_MIN_LENGTH);
  }
}

/** LASzip modular integer predictor encoder. */
export class IntegerCompressor {
  /** Arithmetic stream that receives encoded corrections. */
  private readonly encoder: ArithmeticEncoder;
  /** Number of prediction contexts. */
  private readonly contexts: number;
  /** Number of high correction bits encoded as one symbol. */
  private readonly bitsHigh: number;
  /** Maximum correction bit width. */
  private readonly correctionBits: number;
  /** Modular integer range, or zero for signed 32-bit values. */
  private readonly correctionRange: number;
  /** Minimum signed correction represented by the modular range. */
  private readonly correctionMinimum: number;
  /** Models that encode correction bit widths. */
  private readonly bitModels: ArithmeticModel[];
  /** Binary model for zero-bit corrections. */
  private readonly zeroBitCorrector = new ArithmeticBitModel();
  /** Models that encode correction values. */
  private readonly correctorModels: ArithmeticModel[];
  /** Bit width used by the most recently encoded correction. */
  k = 0;

  /** Create an integer compressor for one arithmetic layer. */
  constructor(encoder: ArithmeticEncoder, bits = 16, contexts = 1, bitsHigh = 8, range = 0) {
    this.encoder = encoder;
    this.contexts = contexts;
    this.bitsHigh = bitsHigh;
    if (range) {
      let remainingRange = range;
      let correctionBits = 0;
      while (remainingRange) {
        remainingRange >>= 1;
        correctionBits++;
      }
      if (range === 2 ** (correctionBits - 1)) {
        correctionBits--;
      }
      this.correctionBits = correctionBits;
      this.correctionRange = range;
      this.correctionMinimum = -(range / 2);
    } else if (bits && bits < 32) {
      this.correctionBits = bits;
      this.correctionRange = 2 ** bits;
      this.correctionMinimum = -(this.correctionRange / 2);
    } else {
      this.correctionBits = 32;
      this.correctionRange = 0;
      this.correctionMinimum = -2147483648;
    }

    this.bitModels = Array.from(
      {length: this.contexts},
      () => new ArithmeticModel(this.correctionBits + 1)
    );
    this.correctorModels = Array.from({length: this.correctionBits}, (_, index) => {
      const bitCount = index + 1;
      return new ArithmeticModel(2 ** Math.min(bitCount, this.bitsHigh));
    });
  }

  /** Encode an integer relative to a predictor in the selected context. */
  compress(prediction: number, value: number, context = 0): void {
    if (!Number.isInteger(context) || context < 0 || context >= this.contexts) {
      throw new Error(`Invalid integer compressor context ${context}`);
    }
    let correction = toInt32(value - prediction);
    if (this.correctionRange) {
      if (correction < this.correctionMinimum) {
        correction += this.correctionRange;
      } else if (correction > this.correctionMinimum + this.correctionRange - 1) {
        correction -= this.correctionRange;
      }
    }
    this.writeCorrector(correction, this.bitModels[context]);
  }

  /** Encode a folded signed correction and record its bit width. */
  private writeCorrector(correction: number, bitModel: ArithmeticModel): void {
    let folded = correction <= 0 ? -correction : correction - 1;
    let bitCount = 0;
    while (folded) {
      folded >>>= 1;
      bitCount++;
    }
    this.k = bitCount;
    this.encoder.encodeSymbol(bitModel, bitCount);

    if (bitCount === 0) {
      this.encoder.encodeBit(this.zeroBitCorrector, correction);
      return;
    }
    if (bitCount === 32) {
      if (correction !== this.correctionMinimum) {
        throw new Error(`Invalid ${bitCount}-bit integer correction ${correction}`);
      }
      return;
    }

    let symbol = correction < 0 ? correction + (2 ** bitCount - 1) : correction - 1;
    const model = this.correctorModels[bitCount - 1];
    if (bitCount <= this.bitsHigh) {
      this.encoder.encodeSymbol(model, symbol);
    } else {
      const lowerBitCount = bitCount - this.bitsHigh;
      const lowerMask = 2 ** lowerBitCount - 1;
      const lower = symbol & lowerMask;
      symbol >>>= lowerBitCount;
      this.encoder.encodeSymbol(model, symbol);
      this.encoder.writeBits(lowerBitCount, lower);
    }
  }
}

/** Five-value streaming median predictor used by LASzip coordinate coding. */
export class StreamingMedian {
  /** Smallest retained value. */
  private value0 = 0;
  /** Second-smallest retained value. */
  private value1 = 0;
  /** Current median. */
  private value2 = 0;
  /** Second-largest retained value. */
  private value3 = 0;
  /** Largest retained value. */
  private value4 = 0;
  /** Whether the next update shifts values toward the upper half. */
  private high = true;

  /** Add one value to the streaming median state. */
  add(value: number): void {
    if (this.high) {
      if (value < this.value2) {
        this.value4 = this.value3;
        this.value3 = this.value2;
        if (value < this.value0) {
          this.value2 = this.value1;
          this.value1 = this.value0;
          this.value0 = value;
        } else if (value < this.value1) {
          this.value2 = this.value1;
          this.value1 = value;
        } else {
          this.value2 = value;
        }
      } else {
        if (value < this.value3) {
          this.value4 = this.value3;
          this.value3 = value;
        } else {
          this.value4 = value;
        }
        this.high = false;
      }
    } else if (this.value2 < value) {
      this.value0 = this.value1;
      this.value1 = this.value2;
      if (this.value4 < value) {
        this.value2 = this.value3;
        this.value3 = this.value4;
        this.value4 = value;
      } else if (this.value3 < value) {
        this.value2 = this.value3;
        this.value3 = value;
      } else {
        this.value2 = value;
      }
    } else {
      if (this.value1 < value) {
        this.value0 = this.value1;
        this.value1 = value;
      } else {
        this.value0 = value;
      }
      this.high = true;
    }
  }

  /** Return the current median predictor. */
  get(): number {
    return this.value2;
  }
}

/** Convert a number to signed 32-bit integer semantics. */
export function toInt32(value: number): number {
  return value | 0;
}
