// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {discoverArcGISCapabilities, selectArcGISService} from '../src/index';

const ROOT_URL = 'https://example.com/arcgis/rest/services';

describe('ArcGIS capability graph boundaries', () => {
  test('normalizes every service family and provider metadata shape', async () => {
    const graph = await discoverArcGISCapabilities(ROOT_URL, {
      fetch: async input => {
        const url = String(input);
        if (url === `${ROOT_URL}?f=pjson`) {
          return jsonResponse({
            services: [
              {name: 'Features', type: 'FeatureServer'},
              {name: 'Imagery', type: 'ImageServer'},
              {name: 'Map', type: 'MapServer'},
              {name: 'Scene', type: 'SceneServer'},
              {name: 'Vector', type: 'VectorTileServer'},
              {name: 'Mystery', type: 'UnknownServer'}
            ]
          });
        }
        if (url.includes('/Scene/SceneServer/layers/0')) {
          return jsonResponse({
            name: 'Buildings detail',
            store: {profile: 'meshpyramids', version: '2.0'},
            spatialReference: {latestWkid: 4978},
            extent: {xmin: 0, ymin: 1, xmax: 2, ymax: 3}
          });
        }
        if (url.includes('/Scene/SceneServer/layers/failing')) {
          return new Response('', {status: 503});
        }
        if (url.includes('/Scene/SceneServer?')) {
          return jsonResponse({
            name: 'Scene title',
            description: 'Scene description',
            capabilities: 'Query, ,Extract',
            layers: [
              null,
              'invalid',
              {name: 'No id'},
              {id: 0, name: 'Buildings'},
              {id: 'failing', name: 'Fallback', profile: 'points', version: '1.0'},
              {
                id: 2,
                name: 'Integrated mesh',
                url: 'https://cdn.example.com/layer',
                profile: 'mesh-pyramids',
                version: '1.2',
                layerType: 'IntegratedMesh',
                spatialReference: {wkid: 4326},
                extent: {xmin: -1, ymin: -2, xmax: 3, ymax: 4}
              },
              {id: 3, name: 'Invalid extent', extent: {xmin: 0}}
            ]
          });
        }
        if (url.includes('/Features/FeatureServer')) {
          return jsonResponse({
            name: 'Feature title',
            description: 'Feature description',
            supportedQueryFormats: ' JSON, GeoJSON, JSON ',
            spatialReference: {wkid: 4326, latestWkid: 3857},
            fullExtent: {spatialReference: {wkid: 4326}},
            capabilities: 'Query, Editing'
          });
        }
        if (url.includes('/Imagery/ImageServer')) {
          return jsonResponse({supportedImageFormatTypes: 'PNG, JPEG'});
        }
        if (url.includes('/Vector/VectorTileServer')) {
          return jsonResponse({tileInfo: {format: 'PBF'}});
        }
        return jsonResponse({});
      }
    });

    expect(graph?.nodes.map(node => [node.name, node.kind, node.capabilities.type])).toEqual([
      ['Features', 'vector', 'arcgis-feature-server'],
      ['Imagery', 'image', 'arcgis-image-server'],
      ['Map', 'tile', 'arcgis-map-server'],
      ['Scene', 'scene', 'arcgis-scene-server'],
      ['Vector', 'tile', 'arcgis-vector-tile-server'],
      ['Mystery', 'unknown', 'unknown']
    ]);

    const features = graph?.nodes[0];
    expect(features?.capabilities).toMatchObject({
      title: 'Feature title',
      abstract: 'Feature description',
      formats: ['geojson', 'json'],
      crs: ['EPSG:3857', 'EPSG:4326'],
      operations: ['Query', 'Editing']
    });

    const scene = graph?.nodes[3];
    expect(scene?.capabilities.layers).toEqual([
      {
        name: 'No id',
        id: undefined,
        url: undefined,
        title: 'No id',
        crs: undefined,
        bounds: undefined,
        profile: undefined,
        layerType: undefined,
        version: undefined
      },
      {
        name: '0',
        id: '0',
        url: `${ROOT_URL}/Scene/SceneServer/layers/0`,
        title: 'Buildings',
        crs: ['EPSG:4978'],
        bounds: [0, 1, 2, 3],
        profile: 'meshpyramids',
        layerType: undefined,
        version: '2.0'
      },
      {
        name: 'failing',
        id: 'failing',
        url: `${ROOT_URL}/Scene/SceneServer/layers/failing`,
        title: 'Fallback',
        crs: undefined,
        bounds: undefined,
        profile: 'points',
        layerType: undefined,
        version: '1.0'
      },
      {
        name: '2',
        id: '2',
        url: 'https://cdn.example.com/layer',
        title: 'Integrated mesh',
        crs: ['EPSG:4326'],
        bounds: [-1, -2, 3, 4],
        profile: 'mesh-pyramids',
        layerType: 'IntegratedMesh',
        version: '1.2'
      },
      {
        name: '3',
        id: '3',
        url: `${ROOT_URL}/Scene/SceneServer/layers/3`,
        title: 'Invalid extent',
        crs: undefined,
        bounds: undefined,
        profile: undefined,
        layerType: undefined,
        version: undefined
      }
    ]);

    expect(selectArcGISService(graph!, {kind: 'vector', format: 'GEOJSON', crs: 'EPSG:4326'})).toBe(
      features
    );
    expect(selectArcGISService(graph!, {kind: 'scene', profile: 'meshpyramids'})).toBe(scene);
    expect(selectArcGISService(graph!, {profile: 'mesh-pyramids'})).toBe(scene);
    expect(selectArcGISService(graph!, {layerId: 0})).toBe(scene);
    expect(selectArcGISService(graph!, {layerId: 'No id'})).toBe(scene);
    expect(selectArcGISService(graph!, {format: 'missing'})).toBeUndefined();
    expect(selectArcGISService(graph!, {crs: 'EPSG:0'})).toBeUndefined();
    expect(selectArcGISService(graph!, {profile: 'missing'})).toBeUndefined();
    expect(selectArcGISService(graph!, {layerId: 'missing'})).toBeUndefined();
  });

  test('returns null outside ArcGIS directories and reports metadata failures', async () => {
    await expect(
      discoverArcGISCapabilities('https://example.com/not-arcgis', {
        fetch: async () => jsonResponse({})
      })
    ).resolves.toBeNull();

    await expect(
      discoverArcGISCapabilities(ROOT_URL, {
        fetch: async input =>
          String(input) === `${ROOT_URL}?f=pjson`
            ? jsonResponse({services: [{name: 'Broken', type: 'MapServer'}]})
            : new Response('', {status: 404})
      })
    ).rejects.toThrow('metadata request failed: 404');
  });
});

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {headers: {'content-type': 'application/json'}});
}
