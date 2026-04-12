// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

function createLayer(
  props: ImageSourceLayerProps = {id: 'test', data: TEST_IMAGE_SOURCE as any}
) {
  return new ImageSourceLayer(props as any) as any;
}

test('ImageSourceLayer#accepts direct ImageSource inputs', t => {
  const layer = createLayer();
  const resolvedData = layer._resolveData(layer.props);
  t.equal(resolvedData, TEST_IMAGE_SOURCE);
  t.end();
});

test('ImageSourceLayer#resolves URL inputs with sources', t => {
  const layer = createLayer({
    id: 'test',
    data: 'https://example.com/wms',
    sources: [TEST_SOURCE_FACTORY as any]
  });

  const resolvedData = layer._resolveData(layer.props);
  t.equal(resolvedData, TEST_IMAGE_SOURCE);
  t.end();
});

test('ImageSourceLayer#rejects Blob inputs without sources', t => {
  const layer = createLayer({id: 'test', data: new Blob(['test'])});

  t.throws(() => layer._resolveData(layer.props), /requires `sources`/);
  t.end();
});

test('ImageSourceLayer#creates an ImageSet for resolved sources', t => {
  const layer = createLayer();
  layer.state = {
    resolvedData: null,
    imageSet: null,
    unsubscribeImageSetEvents: null
  };

  const imageSet = layer._getOrCreateImageSet(TEST_IMAGE_SOURCE as any, true);

  t.ok(imageSet);
  t.equal(layer.state.imageSet, imageSet);

  layer._releaseImageSet();
  t.end();
});

test('ImageSourceLayer#forwards feature info using the last request parameters', async t => {
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
          boundingBox: [[1, 2], [3, 4]],
          width: 256,
          height: 128,
          crs: 'EPSG:4326'
        }
      }
    },
    unsubscribeImageSetEvents: null
  };

  const featureInfo = await layer.getFeatureInfoText(10, 20);

  t.ok(featureInfo?.includes('"query_layers":["visible"]'));
  t.ok(featureInfo?.includes('"width":256'));
  t.end();
});

test('ImageSourceLayer#keeps auto-SRS request shaping behavior', t => {
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

  t.equal(geographicParameters.crs, 'EPSG:4326');
  t.equal(mercatorParameters.crs, 'EPSG:3857');
  t.notDeepEqual(mercatorParameters.boundingBox, [
    [1, 2],
    [3, 4]
  ]);
  t.end();
});
