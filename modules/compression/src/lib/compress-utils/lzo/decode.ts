// SPDX-License-Identifier: MIT
// Copyright (c) 2018 Jack Andersen
// Adapted from lzokay; see LICENSE and PROVENANCE.md.

/** Decodes one raw LZO1X block using checked offsets and bounded output. */
export function decodeLzoBlock(input: Uint8Array, capacity: number): Uint8Array {
  const output = new Uint8Array(capacity);
  let inputOffset = 0;
  let outputOffset = 0;
  let state = 0;
  /** Reads one byte, rejecting truncated input. */
  function readByte(): number {
    if (inputOffset >= input.length) throw new Error('lzo: truncated input');
    return input[inputOffset++];
  }
  /** Checks that a decoded run fits the output capacity. */
  function checkOutput(length: number): void {
    if (length > capacity - outputOffset) throw new Error('lzo: output exceeds capacity');
  }
  /** Copies a checked literal run. */
  function copyLiterals(length: number): void {
    if (length > input.length - inputOffset) throw new Error('lzo: truncated input');
    checkOutput(length);
    output.set(input.subarray(inputOffset, inputOffset + length), outputOffset);
    inputOffset += length;
    outputOffset += length;
  }
  /** Reads the zero-byte extension used by long literal and match runs. */
  function readLength(base: number): number {
    let length = base;
    let byte = readByte();
    while (byte === 0) {
      length += 255;
      if (length > capacity) throw new Error('lzo: output exceeds capacity');
      byte = readByte();
    }
    return length + byte;
  }
  if (input.length === 0) throw new Error('lzo: truncated input');
  if (input[0] > 17) {
    const length = readByte() - 17;
    copyLiterals(length);
    state = Math.min(length, 4);
  }
  for (;;) {
    const instruction = readByte();
    let distance: number;
    let matchLength: number;
    let nextState: number;
    if (instruction >= 64) {
      distance = (readByte() << 3) + ((instruction >> 2) & 7) + 1;
      matchLength = (instruction >> 5) + 1;
      nextState = instruction & 3;
    } else if (instruction >= 32) {
      matchLength = (instruction & 31) + 2;
      if (matchLength === 2) matchLength = readLength(33);
      const word = readByte() | (readByte() << 8);
      distance = (word >> 2) + 1;
      nextState = word & 3;
    } else if (instruction >= 16) {
      matchLength = (instruction & 7) + 2;
      if (matchLength === 2) matchLength = readLength(9);
      const word = readByte() | (readByte() << 8);
      distance = ((instruction & 8) << 11) + (word >> 2);
      nextState = word & 3;
      if (distance === 0) {
        if (matchLength !== 3 || inputOffset !== input.length)
          throw new Error('lzo: invalid end marker or trailing input');
        return output.slice(0, outputOffset);
      }
      distance += 16384;
    } else if (state === 0) {
      copyLiterals(instruction === 0 ? readLength(18) : instruction + 3);
      state = 4;
      continue;
    } else {
      distance = (instruction >> 2) + (readByte() << 2) + (state === 4 ? 2049 : 1);
      matchLength = state === 4 ? 3 : 2;
      nextState = instruction & 3;
    }
    if (distance > outputOffset) throw new Error('lzo: invalid back-reference');
    checkOutput(matchLength);
    for (let index = 0; index < matchLength; index++) {
      output[outputOffset] = output[outputOffset - distance];
      outputOffset++;
    }
    copyLiterals(nextState);
    state = nextState;
  }
}
