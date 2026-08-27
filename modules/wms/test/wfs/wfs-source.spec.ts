// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {WFSSourceLoader} from '@loaders.gl/wms';
import {expect, test as vitestTest} from 'vitest';

const WFS_URL = 'https://example.com/geoserver/wfs';

test('WFSSourceLoader#getFeaturesURL', t => {
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

  t.equal(featuresUrl.origin + featuresUrl.pathname, WFS_URL, 'keeps the base WFS URL');
  t.equal(featuresUrl.searchParams.get('SERVICE'), 'WFS');
  t.equal(featuresUrl.searchParams.get('REQUEST'), 'GetFeature');
  t.equal(featuresUrl.searchParams.get('VERSION'), '2.0.0');
  t.equal(featuresUrl.searchParams.get('TYPENAME'), 'roads,bridges');
  t.equal(featuresUrl.searchParams.get('BBOX'), '2,1,4,3,EPSG:4326');
  t.equal(featuresUrl.searchParams.get('SRSNAME'), 'EPSG:4326');
  t.equal(featuresUrl.searchParams.get('OUTPUTFORMAT'), 'application/json');
  t.end();
});

test('WFSSourceLoader#getCapabilitiesURL defaults version', t => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  const capabilitiesUrl = new URL(source.getCapabilitiesURL());

  t.equal(capabilitiesUrl.origin + capabilitiesUrl.pathname, WFS_URL, 'keeps the base WFS URL');
  t.equal(capabilitiesUrl.searchParams.get('SERVICE'), 'WFS');
  t.equal(capabilitiesUrl.searchParams.get('REQUEST'), 'GetCapabilities');
  t.equal(capabilitiesUrl.searchParams.get('VERSION'), '2.0.0');
  t.end();
});

test('WFSSourceLoader#getFeatures returns Arrow by default', async t => {
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

  t.equal(table.shape, 'arrow-table', 'returns Arrow tables by default');
  t.equal(table.data.numRows, 1, 'preserves feature rows');
  t.ok(table.schema?.metadata?.geo, 'adds GeoArrow metadata');
  t.end();
});

test('WFSSourceLoader#getFeatures supports explicit GeoJSON', async t => {
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

  t.deepEqual(table, {
    shape: 'geojson-table',
    ...featureCollection
  });
  t.end();
});

vitestTest('WFSSourceLoader#getFeatures parses GML feature responses', async () => {
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

vitestTest('WFSSourceLoader#getFeaturesInBatches streams GML into Arrow batches', async () => {
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

vitestTest('WFSSourceLoader#getFeatures honors configured output format', () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {
    wfs: {wfsParameters: {outputFormat: 'application/vnd.ogc.gml'}}
  });
  const featuresUrl = new URL(source.getFeaturesURL({layers: ['roads'], crs: 'EPSG:4326'}));

  expect(featuresUrl.searchParams.get('OUTPUTFORMAT')).toBe('application/vnd.ogc.gml');
});

vitestTest(
  'WFSSourceLoader#getFeaturesInBatches rejects successful WFS exception responses',
  async () => {
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
          // The response should fail before any feature batch is emitted.
        }
      })()
    ).rejects.toThrow('exception document');
  }
);
