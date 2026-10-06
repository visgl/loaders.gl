// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import ArcGISMap from '../../examples/website/shared/arcgis-map';

const arcgisMock = vi.hoisted(() => ({
  maps: [] as any[],
  views: [] as any[],
  layers: [] as any[],
  resolveReady: null as (() => void) | null,
  watch: vi.fn(),
  removeWatch: vi.fn(),
  destroyFullscreen: vi.fn()
}));

vi.mock('@arcgis/core/Map.js', () => ({
  default: class {
    basemap = {baseLayers: [{visible: true}], referenceLayers: [{visible: true}]};
    destroy = vi.fn();
    constructor() {
      arcgisMock.maps.push(this);
    }
  }
}));
vi.mock('@arcgis/core/views/MapView.js', () => ({
  default: class {
    center: {longitude: number; latitude: number};
    zoom: number;
    rotation: number;
    ready = false;
    map: any;
    configuration: any;
    ui = {move: vi.fn(), add: vi.fn()};
    destroy = vi.fn();
    goTo = vi.fn(async (target: any) => {
      this.center = {longitude: target.center[0], latitude: target.center[1]};
      this.zoom = target.zoom;
      this.rotation = target.rotation;
    });
    constructor(configuration: any) {
      this.configuration = configuration;
      this.center = {longitude: configuration.center[0], latitude: configuration.center[1]};
      this.zoom = configuration.zoom;
      this.rotation = configuration.rotation;
      this.map = configuration.map;
      arcgisMock.views.push(this);
    }
    when() {
      return new Promise<void>(resolve => {
        arcgisMock.resolveReady = () => {
          this.ready = true;
          resolve();
        };
      });
    }
  }
}));
vi.mock('@arcgis/core/layers/support/TileInfo.js', () => ({
  default: {
    create: (configuration: any) => ({lods: configuration})
  }
}));
vi.mock('@arcgis/core/core/reactiveUtils.js', () => ({watch: arcgisMock.watch}));
vi.mock('@arcgis/core/widgets/Fullscreen.js', () => ({
  default: class {
    destroy = arcgisMock.destroyFullscreen;
  }
}));
vi.mock('@deck.gl/arcgis', () => ({
  DeckLayer: class {
    deck = {set: vi.fn()};
    constructor() {
      arcgisMock.layers.push(this);
    }
  }
}));

let container: HTMLDivElement;
let root: Root | null;
const camera = {longitude: -85.75, latitude: 37.75, zoom: 7.9};

beforeEach(() => {
  vi.clearAllMocks();
  arcgisMock.maps.length = 0;
  arcgisMock.views.length = 0;
  arcgisMock.layers.length = 0;
  arcgisMock.resolveReady = null;
  arcgisMock.watch.mockReturnValue({remove: arcgisMock.removeWatch});
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

test('ArcGIS map applies pending camera changes and preserves navigation during overlay updates', async () => {
  const onViewStateChange = vi.fn();
  await act(async () =>
    root!.render(
      React.createElement(ArcGISMap, {
        viewState: camera,
        layers: [],
        onViewStateChange
      })
    )
  );
  await vi.waitFor(() => expect(arcgisMock.views).toHaveLength(1));
  const nextCamera = {...camera, longitude: -85.4, zoom: 8.8};
  await act(async () =>
    root!.render(
      React.createElement(ArcGISMap, {
        viewState: nextCamera,
        layers: [],
        showBasemap: false,
        onViewStateChange
      })
    )
  );
  await act(async () => arcgisMock.resolveReady!());
  const view = arcgisMock.views[0];
  expect(view.configuration.constraints.lods).toEqual({size: 512, numLODs: 24});
  expect(view.zoom).toBe(8);
  expect(view.center.longitude).toBe(-85.4);
  expect(arcgisMock.maps[0].basemap.baseLayers[0].visible).toBe(false);
  expect(arcgisMock.maps[0].basemap.referenceLayers[0].visible).toBe(false);
  view.center = {longitude: -84, latitude: 38};
  arcgisMock.watch.mock.calls[0][1](true);
  expect(onViewStateChange).toHaveBeenLastCalledWith({
    longitude: -84,
    latitude: 38,
    zoom: 8,
    bearing: 0,
    pitch: 0
  });
  view.goTo.mockClear();
  const getTooltip = () => 'Feature';
  await act(async () =>
    root!.render(
      React.createElement(ArcGISMap, {
        viewState: nextCamera,
        layers: [],
        showBasemap: true,
        getTooltip,
        onViewStateChange
      })
    )
  );
  expect(view.goTo).not.toHaveBeenCalled();
  expect(arcgisMock.layers[0].deck.set).toHaveBeenLastCalledWith({
    layers: [],
    getTooltip,
    onError: undefined
  });
  expect(arcgisMock.maps[0].basemap.referenceLayers[0].visible).toBe(true);
  // Track native navigation so a repeated fit to the same dataset becomes a new request.
  const navigatedCamera = onViewStateChange.mock.lastCall![0];
  await act(async () =>
    root!.render(
      React.createElement(ArcGISMap, {
        viewState: navigatedCamera,
        layers: [],
        onViewStateChange
      })
    )
  );
  expect(view.goTo).not.toHaveBeenCalled();
  await act(async () =>
    root!.render(
      React.createElement(ArcGISMap, {
        viewState: nextCamera,
        layers: [],
        onViewStateChange
      })
    )
  );
  expect(view.goTo).toHaveBeenCalledOnce();
  expect(view.center.longitude).toBe(nextCamera.longitude);
  await act(async () => root!.unmount());
  root = null;
  expect(arcgisMock.removeWatch).toHaveBeenCalledOnce();
  expect(arcgisMock.destroyFullscreen).toHaveBeenCalledOnce();
  expect(view.map).toBeNull();
  expect(view.destroy).toHaveBeenCalledOnce();
  expect(arcgisMock.maps[0].destroy).toHaveBeenCalledOnce();
});

test('ArcGIS map destroys a pending view without attaching controls after unmount', async () => {
  await act(async () =>
    root!.render(React.createElement(ArcGISMap, {viewState: camera, layers: []}))
  );
  await vi.waitFor(() => expect(arcgisMock.views).toHaveLength(1));
  const view = arcgisMock.views[0];
  await act(async () => root!.unmount());
  root = null;
  await act(async () => arcgisMock.resolveReady!());
  expect(view.destroy).toHaveBeenCalledOnce();
  expect(arcgisMock.maps[0].destroy).toHaveBeenCalledOnce();
  expect(arcgisMock.watch).not.toHaveBeenCalled();
  expect(view.ui.add).not.toHaveBeenCalled();
});
