// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {encodePotreeDataset, PotreeSourceLoader} from '@loaders.gl/potree';
import {getPathPrefix, setPathPrefix} from '@loaders.gl/loader-utils';
import {Potree2Source} from '../src/potree2-source';
import {createPoints, createDatasetFetch} from './potree-format-fixtures';

test.each([
  './dataset/metadata.json',
  './dataset',
  '/dataset'
])('resolves browser relative dataset %s against document base', async input => {
  const base = vi
    .spyOn(document, 'baseURI', 'get')
    .mockReturnValue('https://example.com/viewer/../');
  const transport = createDatasetFetch(await encodePotreeDataset(createPoints()));
  const prefix = getPathPrefix();
  setPathPrefix('');
  const source = new Potree2Source(input, {core: {fetch: transport.fetch}});
  try {
    expect((await source.getRootTile()).pointCount).toBe(2);
    expect(transport.requests[0].url).toBe('https://example.com/dataset/metadata.json');
  } finally {
    source.close();
    setPathPrefix(prefix);
    base.mockRestore();
  }
});

test('uses the resolved source path prefix before opening a dataset', async () => {
  const transport = createDatasetFetch(await encodePotreeDataset(createPoints()));
  const prefix = getPathPrefix();
  setPathPrefix('https://example.com/');
  const source = PotreeSourceLoader.createDataSource('dataset/metadata.json', {
    core: {fetch: transport.fetch}
  });
  try {
    await source.initialize();
    expect(transport.requests[0].url).toBe('https://example.com/dataset/metadata.json');
  } finally {
    source.close();
    setPathPrefix(prefix);
  }
});

test('legacy URL query text does not select the modern dataset reader', async () => {
  const transport = createDatasetFetch(
    await encodePotreeDataset(createPoints(), {potree: {version: '1.8'}})
  );
  const source = PotreeSourceLoader.createDataSource(
    'https://example.com/dataset/cloud.js?token=/metadata.json',
    {core: {fetch: transport.fetch}}
  );
  try {
    const root = await source.getRootTile();
    expect((await source.loadTileContent(root))?.pointCount).toBe(2);
    expect(
      transport.requests.every(request => new URL(request.url).search === '?token=/metadata.json')
    ).toBe(true);
  } finally {
    source.close();
  }
});
