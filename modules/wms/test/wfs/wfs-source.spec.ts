// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {WFSSourceLoader} from '@loaders.gl/wms';
const WFS_URL = 'https://example.com/geoserver/wfs';
test('WFSSourceLoader#getFeaturesURL', () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  const featuresUrl = new URL(
    source.getFeaturesURL({
      boundingBox: [
        [1, 2],
        [3, 4]
      ],
      layers: ['roads', 'bridges'],
      crs: 'EPSG:4326'
    })
  );
  expect(featuresUrl.origin + featuresUrl.pathname, 'keeps the base WFS URL').toBe(WFS_URL);
  expect(featuresUrl.searchParams.get('SERVICE')).toBe('WFS');
  expect(featuresUrl.searchParams.get('REQUEST')).toBe('GetFeature');
  expect(featuresUrl.searchParams.get('VERSION')).toBe('2.0.0');
  expect(featuresUrl.searchParams.get('TYPENAME')).toBe('roads,bridges');
  expect(featuresUrl.searchParams.get('BBOX')).toBe('2,1,4,3,EPSG:4326');
  expect(featuresUrl.searchParams.get('SRSNAME')).toBe('EPSG:4326');
  expect(featuresUrl.searchParams.get('OUTPUTFORMAT')).toBe('application/json');
});
test('WFSSourceLoader#getCapabilitiesURL defaults version', () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  const capabilitiesUrl = new URL(source.getCapabilitiesURL());
  expect(capabilitiesUrl.origin + capabilitiesUrl.pathname, 'keeps the base WFS URL').toBe(WFS_URL);
  expect(capabilitiesUrl.searchParams.get('SERVICE')).toBe('WFS');
  expect(capabilitiesUrl.searchParams.get('REQUEST')).toBe('GetCapabilities');
  expect(capabilitiesUrl.searchParams.get('VERSION')).toBe('2.0.0');
});
test('WFSSourceLoader#getFeaturesURL supports WFS 1.1.0 parameter conventions', () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  const featuresUrl = new URL(
    source.getFeaturesURL({
      version: '1.1.0',
      typeName: 'roads',
      bbox: [1, 2, 3, 4],
      crs: 'EPSG:3857'
    })
  );
  expect(featuresUrl.searchParams.get('VERSION')).toBe('1.1.0');
  expect(featuresUrl.searchParams.get('BBOX')).toBe('1,2,3,4');
  expect(featuresUrl.searchParams.get('SRSNAME')).toBe('EPSG:3857');
  const mapUrl = new URL(
    source.getMapURL({
      version: '1.1.0',
      bbox: [1, 2, 3, 4],
      width: 256,
      height: 256,
      crs: 'EPSG:3857'
    })
  );
  expect(mapUrl.searchParams.get('SRS')).toBe('EPSG:3857');
});
test('WFSSourceLoader#getFeatures returns Arrow by default', async () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  const featureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [1, 2]},
        properties: {name: 'Road'}
      }
    ]
  };
  source.fetch = async () => new Response(JSON.stringify(featureCollection));
  const table = await source.getFeatures({
    boundingBox: [
      [1, 2],
      [3, 4]
    ],
    layers: ['roads'],
    crs: 'EPSG:4326'
  });
  expect(table.shape, 'returns Arrow tables by default').toBe('arrow-table');
  expect(table.data.numRows, 'preserves feature rows').toBe(1);
  expect(table.schema?.metadata?.geo, 'adds GeoArrow metadata').toBeTruthy();
});
test('WFSSourceLoader#getFeatures supports explicit GeoJSON', async () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  const featureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [1, 2]},
        properties: {name: 'Road'}
      }
    ]
  };
  source.fetch = async () => new Response(JSON.stringify(featureCollection));
  const table = await source.getFeatures({
    boundingBox: [
      [1, 2],
      [3, 4]
    ],
    layers: ['roads'],
    crs: 'EPSG:4326',
    format: 'geojson'
  });
  expect(table).toEqual({
    shape: 'geojson-table',
    ...featureCollection
  });
});
test('WFSSourceLoader#getFeatures parses GML feature responses', async () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  source.fetch = async () =>
    new Response(
      '<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml" xmlns:app="urn:app"><gml:featureMember><app:road gml:id="road.1"><app:name>Main Street</app:name><app:geometry><gml:Point><gml:pos>1 2</gml:pos></gml:Point></app:geometry></app:road></gml:featureMember></wfs:FeatureCollection>',
      {headers: {'content-type': 'application/xml'}}
    );
  const table = await source.getFeatures({
    boundingBox: [
      [0, 0],
      [3, 3]
    ],
    layers: ['roads'],
    crs: 'EPSG:4326'
  });
  expect(table.shape).toBe('arrow-table');
  expect(table.data.numRows).toBe(1);
});
test('WFSSourceLoader#getFeaturesInBatches streams GML into Arrow batches', async () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  const xml =
    '<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml" xmlns:app="urn:app"><gml:featureMember><app:road gml:id="road.1"><app:geometry><gml:Point><gml:pos>1 2</gml:pos></gml:Point></app:geometry></app:road></gml:featureMember><gml:featureMember><app:road gml:id="road.2"><app:geometry><gml:Point><gml:pos>3 4</gml:pos></gml:Point></app:geometry></app:road></gml:featureMember></wfs:FeatureCollection>';
  source.fetch = async () =>
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(xml.slice(0, 180)));
          controller.enqueue(new TextEncoder().encode(xml.slice(180)));
          controller.close();
        }
      }),
      {headers: {'content-type': 'application/gml+xml'}}
    );
  const batches = [];
  for await (const batch of source.getFeaturesInBatches(
    {
      boundingBox: [
        [0, 0],
        [5, 5]
      ],
      layers: ['roads'],
      crs: 'EPSG:4326'
    },
    {batchSize: 1}
  )) {
    batches.push(batch);
  }
  expect(batches).toHaveLength(2);
  expect(batches[0].data.numRows).toBe(1);
});
test('WFSSourceLoader#getFeatures honors configured output format', () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {
    wfs: {wfsParameters: {outputFormat: 'application/vnd.ogc.gml'}}
  });
  const featuresUrl = new URL(source.getFeaturesURL({layers: ['roads'], crs: 'EPSG:4326'}));
  expect(featuresUrl.searchParams.get('OUTPUTFORMAT')).toBe('application/vnd.ogc.gml');
});
test('WFSSourceLoader#getFeaturesInBatches rejects successful WFS exception responses', async () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  source.fetch = async () =>
    new Response(
      '<ServiceExceptionReport><ServiceException>Denied</ServiceException></ServiceExceptionReport>',
      {
        headers: {'content-type': 'application/xml'}
      }
    );
  await expect(
    (async () => {
      for await (const _batch of source.getFeaturesInBatches({layers: ['roads']})) {
      }
    })()
  ).rejects.toThrow('exception document');
});
