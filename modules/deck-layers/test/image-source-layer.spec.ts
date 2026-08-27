// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {ImageSourceLayer, type ImageSourceLayerProps} from '@loaders.gl/deck-layers';
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
