// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {ArcGISWebSceneLoader} from '@loaders.gl/i3s';
import {expect, it} from 'vitest';

const ARCGIS_WEB_SCENE_WITH_SUPPORTED_LAYERS_URL =
  '@loaders.gl/i3s/test/data/arcgis-webscenes/arcgis-webscene-with-supported-layers.json';

it('ArcGISWebSceneLoader validates CRS for every supported layer', async () => {
  const response = await fetchFile(ARCGIS_WEB_SCENE_WITH_SUPPORTED_LAYERS_URL);
  const webScene = await response.json();
  webScene.operationalLayers[1].url =
    '@loaders.gl/i3s/test/data/arcgis-webscenes/layers/not-supported-crs-layer.json';

  await expect(parse(JSON.stringify(webScene), ArcGISWebSceneLoader)).rejects.toThrow(
    'NOT_SUPPORTED_CRS_ERROR'
  );
});
