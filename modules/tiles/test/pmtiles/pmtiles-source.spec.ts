import {expect, test} from 'vitest';
import {createDataSource, fetchFile, isBrowser} from '@loaders.gl/core';
import {PMTILESETS} from './data/tilesets';
import {PMTilesLoader, PMTilesSourceLoader} from '@loaders.gl/tiles/pmtiles';
test('PMTilesSourceLoader#urls', async () => {
  if (!isBrowser) {
    console.log('PMTilesSourceLoader currently only supported in browser');
    return;
  }
  for (const tilesetUrl of PMTILESETS) {
    const source = PMTilesSourceLoader.createDataSourceSync(tilesetUrl, {url: tilesetUrl});
    expect(source).toBeTruthy();
    const metadata = await source.getMetadata();
    expect(metadata).toBeTruthy();
  }
});
test('PMTilesLoader creates a source from a Blob', async () => {
  if (!isBrowser) {
    console.log('PMTilesSourceLoader currently only supported in browser');
    return;
  }
  for (const tilesetUrl of PMTILESETS) {
    const response = await fetchFile(tilesetUrl);
    const blob = await response.blob();
    const source = await createDataSource(blob, PMTilesLoader);
    expect(source).toBeTruthy();
    const metadata = await source.getMetadata();
    expect(metadata).toBeTruthy();
  }
});
