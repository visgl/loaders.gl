import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {createReadableFileFromBuffer} from 'test/utils/readable-files';
import {AvroWriter} from '../src/avro-writer';
import {parseAvroInBatchesFromFile} from '../src/lib/parsers/parse-avro';

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
