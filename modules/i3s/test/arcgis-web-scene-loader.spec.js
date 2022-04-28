import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {ArcGisWebSceneLoader} from '@loaders.gl/i3s';

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

const ARCGIS_WEB_SCENE_URL = '@loaders.gl/i3s/test/data/ArcGisWebScene/arcGisWebScene.json';

test('ArcGisWebSceneLoader#should load WebScene', async (t) => {
  const webScene = await load(ARCGIS_WEB_SCENE_URL, ArcGisWebSceneLoader);

  t.ok(webScene);
  t.ok(webScene.header);
  t.equal(webScene.header.authoringApp, 'WebSceneViewer');
  t.ok(webScene.layers);

  const firstLayer = webScene.layers[0];
  const {url, ...dataWithoutUrl} = firstLayer;

  t.ok(url);
  t.equal(webScene.layers.length, 6);
  t.deepEqual(dataWithoutUrl, WEB_SCENE_FIRST_OPERATIONAL_LAYER_EXPECTED);

  t.end();
});
