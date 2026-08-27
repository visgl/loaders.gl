import {expect, test} from 'vitest';
import {OGCAPIFeaturesSourceLoader, OGCAPITilesSourceLoader} from '@loaders.gl/wms';

const OGC_API_URL = 'https://example.com/ogcapi';

test('OGCAPIFeaturesSource#getCollections and getMetadata', async () => {
  const source = OGCAPIFeaturesSourceLoader.createDataSource(OGC_API_URL, {});
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
  const source = OGCAPIFeaturesSourceLoader.createDataSource(OGC_API_URL, {
    'ogc-api': {collectionId: 'roads'}
  });
  source.fetch = async (url, options) => {
    expect(url).toBe(`${OGC_API_URL}/collections/roads/items?bbox=-10%2C-5%2C10%2C5&crs=CRS84`);
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

test('OGCAPIFeaturesSource supports binary and Arrow output', async () => {
  const source = OGCAPIFeaturesSourceLoader.createDataSource(OGC_API_URL, {
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
  expect((await source.getFeatures({...parameters, format: 'arrow'})).shape).toBe('arrow-table');
});

test('OGCAPIFeaturesSource handles a collection URL', async () => {
  const source = OGCAPIFeaturesSourceLoader.createDataSource(
    `${OGC_API_URL}/collections/roads`,
    {}
  );
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
  const source = OGCAPITilesSourceLoader.createDataSource(OGC_API_URL, {
    'ogc-api': {tileTemplate: `${OGC_API_URL}/tiles/{tileMatrix}/{tileRow}/{tileCol}.png`}
  });
  expect(source.getTileURL({z: 3, x: 4, y: 5})).toBe(`${OGC_API_URL}/tiles/3/5/4.png`);
});
