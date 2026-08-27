import {expect, test} from 'vitest';
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
test('ImageSet#loads metadata from ImageSource', async () => {
  const imageSet = ImageSet.fromImageSource(createImageSource() as any);
  const metadata = await imageSet.loadMetadata();
  expect(metadata.name).toBe('test');
  expect(imageSet.metadata?.name).toBe('test');
  imageSet.finalize();
});
test('ImageSet#accepts the latest completed request', async () => {
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
  imageSet.requestImage({
    layers: [],
    boundingBox: [
      [0, 0],
      [1, 1]
    ],
    width: 1,
    height: 1
  });
  imageSet.requestImage({
    layers: [],
    boundingBox: [
      [0, 0],
      [1, 1]
    ],
    width: 2,
    height: 2
  });
  resolveSecond?.();
  await new Promise(resolve => setTimeout(resolve, 0));
  resolveFirst?.();
  await new Promise(resolve => setTimeout(resolve, 0));
  expect((imageSet.image as any)?.name).toBe('second');
  expect(imageSet.currentRequest?.requestId).toBe(1);
  imageSet.finalize();
});
test('ImageSet#emits metadata and image errors', async () => {
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
  imageSet.requestImage({
    layers: [],
    boundingBox: [
      [0, 0],
      [1, 1]
    ],
    width: 1,
    height: 1
  });
  await new Promise(resolve => setTimeout(resolve, 0));
  metadataFailed = false;
  imageFailed = false;
  await imageSet.loadMetadata();
  imageSet.requestImage({
    layers: [],
    boundingBox: [
      [0, 0],
      [1, 1]
    ],
    width: 2,
    height: 2
  });
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(metadataErrors).toEqual(['metadata boom']);
  expect(imageErrors).toEqual(['image boom']);
  expect(imageSet.metadata?.name).toBe('test');
  expect((imageSet.image as any)?.name).toBe('image');
  imageSet.finalize();
});
test('ImageSet#debounces image requests', async () => {
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
  imageSet.requestImage({
    layers: [],
    boundingBox: [
      [0, 0],
      [1, 1]
    ],
    width: 1,
    height: 1
  });
  imageSet.requestImage({
    layers: [],
    boundingBox: [
      [0, 0],
      [1, 1]
    ],
    width: 2,
    height: 2
  });
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(calls).toEqual([2]);
  expect((imageSet.image as any)?.width).toBe(2);
  imageSet.finalize();
});
test('ImageSet#emits loading state changes', async () => {
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
  imageSet.requestImage({
    layers: [],
    boundingBox: [
      [0, 0],
      [1, 1]
    ],
    width: 1,
    height: 1
  });
  await new Promise(resolve => setTimeout(resolve, 0));
  resolveImage?.();
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(loadingStates).toEqual([true, false]);
  imageSet.finalize();
});
