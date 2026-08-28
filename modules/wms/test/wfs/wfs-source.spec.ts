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
test('WFSSourceLoader#getFeaturesInBatches forwards GML property types', async () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {
    wfs: {propertyTypes: {height: 'number'}}
  });
  const xml =
    '<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml" xmlns:app="urn:app"><gml:featureMember><app:road><app:height>12</app:height><app:geometry><gml:Point><gml:pos>1 2</gml:pos></gml:Point></app:geometry></app:road></gml:featureMember></wfs:FeatureCollection>';
  source.fetch = async () =>
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(xml));
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
      format: 'geojson'
    },
    {batchSize: 1}
  )) {
    batches.push(batch);
  }
  expect((batches[0] as any).features[0].properties.height).toBe(12);
});
test('WFSSourceLoader#getFeatures honors configured output format', () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {
    wfs: {wfsParameters: {outputFormat: 'application/vnd.ogc.gml'}}
  });
  const featuresUrl = new URL(source.getFeaturesURL({layers: ['roads'], crs: 'EPSG:4326'}));
  expect(featuresUrl.searchParams.get('OUTPUTFORMAT')).toBe('application/vnd.ogc.gml');
});
test('WFSSourceLoader#getFeaturesURL supports paging and server-side filters', () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  const featuresUrl = new URL(
    source.getFeaturesURL({
      version: '2.0.0',
      typeName: 'roads',
      bbox: [1, 2, 3, 4, 'EPSG:4326'],
      srsName: 'EPSG:4326',
      count: 25,
      startIndex: 50,
      propertyName: ['name', 'geometry'],
      filter: '<fes:Filter><fes:PropertyIsEqualTo/></fes:Filter>',
      resultType: 'results',
      sortBy: ['name A', 'id D']
    })
  );
  expect(featuresUrl.searchParams.get('COUNT')).toBe('25');
  expect(featuresUrl.searchParams.get('STARTINDEX')).toBe('50');
  expect(featuresUrl.searchParams.get('PROPERTYNAME')).toBe('name,geometry');
  expect(featuresUrl.searchParams.get('FILTER')).toContain('<fes:Filter>');
  expect(featuresUrl.searchParams.get('RESULTTYPE')).toBe('results');
  expect(featuresUrl.searchParams.get('SORTBY')).toBe('name A,id D');
});
test('WFSSourceLoader#getFeaturesURL maps page size for WFS 1.1', () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  const featuresUrl = new URL(
    source.getFeaturesURL({
      version: '1.1.0',
      typeName: 'roads',
      bbox: [1, 2, 3, 4, 'CRS:84'],
      count: 10,
      startIndex: 20
    })
  );
  expect(featuresUrl.searchParams.get('MAXFEATURES')).toBe('10');
  expect(featuresUrl.searchParams.get('STARTINDEX')).toBe('20');
  expect(featuresUrl.searchParams.get('COUNT')).toBeNull();
});
test('WFSSourceLoader#getFeaturesURL encodes reserved filter characters', () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  const featuresUrl = new URL(
    source.getFeaturesURL({
      typeName: 'roads',
      bbox: [1, 2, 3, 4],
      filter: '<fes:Filter><fes:Literal>A&B #1</fes:Literal></fes:Filter>'
    })
  );
  expect(featuresUrl.hash).toBe('');
  expect(featuresUrl.searchParams.get('FILTER')).toBe(
    '<fes:Filter><fes:Literal>A&B #1</fes:Literal></fes:Filter>'
  );
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

test('WFSSourceLoader exposes schema, metadata, and binary feature output', async () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {});
  await expect(source.getSchema()).resolves.toEqual({metadata: {}, fields: []});
  source.getCapabilities = async () => ({title: 'WFS service'}) as any;
  await expect(source.getMetadata()).resolves.toEqual({title: 'WFS service'});

  source.fetch = async () =>
    new Response(
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {name: 'road'},
            geometry: {type: 'Point', coordinates: [1, 2]}
          }
        ]
      }),
      {headers: {'content-type': 'application/json'}}
    );
  const result = await source.getFeatures({
    boundingBox: [
      [0, 0],
      [2, 3]
    ],
    layers: ['roads'],
    format: 'binary'
  } as any);
  expect(result.shape).toBe('binary-feature-collection');
});

test('WFSSourceLoader builds auxiliary service URLs and normalizes aliases', () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {
    wfs: {vendorParameters: {token: 'base'}}
  }) as any;
  expect(source._parseWFSUrl('https://example.com/wfs?SERVICE=WFS&REQUEST=GetFeature')).toEqual({
    url: 'https://example.com/wfs',
    parameters: {SERVICE: 'WFS', REQUEST: 'GetFeature'}
  });
  expect(source._getWFS130Parameters({srs: 'EPSG:3857'})).toEqual({crs: 'EPSG:3857'});
  expect(source._getWFS130Parameters({srs: 'EPSG:3857', crs: 'CRS:84'})).toEqual({crs: 'CRS:84'});

  const featureInfo = new URL(
    source.getFeatureInfoURL(
      {
        version: '2.0.0',
        x: 4,
        y: 5,
        width: 100,
        height: 50,
        boundingBox: [
          [1, 2],
          [3, 4]
        ],
        crs: 'EPSG:4326'
      },
      {token: 'request'}
    )
  );
  expect(featureInfo.searchParams.get('I')).toBe('4');
  expect(featureInfo.searchParams.get('J')).toBe('5');
  expect(featureInfo.searchParams.get('TOKEN')).toBe('request');
  expect(new URL(source.describeLayerURL({version: '2.0.0'})).searchParams.get('REQUEST')).toBe(
    'DescribeLayer'
  );
  expect(new URL(source.getLegendGraphicURL({version: '2.0.0'})).searchParams.get('REQUEST')).toBe(
    'GetLegendGraphic'
  );
});

test('WFSSourceLoader handles axis ordering, paging aliases, and malformed bounds', () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {}) as any;
  expect(source._flipBoundingBox('invalid', {version: '2.0.0', crs: 'EPSG:4326'})).toBeNull();
  expect(source._flipBoundingBox([1, 2, 3], {version: '2.0.0', crs: 'EPSG:4326'})).toBeNull();
  expect(
    source._flipBoundingBox([1, 2, 3, 4, 'EPSG:4326'], {version: '2.0.0', crs: 'EPSG:4326'})
  ).toEqual([2, 1, 4, 3, 'EPSG:4326']);
  expect(source._getURLParameter('count', 10, {version: '1.1.0'})).toBe('MAXFEATURES=10');
  expect(source._getURLParameter('maxFeatures', 10, {version: '2.0.0'})).toBe('COUNT=10');
  expect(source._getURLParameter('srs', 'EPSG:3857', {version: '2.0.0'})).toBe('CRS=EPSG%3A3857');
  expect(source._getURLParameter('crs', 'EPSG:3857', {version: '1.1.0'})).toBe('SRS=EPSG%3A3857');
});

test('WFSSourceLoader rejects non-feature JSON and service errors', async () => {
  const source = WFSSourceLoader.createDataSource(WFS_URL, {}) as any;
  source.fetch = async () =>
    new Response(JSON.stringify({type: 'NotAFeatureCollection'}), {
      headers: {'content-type': 'application/json'}
    });
  await expect(
    source.getFeatures({
      boundingBox: [
        [0, 0],
        [1, 1]
      ],
      layers: ['roads']
    } as any)
  ).rejects.toThrow('GeoJSON FeatureCollection');

  const errorBytes = new TextEncoder().encode(
    '<ServiceExceptionReport><ServiceException code="InvalidRequest">bad request</ServiceException></ServiceExceptionReport>'
  );
  const response = new Response(errorBytes, {
    status: 200,
    headers: {'content-type': 'application/xml'}
  });
  expect(() => source._checkResponse(response, errorBytes.buffer)).toThrow();
  expect(source._parseError(errorBytes.buffer)).toBeInstanceOf(Error);
  source.fetch = async () => response;
  await expect(source._fetchArrayBuffer('https://example.com/error')).rejects.toThrow();
});
