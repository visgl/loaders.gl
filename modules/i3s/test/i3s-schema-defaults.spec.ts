// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {describe, expect, test} from 'vitest';
import {I3SSceneLayerSchema, I3SPointCloudSceneLayerSchema} from '../src/i3s-zod-schema';

const SCENE_LAYER_SCHEMAS = [
  {
    name: 'mesh',
    schema: I3SSceneLayerSchema,
    layer: {
      id: 0,
      layerType: '3DObject',
      version: '1.10',
      capabilities: ['View'],
      store: {profile: 'meshpyramids', version: '1.10'}
    }
  },
  {
    name: 'point cloud',
    schema: I3SPointCloudSceneLayerSchema,
    layer: {
      id: 0,
      layerType: 'PointCloud',
      version: '2.1',
      capabilities: ['View'],
      store: {
        profile: 'pointcloud',
        version: '2.1',
        defaultGeometrySchema: {geometryType: 'points'}
      },
      nodePages: {nodesPerPage: 1}
    }
  }
];

describe.each(SCENE_LAYER_SCHEMAS)('$name scene-layer popup defaults', ({schema, layer}) => {
  test.each([
    undefined,
    false,
    true
  ])('accepts disablePopup=%s with the specified default', disablePopup => {
    const document = disablePopup === undefined ? layer : {...layer, disablePopup};
    expect(schema.parse(document).disablePopup).toBe(disablePopup ?? false);
  });
  test.each(['false', null])('rejects invalid disablePopup=%s', disablePopup => {
    expect(() => schema.parse({...layer, disablePopup})).toThrow();
  });
});
