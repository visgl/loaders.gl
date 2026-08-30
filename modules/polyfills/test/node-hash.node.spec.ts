// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NodeHash} from '../src/crypto/node-hash';

test('NodeHash validates algorithms and hashes complete buffers', async () => {
  expect(() => new NodeHash({crypto: {algorithm: ''}})).toThrow('crypto-node');

  const hash = new NodeHash({crypto: {algorithm: 'SHA256'}});
  const input = new TextEncoder().encode('loaders.gl').buffer;
  await expect(hash.hash(input, 'base64')).resolves.toBe(
    '68ZCCp2IUFAtPFPbi3m6ywb2bsPvOKf/FFKfE7CUJ/E='
  );

  const unavailable = new NodeHash({crypto: {algorithm: 'not-a-real-hash'}});
  await expect(unavailable.hash(input, 'hex')).rejects.toThrow(
    'not-a-real-hash hash not available'
  );
});

test('NodeHash streams chunks through and reports encoded digests', async () => {
  const onEnd = vi.fn();
  const hash = new NodeHash({crypto: {algorithm: 'sha256', onEnd}});
  const chunks = [
    new TextEncoder().encode('loaders.').buffer,
    new TextEncoder().encode('gl').buffer
  ];
  const yielded: ArrayBuffer[] = [];

  for await (const chunk of hash.hashBatches(chunks, 'hex')) {
    yielded.push(chunk);
  }

  expect(yielded).toEqual(chunks);
  expect(onEnd).toHaveBeenCalledWith({
    hash: 'ebc6420a9d8850502d3c53db8b79bacb06f66ec3ef38a7ff14529f13b09427f1'
  });
});
