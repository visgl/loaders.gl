import test from 'tape-promise/tape';
import transform from 'json-map-transform';

import {SHARED_RESOURCES as sharedResourcesTemplate} from '../../../src/i3s-converter/json-templates/shared-resources';

test('tile-converter(i3s-converter)#json-templates - shared-resources - Verify the default shared data', async (t) => {
  const SHARED_RESOURCES_ENTRY = {
    materialDefinitionInfos: [
      {
        params: {}
      }
    ],
    nodePath: '1'
  };

  const EXPECTED_DATA = {
    Mat10: {
      name: 'standard',
      type: 'standard',
      params: {
        renderMode: 'solid',
        shininess: 1,
        reflectivity: 0,
        ambient: [1, 1, 1],
        diffuse: [1, 1, 1],
        specular: [0, 0, 0],
        useVertexColorAlpha: false,
        vertexRegions: false,
        vertexColors: true
      }
    }
  };

  const sharedData = transform(SHARED_RESOURCES_ENTRY, sharedResourcesTemplate());
  t.deepEquals(sharedData ? sharedData.materialDefinitions : {}, EXPECTED_DATA);
  t.end();
});
