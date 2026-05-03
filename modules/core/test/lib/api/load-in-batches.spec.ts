import {expect, test} from 'vitest';
import {loadInBatches, fetchFile, isBrowser} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
import {OBJLoader} from '@loaders.gl/obj';
import {KMLLoader} from '@loaders.gl/kml';
import type {ObjectRowTableBatch} from '@loaders.gl/schema';

const CSV_SAMPLE_VERY_LONG_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
const OBJ_ASCII_URL = '@loaders.gl/obj/test/data/bunny.obj';
const KML_URL = '@loaders.gl/kml/test/data/kml/KML_Samples.kml';

test.runIf(isBrowser)('loadInBatches#FileList', async () => {
  const response = await fetchFile(OBJ_ASCII_URL);
  const blob = await response.blob();
  const iteratorPromises = await loadInBatches([blob, blob], OBJLoader);

  for await (const iterator of iteratorPromises) {
    // @ts-ignore
    for await (const batch of iterator) {
      expect(batch.data.mode, 'mode is TRIANGLES (4)').toBe(4);
    }
  }
});

test.skip('loadInBatches#non-batched loader (mesh)', async () => {});

test('loadInBatches#non-batched loader (gis)', async () => {
  const batches = (await loadInBatches(KML_URL, KMLLoader, {
    kml: {shape: 'object-row-table'}
  })) as AsyncIterableIterator<ObjectRowTableBatch>;

  for await (const batch of batches) {
    // @ts-ignore TODO - check returned types
    expect(batch.data.length, 'KML length of data features table is correct').toBe(20);
  }
});

test('loadInBatches(options.limit)', async () => {
  // @ts-ignore
  const iterator = await loadInBatches(CSV_SAMPLE_VERY_LONG_URL, CSVLoader, {
    limit: 100
  });
  const rows: unknown[] = [];

  for await (const batch of iterator) {
    // @ts-ignore CSVLoader types are not made available here due to potential circular dependency in tsconfigs
    rows.push(...batch.data);
  }

  expect(rows.length, 'Got the correct table size with options.limit').toBe(100);
});
