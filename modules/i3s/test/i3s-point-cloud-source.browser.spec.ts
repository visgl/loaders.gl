// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {fetchFile} from '@loaders.gl/core';
import {I3SPointCloudSource} from '@loaders.gl/i3s';
import {expect, test} from 'vitest';

const XYZ_FIXTURE = '@loaders.gl/i3s/test/data/point-cloud/SMALL_AUTZEN_LAS_All.pccxyz';
const INTENSITY_FIXTURE = '@loaders.gl/i3s/test/data/point-cloud/SMALL_AUTZEN_LAS_All.pccint';

test('I3SPointCloudSource traverses node pages and decodes content', async () => {
  const [xyzResponse, intensityResponse] = await Promise.all([
    fetchFile(XYZ_FIXTURE),
    fetchFile(INTENSITY_FIXTURE)
  ]);
  const resources = new Map<string, ArrayBuffer>([
    [
      'https://example.com/layer',
      new TextEncoder().encode(
        JSON.stringify({
          id: 1,
          layerType: 'PointCloud',
          version: '2.1',
          capabilities: [],
          disablePopup: false,
          store: {
            profile: 'pointcloud',
            version: '2.1',
            defaultGeometrySchema: {geometryType: 'points', encoding: 'lepcc-xyz'}
          },
          nodePages: {nodesPerPage: 2, rootIndex: 0, lodSelectionMetricType: 'density-threshold'},
          attributeInfo: [
            {key: 'intensity', name: 'intensity', encoding: 'lepcc-intensity', resource: 0}
          ]
        })
      ).buffer
    ],
    [
      'https://example.com/layer/nodepages/0',
      new TextEncoder().encode(
        JSON.stringify({
          nodes: [
            {
              resourceId: 0,
              obb: {center: [0, 0, 0], halfSize: [10, 10, 10], quaternion: [0, 0, 0, 1]},
              vertexCount: 106,
              firstChild: 1,
              childCount: 1,
              lodThreshold: 1
            },
            {
              resourceId: 1,
              obb: {center: [1, 1, 1], halfSize: [1, 1, 1], quaternion: [0, 0, 0, 1]},
              vertexCount: 106
            }
          ]
        })
      ).buffer
    ],
    ['https://example.com/layer/nodes/0/geometries/0', await xyzResponse.arrayBuffer()],
    [
      'https://example.com/layer/nodes/0/attributes/intensity/0',
      await intensityResponse.arrayBuffer()
    ]
  ]);

  const source = new I3SPointCloudSource('https://example.com/layer', {
    core: {loadOptions: {core: {fetch: async (url: string) => new Response(resources.get(url))}}}
  });
  const root = await source.getRootTile();
  expect(root.id).toBe('0');
  expect(root.lodSelectionMetricType).toBe('density-threshold');
  expect((await source.getChildren(root)).map(tile => tile.id)).toEqual(['1']);
  const content = await source.loadTileContent(root);
  expect(content?.pointCount).toBe(106);
  expect(content?.data.topology).toBe('point-list');
  expect(content?.data.data.schema.fields.map(field => field.name)).toEqual([
    'POSITION',
    'intensity'
  ]);
});
