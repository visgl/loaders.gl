// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {SourceLayer} from '@loaders.gl/deck-layers';

function createLayer(props: Record<string, unknown> = {}): SourceLayer & Record<string, any> {
  const layer = new SourceLayer({id: 'source-boundary', data: '', ...props} as any) as SourceLayer &
    Record<string, any>;
  layer.initializeState();
  layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);
  layer.getSubLayerProps = (childProps: Record<string, unknown>) => childProps;
  layer.raiseError = vi.fn();
  return layer;
}

test('SourceLayer resolves direct vector sources and emits metadata and view-state callbacks', async () => {
  const previousClose = vi.fn(async () => {});
  const onSourceLoad = vi.fn();
  const onMetadataLoad = vi.fn();
  const onViewStateLoad = vi.fn();
  const vectorSource = {
    async getMetadata() {
      return {
        layers: [{name: 'roads'}],
        boundingBox: [
          [-10, -5],
          [10, 5]
        ],
        crs: 'EPSG:4326'
      };
    },
    async getSchema() {
      return {fields: [], metadata: {}};
    },
    async getFeatures() {
      return {shape: 'geojson-table', type: 'FeatureCollection', features: []};
    }
  };
  const layer = createLayer({
    data: vectorSource,
    layers: 'auto',
    onSourceLoad,
    onMetadataLoad,
    onViewStateLoad
  });
  layer.state.resolvedSource = {
    source: {close: previousClose},
    sourceType: 'vector',
    parserLoaders: [],
    owned: true
  };

  await layer.resolveSource(layer.props);

  expect(previousClose).toHaveBeenCalledOnce();
  expect(onSourceLoad).toHaveBeenCalledWith(expect.objectContaining({sourceType: 'vector'}));
  expect(onMetadataLoad).toHaveBeenCalledWith(
    expect.objectContaining({layers: [{name: 'roads'}]}),
    expect.objectContaining({sourceType: 'vector'})
  );
  expect(onViewStateLoad).toHaveBeenCalledWith(
    expect.objectContaining({longitude: 0, latitude: 0, crs: 'EPSG:4326'}),
    expect.objectContaining({sourceType: 'vector'})
  );
  expect(layer.state).toMatchObject({
    resolvedLayers: 'roads',
    resolvedCoordinateReferenceSystem: 'EPSG:4326',
    isResolving: false
  });
});

test('SourceLayer renders every runtime adapter and normalizes image layer names', () => {
  const layer = createLayer({layers: 'auto', srs: 'EPSG:3857', crs: 'EPSG:4326'});
  const source = {};
  const expectedLayerNames = {
    image: 'ImageSourceLayer',
    vector: 'VectorSourceLayer',
    raster: 'RasterSourceLayer',
    'tile-2d': 'Tile2DSourceLayer',
    'point-cloud': 'PointCloudSourceLayer'
  };

  for (const [sourceType, layerName] of Object.entries(expectedLayerNames)) {
    layer.state = {
      resolvedSource: {source, sourceType, parserLoaders: [], owned: false},
      metadata: {name: sourceType},
      resolvedLayers: sourceType === 'image' ? 'imagery' : ['roads'],
      resolvedCoordinateReferenceSystem: 'EPSG:4326',
      isResolving: false
    };
    const child = layer.renderLayers()[0];
    expect(child.constructor.layerName).toBe(layerName);
    if (sourceType === 'image') expect(child.props.layers).toEqual(['imagery']);
  }

  layer.state.resolvedSource = {source, sourceType: 'unknown', parserLoaders: [], owned: false};
  expect(layer.renderLayers()).toBeNull();
  layer.state.resolvedSource = null;
  expect(layer.renderLayers()).toBeNull();
});

test('SourceLayer forwards 3D Tiles metadata and navigation hints from child callbacks', async () => {
  const onTilesetLoad = vi.fn();
  const onMetadataLoad = vi.fn();
  const onViewStateLoad = vi.fn();
  const layer = createLayer({data: 'tileset.json', onTilesetLoad, onMetadataLoad, onViewStateLoad});
  const resolvedSource = {
    source: 'tileset.json',
    sourceType: 'tile-3d',
    parserLoaders: [],
    owned: false
  };
  layer.state = {
    resolvedSource,
    metadata: null,
    resolvedLayers: undefined,
    resolvedCoordinateReferenceSystem: undefined,
    isResolving: false
  };

  const child = layer.renderLayers()[0];
  child.props.onTilesetLoad({
    tileset: {asset: {version: '1.1'}},
    cartographicCenter: new Float64Array([1, 2, 3]),
    zoom: 12,
    boundingVolume: {
      cartographicBounds: [
        [0, 0, 0],
        [2, 4, 6]
      ]
    }
  });
  await Promise.resolve();
  await Promise.resolve();

  expect(onTilesetLoad).toHaveBeenCalledOnce();
  expect(onMetadataLoad).toHaveBeenCalledWith(
    {asset: {version: '1.1'}},
    expect.objectContaining({sourceType: 'tile-3d'})
  );
  expect(onViewStateLoad).toHaveBeenCalledWith(
    expect.objectContaining({longitude: 1, latitude: 2, zoom: 12}),
    expect.objectContaining({sourceType: 'tile-3d'})
  );

  layer.state.resolvedSource = null;
  await layer.handleTilesetLoad({}, resolvedSource);
  expect(onMetadataLoad).toHaveBeenCalledTimes(1);
});

test('SourceLayer reports resolution errors and starts fresh resolution on prop changes', async () => {
  const onSourceError = vi.fn();
  const layer = createLayer({data: 42, onSourceError});

  await layer.resolveSource(layer.props);
  expect(onSourceError).toHaveBeenCalledWith(expect.any(Error), undefined);
  expect(layer.raiseError).toHaveBeenCalledWith(expect.any(Error), 'resolving loaders.gl source');
  expect(layer.state.isResolving).toBe(false);

  const resolveSource = vi.fn();
  layer.resolveSource = resolveSource;
  layer.updateState({
    props: {...layer.props, layers: ['new']},
    oldProps: {...layer.props, layers: ['old']},
    changeFlags: {dataChanged: false}
  });
  expect(resolveSource).toHaveBeenCalledOnce();
});
