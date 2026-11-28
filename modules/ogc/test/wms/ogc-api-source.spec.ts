import {expect, test} from 'vitest';
import {Table as NativeArrowTable} from 'apache-arrow';
import {OGCAPIFeaturesLoader, OGCAPITilesLoader} from '@loaders.gl/ogc/wms/bundled';

const OGC_API_URL = 'https://example.com/ogcapi';

test('OGCAPIFeaturesSource#getCollections and getMetadata', async () => {
  const source = OGCAPIFeaturesLoader.createDataSourceSync(OGC_API_URL, {});
  source.fetch = async url => {
    if (url.endsWith('/collections')) {
      return new Response(
        JSON.stringify({
          collections: [
            {id: 'roads', title: 'Roads', crs: ['http://www.opengis.net/def/crs/OGC/1.3/CRS84']}
          ]
        }),
        {headers: {'content-type': 'application/json'}}
      );
    }
    return new Response(JSON.stringify({title: 'Demo API'}));
  };

  const metadata = await source.getMetadata();
  expect(metadata.name).toBe('roads');
  expect(metadata.layers[0].title).toBe('Roads');
});

test('OGCAPIFeaturesSource#getFeatures uses standard bbox query', async () => {
  const source = OGCAPIFeaturesLoader.createDataSourceSync(OGC_API_URL, {
    'ogc-api': {collectionId: 'roads'}
  });
  source.fetch = async (url, options) => {
    expect(url).toBe(
      `${OGC_API_URL}/collections/roads/items?bbox=-10%2C-5%2C10%2C5&crs=CRS84&bbox-crs=CRS84`
    );
    expect(new Headers(options?.headers).get('accept')).toContain('application/geo+json');
    return new Response(JSON.stringify({type: 'FeatureCollection', features: []}));
  };

  const result = await source.getFeatures({
    layers: 'roads',
    boundingBox: [
      [-10, -5],
      [10, 5]
    ],
    crs: 'CRS84'
  });
  expect(result.shape).toBe('geojson-table');
});

test('OGCAPIFeaturesSource#getFeatures separates bbox and output CRS', async () => {
  const source = OGCAPIFeaturesLoader.createDataSourceSync(OGC_API_URL, {
    'ogc-api': {collectionId: 'roads'}
  });
  source.fetch = async url => {
    expect(url).toBe(
      `${OGC_API_URL}/collections/roads/items?bbox=-5%2C-10%2C5%2C10&crs=EPSG%3A3857&bbox-crs=EPSG%3A4326`
    );
    return new Response(JSON.stringify({type: 'FeatureCollection', features: []}));
  };
  await source.getFeatures({
    layers: 'roads',
    boundingBox: [
      [-10, -5],
      [10, 5]
    ],
    requestCrs: 'EPSG:4326',
    crs: 'EPSG:3857'
  });
});

test('OGCAPIFeaturesSource supports binary and Arrow output', async () => {
  const source = OGCAPIFeaturesLoader.createDataSourceSync(OGC_API_URL, {
    'ogc-api': {collectionId: 'roads'}
  });
  source.fetch = async () =>
    new Response(
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {type: 'Feature', geometry: {type: 'Point', coordinates: [1, 2]}, properties: {}}
        ]
      })
    );
  const parameters = {
    layers: 'roads',
    boundingBox: [
      [-1, -1],
      [1, 1]
    ]
  } as const;
  expect((await source.getFeatures({...parameters, format: 'binary'})).shape).toBe(
    'binary-feature-collection'
  );
  expect(await source.getFeatures({...parameters, format: 'arrow'})).toBeInstanceOf(
    NativeArrowTable
  );
});

test('OGCAPIFeaturesSource handles a collection URL', async () => {
  const source = OGCAPIFeaturesLoader.createDataSourceSync(`${OGC_API_URL}/collections/roads`, {});
  source.fetch = async url => {
    expect(url).toBe(`${OGC_API_URL}/collections/roads/items?bbox=-1%2C-1%2C1%2C1`);
    return new Response(JSON.stringify({type: 'FeatureCollection', features: []}));
  };
  await source.getFeatures({
    layers: 'roads',
    boundingBox: [
      [-1, -1],
      [1, 1]
    ]
  });
});

test('OGCAPITilesSource#getTileURL expands OGC templates', () => {
  const source = OGCAPITilesLoader.createDataSourceSync(OGC_API_URL, {
    'ogc-api': {
      tileTemplate: `${OGC_API_URL}/tiles/{tileMatrix}/{tileRow}/{tileCol}.png`,
      discoverTileMatrixSet: false
    }
  });
  expect(source.getTileURL({z: 3, x: 4, y: 5})).toBe(`${OGC_API_URL}/tiles/3/5/4.png`);
});

test('OGC API Features forwards cancellation and preserves paging completion metadata', async () => {
  const source = OGCAPIFeaturesLoader.createDataSourceSync(OGC_API_URL, {});
  const controller = new AbortController();
  source.fetch = async (_url, options) => {
    expect(options?.signal).toBe(controller.signal);
    return new Response(
      JSON.stringify({
        type: 'FeatureCollection',
        features: [],
        numberMatched: 0,
        links: [{rel: 'self', href: 'items'}]
      })
    );
  };
  const table = await source.getFeatures({
    layers: 'roads',
    boundingBox: [
      [0, 0],
      [1, 1]
    ],
    format: 'geojson',
    signal: controller.signal
  });
  expect(table).toMatchObject({numberMatched: 0, links: [{rel: 'self', href: 'items'}]});
});

test.each([
  ['http://www.opengis.net/def/crs/EPSG/0/4258', '47%2C5%2C55%2C15'],
  ['http://www.opengis.net/def/crs/EPSG/9.9/4326', '47%2C5%2C55%2C15'],
  ['http://www.opengis.net/def/crs/OGC/1.3/CRS84', '5%2C47%2C15%2C55'],
  ['http://www.opengis.net/def/crs/IAU/0/30100', '5%2C47%2C15%2C55']
])('OGCAPIFeaturesSource#getFeatures sends bbox-crs %s in its axis order', async (requestCrs, bbox) => {
  const source = OGCAPIFeaturesLoader.createDataSourceSync(OGC_API_URL, {
    'ogc-api': {collectionId: 'roads'}
  });
  let requestURL = '';
  source.fetch = async url => {
    requestURL = String(url);
    return new Response(JSON.stringify({type: 'FeatureCollection', features: []}));
  };
  await source.getFeatures({
    layers: 'roads',
    boundingBox: [
      [5, 47],
      [15, 55]
    ],
    requestCrs
  });
  expect(requestURL).toContain(`bbox=${bbox}&`);
});

test('OGCAPIFeaturesSource axisOrder option overrides the built-in axis order', async () => {
  const source = OGCAPIFeaturesLoader.createDataSourceSync(OGC_API_URL, {
    'ogc-api': {collectionId: 'roads', axisOrder: 'xy'}
  });
  let requestURL = '';
  source.fetch = async url => {
    requestURL = String(url);
    return new Response(JSON.stringify({type: 'FeatureCollection', features: []}));
  };
  await source.getFeatures({
    layers: 'roads',
    boundingBox: [
      [5, 47],
      [15, 55]
    ],
    requestCrs: 'EPSG:4326'
  });
  expect(requestURL).toContain('bbox=5%2C47%2C15%2C55&');
});
