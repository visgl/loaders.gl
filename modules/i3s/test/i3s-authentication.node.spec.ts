// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  createQueryParameterCredential,
  getAuthenticatedFetch,
  type LoaderContext
} from '@loaders.gl/loader-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {loadFeatureAttributes} from '../src/i3s-attribute-loader-with-parser';
import I3SNodePagesTiles from '../src/lib/helpers/i3s-nodepages-tiles';
import {loadStatistics} from '../src/i3s-statistics';
import {parseWebscene} from '../src/lib/parsers/parse-arcgis-webscene';
import {TILESET_STUB} from './test-utils/load-utils';

afterEach(() => vi.unstubAllGlobals());

const credential = createQueryParameterCredential({
  id: 'arcgis-token',
  origins: ['https://example.com'],
  parameterName: 'token',
  token: 'secret-token'
});

describe('I3S authentication', () => {
  test('applies core credentials to node-page requests', async () => {
    const requestedUrls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        requestedUrls.push(url);
        return new Response(
          JSON.stringify({
            nodes: [
              {
                index: 0,
                obb: {
                  center: [8.67, 50.1, 189],
                  halfSize: [10, 20, 30],
                  quaternion: [0, 0, 0, 1]
                },
                children: []
              }
            ]
          })
        );
      })
    );

    const nodePagesTiles = new I3SNodePagesTiles(
      TILESET_STUB(),
      'https://example.com/SceneServer/layers/0',
      {core: {credentials: [credential]}}
    );

    await nodePagesTiles.getNodeById(0);

    expect(requestedUrls).toEqual([
      'https://example.com/SceneServer/layers/0/nodepages/0?token=secret-token'
    ]);
  });

  test('applies core credentials to feature attribute requests', async () => {
    const objectIds = readFixture('./data/attributes/f_0/0/index.bin');
    const names = readFixture('./data/attributes/f_1/0/index.bin');
    const requestedUrls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        requestedUrls.push(url);
        return new Response(url.includes('/f_0/') ? objectIds : names);
      })
    );

    const attributes = await loadFeatureAttributes(
      {
        tileset: {
          tileset: {
            attributeStorageInfo: [
              {key: 'f_0', name: 'OBJECTID', objectIds: []},
              {key: 'f_1', name: 'NAME', attributeValues: {valueType: 'String'}}
            ]
          }
        },
        header: {
          attributeUrls: [
            'https://example.com/SceneServer/layers/0/attributes/f_0/0',
            'https://example.com/SceneServer/layers/0/attributes/f_1/0'
          ]
        }
      },
      979297,
      {core: {credentials: [credential]}}
    );

    expect(attributes).toBeTruthy();
    expect(requestedUrls).toEqual([
      'https://example.com/SceneServer/layers/0/attributes/f_0/0?token=secret-token',
      'https://example.com/SceneServer/layers/0/attributes/f_1/0?token=secret-token'
    ]);
  });

  test('applies core credentials to statistics requests', async () => {
    const requestedUrls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        requestedUrls.push(url);
        return new Response(JSON.stringify({count: 1}));
      })
    );

    const statistics = await loadStatistics(
      [{key: 'height', name: 'Height', href: './statistics/height'}],
      {
        core: {
          baseUrl: 'https://example.com/SceneServer/layers/0',
          credentials: [credential]
        }
      }
    );

    expect(statistics).toEqual({height: {count: 1}});
    expect(requestedUrls).toEqual([
      'https://example.com/SceneServer/layers/0/statistics/height?token=secret-token'
    ]);
  });

  test('applies core credentials to WebScene metadata requests', async () => {
    const requestedUrls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        requestedUrls.push(url);
        return new Response(JSON.stringify({spatialReference: {wkid: 4326}}));
      })
    );

    const webScene = await parseWebscene(
      JSON.stringify({
        operationalLayers: [
          {
            layerType: 'ArcGISSceneServiceLayer',
            url: 'https://example.com/SceneServer/layers/0'
          }
        ]
      }),
      {fetch: getAuthenticatedFetch({core: {credentials: [credential]}})} as LoaderContext
    );

    expect(webScene.layers).toHaveLength(1);
    expect(requestedUrls).toEqual(['https://example.com/SceneServer/layers/0?token=secret-token']);
  });
});

function readFixture(path: string): ArrayBuffer {
  const bytes = readFileSync(new URL(path, import.meta.url));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
