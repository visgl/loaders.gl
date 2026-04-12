// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {WFSSource} from '@loaders.gl/wms';

const WFS_URL = 'https://example.com/geoserver/wfs';

test('WFSSource#getFeaturesURL', t => {
  const source = WFSSource.createDataSource(WFS_URL, {});
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
  t.equal(featuresUrl.searchParams.get('VERSION'), '1.3.0');
  t.equal(featuresUrl.searchParams.get('TYPENAME'), 'roads,bridges');
  t.equal(featuresUrl.searchParams.get('BBOX'), '1,2,3,4,EPSG:4326');
  t.equal(featuresUrl.searchParams.get('SRSNAME'), 'EPSG:4326');
  t.equal(featuresUrl.searchParams.get('OUTPUTFORMAT'), 'application/json');
  t.end();
});

test('WFSSource#getCapabilitiesURL defaults version', t => {
  const source = WFSSource.createDataSource(WFS_URL, {});
  const capabilitiesUrl = new URL(source.getCapabilitiesURL());

  t.equal(capabilitiesUrl.origin + capabilitiesUrl.pathname, WFS_URL, 'keeps the base WFS URL');
  t.equal(capabilitiesUrl.searchParams.get('SERVICE'), 'WFS');
  t.equal(capabilitiesUrl.searchParams.get('REQUEST'), 'GetCapabilities');
  t.equal(capabilitiesUrl.searchParams.get('VERSION'), '1.3.0');
  t.end();
});

test('WFSSource#getFeatures', async t => {
  const source = WFSSource.createDataSource(WFS_URL, {});
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

  t.deepEqual(table, {
    shape: 'geojson-table',
    ...featureCollection
  });
  t.end();
});
