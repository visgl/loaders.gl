// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, expect, test, vi} from 'vitest';

const tileLayerMocks = vi.hoisted(() => ({
  selectLoader: vi.fn(),
  preload: vi.fn(),
  tilesetOptions: null as Record<string, unknown> | null
}));

vi.mock('@loaders.gl/core', async importOriginal => {
  const original = await importOriginal<typeof import('@loaders.gl/core')>();
  return {...original, selectLoader: tileLayerMocks.selectLoader, preload: tileLayerMocks.preload};
});

vi.mock('@loaders.gl/tiles', async importOriginal => {
  const original = await importOriginal<typeof import('@loaders.gl/tiles')>();
  return {
    ...original,
    Tileset3D: class {
      tilesetInitializationPromise = Promise.resolve();
      constructor(_source: unknown, options: Record<string, unknown>) {
        tileLayerMocks.tilesetOptions = options;
      }
    }
  };
});

import {Tile3DSourceLayer} from '../src/tile-3d-source-layer';

beforeEach(() => {
  tileLayerMocks.selectLoader.mockReset();
  tileLayerMocks.preload.mockReset().mockImplementation(async loader => loader);
  tileLayerMocks.tilesetOptions = null;
});

function createLayer(data: unknown, props: Record<string, unknown> = {}) {
  const onTilesetLoad = vi.fn();
  const layer = new Tile3DSourceLayer({
    id: 'tile-source',
    data,
    loadOptions: {},
    onTilesetLoad,
    ...props
  } as any) as any;
  layer.state = {activeViewports: {main: {id: 'main'}}, tileset3d: null, layerMap: {old: {}}};
  layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);
  layer._onTileLoad = vi.fn();
  layer._onTileUnload = vi.fn();
  layer._updateTileset = vi.fn();
  return {layer, onTilesetLoad};
}

test('Tile3DSourceLayer initializes preconstructed sources directly', async () => {
  const source = {
    coreApi: undefined,
    async initialize() {},
    async getRootTileset() {},
    async initializeTileHeaders() {},
    async loadTileContent() {}
  };
  const {layer, onTilesetLoad} = createLayer(source);

  await layer.loadSourceTileset(source);

  expect(source.coreApi).toBeTruthy();
  expect(layer.state.layerMap).toEqual({});
  expect(layer._updateTileset).toHaveBeenCalledWith({main: {id: 'main'}});
  expect(onTilesetLoad).toHaveBeenCalledWith(layer.state.tileset3d);
});

test('Tile3DSourceLayer selects, preloads, and merges URL loader credentials', async () => {
  const loader = {
    id: 'tiles',
    preload: vi.fn(async () => ({
      url: 'resolved.json',
      credentials: [{url: 'resolved'}],
      maximumMemoryUsage: 64
    }))
  };
  tileLayerMocks.selectLoader.mockResolvedValue(loader);
  const {layer} = createLayer('tileset.json', {
    loaders: [loader],
    loadOptions: {core: {credentials: [{url: 'existing'}]}}
  });

  await layer.loadSourceTileset('tileset.json');

  expect(tileLayerMocks.selectLoader).toHaveBeenCalledWith(
    'tileset.json',
    [loader],
    expect.objectContaining({core: expect.objectContaining({ignoreRegisteredLoaders: true})})
  );
  expect(tileLayerMocks.preload).toHaveBeenCalledWith(
    loader,
    layer.props.loadOptions,
    'tileset.json'
  );
  expect(tileLayerMocks.tilesetOptions).toMatchObject({
    maximumMemoryUsage: 64,
    loadOptions: {core: {credentials: [{url: 'existing'}, {url: 'resolved'}]}}
  });
});

test('Tile3DSourceLayer validates Blob fallbacks, preload headers, and missing loaders', async () => {
  const loader = {
    id: 'tiles',
    preload: vi.fn(async () => ({headers: {authorization: 'token'}}))
  };
  tileLayerMocks.selectLoader.mockResolvedValue(undefined);
  const blob = new Blob(['tiles']);
  const {layer} = createLayer(blob, {loader});
  layer.props = {...layer.props, loaders: undefined, loader};

  await expect(layer.loadSourceTileset(blob)).rejects.toThrow(
    'Blob inputs require a 3TZ or SLPK archive loader'
  );
  expect(tileLayerMocks.preload).toHaveBeenCalledWith(loader, {}, undefined);

  const stringLayer = createLayer('tileset.json', {loader}).layer;
  stringLayer.props = {...stringLayer.props, loaders: undefined, loader};
  await stringLayer.loadSourceTileset('tileset.json');
  expect(tileLayerMocks.tilesetOptions).toMatchObject({
    loadOptions: {fetch: {headers: {authorization: 'token'}}}
  });

  const missing = createLayer('tileset.json', {loader: undefined, loaders: []}).layer;
  await expect(missing.loadSourceTileset('tileset.json')).rejects.toThrow('requires a loader');
});
