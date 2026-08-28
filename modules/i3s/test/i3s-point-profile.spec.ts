// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {I3SContentLoader, loadFeatureAttributes} from '@loaders.gl/i3s';
import {describe, expect, test, vi} from 'vitest';
import {I3SLoaderWithParser} from '../src/i3s-loader-with-parser';

const FIXTURE_URL = '@loaders.gl/i3s/test/data/conformance/i3s-1.8-point.json';
const LAYER_URL = 'https://example.com/PointSceneServer/layers/0';

/** Decode fixture bytes without relying on Node-only Buffer APIs. */
function decodeBase64(value: string): ArrayBuffer {
  const decoded = globalThis.atob(value);
  return Uint8Array.from(decoded, character => character.charCodeAt(0)).buffer;
}

describe('I3S Point profile', () => {
  test('loads pointNodePages and decodes point geometry, symbols, and attributes', async () => {
    const fixture = await (await fetchFile(FIXTURE_URL)).json();
    const nodePageFetch = vi.fn(async (url: string) => {
      expect(url).toBe(`${LAYER_URL}/nodepages/0`);
      return new Response(JSON.stringify(fixture.testResources.nodePage));
    });
    const tileset = await I3SLoaderWithParser.parse(
      new TextEncoder().encode(JSON.stringify(fixture)).buffer,
      {
        fetch: nodePageFetch,
        i3s: {isTileset: true, useDracoGeometry: true}
      } as any,
      {url: LAYER_URL} as any
    );

    expect(nodePageFetch).toHaveBeenCalledOnce();
    expect(tileset.layerType).toBe('Point');
    expect(tileset.pointRenderer).toMatchObject({type: 'simple'});
    expect(tileset.pointSymbol).toMatchObject({
      type: 'PointSymbol3D',
      symbolLayers: [{type: 'Icon', resource: {primitive: 'circle'}}]
    });
    expect(tileset.root).toMatchObject({
      layerType: 'Point',
      contentUrl: `${LAYER_URL}/nodes/62/geometries/0`,
      attributeUrls: [`${LAYER_URL}/nodes/62/attributes/f_0/0`],
      isDracoGeometry: true
    });

    const content = await parse(
      decodeBase64(fixture.testResources.geometryBase64),
      I3SContentLoader,
      {
        core: {worker: false},
        i3s: {
          _tileOptions: {
            attributeUrls: tileset.root.attributeUrls,
            isDracoGeometry: tileset.root.isDracoGeometry,
            layerType: tileset.root.layerType,
            mbs: tileset.root.mbs,
            pointRenderer: tileset.root.pointRenderer,
            pointSymbol: tileset.root.pointSymbol
          },
          _tilesetOptions: {
            store: tileset.store,
            attributeStorageInfo: tileset.attributeStorageInfo,
            fields: tileset.fields
          }
        }
      }
    );

    expect(content).toBeTruthy();
    expect(content!.topology).toBe('point-list');
    expect(content!.vertexCount).toBe(2);
    expect(content!.attributes.positions.value).toHaveLength(6);
    expect(Array.from(content!.featureIds)).toEqual([317494, 319150]);
    expect(content!.drawRanges).toEqual([
      {
        featureId: 317494,
        firstPrimitive: 0,
        primitiveCount: 1,
        firstVertex: 0,
        vertexCount: 1
      },
      {
        featureId: 319150,
        firstPrimitive: 1,
        primitiveCount: 1,
        firstVertex: 1,
        vertexCount: 1
      }
    ]);
    expect(content!.pointSymbol).toEqual(tileset.pointSymbol);

    const attributes = await loadFeatureAttributes(
      {
        tileset: {tileset},
        header: tileset.root
      },
      319150,
      {
        fetch: async () => new Response(decodeBase64(fixture.testResources.attributeBase64))
      }
    );
    expect(attributes).toEqual({FID: '319150'});
  });
});
