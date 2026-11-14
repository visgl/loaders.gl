// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createDataSourceSync} from '@loaders.gl/core';
import {WMSSourceLoader, WMSImageSource, type ImageSource} from '@loaders.gl/ogc/wms';

test('creates a WMS image source synchronously from a service URL', () => {
  const source: ImageSource = createDataSourceSync(
    'https://example.com/wms?service=WMS',
    [WMSSourceLoader],
    {wms: {version: '1.3.0'}}
  );
  expect(source).toBeInstanceOf(WMSImageSource);
});
