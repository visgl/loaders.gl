import {expect, test, vi} from 'vitest';
import {
  OGCAPICoveragesSourceLoader,
  OGCAPIEDRSourceLoader,
  WCSCoverageSource,
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

test('WCSCoverageSource builds legacy and modern request variants', () => {
  const modern = new WCSCoverageSource('https://example.com/wcs/', {
    wcs: {version: '2.0.1', parameters: {token: 'abc'}}
  });
  const modernUrl = new URL(
    modern.getCoverageURL({
      coverageId: 'temperature',
      bbox: [1, 2, 3, 4],
      subset: ['ansi(0)'],
      subsetAxes: ['E', 'N'],
      crs: 'EPSG:4326',
      responseCRS: 'EPSG:3857',
      width: 64,
      height: 32,
      parameters: {interpolation: 'nearest'}
    })
  );
  expect(modernUrl.searchParams.getAll('subset')).toEqual(['E(1,3)', 'N(2,4)', 'ansi(0)']);
  expect(modernUrl.searchParams.get('subsetCRS')).toBe('EPSG:4326');
  expect(modernUrl.searchParams.get('outputCRS')).toBe('EPSG:3857');
  expect(modernUrl.searchParams.get('token')).toBe('abc');

  const legacy = new WCSCoverageSource('https://example.com/wcs', {wcs: {version: '1.0.0'}});
  const legacyUrl = new URL(
    legacy.getCoverageURL({
      coverageId: 'elevation',
      bbox: [1, 2, 3, 4],
      crs: 'EPSG:4326',
      responseCRS: 'EPSG:3857'
    })
  );
  expect(legacyUrl.searchParams.get('bbox')).toBe('1,2,3,4');
  expect(legacyUrl.searchParams.get('crs')).toBe('EPSG:4326');
  expect(legacyUrl.searchParams.get('responseCRS')).toBe('EPSG:3857');
  expect(new URL(legacy.getCapabilitiesURL()).searchParams.get('request')).toBe('GetCapabilities');
});

test('WCSCoverageSource normalizes capability key variants', async () => {
  const source = new WCSCoverageSource('https://example.com/wcs');
  vi.spyOn(source, 'getCapabilities').mockResolvedValue({
    ServiceIdentification: {Title: {'#text': 'Coverage service'}},
    Contents: {
      CoverageSummary: [
        {
          Identifier: 'elevation',
          Title: 'Elevation',
          Format: ['image/tiff', {'#text': 'image/lerc'}],
          WGS84BoundingBox: {LowerCorner: '-10 -5', UpperCorner: '10 5'}
        },
        {Title: 'missing identifier'}
      ]
    }
  } as any);

  await expect(source.getMetadata()).resolves.toEqual({
    title: 'Coverage service',
    coverages: [
      {
        identifier: 'elevation',
        title: 'Elevation',
        format: ['image/tiff', 'image/lerc'],
        boundingBox: [-10, -5, 10, 5]
      }
    ]
  });
});

test('WCSCoverageSource decodes LERC and reports failed responses', async () => {
  const parse = vi.fn().mockResolvedValue({width: 1, height: 1});
  const source = new WCSCoverageSource(
    'https://example.com/wcs',
    {wcs: {coverageId: 'elevation', format: 'image/lerc'}},
    {parse} as any
  );
  source.fetch = async () => new Response(new Uint8Array([1, 2, 3]));
  await expect(source.getCoverage()).resolves.toEqual({width: 1, height: 1});
  expect(parse).toHaveBeenCalledOnce();

  source.fetch = async () => new Response(null, {status: 503});
  await expect(source.getCoverage()).rejects.toThrow('WCS GetCoverage request failed: 503');
});

test('WCSCoverageSourceLoader recognizes service URLs and creates sources', () => {
  expect(WCSCoverageSourceLoader.testURL('https://example.com/geoserver/wcs')).toBe(true);
  expect(WCSCoverageSourceLoader.testURL('https://example.com/api?service=WCS')).toBe(true);
  expect(WCSCoverageSourceLoader.testURL('https://example.com/api')).toBe(false);
  expect(WCSCoverageSourceLoader.createDataSource('https://example.com/wcs')).toBeInstanceOf(
    WCSCoverageSource
  );
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
