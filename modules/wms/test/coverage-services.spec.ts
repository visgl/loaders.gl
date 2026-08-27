import {expect, test} from 'vitest';
import {
  OGCAPICoveragesSourceLoader,
  OGCAPIEDRSourceLoader,
  WCSCoverageSourceLoader
} from '@loaders.gl/wms';

test('WCSCoverageSource builds GetCoverage requests and preserves binary responses', async () => {
  const source = WCSCoverageSourceLoader.createDataSource('https://example.com/geoserver/wcs', {
    wcs: {coverageId: 'elevation', format: 'image/tiff'}
  });
  source.fetch = async url => {
    expect(url).toContain('request=GetCoverage');
    expect(url).toContain('coverageId=elevation');
    expect(url).toContain('subset=Long%281%2C3%29');
    expect(url).toContain('subset=Lat%282%2C4%29');
    return new Response(new Uint8Array([1, 2, 3]), {
      headers: {'content-type': 'image/tiff'}
    });
  };
  const response = await source.getCoverage({bbox: [1, 2, 3, 4], width: 32, height: 16});
  expect(response).toBeInstanceOf(ArrayBuffer);
});

test('OGC API Coverages requests a collection subset and decodes JSON', async () => {
  const source = OGCAPICoveragesSourceLoader.createDataSource('https://example.com/coverages', {
    'ogc-api-coverages': {collectionId: 'temperature'}
  });
  source.fetch = async url => {
    expect(url).toContain('/collections/temperature/coverage');
    expect(url).toContain('bbox=-10%2C-5%2C10%2C5');
    expect(url).toContain('subset=Lat%2840%2C45%29');
    return new Response(JSON.stringify({type: 'Coverage', domain: {}}), {
      headers: {'content-type': 'application/json'}
    });
  };
  await expect(
    source.getCoverage({bbox: [-10, -5, 10, 5], subset: ['Lat(40,45)']})
  ).resolves.toMatchObject({type: 'Coverage'});
});

test('OGC API EDR builds a position query with temporal and parameter filters', async () => {
  const source = OGCAPIEDRSourceLoader.createDataSource('https://example.com/edr');
  source.fetch = async url => {
    expect(url).toContain('/collections/weather/position');
    expect(url).toContain('coords=POINT%2810+20%29');
    expect(url).toContain('datetime=2025-01-01');
    expect(url).toContain('parameter-name=temperature%2Cwind');
    return new Response(JSON.stringify({type: 'CoverageJSON'}), {
      headers: {'content-type': 'application/json'}
    });
  };
  await expect(
    source.query({
      collectionId: 'weather',
      queryType: 'position',
      coords: 'POINT(10 20)',
      datetime: '2025-01-01',
      parameterName: ['temperature', 'wind']
    })
  ).resolves.toMatchObject({type: 'CoverageJSON'});
});
