// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import test from 'tape-promise/tape';

import {BasisLoader} from '@loaders.gl/textures';
import {load, setLoaderOptions, isBrowser} from '@loaders.gl/core';
import {
  GL_COMPRESSED_RGB_ETC1_WEBGL,
  GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
  GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
  GL_COMPRESSED_RGBA_ASTC_4x4_KHR,
  GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
  GL_COMPRESSED_RGBA_S3TC_DXT5_EXT,
  GL_RGB565
} from '../src/lib/gl-extensions';
import {withBasisTranscodingLock} from '../src/lib/parsers/parse-basis';

const BASIS_TEST_URL = '@loaders.gl/textures/test/data/alpha3.basis';
const KTX2_BASIS_TEST_URL = '@loaders.gl/textures/test/data/kodim23.ktx2';

setLoaderOptions({
  _workerType: 'test',
  CDN: null
});

test('BasisLoader#imports', (t) => {
  t.ok(BasisLoader, 'BasisLoader defined');
  t.end();
});

test('BasisLoader#load(URL, worker: false)', async (t) => {
  const images = await load(BASIS_TEST_URL, BasisLoader, {
    core: {worker: false}
  });

  const image = images[0][0];

  t.ok(image, 'image loaded successfully from URL');

  t.equals(image.shape, 'texture-level', 'image shape is correct');
  t.equals(image.width, 768, 'image width is correct');
  t.equals(image.height, 512, 'image height is correct');
  if (isBrowser) {
    t.equals(image.compressed, true, 'image is compressed');
    t.equals(image.data.byteLength, 393216, 'image `data.byteLength` is correct');
  } else {
    t.equals(image.compressed, false, 'image is compressed');
    t.equals(image.data.byteLength, 786432, 'image `data.byteLength` is correct');
    t.equals(image.textureFormat, 'rgb565unorm-webgl', 'image `textureFormat` is correct');
  }

  t.ok(ArrayBuffer.isView(image.data), 'image data is `ArrayBuffer`');

  t.end();
});

test('BasisLoader#load(URL, worker: true)', async (t) => {
  const images = await load(BASIS_TEST_URL, BasisLoader, {worker: true, _nodeWorkers: true});

  const image = images[0][0];

  t.ok(image, 'image loaded successfully from URL');

  t.equals(image.width, 768, 'image width is correct');
  t.equals(image.height, 512, 'image height is correct');
  t.equals(image.compressed, false, 'image height is correct');
  t.equals(image.textureFormat, 'rgb565unorm-webgl', 'image `textureFormat` is correct');

  t.ok(ArrayBuffer.isView(image.data), 'image data is `ArrayBuffer`');
  t.equals(image.data.byteLength, 786432, 'image `data.byteLength` is correct');

  t.end();
});

test('BasisLoader#auto-select a target format', async (t) => {
  // Can't auto-select format in worker because gl context isn't not available on a worker thread
  const images = await load(BASIS_TEST_URL, BasisLoader, {
    core: {worker: false},
    basis: {format: 'auto'}
  });

  const image = images[0][0];

  if (isBrowser) {
    t.ok(
      typeof image.format === 'number' &&
        [
          GL_COMPRESSED_RGBA_ASTC_4x4_KHR,
          GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
          GL_COMPRESSED_RGBA_S3TC_DXT5_EXT,
          GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
          GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
          GL_COMPRESSED_RGB_ETC1_WEBGL
        ].includes(image.format),
      'Browser supports one of GPU textures formats'
    );
    t.ok(image.compressed, 'Basis transcodes to compressed texture');
  } else {
    t.equals(
      image.format,
      GL_RGB565,
      'Basis transcodes to RGB565 in NodeJS'
    );
    t.notOk(image.compressed, "Basis can't transcode to compressed texture in NodeJS");
  }

  t.end();
});

test('BasisLoader#transcode to explicit format', async (t) => {
  const images = await load(BASIS_TEST_URL, BasisLoader, {
    worker: true,
    _nodeWorkers: true,
    basis: {
      format: {
        alpha: 'BC3',
        noAlpha: 'BC1'
      }
    }
  });

  const image = images[0][0];

  t.equals(
    image.format,
    GL_COMPRESSED_RGBA_S3TC_DXT5_EXT,
    'The texture was transcoded to DXT fromat'
  );
  t.equals(image.textureFormat, 'bc3-rgba-unorm', 'The texture exposes the WebGPU format');
  t.ok(image.compressed, 'Basis transcodes to compressed texture');

  t.end();
});

test('BasisLoader#auto-selects format from supportedTextureFormats', async (t) => {
  const images = await load(BASIS_TEST_URL, BasisLoader, {
    core: {worker: false},
    basis: {
      format: 'auto',
      supportedTextureFormats: ['bc3-rgba-unorm']
    }
  });

  const image = images[0][0];

  t.equals(
    image.format,
    GL_COMPRESSED_RGBA_S3TC_DXT5_EXT,
    'BasisLoader selects the matching WebGL format'
  );
  t.equals(image.textureFormat, 'bc3-rgba-unorm', 'BasisLoader sets the selected texture format');
  t.end();
});

test('BasisLoader#auto-select a decoder format', async (t) => {
  const images = await load(BASIS_TEST_URL, BasisLoader, {
    worker: true,
    basis: {
      format: 'astc-4x4',
      containerFormat: 'auto'
    }
  });
  const image = images[0][0];
  t.ok(image, 'Transcode .basis');

  const ktx2Images = await load(KTX2_BASIS_TEST_URL, BasisLoader, {
    worker: true,
    _nodeWorkers: true,
    basis: {
      format: 'astc-4x4',
      containerFormat: 'auto'
    }
  });
  const ktx2Image = ktx2Images[0];
  t.ok(ktx2Image, 'Transcode .ktx2');
  t.is(ktx2Image.length, 10, 'Transcode .ktx2 mips');

  t.end();
});

test('BasisLoader#uses injected transcoder modules', async (t) => {
  class FakeBasisFile {
    constructor(data: Uint8Array) {
      t.equals(data.byteLength, 4, 'forwards the provided payload to the injected BasisFile')
    }

    startTranscoding() {
      return true
    }

    getNumImages() {
      return 1
    }

    getNumLevels() {
      return 1
    }

    getImageWidth() {
      return 2
    }

    getImageHeight() {
      return 2
    }

    getHasAlpha() {
      return false
    }

    getImageTranscodedSizeInBytes() {
      return 8
    }

    transcodeImage(decodedData: Uint8Array) {
      decodedData.set([1, 2, 3, 4, 5, 6, 7, 8])
      return true
    }

    close() {}

    delete() {}
  }

  const images = await load(new Uint8Array([1, 2, 3, 4]).buffer, BasisLoader, {
    core: {worker: false},
    basis: {
      format: 'rgb565',
      containerFormat: 'basis'
    },
    modules: {
      basis: {BasisFile: FakeBasisFile}
    }
  })

  const image = images[0][0]

  t.equals(image.width, 2, 'uses the injected BasisFile implementation')
  t.equals(image.height, 2, 'returns the injected texture height')
  t.equals(image.data.byteLength, 8, 'returns the injected transcoded payload size')
  t.end()
})

test('BasisLoader#serializes Basis transcoding work', async (t) => {
  const events: string[] = [];
  let activeTranscodes = 0;

  const runTranscode = async (label: string, delayMs: number) =>
    await withBasisTranscodingLock(async () => {
      events.push(`${label}:start`);
      activeTranscodes++;
      t.equals(activeTranscodes, 1, `${label} runs with exclusive access`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      activeTranscodes--;
      events.push(`${label}:end`);
      return label;
    });

  const [first, second] = await Promise.all([runTranscode('first', 20), runTranscode('second', 0)]);

  t.equals(first, 'first', 'first transcode resolves');
  t.equals(second, 'second', 'second transcode resolves');
  t.deepEqual(
    events,
    ['first:start', 'first:end', 'second:start', 'second:end'],
    'concurrent requests are serialized'
  );
  t.end();
})


// test('BasisLoader#formats', async t => {
//   for (const testCase of TEST_CASES) {
//     await testLoadImage(t, testCase);
//   }
//   t.end();
// });

/*
test('loadImageTexture#worker', t => {
  if (typeof Worker === 'undefined') {
    t.comment('loadImageTexture only works under browser');
    t.end();
    return;
  }

  const worker = new LoadImageWorker();
  let testIndex = 0;

  const runTest = index => {
    const testCase = TEST_CASES[index];
    if (!testCase) {
      t.end();
      return;
    }
    if (testCase.worker === false) {
      // the current loader does not support loading from dataURL in a worker
      runTest(testIndex++);
      return;
    }

    const {title, width, height} = testCase;
    // t.comment(title);

    let {url} = testCase;
    url = url.startsWith('data:') ? url : resolvePath(CONTENT_BASE + url);

    worker.onmessage = ({data}) => {
      if (data.error) {
        t.fail(data.error);
      } else {
        t.ok(data.image, 'loadImageTexture loaded data from url');
        t.ok(
          data.image.width === width && data.image.height === height,
          'loaded image has correct content'
        );
      }

      runTest(testIndex++);
    };

    worker.postMessage(url);
  };

  runTest(testIndex++);
});
*/
