// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, expect, test, vi} from 'vitest';

const sourceLayerMocks = vi.hoisted(() => ({
  createSource: vi.fn(),
  tilesetOptions: null as Record<string, unknown> | null
}));

vi.mock('../src/tile-3d-source-layer', () => ({
  createSource: sourceLayerMocks.createSource
}));

vi.mock('@loaders.gl/tiles', async importOriginal => {
  const original = await importOriginal<typeof import('@loaders.gl/tiles')>();
  return {
    ...original,
    Tileset3D: class {
      tilesetInitializationPromise = Promise.resolve();
      constructor(_source: unknown, options: Record<string, unknown>) {
        sourceLayerMocks.tilesetOptions = options;
      }
    }
  };
});

import {SourceDataDrivenTile3DLayer} from '../src/data-driven-tile-3d-source-layer';

beforeEach(() => {
  sourceLayerMocks.createSource.mockReset().mockReturnValue({id: 'source'});
  sourceLayerMocks.tilesetOptions = null;
});

function createLayer(loader: Record<string, unknown>) {
  const onTilesetLoad = vi.fn();
  const layer = new SourceDataDrivenTile3DLayer({
    id: 'source-data-driven',
    data: 'tileset.json',
    loaders: [loader],
    loadOptions: {core: {credentials: [{url: 'existing'}]}},
    onTilesetLoad
  } as any) as any;
  layer.state = {activeViewports: {main: {id: 'main'}}, tileset3d: null, layerMap: {old: {}}};
  layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);
  layer._onTileLoad = vi.fn();
  layer._onTileUnload = vi.fn();
  layer._onTraversalComplete = vi.fn();
  layer._updateTileset = vi.fn();
  return {layer, onTilesetLoad};
}

test('SourceDataDrivenTile3DLayer merges preload URLs and credentials', async () => {
  const loader = {
    id: 'tiles',
    preload: vi.fn(async () => ({
      url: 'resolved.json',
      credentials: [{url: 'resolved'}],
      maximumMemoryUsage: 32
    }))
  };
  const {layer, onTilesetLoad} = createLayer(loader);

  await layer.loadSourceTileset('tileset.json');

  expect(sourceLayerMocks.createSource).toHaveBeenCalledWith(
    'resolved.json',
    loader,
    expect.objectContaining({core: {credentials: [{url: 'existing'}, {url: 'resolved'}]}})
  );
  expect(sourceLayerMocks.tilesetOptions).toMatchObject({maximumMemoryUsage: 32});
  expect(layer.state.layerMap).toEqual({});
  expect(layer._updateTileset).toHaveBeenCalledWith({main: {id: 'main'}});
  expect(onTilesetLoad).toHaveBeenCalledWith(layer.state.tileset3d);
});

test('SourceDataDrivenTile3DLayer forwards preload headers for legacy loaders', async () => {
  const loader = {
    id: 'tiles',
    preload: vi.fn(async () => ({headers: {'x-token': 'secret'}}))
  };
  const {layer} = createLayer(loader);
  layer.props = {...layer.props, loaders: undefined, loader};

  await layer.loadSourceTileset('tileset.json');

  expect(sourceLayerMocks.createSource).toHaveBeenCalledWith(
    'tileset.json',
    loader,
    expect.objectContaining({fetch: {headers: {'x-token': 'secret'}}})
  );
});
