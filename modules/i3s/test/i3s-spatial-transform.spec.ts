// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createTilesetSpatialReference} from '@loaders.gl/tiles';
import {expect, test} from 'vitest';
import {parseI3STileContent} from '../src/lib/parsers/parse-i3s-tile-content';

test('parseI3STileContent transforms mesh geometry to a requested CRS', async () => {
  const arrayBuffer = new ArrayBuffer(44);
  const dataView = new DataView(arrayBuffer);
  dataView.setUint32(0, 3, true);
  dataView.setUint32(4, 0, true);
  const positions = [0, 0, 0, 0.001, 0, 0, 0, 0.001, 0];
  positions.forEach((position, index) => dataView.setFloat32(8 + index * 4, position, true));

  const content = await parseI3STileContent(
    arrayBuffer,
    {mbs: [10, 0, 12, 100]} as any,
    {
      store: {
        normalReferenceFrame: 'earth-centered',
        defaultGeometrySchema: {
          header: [
            {property: 'vertexCount', type: 'UInt32'},
            {property: 'featureCount', type: 'UInt32'}
          ],
          ordering: ['position'],
          vertexAttributes: {
            position: {valueType: 'Float32', valuesPerElement: 3}
          },
          featureAttributeOrder: [],
          featureAttributes: {}
        }
      },
      spatialReference: createTilesetSpatialReference(
        {
          sourceCrs: 'EPSG:4326',
          coordinateFrame: 'geographic',
          axisOrder: 'xyz',
          heightReference: 'ellipsoidal',
          provenance: 'metadata'
        },
        {targetCrs: 'EPSG:3857'}
      )
    } as any
  );

  expect(content.coordinateSystem).toBe('cartesian');
  expect(content.spatialReference).toMatchObject({
    targetCrs: 'EPSG:3857',
    status: 'transformed'
  });
  expect(content.attributes.positions.value).toBeInstanceOf(Float32Array);
  expect(Array.from(content.attributes.positions.value.slice(0, 3))).toEqual([0, 0, 0]);
  expect(content.attributes.positions.value[3]).toBeCloseTo(111.31949, 4);
  expect(content.origin?.every(Number.isFinite)).toBe(true);
  expect(Array.from(content.modelMatrix).slice(12, 15)).toEqual(content.origin);
});
