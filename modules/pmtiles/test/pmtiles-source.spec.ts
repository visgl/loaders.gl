import {expect, test} from 'vitest';
import {isBrowser, fetchFile} from '@loaders.gl/core';
import {PMTILESETS} from './data/tilesets';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';
test('PMTilesSourceLoader#urls', async () => {
  if (!isBrowser) {
    console.log('PMTilesSourceLoader currently only supported in browser');
    return;
  }
  for (const tilesetUrl of PMTILESETS) {
    const source = PMTilesSourceLoader.createDataSource(tilesetUrl, {url: tilesetUrl});
    expect(source).toBeTruthy();
    const metadata = await source.getMetadata();
    expect(metadata).toBeTruthy();
  }
});
test('PMTilesSourceLoader#Blobs', async () => {
  if (!isBrowser) {
    console.log('PMTilesSourceLoader currently only supported in browser');
    return;
  }
  for (const tilesetUrl of PMTILESETS) {
    const response = await fetchFile(tilesetUrl);
    const blob = await response.blob();
    const source = PMTilesSourceLoader.createDataSource(blob, {url: blob});
    expect(source).toBeTruthy();
    const metadata = await source.getMetadata();
    expect(metadata).toBeTruthy();
  }
});
