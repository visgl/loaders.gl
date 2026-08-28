import {afterEach, describe, expect, test, vi} from 'vitest';
import {
  CapabilityGraph,
  DEFAULT_SERVICE_LOADERS,
  OGCAPICoveragesSource,
  OGCAPIEDRSource,
  OGCAPIFeaturesSource,
  OGCAPITilesSource,
  ServiceRequestError,
  ServiceRuntime,
  discoverServiceGraph
} from '@loaders.gl/wms';
import {createQueryParameterCredential} from '@loaders.gl/loader-utils';

afterEach(() => vi.unstubAllGlobals());

describe('ServiceRuntime', () => {
  test('registers every implemented OGC service source family', () => {
    expect(DEFAULT_SERVICE_LOADERS.map(loader => loader.type)).toEqual([
      'wmts',
      'wms',
      'wfs',
      'wcs-coverage',
      'ogc-api-tiles',
      'ogc-api-coverages',
      'ogc-api-edr',
      'ogc-api-features',
      'csw'
    ]);
  });

  test.each([
    ['https://example.com/collections/world/tiles', OGCAPITilesSource],
    ['https://example.com/collections/temperature/coverage', OGCAPICoveragesSource],
    ['https://example.com/collections/weather/position', OGCAPIEDRSource],
    ['https://example.com/collections/roads/items', OGCAPIFeaturesSource]
  ])('selects the specific OGC API source for %s', (url, Source) => {
    const runtime = new ServiceRuntime();
    expect(runtime.getSource(url)).toBeInstanceOf(Source);
  });

  test('retries transient responses and emits lifecycle telemetry', async () => {
    const telemetry: string[] = [];
    let attempts = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        attempts++;
        return attempts === 1 ? new Response('', {status: 503}) : new Response('ok');
      })
    );
    const runtime = new ServiceRuntime({
      retryDelay: 0,
      onTelemetry: event => telemetry.push(event.phase)
    });
    const response = await runtime.request('https://example.com/service');
    expect(response.ok).toBe(true);
    expect(attempts).toBe(2);
    expect(telemetry).toEqual(['start', 'start', 'success']);
  });

  test('normalizes terminal failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', {status: 404}))
    );
    const runtime = new ServiceRuntime({retries: 2, retryDelay: 0});
    await expect(runtime.request('https://example.com/missing')).rejects.toMatchObject({
      url: 'https://example.com/missing',
      status: 404,
      attempts: 1
    } satisfies Partial<ServiceRequestError>);
  });

  test('merges HeadersInit values and does not retry POST requests', async () => {
    let attempts = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        attempts++;
        expect(new Headers(init.headers).get('authorization')).toBe('request-token');
        return new Response('', {status: 503});
      })
    );
    const runtime = new ServiceRuntime({
      headers: new Headers([['authorization', 'default-token']]),
      retryDelay: 0
    });
    await expect(
      runtime.request('https://example.com/mutate', {
        method: 'POST',
        headers: [['authorization', 'request-token']]
      })
    ).rejects.toBeInstanceOf(ServiceRequestError);
    expect(attempts).toBe(1);
  });

  test('applies credentials and redacts telemetry URLs', async () => {
    const requestedURLs: string[] = [];
    const telemetryURLs: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async url => {
        requestedURLs.push(String(url));
        return new Response('ok');
      })
    );
    const credential = createQueryParameterCredential({
      id: 'service-token',
      origins: ['https://secure.example.com'],
      parameterName: 'token',
      token: 'secret'
    });
    const runtime = new ServiceRuntime({
      credentials: [credential],
      onTelemetry: event => telemetryURLs.push(event.url)
    });

    await runtime.request('https://secure.example.com/wms?token=legacy');

    expect(requestedURLs).toEqual(['https://secure.example.com/wms?token=legacy']);
    expect(telemetryURLs).toEqual([
      'https://secure.example.com/wms?token=%5BREDACTED%5D',
      'https://secure.example.com/wms?token=%5BREDACTED%5D'
    ]);
  });

  test('propagates runtime credentials to created sources', async () => {
    const requestedURLs: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async url => {
        requestedURLs.push(String(url));
        return new Response('ok');
      })
    );
    const runtime = new ServiceRuntime({
      credentials: [
        createQueryParameterCredential({
          id: 'source-token',
          origins: ['https://secure.example.com'],
          parameterName: 'token',
          token: 'secret'
        })
      ]
    });
    const source = runtime.getSource('https://secure.example.com/wms?service=WMS');
    const resourceURL = 'https://secure.example.com/resource';

    await source.fetch(resourceURL);

    expect(requestedURLs).toEqual(['https://secure.example.com/resource?token=secret']);
  });
});

test('CapabilityGraph ranks preferred endpoints', () => {
  const graph = new CapabilityGraph([
    {
      url: 'https://example.com/wms',
      type: 'wms',
      relation: 'service',
      capabilities: {
        type: 'wms',
        name: 'map',
        crs: ['EPSG:4326'],
        formats: ['image/png'],
        layers: [],
        operations: []
      }
    },
    {
      url: 'https://example.com/wmts',
      type: 'wmts',
      relation: 'service',
      capabilities: {
        type: 'wmts',
        name: 'tiles',
        crs: ['EPSG:3857'],
        formats: ['image/png'],
        layers: [],
        operations: []
      }
    }
  ]);
  expect(graph.rank({types: ['wmts'], crs: ['EPSG:3857']})[0].type).toBe('wmts');
});

test('discoverServiceGraph follows ArcGIS directory and OGC links', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            services: [{name: 'Imagery', type: 'ImageServer'}],
            links: [{rel: 'service-desc', href: '/api?f=json', type: 'application/json'}]
          }),
          {status: 200, headers: {'content-type': 'application/json'}}
        )
    )
  );
  const graph = await discoverServiceGraph('https://example.com/rest/services');
  expect(graph.endpoints.map(endpoint => endpoint.type)).toEqual([
    'arcgis-image-server',
    'unknown'
  ]);
  expect(graph.endpoints[0].url).toBe('https://example.com/rest/services/Imagery/ImageServer');
});

test('discoverServiceGraph preserves HTML link relationships', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response('<link rel="service-desc" href="/collections?f=json">', {
          status: 200,
          headers: {'content-type': 'text/html'}
        })
    )
  );
  const graph = await discoverServiceGraph('https://example.com/api');
  expect(graph.endpoints[0].relation).toBe('service-desc');
});
