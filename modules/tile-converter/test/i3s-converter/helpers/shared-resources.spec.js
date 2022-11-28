import test from 'tape-promise/tape';
import transform from 'json-map-transform';

import {SHARED_RESOURCES as sharedResourcesTemplate} from '../../../src/i3s-converter/json-templates/shared-resources';

test('#SHARED_RESOURCES - Should have arrays with three elements like [1, 1, 1]', async (t) => {
  const SHARED_RESOURCES_ENTRY = {
    materialDefinitionInfos: [
      {
        params: {}
      }
    ],
    nodePath: '1'
  };
  const PARAM_NAMES = ['ambient', 'diffuse', 'specular'];
  const EXPECTED_LENGTH = 3;

  const checkParam = (val) => !!val && val.length === EXPECTED_LENGTH;

  let r = false;
  const sharedData = transform(SHARED_RESOURCES_ENTRY, sharedResourcesTemplate());
  for (const [_i1, materialDefinitionInfo] of Object.entries(sharedData || {})) {
    for (const [_i2, info] of Object.entries(materialDefinitionInfo || {})) {
      const params = info.params || {};
      for (const p of PARAM_NAMES) {
        r = checkParam(params[p]);
        if (!r) break;
      }
      if (!r) break;
    }
    if (!r) break;
  }
  t.ok(r);
  t.end();
});
