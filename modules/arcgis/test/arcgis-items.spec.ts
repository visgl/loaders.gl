import {expect, test, vi} from 'vitest';
import {resolveArcGISItem} from '../src/arcgis-items';

const ITEM_ID = '0123456789abcdef0123456789abcdef';
const SERVICE_URL = 'https://services.example.com/rest/services/Test/FeatureServer';
/** Creates a tiny portal and service response transport. */
function createFetch(item = {}, service = {}, layer = {}) {
  return vi.fn(async (url: string) =>
    Response.json(
      url.includes('/content/items/')
        ? {
            id: ITEM_ID,
            title: 'Routes',
            type: 'Feature Service',
            url: SERVICE_URL,
            description: '<p>Published routes</p>',
            accessInformation: 'Publisher',
            extent: [
              [-90, 30],
              [-80, 40]
            ],
            ...item
          }
        : /\/\d+\?/.test(url)
          ? layer
          : {
              layers: [{id: 0, name: 'Routes'}, {id: 2}, {id: -1}, {}],
              tables: [{id: 1, name: 'Counts'}],
              ...service
            }
    )
  );
}

test.each([
  [ITEM_ID.toUpperCase(), 'https://www.arcgis.com/sharing/rest'],
  [
    `https://org.example.com/portal/home/item.html?id=${ITEM_ID}`,
    'https://org.example.com/portal/sharing/rest'
  ],
  [
    `https://org.example.com/portal/sharing/rest/content/items/${ITEM_ID}?f=json`,
    'https://org.example.com/portal/sharing/rest'
  ]
])('resolves %s without implicitly selecting a layer', async (input, portalUrl) => {
  const fetch = createFetch();
  const controller = new AbortController();
  const result = await resolveArcGISItem(input, {fetch, signal: controller.signal});
  expect(result.portalUrl).toBe(portalUrl);
  expect(result.item).toMatchObject({
    title: 'Routes',
    accessInformation: 'Publisher',
    description: '<p>Published routes</p>',
    extent: [
      [-90, 30],
      [-80, 40]
    ]
  });
  expect(result.layers.map(layer => [layer.id, layer.kind])).toEqual([
    [0, 'layer'],
    [2, 'layer'],
    [1, 'table']
  ]);
  expect(result.layers[1].name).toBe('2');
  expect(result.selectedLayer).toBeUndefined();
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[0][0]).toBe(`${portalUrl}/content/items/${ITEM_ID}?f=json`);
});

test('selected tables retain fields, domains and spatial reference without coercion', async () => {
  const metadata = {
    type: 'Table',
    fields: [
      {name: 'count', type: 'esriFieldTypeInteger', domain: {type: 'range', range: [0, 100]}}
    ],
    extent: {spatialReference: {wkid: 3857}}
  };
  const result = await resolveArcGISItem(ITEM_ID, {
    fetch: createFetch({}, {}, metadata),
    layerId: 1
  });
  expect(result.selectedLayer).toEqual({
    id: 1,
    name: 'Counts',
    kind: 'table',
    url: `${SERVICE_URL}/1`,
    metadata
  });
});

test.each([
  ['Map Service', 'MapServer'],
  ['Image Service', 'ImageServer'],
  ['Vector Tile Service', 'VectorTileServer']
])('exposes %s roots', async (type, endpoint) => {
  const url = `https://services.example.com/${endpoint}`;
  const result = await resolveArcGISItem(ITEM_ID, {
    fetch: createFetch({type, url}, {layers: null, tables: null}),
    layerId: null
  });
  expect(result.layers).toEqual([{id: null, name: 'Routes', kind: 'service', url}]);
  expect(result.selectedLayer?.metadata).toEqual(result.service);
});

test('scene choices use the layers path', async () => {
  const result = await resolveArcGISItem(ITEM_ID, {
    fetch: createFetch({type: 'Scene Service', url: 'https://example.com/SceneServer'})
  });
  expect(result.layers[0].url).toBe('https://example.com/SceneServer/layers/0');
});

test.each(['Feature Layer', 'Table'])('direct numbered item is one %s choice', async type => {
  const fetch = createFetch({url: `${SERVICE_URL}/3`}, {}, {type});
  const result = await resolveArcGISItem(ITEM_ID, {fetch, layerId: 3});
  expect(result.layers[0]).toMatchObject({id: 3, kind: type === 'Table' ? 'table' : 'layer'});
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('bare IDs use the explicitly configured Enterprise portal', async () => {
  const result = await resolveArcGISItem(ITEM_ID, {
    fetch: createFetch(),
    portalUrl: 'https://example.com/enterprise/'
  });
  expect(result.portalUrl).toBe('https://example.com/enterprise/sharing/rest');
});

test.each([
  'bad',
  'https://example.com/not-an-item',
  'https://example.com/home/item.html?id=wrong',
  `https://user:secret@example.com/home/item.html?id=${ITEM_ID}`,
  `https://example.com/home/item.html?id=${ITEM_ID}&token=secret`,
  `ftp://example.com/home/item.html?id=${ITEM_ID}`,
  `https://example.com/home/item.html?id=${ITEM_ID}#fragment`
])('rejects invalid or credential-bearing input before fetching: %s', async input => {
  const fetch = createFetch();
  await expect(resolveArcGISItem(input, {fetch})).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});

test('rejects cross-portal references', async () => {
  await expect(
    resolveArcGISItem(`https://example.com/home/item.html?id=${ITEM_ID}`, {
      portalUrl: 'https://other.example.com',
      fetch: createFetch()
    })
  ).rejects.toThrow('configured portal');
});

test.each([
  {type: 'Web Map'},
  {type: 'Web Scene'},
  {type: 'CSV'},
  {id: 'wrong'},
  {title: null},
  {url: 'https://example.com/MapServer'},
  {url: 'https://example.com/FeatureServer?token=secret'},
  {url: 'https://example.com/FeatureServer#fragment'},
  {url: 'https://user:secret@example.com/FeatureServer'},
  {url: 'ftp://example.com/FeatureServer'}
])('rejects unsupported or malformed item metadata %j', async item => {
  await expect(resolveArcGISItem(ITEM_ID, {fetch: createFetch(item)})).rejects.toThrow();
});

test('does not fetch a layer absent from the item', async () => {
  const fetch = createFetch();
  await expect(resolveArcGISItem(ITEM_ID, {fetch, layerId: 999})).rejects.toThrow('not present');
  expect(fetch).toHaveBeenCalledTimes(2);
});

test.each([
  null,
  [],
  {error: {code: 499, message: 'secret'}}
])('rejects malformed or error envelopes without exposing server text', async metadata => {
  await expect(
    resolveArcGISItem(ITEM_ID, {fetch: async () => Response.json(metadata)})
  ).rejects.toThrow('metadata is unavailable');
});

test('reports HTTP errors and propagates cancellation', async () => {
  await expect(
    resolveArcGISItem(ITEM_ID, {fetch: async () => new Response('', {status: 403})})
  ).rejects.toThrow('HTTP 403');
  const controller = new AbortController();
  controller.abort();
  await expect(
    resolveArcGISItem(ITEM_ID, {
      signal: controller.signal,
      fetch: async (_, options) => {
        options?.signal?.throwIfAborted();
        return Response.json({});
      }
    })
  ).rejects.toMatchObject({name: 'AbortError'});
});

test('defaults to global fetch and retains explicit named service choices', async () => {
  const transport = createFetch({}, {name: 'Published service'});
  vi.stubGlobal('fetch', transport);
  try {
    const result = await resolveArcGISItem(ITEM_ID);
    expect(result.service.name).toBe('Published service');
  } finally {
    vi.unstubAllGlobals();
  }
});

test.each([
  {url: 'https://example.com/FeatureServer/layers/0'},
  {url: 'https://example.com/unknown'},
  {type: 'Image Service', url: 'https://example.com/ImageServer/0'},
  {type: 'Scene Service', url: 'https://example.com/SceneServer/0'}
])('rejects a service URL with an invalid layer path %j', async item => {
  await expect(resolveArcGISItem(ITEM_ID, {fetch: createFetch(item)})).rejects.toThrow(
    'does not match'
  );
});
