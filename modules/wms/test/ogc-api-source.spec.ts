import test from 'test/utils/vitest-tape';
import {OGCAPIFeaturesSourceLoader, OGCAPITilesSourceLoader} from '@loaders.gl/wms';

const OGC_API_URL = 'https://example.com/ogcapi';

test('OGCAPIFeaturesSource#getCollections and getMetadata', async t => {
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
  t.equal(metadata.name, 'roads');
  t.equal(metadata.layers[0].title, 'Roads');
  t.end();
});

test('OGCAPIFeaturesSource#getFeatures uses standard bbox query', async t => {
  const source = OGCAPIFeaturesSourceLoader.createDataSource(OGC_API_URL, {
    'ogc-api': {collectionId: 'roads'}
  });
  source.fetch = async url => {
    t.equal(
      url,
      `${OGC_API_URL}/collections/roads/items?bbox=-10%2C-5%2C10%2C5&crs=CRS84`,
      'uses OGC API query parameters'
    );
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
  t.equal(result.shape, 'geojson-table');
  t.end();
});

test('OGCAPITilesSource#getTileURL expands both OGC and XYZ templates', t => {
  const source = OGCAPITilesSourceLoader.createDataSource(OGC_API_URL, {
    'ogc-api': {tileTemplate: `${OGC_API_URL}/tiles/{tileMatrix}/{tileRow}/{tileCol}.png`}
  });
  t.equal(source.getTileURL({z: 3, x: 4, y: 5}), `${OGC_API_URL}/tiles/3/5/4.png`);
  t.end();
});
