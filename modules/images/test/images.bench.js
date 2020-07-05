/* global createImageBitmap */
import {
  ImageLoader,
  isImageTypeSupported,
  getImageData,
  getImageDataAsync
} from '@loaders.gl/images';
import {fetchFile, parse} from '@loaders.gl/core';

const TEST_URL = '@loaders.gl/images/test/data/tiles/colortile-256x256.png';

const OPTIONS = [
  {type: 'imagebitmap'},
  {type: 'data', _extractDataOnWorker: true},
  {type: 'data', _extractDataOnWorker: false},
  {type: 'image', decode: true},
  {type: 'image', decode: false}
];

export default async function imageLoaderBench(suite) {
  // ADD IMAGE DATA EXTRACTION BENCHMARKS
  await getImageDataBench(suite);

  const response = await fetchFile(TEST_URL);
  const masterArrayBuffer = await response.arrayBuffer();

  // warm up loader (load any dynamic libraries or workers)
  await parse(masterArrayBuffer.slice(0), ImageLoader);

  // Add the tests

  // PARALLEL PARSING

  suite.group('ImageLoader: parallel parsing of 256x256 color tiles');
  for (const options of OPTIONS) {
    const {type, worker} = options;
    if (isImageTypeSupported(type)) {
      suite.addAsync(
        `parse({images: {${JSON.stringify(options)}}) parallel`,
        {unit: 'tiles(256x256)', _throughput: 100, _target: 1000},
        async () =>
          await parse(masterArrayBuffer.slice(0), ImageLoader, {
            worker,
            image: options
          })
      );
    }
  }

  // SEQUENTIAL PARSING

  suite.group('ImageLoader: sequential parsing of 256x256 color tiles');
  for (const options of OPTIONS) {
    const {type, worker} = options;
    if (isImageTypeSupported(type)) {
      suite.addAsync(
        `parse({images: ${JSON.stringify(options)}}) sequential`,
        {unit: 'tiles(256x256)', _target: 1000},
        async () => await parse(masterArrayBuffer.slice(0), ImageLoader, {worker, image: options})
      );
    }
  }
}

async function getImageDataBench(suite) {
  const response = await fetchFile(TEST_URL);
  const masterArrayBuffer = await response.arrayBuffer();

  // DATA EXTRACTION

  if (isImageTypeSupported('imagebitmap')) {
    suite.group('getImageData: parallel data extraction from 256x256 color tiles');

    // We need a lot of ImageBitmaps as they get detached in worker processing
    const BITMAP_COUNT = 20000;
    const imageBitmap = await parse(masterArrayBuffer.slice(0), ImageLoader, {
      image: {type: 'imagebitmap'}
    });
    const imageBitmapPromises = new Array(BITMAP_COUNT)
      .fill(null)
      .map((_, i) => createImageBitmap(imageBitmap, i % 20, 0, 256 - (i % 20), 256));
    const imageBitmaps = await Promise.all(imageBitmapPromises);
    let imageBitmapCounter = 0;

    // Warm up the thread pools
    const warmUpPromises = [];
    for (let i = 0; i < 20; ++i) {
      warmUpPromises.push(getImageDataAsync(imageBitmaps[imageBitmapCounter++]));
    }
    await Promise.all(warmUpPromises);

    suite.addAsync(
      `getImageDataAsync()`,
      {unit: 'tiles(256x256)', _throughput: 100, _target: 1000},
      async () => await getImageDataAsync(imageBitmaps[imageBitmapCounter++])
    );

    suite.addAsync(
      `getImageData()`,
      {unit: 'tiles(256x256)', _throughput: 100, _target: 1000},
      async () => await getImageData(imageBitmaps[imageBitmapCounter++])
    );

    suite.group('getImageData: sequential data extraction from 256x256 color tiles');

    suite.addAsync(
      `getImageDataAsync() sequential`,
      {unit: 'tiles(256x256)', _target: 1000},
      async () => await getImageDataAsync(imageBitmaps[imageBitmapCounter++])
    );

    suite.add(`getImageData() sequential`, {unit: 'tiles(256x256)', _target: 1000}, () =>
      getImageData(imageBitmaps[imageBitmapCounter++])
    );

    suite.add(
      `getImageData() sequential (same bitmap) - browser caching defeating benchmarks!`,
      {unit: 'tiles(256x256)', _target: 1000},
      () => getImageData(imageBitmap)
    );
  }
}
