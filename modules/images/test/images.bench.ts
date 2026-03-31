import {ImageBitmapLoader, isImageTypeSupported} from '@loaders.gl/images';
import {fetchFile, parse} from '@loaders.gl/core';

const TEST_URL = '@loaders.gl/images/test/data/tiles/colortile-256x256.png';

const OPTIONS: {label: string; image?: {type: 'imagebitmap'}; worker?: boolean}[] = [
  {label: 'default'},
  {label: 'imagebitmap', image: {type: 'imagebitmap'}}
];

export default async function imageLoaderBench(suite) {
  const response = await fetchFile(TEST_URL);
  const masterArrayBuffer = await response.arrayBuffer();

  // warm up loader (load any dynamic libraries or workers)
  await parse(masterArrayBuffer.slice(0), ImageBitmapLoader);

  // Add the tests
  suite.group('ImageBitmapLoader: parallel parsing of 256x256 color tiles');
  for (const options of OPTIONS) {
    const {label} = options;
    if (!options.image || isImageTypeSupported(options.image.type)) {
      suite.addAsync(
        `parse(${label}) parallel`,
        {unit: 'tiles(256x256)', _throughput: 100, _target: 1000},
        async () => await parse(masterArrayBuffer.slice(0), ImageBitmapLoader, options)
      );
    }
  }

  suite.group('ImageBitmapLoader: sequential parsing of 256x256 color tiles');
  for (const options of OPTIONS) {
    const {label} = options;
    if (!options.image || isImageTypeSupported(options.image.type)) {
      suite.addAsync(
        `parse(${label}) sequential`,
        {unit: 'tiles(256x256)', _target: 1000},
        async () => {
          const arrayBuffer = masterArrayBuffer.slice(0);
          return await parse(arrayBuffer, ImageBitmapLoader, options);
        }
      );
    }
  }
}
