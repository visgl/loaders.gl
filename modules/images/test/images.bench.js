import {ImageLoader, isImageTypeSupported} from '@loaders.gl/images';
import {fetchFile, parse} from '@loaders.gl/core';

const TEST_URL = '@loaders.gl/images/test/data/img1-preview.png';

export default async function jsonLoaderBench(suite) {
  suite.group('ImageLoader - parsing');

  const response = await fetchFile(TEST_URL);
  const arrayBuffer = await response.arrayBuffer();

  for (const type of ['html', 'imagebitmap', 'ndarray']) {
    if (isImageTypeSupported(type)) {
      suite.addAsync(`load(ImageLoader, type=${type})`, async () => {
        return await parse(arrayBuffer, ImageLoader, {image: {type}});
      });
    }
  }
}
