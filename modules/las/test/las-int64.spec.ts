// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {LASWriter} from '@loaders.gl/las';
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';
import {parseLAS, parseLASInBatches} from '../src/lib/typescript/parse-las';

const unsignedValues = new BigUint64Array([0n, 9007199254740993n, (1n << 64n) - 1n]);
const signedValues = new BigInt64Array([
  -(1n << 63n),
  -9007199254740993n,
  -1n,
  0n,
  1n,
  9007199254740993n,
  (1n << 63n) - 1n,
  -100n,
  100n
]);

/** Yield small fragments to cross header, descriptor, and compressed record boundaries. */
function* splitInput(bytes: Uint8Array): Iterable<Uint8Array> {
  for (let byteOffset = 0; byteOffset < bytes.length; byteOffset += 113) {
    yield bytes.subarray(byteOffset, byteOffset + 113);
  }
}

test.each([
  ['las', 3],
  ['laz', 3],
  ['las', 6],
  ['laz', 6]
] as const)('%s PDRF %i preserves typed 64-bit Extra Bytes in complete and streaming output', async (format, pointDataRecordFormat) => {
  const source = makeMeshArrowTable({
    POSITION: {value: new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), size: 3},
    unsigned: {value: unsignedValues, size: 1},
    signed: {value: signedValues, size: 3}
  });
  const file = LASWriter.encodeSync!(source, {
    las: {
      format,
      pointDataRecordFormat,
      chunkSize: 2,
      extraBytes: [{attribute: 'unsigned'}, {attribute: 'signed'}]
    }
  });
  const options = {las: {extraBytes: 'typed' as const}};
  const actual = parseLAS(file, options);
  expect(actual.data.getChild('EXTRA_BYTES_unsigned')!.toArray()).toEqual(unsignedValues);
  expect(actual.data.getChild('EXTRA_BYTES_signed')!.data[0].children[0].values).toEqual(
    signedValues
  );
  const streamedUnsigned: bigint[] = [];
  const streamedSigned: bigint[] = [];
  for await (const batch of parseLASInBatches(splitInput(new Uint8Array(file)), {
    ...options,
    batchSize: 2
  })) {
    streamedUnsigned.push(...batch.data.getChild('EXTRA_BYTES_unsigned')!.toArray());
    const vectors = batch.data.getChild('EXTRA_BYTES_signed')!;
    for (const vector of vectors) streamedSigned.push(...vector.toArray());
  }
  expect(streamedUnsigned).toEqual([...unsignedValues]);
  expect(streamedSigned).toEqual([...signedValues]);
});
