// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {describe, expect, test} from 'vitest';
import {z} from 'zod';
import {
  I3SSceneLayerSchema,
  I3SPointCloudSceneLayerSchema,
  I3SNodePageSchema
} from '../src/i3s-zod-schema';

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

test.each([undefined, null])('accepts a contentless node with mesh=%s', mesh => {
  const node = {
    index: 0,
    obb: {center: [0, 0, 0], halfSize: [1, 1, 1], quaternion: [0, 0, 0, 1]},
    children: [1],
    mesh
  };
  expect(I3SNodePageSchema.parse({nodes: [node]}).nodes[0].mesh).toBe(mesh);
});

test('still rejects a malformed non-null mesh', () => {
  const node = {
    index: 0,
    obb: {center: [0, 0, 0], halfSize: [1, 1, 1], quaternion: [0, 0, 0, 1]},
    mesh: {}
  };
  expect(() => I3SNodePageSchema.parse({nodes: [node]})).toThrow();
});

test('published scene-layer JSON schema permits the omitted popup setting and declares its default', () => {
  const jsonSchema = z.toJSONSchema(I3SSceneLayerSchema, {target: 'draft-7'});
  expect(jsonSchema.required).not.toContain('disablePopup');
  expect(jsonSchema.properties?.disablePopup).toMatchObject({type: 'boolean', default: false});
});
