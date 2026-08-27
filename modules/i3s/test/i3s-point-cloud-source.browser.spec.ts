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
            index: {nodePerIndexBlock: 2},
            defaultGeometrySchema: {geometryType: 'points', encoding: 'lepcc-xyz'}
          },
          nodePages: {rootIndex: 0, lodSelectionMetricType: 'density-threshold'},
          attributeStorageInfo: [
            {key: 'intensity', name: 'intensity', encoding: 'lepcc-intensity', resource: 0},
            {
              key: 'classification',
              name: 'classification',
              resource: 0,
              attributeValues: {valueType: 'UInt16', valuesPerElement: 1}
            }
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
    ],
    [
      'https://example.com/layer/nodes/0/attributes/classification/0',
      Uint16Array.from({length: 106}, () => 7).buffer
    ]
  ]);

  const fetchResource = async (url: string) => new Response(resources.get(url));
  const source = new I3SPointCloudSource('https://example.com/layer', {
    core: {loadOptions: {core: {fetch: fetchResource}}}
  });
  const root = await source.getRootTile();
  expect(root.id).toBe('0');
  expect(root.lodSelectionMetricType).toBe('density-threshold');
  expect(root.boundingVolume.cartographicBounds[1][0]).toBeLessThan(0.001);
  expect((await source.getChildren(root)).map(tile => tile.id)).toEqual(['1']);
  const content = await source.loadTileContent(root);
  expect(content?.pointCount).toBe(106);
  expect(content?.data.topology).toBe('point-list');
  expect(content?.data.data.schema.fields.map(field => field.name)).toEqual([
    'POSITION',
    'intensity',
    'classification'
  ]);
  expect(content?.coordinateSystem).toBe('lnglat-offsets');
  expect(content?.data.data.getChild('classification')?.get(0)).toBe(7);

  const cartesianSource = new I3SPointCloudSource('https://example.com/layer', {
    i3s: {coordinateSystem: 'cartesian'},
    core: {loadOptions: {core: {fetch: fetchResource}}}
  });
  const cartesianRoot = await cartesianSource.getRootTile();
  (cartesianSource as any).decoder.decodeXyz = () => new Float64Array(106 * 3);
  const cartesianContent = await cartesianSource.loadTileContent(cartesianRoot);
  const firstPosition = cartesianContent?.data.data.getChild('POSITION')?.get(0) as
    | Iterable<number>
    | undefined;
  expect(cartesianContent?.coordinateSystem).toBe('cartesian');
  expect(firstPosition ? Array.from(firstPosition)[0] : 0).toBeGreaterThan(6_000_000);
});
