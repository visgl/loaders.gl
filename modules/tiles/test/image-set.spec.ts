// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {ImageSet} from '@loaders.gl/tiles';

function createImageSource() {
  return {
    async getMetadata() {
      return {
        name: 'test',
        keywords: [],
        layers: []
      };
    },
    async getImage(parameters: any) {
      return {parameters};
    }
  };
}

test('ImageSet#loads metadata from ImageSource', async t => {
  const imageSet = ImageSet.fromImageSource(createImageSource() as any);

  const metadata = await imageSet.loadMetadata();

  t.equal(metadata.name, 'test');
  t.equal(imageSet.metadata?.name, 'test');

  imageSet.finalize();
  t.end();
});

test('ImageSet#accepts the latest completed request', async t => {
  let resolveFirst;
  let resolveSecond;
  const imageSet = new ImageSet({
    async getMetadata() {
      return {name: 'test', keywords: [], layers: []};
    },
    getImage(parameters) {
      return new Promise(resolve => {
        if (parameters.width === 1) {
          resolveFirst = () => resolve({name: 'first'});
        } else {
          resolveSecond = () => resolve({name: 'second'});
        }
      }) as Promise<any>;
    }
  });

  imageSet.requestImage({layers: [], boundingBox: [[0, 0], [1, 1]], width: 1, height: 1});
  imageSet.requestImage({layers: [], boundingBox: [[0, 0], [1, 1]], width: 2, height: 2});

  resolveSecond?.();
  await new Promise(resolve => setTimeout(resolve, 0));
  resolveFirst?.();
  await new Promise(resolve => setTimeout(resolve, 0));

  t.equal((imageSet.image as any)?.name, 'second');
  t.equal(imageSet.currentRequest?.requestId, 1);

  imageSet.finalize();
  t.end();
});

test('ImageSet#emits metadata and image errors', async t => {
  const metadataErrors: string[] = [];
  const imageErrors: string[] = [];
  let metadataFailed = true;
  let imageFailed = true;
  const imageSet = new ImageSet({
    async getMetadata() {
      if (metadataFailed) {
        throw new Error('metadata boom');
      }
      return {name: 'test', keywords: [], layers: []};
    },
    async getImage() {
      if (imageFailed) {
        throw new Error('image boom');
      }
      return {name: 'image'} as any;
    }
  });

  imageSet.subscribe({
    onMetadataLoadError: error => metadataErrors.push(error.message),
    onImageLoadError: (_requestId, error) => imageErrors.push(error.message)
  });

  await imageSet.loadMetadata().catch(() => {});
  imageSet.requestImage({layers: [], boundingBox: [[0, 0], [1, 1]], width: 1, height: 1});
  await new Promise(resolve => setTimeout(resolve, 0));

  metadataFailed = false;
  imageFailed = false;
  await imageSet.loadMetadata();
  imageSet.requestImage({layers: [], boundingBox: [[0, 0], [1, 1]], width: 2, height: 2});
  await new Promise(resolve => setTimeout(resolve, 0));

  t.deepEqual(metadataErrors, ['metadata boom']);
  t.deepEqual(imageErrors, ['image boom']);
  t.equal(imageSet.metadata?.name, 'test');
  t.equal((imageSet.image as any)?.name, 'image');

  imageSet.finalize();
  t.end();
});

test('ImageSet#debounces image requests', async t => {
  const calls: number[] = [];
  const imageSet = new ImageSet({
    debounceTime: 5,
    async getMetadata() {
      return {name: 'test', keywords: [], layers: []};
    },
    async getImage(parameters) {
      calls.push(parameters.width);
      return {width: parameters.width} as any;
    }
  });

  imageSet.requestImage({layers: [], boundingBox: [[0, 0], [1, 1]], width: 1, height: 1});
  imageSet.requestImage({layers: [], boundingBox: [[0, 0], [1, 1]], width: 2, height: 2});

  await new Promise(resolve => setTimeout(resolve, 20));

  t.deepEqual(calls, [2]);
  t.equal((imageSet.image as any)?.width, 2);

  imageSet.finalize();
  t.end();
});

test('ImageSet#emits loading state changes', async t => {
  let resolveImage;
  const loadingStates: boolean[] = [];
  const imageSet = new ImageSet({
    async getMetadata() {
      return {name: 'test', keywords: [], layers: []};
    },
    getImage() {
      return new Promise(resolve => {
        resolveImage = () => resolve({name: 'image'});
      }) as Promise<any>;
    }
  });

  imageSet.subscribe({
    onLoadingStateChange: isLoading => loadingStates.push(isLoading)
  });

  imageSet.requestImage({layers: [], boundingBox: [[0, 0], [1, 1]], width: 1, height: 1});
  await new Promise(resolve => setTimeout(resolve, 0));
  resolveImage?.();
  await new Promise(resolve => setTimeout(resolve, 0));

  t.deepEqual(loadingStates, [true, false]);

  imageSet.finalize();
  t.end();
});
