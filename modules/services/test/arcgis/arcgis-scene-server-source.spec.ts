import {fetchFile} from '@loaders.gl/core';
import {I3SPointCloudSource} from '@loaders.gl/i3s';
import {I3SSource} from '@loaders.gl/tiles';
import {
  ArcGISSceneServerSource,
  ArcGISSceneServerSourceLoader,
  aggregateArcGISSceneFeatures
} from '@loaders.gl/services';
import {expect, test, vi} from 'vitest';

const SCENE_SERVER_URL = 'https://example.com/arcgis/rest/services/City/SceneServer';
const MESH_FIXTURE = '@loaders.gl/i3s/test/data/conformance/i3s-1.8-3d-object.json';
const POINT_FIXTURE = '@loaders.gl/i3s/test/data/conformance/i3s-1.8-point.json';
const POINT_CLOUD_FIXTURE = '@loaders.gl/i3s/test/data/conformance/i3s-2.1-point-cloud.json';

const MESH_LAYER = {
  id: 0,
  layerType: '3DObject',
  version: '1.7',
  name: 'Buildings',
  description: 'Building scene layer',
  capabilities: ['View'],
  disablePopup: false,
  spatialReference: {wkid: 4326},
  fullExtent: {xmin: -1, ymin: -2, xmax: 3, ymax: 4, zmin: 0, zmax: 20},
  store: {
    profile: 'meshpyramids',
    version: '1.7',
    defaultGeometrySchema: {}
  },
  nodePages: {nodesPerPage: 64, lodSelectionMetricType: 'maxScreenThresholdSQ'}
};

const POINT_CLOUD_LAYER = {
  id: 0,
  layerType: 'PointCloud',
  version: '2.1',
  capabilities: ['View'],
  disablePopup: false,
  spatialReference: {wkid: 4326},
  store: {
    profile: 'pointcloud',
    version: '2.1',
    index: {nodePerIndexBlock: 64},
    defaultGeometrySchema: {geometryType: 'points', encoding: 'lepcc-xyz'}
  }
};

/** Reads a JSON fixture through the same fetch abstraction used by service consumers. */
async function loadJSONFixture(url: string): Promise<unknown> {
  const response = await fetchFile(url);
  return JSON.parse(await response.text());
}

test('ArcGISSceneServerSource normalizes metadata and creates a mesh source', async () => {
  const source = new ArcGISSceneServerSource(`${SCENE_SERVER_URL}/layers/0`, {
    'arcgis-scene-server': {token: 'secret'}
  });
  const fetch = vi.fn(async (url: string) => {
    expect(new URL(url).searchParams.get('token')).toBe('secret');
    return new Response(JSON.stringify(MESH_LAYER));
  });
  source.fetch = fetch;

  const metadata = await source.getMetadata();
  expect(metadata).toMatchObject({
    url: `${SCENE_SERVER_URL}/layers/0`,
    layerType: '3DObject',
    profile: 'meshpyramids',
    version: '1.7',
    spatialReference: {wkid: 4326}
  });
  expect(metadata.supportReport.features.geometry).toBe('supported');
  expect(await source.getTilesetSource()).toBeInstanceOf(I3SSource);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('ArcGISSceneServerSource selects Point Cloud sources', async () => {
  const source = new ArcGISSceneServerSource(`${SCENE_SERVER_URL}/layers/0`, {
    'arcgis-scene-server': {metadata: POINT_CLOUD_LAYER}
  });

  const metadata = await source.getMetadata();
  expect(metadata.layerType).toBe('PointCloud');
  expect(await source.getTilesetSource()).toBeInstanceOf(I3SPointCloudSource);
});

test('ArcGISSceneServerSource accepts mesh, Point, and Point Cloud conformance fixtures', async () => {
  const [meshLayer, pointLayer, pointCloudLayer] = await Promise.all([
    loadJSONFixture(MESH_FIXTURE),
    loadJSONFixture(POINT_FIXTURE),
    loadJSONFixture(POINT_CLOUD_FIXTURE)
  ]);

  const meshSource = new ArcGISSceneServerSource(`${SCENE_SERVER_URL}/layers/0`, {
    'arcgis-scene-server': {metadata: meshLayer}
  });
  const pointCloudSource = new ArcGISSceneServerSource(`${SCENE_SERVER_URL}/layers/1`, {
    'arcgis-scene-server': {metadata: pointCloudLayer}
  });
  const pointSource = new ArcGISSceneServerSource(`${SCENE_SERVER_URL}/layers/2`, {
    'arcgis-scene-server': {metadata: pointLayer}
  });

  expect((await meshSource.getMetadata()).version).toBe('1.8');
  expect(await meshSource.getTilesetSource()).toBeInstanceOf(I3SSource);
  expect((await pointSource.getMetadata()).version).toBe('1.8');
  expect(await pointSource.getTilesetSource()).toBeInstanceOf(I3SSource);
  expect((await pointCloudSource.getMetadata()).version).toBe('2.1');
  expect(await pointCloudSource.getTilesetSource()).toBeInstanceOf(I3SPointCloudSource);
});

test('ArcGISSceneServerSource resolves a layer ID and preserves source tokens', async () => {
  const source = new ArcGISSceneServerSource(SCENE_SERVER_URL, {
    'arcgis-scene-server': {layerId: 2, token: 'secret'},
    core: {loadOptions: {core: {fetch: async () => new Response(JSON.stringify(MESH_LAYER))}}}
  });
  source.fetch = async url => {
    expect(url).toBe(`${SCENE_SERVER_URL}/layers/2?f=pjson&token=secret`);
    return new Response(JSON.stringify(MESH_LAYER));
  };

  expect(source.getLayerURL()).toBe(`${SCENE_SERVER_URL}/layers/2`);
  await source.getMetadata();
  const tilesetSource = (await source.getTilesetSource()) as I3SSource;
  expect(tilesetSource.getTileUrl(`${SCENE_SERVER_URL}/layers/2/nodes/1`)).toBe(
    `${SCENE_SERVER_URL}/layers/2/nodes/1?token=secret`
  );
});

test('ArcGISSceneServerSource selects I3SSource for Point layers', async () => {
  const source = new ArcGISSceneServerSource(`${SCENE_SERVER_URL}/layers/0`, {
    'arcgis-scene-server': {
      metadata: {
        ...MESH_LAYER,
        layerType: 'Point',
        store: {profile: 'points', version: '1.8'},
        pointNodePages: {
          nodesPerPage: 64,
          lodSelectionMetricType: 'maxScreenThresholdSQ'
        },
        geometryDefinitions: [{geometryBuffers: []}]
      }
    }
  });

  expect((await source.getMetadata()).layerType).toBe('Point');
  expect(await source.getTilesetSource()).toBeInstanceOf(I3SSource);
});

test('ArcGISSceneServerSourceLoader detects SceneServer URLs', () => {
  expect(ArcGISSceneServerSourceLoader.testURL(`${SCENE_SERVER_URL}/layers/0`)).toBe(true);
  expect(ArcGISSceneServerSourceLoader.testURL('https://example.com/FeatureServer/0')).toBe(false);
});

test('ArcGISSceneServerSource normalizes a trailing slash before query parameters', () => {
  const source = new ArcGISSceneServerSource(`${SCENE_SERVER_URL}/layers/0/?token=url-secret`);

  expect(source.getLayerURL()).toBe(`${SCENE_SERVER_URL}/layers/0`);
  expect(source.metadataURL()).toBe(`${SCENE_SERVER_URL}/layers/0?f=pjson&token=url-secret`);
});

test('ArcGISSceneServerSource queries features with authentication and cancellation', async () => {
  const source = new ArcGISSceneServerSource(`${SCENE_SERVER_URL}/layers/0`, {
    'arcgis-scene-server': {token: 'query-secret'}
  });
  let requestedURL = '';
  let requestOptions: RequestInit | undefined;
  source.fetch = async (url, options) => {
    requestedURL = url;
    requestOptions = options;
    return new Response(
      JSON.stringify({
        features: [{attributes: {kind: 'building', height: 10}}],
        exceededTransferLimit: false
      })
    );
  };
  const controller = new AbortController();
  const result = await source.query({
    where: "kind = 'building'",
    outFields: ['kind', 'height'],
    resultRecordCount: 1,
    signal: controller.signal
  });
  const url = new URL(requestedURL);
  expect(url.pathname).toBe('/arcgis/rest/services/City/SceneServer/layers/0/query');
  expect(url.searchParams.get('token')).toBe('query-secret');
  expect(url.searchParams.get('where')).toBe("kind = 'building'");
  expect(result.features).toHaveLength(1);
  expect(requestOptions?.signal).toBe(controller.signal);
});

test('aggregateArcGISSceneFeatures groups and ignores non-numeric values', () => {
  const result = aggregateArcGISSceneFeatures({
    features: [
      {attributes: {kind: 'a', value: 2}},
      {attributes: {kind: 'a', value: '3'}},
      {attributes: {kind: 'b', value: 'invalid'}}
    ],
    groupBy: 'kind',
    aggregations: [
      {name: 'count', operation: 'count'},
      {name: 'sum', field: 'value', operation: 'sum'},
      {name: 'average', field: 'value', operation: 'average'}
    ]
  });
  expect(result).toEqual([
    {group: 'a', values: {count: 2, sum: 5, average: 2.5}},
    {group: 'b', values: {count: 1, sum: 0, average: 0}}
  ]);
});

test('aggregateArcGISSceneFeatures supports all numeric operations and plain records', () => {
  const result = aggregateArcGISSceneFeatures({
    features: [{kind: 'a', value: 2}, {kind: 'a', value: 6}, {kind: 'a', value: null}, null],
    aggregations: [
      {name: 'count', operation: 'count'},
      {name: 'min', field: 'value', operation: 'min'},
      {name: 'max', field: 'value', operation: 'max'},
      {name: 'sum', field: 'value', operation: 'sum'}
    ]
  });
  expect(result).toEqual([{group: undefined, values: {count: 4, min: 2, max: 6, sum: 8}}]);
});

test('ArcGISSceneServerSource reports query and URL errors with typed details', async () => {
  const source = new ArcGISSceneServerSource(`${SCENE_SERVER_URL}/layers/0`);
  source.fetch = async () => new Response('nope', {status: 503, statusText: 'Unavailable'});
  await expect(source.query()).rejects.toMatchObject({
    name: 'ArcGISSceneServerQueryError',
    status: 503
  });

  source.fetch = async () => new Response(JSON.stringify({error: {code: 400, message: 'bad'}}));
  await expect(source.getFeatures({f: 'pjson'})).rejects.toThrow('query returned an error');

  expect(() =>
    new ArcGISSceneServerSource('https://example.com/FeatureServer/0').getLayerURL()
  ).toThrow(/requires a \/SceneServer/);
  expect(() => new ArcGISSceneServerSource(SCENE_SERVER_URL).getLayerURL()).toThrow(/layerId/);
});
