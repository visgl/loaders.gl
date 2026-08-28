import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {ArcGISWebSceneLoader} from '@loaders.gl/i3s';
const ARCGIS_WEB_SCENE_WITH_SUPPORTED_LAYERS_URL =
  '@loaders.gl/i3s/test/data/arcgis-webscenes/arcgis-webscene-with-supported-layers.json';
const ARCGIS_WEB_SCENE_WITH_UNSUPPORTED_LAYER_IN_LIST_URL =
  '@loaders.gl/i3s/test/data/arcgis-webscenes/arcgis-webscene-with-one-unsupported-layer.json';
const ARCGIS_WEB_SCENE_WITH_UNSUPPORTED_CRS_URL =
  '@loaders.gl/i3s/test/data/arcgis-webscenes/arcgis-webscene-with-unsupported-crs.json';
const ARCGIS_WEB_SCENE_WITH_UNSUPPORTED_LAYERS_URL =
  '@loaders.gl/i3s/test/data/arcgis-webscenes/arcgis-webscene-with-all-unsupported-layers.json';
test('ArcGISWebSceneLoader#should load WebScene', async () => {
  const WEB_SCENE_FIRST_OPERATIONAL_LAYER_EXPECTED = {
    id: '15f2fe08c8d-layer-0',
    showLegend: true,
    opacity: 1,
    disablePopup: true,
    itemId: '01f432dabdc845bb899cdd27143e1ea6',
    layerType: 'ArcGISSceneServiceLayer',
    showLabels: false,
    title: 'Non-Project Buildings',
    visibility: true,
    screenSizePerspective: true,
    layerDefinition: {
      elevationInfo: {
        mode: 'absoluteHeight'
      },
      drawingInfo: {
        renderer: {
          authoringInfo: {},
          symbol: {
            type: 'MeshSymbol3D',
            symbolLayers: [
              {
                material: {
                  color: [255, 255, 255],
                  colorMixMode: 'replace'
                },
                type: 'Fill',
                edges: {type: 'solid', color: [0, 0, 0], transparency: 60, size: 1}
              }
            ]
          },
          type: 'simple'
        }
      }
    }
  };
  const webScene = await load(ARCGIS_WEB_SCENE_WITH_SUPPORTED_LAYERS_URL, ArcGISWebSceneLoader);
  expect(webScene).toBeTruthy();
  expect(webScene.header).toBeTruthy();
  expect(webScene.header.authoringApp).toBe('WebSceneViewer');
  expect(webScene.layers).toBeTruthy();
  expect(webScene.unsupportedLayers.length).toBe(0);
  const firstLayer = webScene.layers[0];
  const {url, ...dataWithoutUrl} = firstLayer;
  expect(url).toBeTruthy();
  expect(webScene.layers.length, 'parent layers are good').toBe(3);
  expect(webScene.layers[2]?.layers?.length, 'child layers are good').toBe(4);
  expect(dataWithoutUrl).toEqual(WEB_SCENE_FIRST_OPERATIONAL_LAYER_EXPECTED);
});
test('ArcGISWebSceneLoader#should load WebScene with partially unsupported layers', async () => {
  const webScene = await load(
    ARCGIS_WEB_SCENE_WITH_UNSUPPORTED_LAYER_IN_LIST_URL,
    ArcGISWebSceneLoader
  );
  expect(webScene).toBeTruthy();
  expect(webScene.header).toBeTruthy();
  expect(webScene.header.authoringApp).toBe('WebSceneViewer');
  expect(webScene.layers).toBeTruthy();
  expect(webScene.layers.length).toBe(1);
  expect(webScene.unsupportedLayers.length).toBe(1);
  const unsupportedLayerType = webScene.unsupportedLayers[0].layerType;
  expect(unsupportedLayerType).toBe('ArcGISFeatureLayer');
});
test('ArcGISWebSceneLoader#should return error of loading WebScene if one layer has unsupported CRS', async () => {
  try {
    await load(ARCGIS_WEB_SCENE_WITH_UNSUPPORTED_CRS_URL, ArcGISWebSceneLoader);
  } catch (error) {
    // @ts-expect-error - Object is of type 'unknown'
    expect(error.message).toBe('NOT_SUPPORTED_CRS_ERROR');
  }
});
test('ArcGISWebSceneLoader#should return error of loading WebScene if no any supported layers', async () => {
  try {
    await load(ARCGIS_WEB_SCENE_WITH_UNSUPPORTED_LAYERS_URL, ArcGISWebSceneLoader);
  } catch (error) {
    // @ts-expect-error - Object is of type 'unknown'
    expect(error.message).toBe('NO_AVAILABLE_SUPPORTED_LAYERS_ERROR');
  }
});
