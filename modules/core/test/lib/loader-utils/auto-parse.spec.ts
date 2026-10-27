// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/scene/obj';
import {KMLLoader} from '@loaders.gl/geospatial/kml/index';
const KML_URL = '@loaders.gl/geospatial/kml/test/data/kml/KML_Samples.kml';
const LOADERS = [OBJLoader, KMLLoader];
test('parseSync#autoParse', async () => {
  const data = await load(KML_URL, LOADERS);
  expect(data).toBeTruthy();
});
