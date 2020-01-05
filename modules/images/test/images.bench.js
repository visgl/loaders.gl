import {ImageLoader, isImageTypeSupported} from '@loaders.gl/images';
import {fetchFile, parse} from '@loaders.gl/core';

const TEST_URL = '@loaders.gl/images/test/data/tiles/colortile-256x256.png';

const OPTIONS = [
  {type: 'ndarray'},
  {type: 'imagebitmap'},
  {type: 'html', decode: false},
  {type: 'html', decode: true}
];

export default async function imageLoaderBench(suite) {
  const response = await fetchFile(TEST_URL);
  const masterArrayBuffer = await response.arrayBuffer();

  // warm up loader (load any dynamic libraries or workers)
  await parse(masterArrayBuffer.slice(), ImageLoader);

  // Add the tests
  suite.group('parse(ImageLoader) - sequential');
  for (const options of OPTIONS) {
    const {type, worker} = options;
    if (isImageTypeSupported(type)) {
      suite.addAsync(`parse(${JSON.stringify(options)}) sequential`, {unit: 'tiles(256x256)'}, async () => {
        const arrayBuffer = masterArrayBuffer.slice();
        return await parse(arrayBuffer, ImageLoader, {worker, image: options});
      });
    }
  }

  suite.group('parse(ImageLoader) - throughput');
  for (const options of OPTIONS) {
    const {type, worker} = options;
    if (isImageTypeSupported(type)) {
      suite.addAsync(
        `parse(${JSON.stringify(options)}) parallel`,
        {unit: 'tiles(256x256)', _throughput: 100},
        async () => await parse(masterArrayBuffer.slice(), ImageLoader, {worker, image: options})
      );
    }
  }
}
