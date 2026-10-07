// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Generates reproducible CSV with shuffled records and mixed field entropy. */
export function createCompressionBenchmarkData(byteLength: number, seed = 42): Uint8Array<ArrayBuffer> {
  const output = new Uint8Array(byteLength);
  const encoder = new TextEncoder();
  let randomState = seed >>> 0;
  /** Produces deterministic pseudo-random values without browser entropy. */
  const nextRandom = (): number => {
    randomState = (randomState + 0x6d2b79f5) >>> 0;
    let value = Math.imul(randomState ^ (randomState >>> 15), randomState | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
  const cities = ['Boston', 'Berlin', 'Tokyo', 'Lima', 'Sydney', 'Nairobi', 'Oslo', 'Austin'];
  const categories = ['sensor', 'purchase', 'delivery', 'maintenance', 'inspection'];
  const words = ['station', 'parcel', 'device', 'scheduled', 'verified', 'updated', 'customer', 'regional', 'warehouse', 'temperature', 'pressure', 'shipment'];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const header = encoder.encode('recordId,city,category,amount,timestamp,token,description\n');
  if (!Number.isSafeInteger(byteLength) || byteLength < header.length + 8) {
    throw new RangeError('CSV benchmark size must accommodate the header and a record');
  }
  output.set(header);
  let outputOffset = header.length;
  let batchOffset = 0;
  while (outputOffset < byteLength) {
    const recordOrder = Array.from({length: 256}, (_, index) => batchOffset + index);
    for (let index = recordOrder.length - 1; index > 0; index--) {
      const shuffledIndex = Math.floor(nextRandom() * (index + 1));
      [recordOrder[index], recordOrder[shuffledIndex]] = [recordOrder[shuffledIndex], recordOrder[index]];
    }
    for (const recordId of recordOrder) {
      const city = cities[Math.floor(nextRandom() * cities.length)];
      const category = categories[Math.floor(nextRandom() * categories.length)];
      const amount = (nextRandom() * 100000).toFixed(2);
      const timestamp = 1700000000000 + Math.floor(nextRandom() * 31536000000);
      let token = '';
      for (let index = 0; index < 24; index++) token += alphabet[Math.floor(nextRandom() * alphabet.length)];
      const description = Array.from({length: 3 + Math.floor(nextRandom() * 10)}, () => words[Math.floor(nextRandom() * words.length)]).join(' ');
      const record = encoder.encode(`${recordId},${city},${category},${amount},${timestamp},${token},${description}\n`);
      const remainingBytes = byteLength - outputOffset;
      if (record.length + 8 > remainingBytes) {
        // Finish with a complete seven-field record, preserving exact fixture size.
        const finalRecord = encoder.encode(`0,,,,,,${'x'.repeat(remainingBytes - 8)}\n`);
        output.set(finalRecord, outputOffset);
        return output;
      }
      output.set(record, outputOffset);
      outputOffset += record.length;
    }
    batchOffset += recordOrder.length;
  }
  return output;
}
