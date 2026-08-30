import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {createReadableFileFromBuffer} from 'test/utils/readable-files';
import {AvroWriter} from '../src/avro-writer';
import {
  parseAvroFromFile,
  parseAvroInBatchesFromFile,
  parseAvroOCF
} from '../src/lib/parsers/parse-avro';

/** Collects every batch from a file-backed parser invocation. */
async function collectBatches(iterator: AsyncIterable<unknown>): Promise<unknown[]> {
  const batches: unknown[] = [];
  for await (const batch of iterator) batches.push(batch);
  return batches;
}

test('Avro file parsing reads small files through the whole-file path', async () => {
  const encoded = await AvroWriter.encode({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({id: [1, 2], label: ['one', 'two']})
  });
  const file = await createReadableFileFromBuffer(encoded);
  const batches = [];

  for await (const batch of parseAvroInBatchesFromFile(file, {batchSize: 1})) {
    batches.push(batch);
  }

  expect(batches.map(batch => batch.length)).toEqual([1, 1]);
  expect(batches[1].data.getChild('label')?.get(0)).toBe('two');
});

test('Avro file parsing reads multiple ranged blocks and applies block selection', async () => {
  const encoded = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromArrays({
        id: Array.from({length: 160}, (_, index) => index),
        label: Array.from({length: 160}, (_, index) => `${'x'.repeat(40)}-${index}`)
      })
    },
    {avro: {blockSize: 1000}}
  );
  const file = await createReadableFileFromBuffer(encoded);
  const batches = [];

  for await (const batch of parseAvroInBatchesFromFile(file, {
    batchSize: 15,
    blockIndices: [2, 5],
    rangeChunkSize: 1024
  })) {
    batches.push(batch);
  }

  const selectedIds = batches.flatMap(batch =>
    Array.from(batch.data.getChild('id')?.toArray() || [])
  );
  expect(selectedIds.length).toBeGreaterThan(20);
  expect(selectedIds.every(id => Number(id) >= 0 && Number(id) < 160)).toBe(true);
  expect(selectedIds.includes(0)).toBe(false);
  expect(selectedIds.includes(159)).toBe(false);
});

test('Avro file parsing resolves stat-only sizes and the table convenience API', async () => {
  const encoded = await AvroWriter.encode({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({id: [1, 2], label: ['one', 'two']})
  });
  const bytes = new Uint8Array(encoded);
  const file = {
    size: 0,
    bigsize: 0n,
    stat: async () => ({size: bytes.length}),
    read: async (offset: number, length: number) => bytes.slice(offset, offset + length).buffer
  };
  await expect(parseAvroFromFile(file as any, {batchSize: 1})).resolves.toMatchObject({
    shape: 'arrow-table',
    data: {numRows: 2}
  });
});

test('Avro file parsing validates random-access sizing options', async () => {
  const missingSizeFile = {size: 0, bigsize: 0n, read: async () => new ArrayBuffer(0)};
  await expect(collectBatches(parseAvroInBatchesFromFile(missingSizeFile as any))).rejects.toThrow(
    'file size is required'
  );
  await expect(
    collectBatches(parseAvroInBatchesFromFile(missingSizeFile as any, {rangeChunkSize: 12}))
  ).rejects.toThrow('rangeChunkSize must be at least 1024');
});

test.each([
  ['negative header', 'Invalid Avro OCF block header'],
  ['truncated payload', 'Truncated Avro OCF block payload'],
  ['invalid sync', 'Invalid Avro OCF sync marker']
] as const)('Avro file parsing rejects a %s', async (failureMode, expectedMessage) => {
  const encoded = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromArrays({
        label: Array.from({length: 80}, (_, index) => `${index}-${'x'.repeat(40)}`)
      })
    },
    {avro: {blockSize: 700}}
  );
  const bytes = new Uint8Array(encoded);
  const firstBlock = parseAvroOCF(encoded).blocks[0];
  const paddedSize = Math.max(bytes.length, 2048);
  const file = {
    size: paddedSize,
    bigsize: BigInt(paddedSize),
    read: async (offset: number, length: number) => {
      if (offset === firstBlock.offset && length <= 32 && failureMode === 'negative header') {
        return Uint8Array.from([1, 0]).buffer;
      }
      const result = bytes.slice(offset, offset + length);
      if (offset === firstBlock.dataOffset && failureMode === 'truncated payload') {
        return result.slice(0, Math.max(0, result.length - 1)).buffer;
      }
      if (offset === firstBlock.dataOffset && failureMode === 'invalid sync') {
        result[firstBlock.compressedSize] ^= 0xff;
      }
      return result.buffer;
    }
  };

  await expect(
    collectBatches(parseAvroInBatchesFromFile(file as any, {rangeChunkSize: 1024}))
  ).rejects.toThrow(expectedMessage);
});

test('Avro file parsing stops at an explicit zero-count block and validates ranged batch size', async () => {
  const encoded = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromArrays({label: Array.from({length: 80}, () => 'x'.repeat(40))})
    },
    {avro: {blockSize: 700}}
  );
  const bytes = new Uint8Array(encoded);
  const firstBlock = parseAvroOCF(encoded).blocks[0];
  const file = {
    size: 2048,
    bigsize: 2048n,
    read: async (offset: number, length: number) =>
      offset === firstBlock.offset && length <= 32
        ? Uint8Array.from([0, 0]).buffer
        : bytes.slice(offset, offset + length).buffer
  };
  await expect(
    collectBatches(parseAvroInBatchesFromFile(file as any, {rangeChunkSize: 1024, batchSize: 0}))
  ).rejects.toThrow('batchSize must be positive');
  await expect(
    collectBatches(parseAvroInBatchesFromFile(file as any, {rangeChunkSize: 1024}))
  ).resolves.toEqual([]);
});
