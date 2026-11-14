// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createDataSourceSync, isBrowser} from '@loaders.gl/core';
import {getImageType} from '@loaders.gl/images';
import {ArcGISImageServerSourceLoader} from '@loaders.gl/arcgis/bundled';
import {IMAGE_DATA_URL} from '../../../images/test/lib/test-cases';

test('ArcGIS ImageServer decodes exported PNGs as ImageBitmap', async () => {
  if (!isBrowser) await import('@loaders.gl/core/polyfills');
  const source = createDataSourceSync(
    'https://example.com/arcgis/rest/services/Imagery/ImageServer',
    [ArcGISImageServerSourceLoader],
    {}
  );
  const bytes = Uint8Array.from(atob(IMAGE_DATA_URL.split(',')[1]), character =>
    character.charCodeAt(0)
  );
  source.fetch = async () => new Response(bytes, {headers: {'content-type': 'image/png'}});
  const image = await source.exportImage({bbox: [0, 0, 1, 1], width: 2, height: 2});
  expect(getImageType(image)).toBe('imagebitmap');
  expect(image).toMatchObject({width: 2, height: 2});
  image.close();
});
