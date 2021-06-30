import test from 'tape-promise/tape';
import {loadInBatches, fetchFile, isBrowser} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';
import {KMLLoader} from '@loaders.gl/kml';

const OBJ_ASCII_URL = '@loaders.gl/obj/test/data/bunny.obj';
const KML_URL = '@loaders.gl/kml/test/data/KML_Samples.kml';

test('loadInBatches#FileList', async (t) => {
  if (isBrowser) {
    const response = await fetchFile(OBJ_ASCII_URL);
    const blob = await response.blob();

    const iteratorPromises = await loadInBatches([blob, blob], OBJLoader);
    for await (const iterator of iteratorPromises) {
      for await (const batch of iterator) {
        // Just the one batch...
        t.equal(batch.mode, 4, 'mode is TRIANGLES (4)');
      }
    }
  }

  t.end();
});

test('loadInBatches#non-batched loader (mesh)', async (t) => {
  const batches = await loadInBatches(OBJ_ASCII_URL, OBJLoader);
  for await (const batch of batches) {
    // Just the one batch...
    t.equal(batch.data.mode, 4, 'OBJ mode is TRIANGLES (4)');
  }
  t.end();
});

test('loadInBatches#non-batched loader (gis)', async (t) => {
  const batches = await loadInBatches(KML_URL, KMLLoader, {kml: {type: 'object-row-table'}});
  for await (const batch of batches) {
    // Just the one batch...
    t.equal(batch.data.length, 20, 'KML length of data features table is correct');
  }
  t.end();
});

test('loadInBatches#FileList', async (t) => {
  if (isBrowser) {
    const response = await fetchFile(OBJ_ASCII_URL);
    const blob = await response.blob();

    const iteratorPromises = await loadInBatches([blob, blob], OBJLoader);
    for await (const iterator of iteratorPromises) {
      for await (const batch of iterator) {
        // Just the one batch...
        t.equal(batch.data.mode, 4, 'mode is TRIANGLES (4)');
      }
    }
  }

  t.end();
});
