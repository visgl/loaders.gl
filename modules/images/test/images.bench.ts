import {ImageLoader, isImageTypeSupported} from '@loaders.gl/images';
import {fetchFile, parse} from '@loaders.gl/core';

const TEST_URL = '@loaders.gl/images/test/data/tiles/colortile-256x256.png';

const OPTIONS: {type: 'imagebitmap' | 'image' | 'data'; decode?: boolean; worker?: boolean}[] = [
  {type: 'imagebitmap'},
  {type: 'image', decode: false},
  {type: 'image', decode: true},
  {type: 'data'}
];

export default async function imageLoaderBench(suite) {
  const response = await fetchFile(TEST_URL);
  const masterArrayBuffer = await response.arrayBuffer();

  // warm up loader (load any dynamic libraries or workers)
  await parse(masterArrayBuffer.slice(0), ImageLoader);

  // Add the tests
  suite.group('ImageLoader: parallel parsing of 256x256 color tiles');
  for (const options of OPTIONS) {
    const {type, worker} = options;
    if (isImageTypeSupported(type)) {
      suite.addAsync(
        `parse({images: {${JSON.stringify(options)}}) parallel`,
        {unit: 'tiles(256x256)', _throughput: 100, _target: 1000},
        async () => await parse(masterArrayBuffer.slice(0), ImageLoader, {worker, image: options})
      );
    }
  }

  suite.group('ImageLoader: sequential parsing of 256x256 color tiles');
  for (const options of OPTIONS) {
    const {type, worker} = options;
    if (isImageTypeSupported(type)) {
      suite.addAsync(
        `parse({images: ${JSON.stringify(options)}}) sequential`,
        {unit: 'tiles(256x256)', _target: 1000},
        async () => {
          const arrayBuffer = masterArrayBuffer.slice(0);
          return await parse(arrayBuffer, ImageLoader, {worker, image: options});
        }
      );
    }
  }

  // for (const type of ['image', 'imagebitmap', 'data']) {
  //   if (isImageTypeSupported(type)) {
  //     suite.addAsync(`parse(ImageLoader, type=${type}, data=true)`, async () => {
  //       return await parse(arrayBuffer, ImageLoader, {image: {type, data: true}});
  //     });
  //   }
  // }
}
