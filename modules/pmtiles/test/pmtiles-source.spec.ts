/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {PMTilesImageSource} from '@loaders.gl/pmtiles';

test('cache getHeader', async (t) => {
  const source = new PMTilesImageSource({
    url: '@loaders.gl/pmtiles/test/data/test_fixture_1.pmtiles'
  }); // , '1');
  t.ok(source);
});

// TBA
