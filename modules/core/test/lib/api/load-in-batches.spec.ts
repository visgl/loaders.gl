// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {loadInBatches, fetchFile, isBrowser} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
import {OBJLoader} from '@loaders.gl/obj';
import {KMLLoader} from '@loaders.gl/kml';
import {ObjectRowTableBatch} from '@loaders.gl/schema';

const CSV_SAMPLE_VERY_LONG_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
const OBJ_ASCII_URL = '@loaders.gl/obj/test/data/bunny.obj';
const KML_URL = '@loaders.gl/kml/test/data/kml/KML_Samples.kml';

test('loadInBatches#FileList', async (t) => {
  if (isBrowser) {
    const response = await fetchFile(OBJ_ASCII_URL);
    const blob = await response.blob();

    const iteratorPromises = await loadInBatches([blob, blob], OBJLoader);
    for await (const iterator of iteratorPromises) {
      // @ts-ignore
      for await (const batch of iterator) {
        // Just the one batch...
        t.equal(batch.data.mode, 4, 'mode is TRIANGLES (4)');
      }
    }
  }

  t.end();
});

test.skip('loadInBatches#non-batched loader (mesh)', async (t) => {
  // This masquerades an atomic loader as batches
  // const batches = await loadInBatches(OBJ_ASCII_URL, OBJLoader);
  // for await (const batch of batches) {
  //   // Just the one batch...
  //   t.equal(batch?.data.mode, 4, 'OBJ mode is TRIANGLES (4)');
  // }
  t.end();
});

test('loadInBatches#non-batched loader (gis)', async (t) => {
  const batches = (await loadInBatches(KML_URL, KMLLoader, {
    kml: {shape: 'object-row-table'}
  })) as AsyncIterableIterator<ObjectRowTableBatch>;
  for await (const batch of batches) {
    // Just the one batch...
    // @ts-ignore TODO - check returned types
    t.equal(batch.data.data.length, 20, 'KML length of data features table is correct');
  }
  t.end();
});

test('loadInBatches(options.limit)', async (t) => {
  // @ts-ignore
  const iterator = await loadInBatches(CSV_SAMPLE_VERY_LONG_URL, CSVLoader, {
    limit: 100
  });
  const rows: unknown[] = [];
  for await (const batch of iterator) {
    // @ts-ignore CSVLoader types are not made available here due to potential circular dependency in tsconfigs
    rows.push(...batch.data);
  }
  t.is(rows.length, 100, 'Got the correct table size with options.limit');
  t.end();
});
