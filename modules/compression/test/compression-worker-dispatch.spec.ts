import {describe, expect, test} from 'vitest';
import {processCompressionWorkerRequest} from '../src/workers/compression-worker';

describe('compression worker dispatch', () => {
  test('supports operation aliases with uncompressed data', async () => {
    const input = new Uint8Array([1, 2, 3]).buffer;

    await expect(
      processCompressionWorkerRequest(input, {compression: 'uncompressed', operation: 'deflate'})
    ).resolves.toBe(input);
    await expect(
      processCompressionWorkerRequest(input, {compression: 'uncompressed', operation: 'inflate'})
    ).resolves.toBe(input);
  });

  test('round-trips fast built-in compression implementations', async () => {
    const input = new TextEncoder().encode('worker dispatch '.repeat(8)).buffer;
    for (const compression of ['deflate', 'gzip', 'lz4', 'snappy']) {
      const compressed = await processCompressionWorkerRequest(input.slice(0), {
        compression,
        operation: 'compress'
      });
      const output = await processCompressionWorkerRequest(compressed, {
        compression,
        operation: 'decompress'
      });
      expect(new Uint8Array(output), compression).toEqual(new Uint8Array(input));
    }
  });

  test('selects lazy codec implementations without misclassifying their names', async () => {
    const input = new Uint8Array([1, 2, 3]).buffer;
    for (const compression of ['brotli', 'zstd', 'bzip2', 'xz']) {
      for (const operation of ['compress', 'decompress']) {
        const result = await Promise.allSettled([
          processCompressionWorkerRequest(input.slice(0), {compression, operation})
        ]);
        if (result[0].status === 'rejected') {
          expect(String(result[0].reason)).not.toContain(`Unsupported compression ${compression}`);
        }
      }
    }
  });

  test('rejects unsupported operations and compression names', async () => {
    await expect(
      processCompressionWorkerRequest(new ArrayBuffer(0), {
        compression: 'uncompressed',
        operation: 'rotate'
      })
    ).rejects.toThrow('Unsupported operation rotate');
    await expect(
      processCompressionWorkerRequest(new ArrayBuffer(0), {
        compression: 'unknown',
        operation: 'compress'
      })
    ).rejects.toThrow('Unsupported compression unknown');
  });
});
