// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {expect, test, vi} from 'vitest';
import {ImageSourceLayer, type ImageSourceLayerProps} from '@loaders.gl/deck-layers';
import {ImageSet} from '@loaders.gl/tiles';
const TEST_IMAGE_SOURCE = {
  async getMetadata() {
    return {name: 'test', keywords: [], layers: []};
  },
  async getImage(parameters: any) {
    return {parameters};
  },
  async getFeatureInfoText(parameters: any) {
    return JSON.stringify(parameters);
  }
};
const TEST_SOURCE_FACTORY = {
  name: 'TestImageSource',
  id: 'test-image-source',
  module: 'test',
  version: '0.0.0',
  extensions: ['test'],
  mimeTypes: ['application/test'],
  type: 'wms',
  fromUrl: true,
  fromBlob: true,
  testURL: () => true,
  createDataSource() {
    return TEST_IMAGE_SOURCE as any;
  }
};
function createLayer(props: ImageSourceLayerProps = {id: 'test', data: TEST_IMAGE_SOURCE as any}) {
  return new ImageSourceLayer(props as any) as any;
}
test('ImageSourceLayer#accepts direct ImageSource inputs', () => {
  const layer = createLayer();
  const resolvedData = layer._resolveData(layer.props);
  expect(resolvedData).toBe(TEST_IMAGE_SOURCE);
});
test('ImageSourceLayer#resolves URL inputs with sources', () => {
  const layer = createLayer({
    id: 'test',
    data: 'https://example.com/wms',
    sources: [TEST_SOURCE_FACTORY as any]
  });
  const resolvedData = layer._resolveData(layer.props);
  expect(resolvedData).toBe(TEST_IMAGE_SOURCE);
});
test('ImageSourceLayer#rejects Blob inputs without sources', () => {
  const layer = createLayer({id: 'test', data: new Blob(['test'])});
  expect(() => layer._resolveData(layer.props)).toThrow(/requires `sources`/);
});
test('ImageSourceLayer#resolves mixed loader lists and rejects unresolved strings', () => {
  const parserLoader = {
    id: 'parser',
    name: 'parser',
    module: 'test',
    version: '1',
    extensions: ['bin'],
    mimeTypes: ['application/octet-stream'],
    binary: true,
    parse: async () => ({})
  };
  const layer = createLayer({
    id: 'mixed',
    data: 'https://example.com/wms',
    serviceType: 'wms',
    loaders: [parserLoader as any, TEST_SOURCE_FACTORY as any, TEST_SOURCE_FACTORY as any],
    sourceOptions: {core: {loaders: [parserLoader as any]}},
    loadOptions: {fetch: {headers: {'X-Test': 'yes'}}}
  } as any);
  expect(layer._resolveData(layer.props)).toBe(TEST_IMAGE_SOURCE);

  expect(() =>
    createLayer({id: 'missing', data: 'https://example.com/wms'})._resolveData({
      id: 'missing',
      data: 'https://example.com/wms'
    })
  ).toThrow(/requires `sources`/);
  expect(createLayer()._resolveData({id: 'null', data: null} as any)).toBeNull();
  expect(
    createLayer()._resolveData({
      id: 'tile',
      data: {...TEST_IMAGE_SOURCE, getTileData() {}}
    } as any)
  ).toBeNull();
});
test('ImageSourceLayer#creates an ImageSet for resolved sources', () => {
  const layer = createLayer();
  layer.state = {
    resolvedData: null,
    imageSet: null,
    unsubscribeImageSetEvents: null
  };
  const imageSet = layer._getOrCreateImageSet(TEST_IMAGE_SOURCE as any, true);
  expect(imageSet).toBeTruthy();
  expect(layer.state.imageSet).toBe(imageSet);
  layer._releaseImageSet();
});
test('ImageSourceLayer#forwards feature info using the last request parameters', async () => {
  const layer = createLayer();
  layer.state = {
    resolvedData: TEST_IMAGE_SOURCE,
    imageSet: {
      imageSource: TEST_IMAGE_SOURCE,
      currentRequest: {
        requestId: 1,
        image: {} as any,
        parameters: {
          layers: ['visible'],
          boundingBox: [
            [1, 2],
            [3, 4]
          ],
          width: 256,
          height: 128,
          crs: 'EPSG:4326'
        }
      }
    },
    unsubscribeImageSetEvents: null
  };
  const featureInfo = await layer.getFeatureInfoText(10, 20);
  expect(featureInfo?.includes('"query_layers":["visible"]')).toBeTruthy();
  expect(featureInfo?.includes('"width":256')).toBeTruthy();
});
test('ImageSourceLayer#keeps auto-SRS request shaping behavior', () => {
  const layer = createLayer({id: 'test', data: TEST_IMAGE_SOURCE as any, srs: 'auto'});
  const geographicParameters = layer._getImageParameters({
    getBounds: () => [1, 2, 3, 4],
    width: 10,
    height: 20,
    resolution: 1
  });
  const mercatorParameters = layer._getImageParameters({
    getBounds: () => [1, 2, 3, 4],
    width: 10,
    height: 20
  });
  expect(geographicParameters.crs).toBe('EPSG:4326');
  expect(mercatorParameters.crs).toBe('EPSG:3857');
  expect(mercatorParameters.boundingBox).not.toEqual([
    [1, 2],
    [3, 4]
  ]);
});
test('ImageSourceLayer#passes debounceTime into ImageSet', () => {
  const layer = createLayer({
    id: 'test',
    data: TEST_IMAGE_SOURCE as any,
    debounceTime: 25
  });
  layer.state = {
    resolvedData: null,
    imageSet: null,
    unsubscribeImageSetEvents: null
  };
  const imageSet = layer._getOrCreateImageSet(TEST_IMAGE_SOURCE as any, true);
  expect(imageSet._opts.debounceTime).toBe(25);
  layer._releaseImageSet();
});
test('ImageSourceLayer#reloads imagery when srs changes on a static viewport', () => {
  const requestedParameters: any[] = [];
  const layer = createLayer({
    id: 'test',
    data: TEST_IMAGE_SOURCE as any,
    srs: 'EPSG:4326'
  });
  layer.context = {
    viewport: {
      getBounds: () => [1, 2, 3, 4],
      width: 256,
      height: 128,
      resolution: 1
    }
  };
  layer.state = {
    resolvedData: TEST_IMAGE_SOURCE,
    imageSet: {
      loadMetadata: async () => {},
      setOptions: () => {},
      requestImage: (parameters: any) => requestedParameters.push(parameters)
    },
    unsubscribeImageSetEvents: null
  };
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, srs: 'EPSG:3857'},
    changeFlags: {dataChanged: false, viewportChanged: false}
  });
  expect(requestedParameters.length, 'issues a fresh image request when srs changes').toBe(1);
  expect(requestedParameters[0].crs, 'uses the updated srs in request parameters').toBe(
    'EPSG:4326'
  );
  expect(requestedParameters[0].boundingBox).toEqual([
    [1, 2],
    [3, 4]
  ]);
});

test('ImageSourceLayer initializes state and tracks image loading', () => {
  const layer = createLayer();
  layer.initializeState();
  expect(layer.state).toMatchObject({resolvedData: null, resolvedLayers: [], imageSet: null});
  expect(layer.shouldUpdateState()).toBe(true);
  expect(layer.isLoaded).toBe(false);
  layer.state.imageSet = {isLoaded: true};
  expect(typeof layer.isLoaded).toBe('boolean');
});

test('ImageSourceLayer updates image options and viewport requests', () => {
  const layer = createLayer({
    id: 'update',
    data: TEST_IMAGE_SOURCE as any,
    layers: ['roads'],
    debounceTime: 10,
    srs: 'EPSG:4326'
  });
  const setOptions = vi.fn();
  const requestImage = vi.fn();
  layer.context = {viewport: createViewport()} as any;
  layer.setState = (update: any) => Object.assign(layer.state, update);
  layer.state = {
    resolvedData: TEST_IMAGE_SOURCE,
    resolvedSource: null,
    resolvedLayers: ['roads'],
    imageSet: {setOptions, requestImage},
    unsubscribeImageSetEvents: null
  };
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, layers: ['buildings'], debounceTime: 0},
    changeFlags: {dataChanged: false, propsChanged: false, viewportChanged: false}
  });
  expect(setOptions).toHaveBeenCalledWith({imageSource: TEST_IMAGE_SOURCE, debounceTime: 10});
  expect(requestImage).toHaveBeenCalledTimes(1);

  layer.updateState({
    props: layer.props,
    oldProps: layer.props,
    changeFlags: {dataChanged: false, propsChanged: false, viewportChanged: true}
  });
  expect(requestImage).toHaveBeenCalledTimes(2);
});

test('ImageSourceLayer renders accepted images in geographic and Cartesian coordinates', () => {
  const layer = createLayer();
  layer.getSubLayerProps = (props: any) => props;
  layer.state = {imageSet: null};
  expect(layer.renderLayers()).toBeNull();

  layer.state.imageSet = {
    currentRequest: {
      image: {width: 1, height: 1},
      parameters: {
        boundingBox: [
          [1, 2],
          [3, 4]
        ],
        crs: 'EPSG:4326'
      }
    }
  };
  const geographic = layer.renderLayers();
  expect(geographic.props.bounds).toEqual([1, 2, 3, 4]);
  expect(geographic.props._imageCoordinateSystem).toBe(COORDINATE_SYSTEM.LNGLAT);

  layer.state.imageSet.currentRequest.parameters.crs = 'EPSG:3857';
  expect(layer.renderLayers().props._imageCoordinateSystem).toBe(COORDINATE_SYSTEM.CARTESIAN);
});

test('ImageSourceLayer skips incomplete requests and WMS requests without layers', async () => {
  const layer = createLayer({id: 'wms', data: TEST_IMAGE_SOURCE as any, serviceType: 'wms'});
  const requestImage = vi.fn();
  layer.state = {resolvedLayers: [], imageSet: {requestImage}};
  layer.loadImage(createViewport());
  expect(requestImage).not.toHaveBeenCalled();
  await expect(layer.getFeatureInfoText(1, 2)).resolves.toBe('');

  layer.state.imageSet = null;
  layer.loadImage(createViewport());
  expect(requestImage).not.toHaveBeenCalled();
});

test('ImageSourceLayer releases and reuses image managers', () => {
  const layer = createLayer();
  const unsubscribe = vi.fn();
  const finalize = vi.fn();
  const existingImageSet = {finalize};
  layer.setState = (update: any) => Object.assign(layer.state, update);
  layer.state = {
    resolvedData: TEST_IMAGE_SOURCE,
    resolvedSource: null,
    resolvedLayers: ['roads'],
    imageSet: existingImageSet,
    unsubscribeImageSetEvents: unsubscribe
  };
  expect(layer._getOrCreateImageSet(TEST_IMAGE_SOURCE, false)).toBe(existingImageSet);
  layer._releaseImageSet();
  expect(unsubscribe).toHaveBeenCalled();
  expect(finalize).toHaveBeenCalled();
  expect(layer.state).toMatchObject({imageSet: null, resolvedLayers: []});
});

test('ImageSourceLayer forwards every ImageSet lifecycle event', () => {
  const listeners: Record<string, (...args: any[]) => void> = {};
  const unsubscribe = vi.fn();
  const mockImageSet = {
    setOptions: vi.fn(),
    subscribe: vi.fn((listener: typeof listeners) => {
      Object.assign(listeners, listener);
      return unsubscribe;
    }),
    finalize: vi.fn()
  };
  const imageSetSpy = vi.spyOn(ImageSet, 'fromImageSource').mockReturnValue(mockImageSet as any);
  const callbacks = {
    onLoadingStateChange: vi.fn(),
    onMetadataLoad: vi.fn(),
    onMetadataLoadError: vi.fn(),
    onImageLoadStart: vi.fn(),
    onImageLoad: vi.fn(),
    onImageLoadError: vi.fn()
  };
  const layer = createLayer({id: 'events', data: TEST_IMAGE_SOURCE as any, ...callbacks});
  layer.state = {imageSet: null, resolvedLayers: [], unsubscribeImageSetEvents: null};
  layer.setState = (update: any) => Object.assign(layer.state, update);
  layer.setNeedsUpdate = vi.fn();
  layer._getOrCreateImageSet(TEST_IMAGE_SOURCE, true);

  const error = new Error('fixture');
  listeners.onLoadingStateChange(true);
  listeners.onMetadataLoad({name: 'metadata'});
  listeners.onMetadataLoadError(error);
  listeners.onImageLoadStart(4);
  listeners.onImageLoad({requestId: 4});
  listeners.onImageLoadError(4, error);
  listeners.onUpdate();

  expect(callbacks.onLoadingStateChange).toHaveBeenCalledWith(true);
  expect(callbacks.onMetadataLoad).toHaveBeenCalledWith({name: 'metadata'});
  expect(callbacks.onMetadataLoadError).toHaveBeenCalledWith(error);
  expect(callbacks.onImageLoadStart).toHaveBeenCalledWith(4);
  expect(callbacks.onImageLoad).toHaveBeenCalledWith(4);
  expect(callbacks.onImageLoadError).toHaveBeenCalledWith(4, error);
  expect(layer.setNeedsUpdate).toHaveBeenCalledTimes(2);
  layer._releaseImageSet();
  expect(unsubscribe).toHaveBeenCalledOnce();
  imageSetSpy.mockRestore();
});

test('ImageSourceLayer uses scalar feature-info layers and finalizes owned state', async () => {
  const getFeatureInfoText = vi.fn(async () => 'info');
  const finalize = vi.fn();
  const layer = createLayer();
  layer.state = {
    resolvedSource: {source: {finalize}, owned: true},
    imageSet: {
      imageSource: {getFeatureInfoText},
      currentRequest: {
        parameters: {
          layers: 'roads',
          boundingBox: [
            [0, 0],
            [1, 1]
          ],
          width: 1,
          height: 1
        }
      }
    }
  };
  await expect(layer.getFeatureInfoText(3, 4)).resolves.toBe('info');
  expect(getFeatureInfoText).toHaveBeenCalledWith(
    expect.objectContaining({query_layers: ['roads']})
  );
  layer._releaseImageSet = vi.fn();
  layer.finalizeState({} as any);
  await Promise.resolve();
  expect(finalize).toHaveBeenCalledOnce();
});

test('ImageSourceLayer resolves direct sources and reports invalid source inputs', async () => {
  const onSourceError = vi.fn();
  const layer = createLayer({id: 'resolve', data: TEST_IMAGE_SOURCE as any, onSourceError});
  const loadMetadata = vi.fn(async () => ({layers: [{name: 'first-layer'}]}));
  const setOptions = vi.fn();
  const requestImage = vi.fn();
  const imageSet = {loadMetadata, setOptions, requestImage};
  layer.context = {viewport: createViewport()} as any;
  layer.setState = (update: any) => Object.assign(layer.state, update);
  layer.raiseError = vi.fn();
  layer.state = {
    resolvedData: null,
    resolvedSource: null,
    resolvedLayers: [],
    imageSet: null,
    unsubscribeImageSetEvents: null
  };
  layer._getOrCreateImageSet = vi.fn(() => imageSet);
  await layer.resolveImageSource(layer.props);
  await Promise.resolve();
  expect(layer.state.resolvedData).toBe(TEST_IMAGE_SOURCE);
  expect(setOptions).toHaveBeenCalledWith({imageSource: TEST_IMAGE_SOURCE});
  expect(loadMetadata).toHaveBeenCalled();

  const invalidLayer = createLayer({id: 'invalid', data: {} as any, onSourceError});
  invalidLayer.state = {...layer.state, resolvedData: null, resolvedSource: null};
  invalidLayer.raiseError = vi.fn();
  await invalidLayer.resolveImageSource(invalidLayer.props);
  expect(onSourceError).toHaveBeenCalled();
  expect(invalidLayer.raiseError).toHaveBeenCalled();
});

function createViewport() {
  return {
    id: 'viewport',
    width: 256,
    height: 128,
    resolution: 1,
    getBounds: () => [1, 2, 3, 4]
  } as any;
}
