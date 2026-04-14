// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {AnyLayer, type AnyLayerProps} from '@loaders.gl/deck-layers';

const TEST_IMAGE_SOURCE = {
  async getMetadata() {
    return {name: 'image', keywords: [], layers: []};
  },
  async getImage() {
    return {};
  }
};

const TEST_VECTOR_SOURCE = {
  async getMetadata() {
    return {name: 'vector', keywords: [], layers: []};
  },
  async getSchema() {
    return {metadata: {}, fields: []};
  },
  async getFeatures() {
    return {
      shape: 'geojson-table',
      type: 'FeatureCollection',
      features: []
    };
  }
};

const TEST_TILE_SOURCE = {
  mimeType: 'image/png',
  options: {},
  async getMetadata() {
    return {minZoom: 0, maxZoom: 1};
  },
  async getTileData() {
    return null;
  }
};

const TEST_TILESET_SOURCE = {
  type: 'tiles3d',
  loader: {id: '3d-tiles'},
  url: 'https://example.com/tileset.json',
  basePath: 'https://example.com',
  loadOptions: {},
  contentFormats: {
    draco: false,
    meshopt: false,
    dds: false,
    ktx2: false
  },
  async initialize() {},
  getMetadata() {
    return {
      type: 'TILES3D' as any,
      loader: this.loader,
      url: this.url,
      basePath: this.basePath,
      tileset: {},
      lodMetricType: 'geometricError',
      lodMetricValue: 1,
      refine: 'ADD'
    };
  },
  async getRootTileset() {
    return {};
  },
  initializeTileHeaders() {
    return {} as any;
  },
  createTraverser() {
    return {} as any;
  },
  async loadTileContent() {
    return {loaded: true};
  },
  getTileUrl(tilePath: string) {
    return tilePath;
  },
  getViewState() {
    return {};
  }
};

const TEST_3D_LOADER = {
  id: '3d-tiles',
  name: '3D Tiles',
  module: '3d-tiles',
  version: '0.0.0'
};

function createLayer(props: AnyLayerProps = {id: 'test', data: 'https://example.com/data'}) {
  return new AnyLayer(props as any) as any;
}

test('AnyLayer#resolves image sources and renders ImageSourceLayer', t => {
  const layer = createLayer({
    id: 'image',
    data: 'https://example.com/wms',
    layers: ['visible'],
    serviceType: 'wms',
    sources: [
      {
        name: 'TestImageSource',
        id: 'test-image-source',
        module: 'test',
        version: '0.0.0',
        extensions: ['test'],
        mimeTypes: ['application/test'],
        type: 'wms',
        fromUrl: true,
        fromBlob: false,
        testURL: () => true,
        createDataSource() {
          return TEST_IMAGE_SOURCE as any;
        }
      } as any
    ]
  });

  const resolvedData = layer._resolveData(layer.props);
  layer.state = {resolvedData};
  const renderedLayers = layer.renderLayers();

  t.equal(resolvedData, TEST_IMAGE_SOURCE);
  t.equal(renderedLayers[0].constructor.layerName, 'ImageSourceLayer');
  t.equal(renderedLayers[0].props.serviceType, 'wms');
  t.end();
});

test('AnyLayer#resolves vector sources and renders VectorSourceLayer', t => {
  const layer = createLayer({
    id: 'vector',
    data: 'https://example.com/wfs',
    layers: ['roads'],
    geoJsonLayerProps: {pickable: true},
    sources: [
      {
        name: 'TestVectorSource',
        id: 'test-vector-source',
        module: 'test',
        version: '0.0.0',
        extensions: ['test'],
        mimeTypes: ['application/test'],
        type: 'wfs',
        fromUrl: true,
        fromBlob: false,
        testURL: () => true,
        createDataSource() {
          return TEST_VECTOR_SOURCE as any;
        }
      } as any
    ]
  });

  const resolvedData = layer._resolveData(layer.props);
  layer.state = {resolvedData};
  const renderedLayers = layer.renderLayers();

  t.equal(resolvedData, TEST_VECTOR_SOURCE);
  t.equal(renderedLayers[0].constructor.layerName, 'VectorSourceLayer');
  t.equal(renderedLayers[0].props.geoJsonLayerProps.pickable, true);
  t.end();
});

test('AnyLayer#resolves tile sources and renders Tile2DSourceLayer', t => {
  const layer = createLayer({
    id: 'tile',
    data: 'https://example.com/tilejson',
    showTileBorders: false,
    sources: [
      {
        name: 'TestTileSource',
        id: 'test-tile-source',
        module: 'test',
        version: '0.0.0',
        extensions: ['test'],
        mimeTypes: ['application/test'],
        type: 'tile',
        fromUrl: true,
        fromBlob: false,
        testURL: () => true,
        createDataSource() {
          return TEST_TILE_SOURCE as any;
        }
      } as any
    ]
  });

  const resolvedData = layer._resolveData(layer.props);
  layer.state = {resolvedData};
  const renderedLayers = layer.renderLayers();

  t.equal(resolvedData, TEST_TILE_SOURCE);
  t.equal(renderedLayers[0].constructor.layerName, 'Tile2DSourceLayer');
  t.equal(renderedLayers[0].props.showTileBorders, false);
  t.end();
});

test('AnyLayer#uses loader-backed fallback for 3D URLs', t => {
  const layer = createLayer({
    id: 'tiles3d',
    data: 'https://example.com/tileset.json',
    loaders: [TEST_3D_LOADER as any]
  });

  const resolvedData = layer._resolveData(layer.props);
  layer.state = {resolvedData};
  const renderedLayers = layer.renderLayers();

  t.equal(resolvedData, 'https://example.com/tileset.json');
  t.equal(renderedLayers[0].constructor.layerName, 'Tile3DSourceLayer');
  t.equal(renderedLayers[0].props.loaders[0], TEST_3D_LOADER);
  t.end();
});

test('AnyLayer#accepts preconstructed source runtimes', t => {
  const layer = createLayer({
    id: 'preconstructed',
    data: TEST_TILESET_SOURCE as any
  });

  const resolvedData = layer._resolveData(layer.props);
  layer.state = {resolvedData};
  const renderedLayers = layer.renderLayers();

  t.equal(resolvedData, TEST_TILESET_SOURCE);
  t.equal(renderedLayers[0].constructor.layerName, 'Tile3DSourceLayer');
  t.end();
});

test('AnyLayer#injects loaders into sourceOptions.core.loaders', t => {
  let capturedOptions;
  const layer = createLayer({
    id: 'loaders',
    data: 'https://example.com/tiles',
    loaders: [TEST_3D_LOADER as any],
    sources: [
      {
        name: 'TestTileSource',
        id: 'test-tile-source',
        module: 'test',
        version: '0.0.0',
        extensions: ['test'],
        mimeTypes: ['application/test'],
        type: 'tile',
        fromUrl: true,
        fromBlob: false,
        testURL: () => true,
        createDataSource(_data: string, options: any) {
          capturedOptions = options;
          return TEST_TILE_SOURCE as any;
        }
      } as any
    ]
  });

  layer._resolveData(layer.props);

  t.deepEqual(capturedOptions.core.loaders, [TEST_3D_LOADER]);
  t.end();
});

test('AnyLayer#prefers sources before loader-backed fallback', t => {
  const layer = createLayer({
    id: 'priority',
    data: 'https://example.com/data',
    loaders: [TEST_3D_LOADER as any],
    sources: [
      {
        name: 'TestTileSource',
        id: 'test-tile-source',
        module: 'test',
        version: '0.0.0',
        extensions: ['test'],
        mimeTypes: ['application/test'],
        type: 'tile',
        fromUrl: true,
        fromBlob: false,
        testURL: () => true,
        createDataSource() {
          return TEST_TILE_SOURCE as any;
        }
      } as any
    ]
  });

  const resolvedData = layer._resolveData(layer.props);
  layer.state = {resolvedData};
  const renderedLayers = layer.renderLayers();

  t.equal(resolvedData, TEST_TILE_SOURCE);
  t.equal(renderedLayers[0].constructor.layerName, 'Tile2DSourceLayer');
  t.end();
});

test('AnyLayer#throws when no source matches and no loaders are available', t => {
  const layer = createLayer({
    id: 'error',
    data: 'https://example.com/unknown',
    sources: [
      {
        name: 'NoMatchSource',
        id: 'no-match-source',
        module: 'test',
        version: '0.0.0',
        extensions: ['test'],
        mimeTypes: ['application/test'],
        type: 'tile',
        fromUrl: true,
        fromBlob: false,
        testURL: () => false,
        createDataSource() {
          return TEST_TILE_SOURCE as any;
        }
      } as any
    ]
  });

  t.throws(
    () => layer._resolveData(layer.props),
    /could not resolve the URL with `sources`, and no `loaders` were provided/
  );
  t.end();
});
