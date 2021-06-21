/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';
import {KMLLoader} from '@loaders.gl/kml';

const KML_URL = '@loaders.gl/kml/test/data/KML_Samples.kml';

const LOADERS = [OBJLoader, KMLLoader];

test('parseSync#autoParse', async (t) => {
  const data = await load(KML_URL, LOADERS);
  t.ok(data);
  t.end();
});
