// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import {createBearerTokenCredential} from '@loaders.gl/loader-utils';

const loadingMocks = vi.hoisted(() => ({
  load: vi.fn(),
  options: null as Record<string, unknown> | null
}));

vi.mock('@loaders.gl/core', async importOriginal => {
  const original = await importOriginal<typeof import('@loaders.gl/core')>();
  return {...original, load: loadingMocks.load};
});

vi.mock('@loaders.gl/tiles', async importOriginal => {
  const original = await importOriginal<typeof import('@loaders.gl/tiles')>();
  return {
    ...original,
    /** Records source initialization without allocating rendering or traversal resources. */
    Tileset3D: class {
      /** Captures runtime options installed by the layer. */
      constructor(_data: unknown, options: Record<string, unknown>) {
        loadingMocks.options = options;
      }
    }
  };
});

import {DataDrivenTile3DLayer} from '../src/data-driven-tile-3d-layer';

beforeEach(() => {
  loadingMocks.load.mockReset().mockResolvedValue({asset: {version: '1.1'}});
  loadingMocks.options = null;
  vi.spyOn(
    Tile3DLayer.prototype as unknown as {_updateTileset: () => void},
    '_updateTileset'
  ).mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

/** Creates a layer with local state updates and no Deck or GPU context. */
function createLayer(props: Record<string, unknown>) {
  // Override deck.gl's default loader and null loadOptions before testing loader selection.
  const layer = new DataDrivenTile3DLayer({
    id: 'loading-boundary',
    data: null,
    loader: null,
    loadOptions: {},
    ...props
  } as never);
  layer.state = {
    activeViewports: {main: {}},
    lastUpdatedViewports: null,
    layerMap: {stale: {}},
    tileset3d: null,
    colorsByAttribute: null,
    filtersByAttribute: null,
    loadingCounter: 0
  };
  layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);
  return layer as unknown as {
    /** Local state inspected after source initialization. */
    state: DataDrivenTile3DLayer['state'];
    /** Invokes the layer's root-loading lifecycle directly. */
    _loadTileset: (url: string) => Promise<void>;
  };
}

test('data-driven root loading selects array loaders and merges preload credentials', async () => {
  const existingCredential = createBearerTokenCredential({
    id: 'existing',
    origins: ['https://archive.invalid'],
    token: 'one'
  });
  const resolvedCredential = createBearerTokenCredential({
    id: 'resolved',
    origins: ['https://archive.invalid'],
    token: 'two'
  });
  const loader = {
    id: 'tiles',
    preload: vi.fn(async () => ({credentials: [resolvedCredential], maximumMemoryUsage: 4}))
  };
  const onTilesetLoad = vi.fn();
  const layer = createLayer({
    loaders: [loader, {id: 'unused'}],
    onTilesetLoad,
    loadOptions: {core: {credentials: [existingCredential]}}
  });
  await layer._loadTileset('https://archive.invalid/tileset.json');
  expect(loader.preload).toHaveBeenCalledOnce();
  expect(loadingMocks.load).toHaveBeenCalledWith(
    'https://archive.invalid/tileset.json',
    loader,
    expect.objectContaining({
      core: expect.objectContaining({credentials: [existingCredential, resolvedCredential]})
    })
  );
  expect(loadingMocks.options).toMatchObject({maximumMemoryUsage: 4});
  expect(layer.state.layerMap).toEqual({});
  expect(onTilesetLoad).toHaveBeenCalledWith(layer.state.tileset3d);
});

test('data-driven root loading merges header fallbacks and initializes viewports', async () => {
  const loader = {
    id: 'tiles',
    preload: vi.fn(async () => ({credentials: [], headers: {authorization: 'token'}}))
  };
  const layer = createLayer({loader, loadOptions: {fetch: {credentials: 'include'}}});
  await layer._loadTileset('tileset.json');
  expect(loadingMocks.load).toHaveBeenCalledWith(
    'tileset.json',
    loader,
    expect.objectContaining({
      fetch: {credentials: 'include', headers: {authorization: 'token'}}
    })
  );
  expect(loadingMocks.options).toMatchObject({
    onTileLoad: expect.any(Function),
    onTileUnload: expect.any(Function),
    onTraversalComplete: expect.any(Function)
  });
  expect(
    (Tile3DLayer.prototype as unknown as {_updateTileset: () => void})._updateTileset
  ).toHaveBeenCalledWith(layer.state.activeViewports);
});

test.each([
  false,
  true
])('data-driven root loading accepts minimal loaders (preload: %s)', async withPreload => {
  const loader = {id: 'tiles', ...(withPreload ? {preload: vi.fn(async () => ({}))} : {})};
  const layer = createLayer({loader});
  await layer._loadTileset('tileset.json');
  expect(loadingMocks.load).toHaveBeenCalledWith('tileset.json', loader, {});
  expect(layer.state.tileset3d).toBeTruthy();
});

test('data-driven root loading propagates parser failures without clearing existing layers', async () => {
  const failure = new Error('invalid tileset');
  loadingMocks.load.mockRejectedValue(failure);
  const layer = createLayer({loader: {id: 'tiles'}});
  await expect(layer._loadTileset('tileset.json')).rejects.toBe(failure);
  expect(layer.state.layerMap).toEqual({stale: {}});
  expect(loadingMocks.options).toBeNull();
});
