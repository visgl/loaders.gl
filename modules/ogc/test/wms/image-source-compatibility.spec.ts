// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {createImageSource, WMSImageSource} from '@loaders.gl/ogc/wms';
import type {SourceLoader} from '@loaders.gl/core/loader-utils';

test.each([
  'auto',
  'fixture'
])('legacy image factory selects a %s source and forwards options', type => {
  const result = {id: 'created-source'};
  const createDataSourceSync = vi.fn(() => result);
  const source = {
    type: 'fixture',
    testURL: (url: string) => url.endsWith('/map'),
    createDataSourceSync
  } as unknown as SourceLoader;
  const loadOptions = {wms: {version: '1.3.0'}};
  expect(
    createImageSource({
      url: 'https://example.com/map',
      type,
      loadOptions,
      options: {},
      sources: [{type: 'other'} as SourceLoader, source]
    })
  ).toBe(result);
  expect(createDataSourceSync).toHaveBeenCalledExactlyOnceWith(
    'https://example.com/map',
    loadOptions
  );
});

test.each(['auto', 'unknown'])('legacy image factory rejects an unmatched %s source', type => {
  const createDataSourceSync = vi.fn();
  const source = {
    type: 'fixture',
    testURL: () => false,
    createDataSourceSync
  } as unknown as SourceLoader;
  expect(() =>
    createImageSource({
      url: 'https://example.com/unknown',
      type,
      loadOptions: {},
      options: {},
      sources: [source]
    })
  ).toThrow('Not a valid image source type');
  expect(createDataSourceSync).not.toHaveBeenCalled();
});

test('legacy image factory defaults to WMS URL detection without fetching', () => {
  const source = createImageSource({url: 'https://example.com/wms?service=WMS'} as Parameters<
    typeof createImageSource
  >[0]);
  expect(source).toBeInstanceOf(WMSImageSource);
});
