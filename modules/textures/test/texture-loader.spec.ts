// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {fetchFile, load, parse, selectLoader} from '@loaders.gl/core';
import {
  TextureArrayLoader,
  TextureCubeArrayLoader,
  TextureCubeLoader,
  TextureLoader
} from '@loaders.gl/textures';

const IMAGE_TEXTURE_MANIFEST_URL =
  '@loaders.gl/textures/test/data/composite-image/image-texture.json';
const IMAGE_TEXTURE_MIPMAP_MANIFEST_URL =
  '@loaders.gl/textures/test/data/composite-image/image-texture-mipmaps.json';
const IMAGE_TEXTURE_ARRAY_MANIFEST_URL =
  '@loaders.gl/textures/test/data/composite-image/image-texture-array.json';
const IMAGE_TEXTURE_CUBE_MANIFEST_URL =
  '@loaders.gl/textures/test/data/composite-image/image-texture-cube.json';

function checkImageTextureLevel(t, textureLevel, message: string) {
  t.equal(textureLevel.shape, 'texture-level', `${message} has texture-level shape`);
  t.notOk(textureLevel.compressed, `${message} is uncompressed`);
  t.ok(textureLevel.width > 0, `${message} has width`);
  t.ok(textureLevel.height > 0, `${message} has height`);
  t.ok(textureLevel.data instanceof Uint8Array, `${message} uses a Uint8Array payload`);
  t.equal(textureLevel.data.length, 0, `${message} uses an empty byte payload`);
  t.equal(textureLevel.textureFormat, 'rgba8unorm', `${message} has canonical texture format`);
  if (typeof ImageBitmap !== 'undefined') {
    t.ok(textureLevel.imageBitmap instanceof ImageBitmap, `${message} preserves the ImageBitmap`);
  }
}

test('TextureLoader#load manifest', async (t) => {
  const texture = await load(IMAGE_TEXTURE_MANIFEST_URL, TextureLoader);
  t.equal(texture.shape, 'texture', 'returns a texture');
  t.equal(texture.type, '2d', 'returns a 2d texture');
  t.equal(texture.data.length, 1, 'returns one level');
  checkImageTextureLevel(t, texture.data[0], 'level 0');
  t.end();
});

test('TextureLoader#load mipmaps manifest', async (t) => {
  const texture = await load(IMAGE_TEXTURE_MIPMAP_MANIFEST_URL, TextureLoader);
  t.equal(texture.shape, 'texture', 'returns a texture');
  t.equal(texture.type, '2d', 'returns a 2d texture');
  t.equal(texture.data.length, 3, 'loads all mip levels');
  texture.data.forEach((textureLevel, index) =>
    checkImageTextureLevel(t, textureLevel, `level ${index}`)
  );
  t.end();
});

test('TextureArrayLoader#load manifest', async (t) => {
  const texture = await load(IMAGE_TEXTURE_ARRAY_MANIFEST_URL, TextureArrayLoader);
  t.equal(texture.shape, 'texture', 'returns a texture');
  t.equal(texture.type, '2d-array', 'returns a 2d array texture');
  t.equal(texture.data.length, 2, 'loads every layer');
  texture.data.forEach((layer, index) => {
    t.equal(layer.length, 1, `layer ${index} has one mip level`);
    checkImageTextureLevel(t, layer[0], `layer ${index} level 0`);
  });
  t.end();
});

test('TextureCubeLoader#load manifest', async (t) => {
  const texture = await load(IMAGE_TEXTURE_CUBE_MANIFEST_URL, TextureCubeLoader);
  t.equal(texture.shape, 'texture', 'returns a texture');
  t.equal(texture.type, 'cube', 'returns a cube texture');
  t.equal(texture.data.length, 6, 'loads six cube faces');
  texture.data.forEach((faceLevels, index) => {
    t.equal(faceLevels.length, 1, `face ${index} has one mip level`);
    checkImageTextureLevel(t, faceLevels[0], `face ${index} level 0`);
  });
  t.end();
});

test('TextureLoader#parse with core.baseUrl', async (t) => {
  const requestedUrls: string[] = [];
  const memberUrl = '@loaders.gl/images/test/data/ibl/brdfLUT.png';
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url);
    if (url !== memberUrl) {
      throw new Error(`Unexpected URL ${url}`);
    }
    return await fetchFile(memberUrl);
  };

  const manifestText = JSON.stringify({
    shape: 'image-texture',
    image: '../../../../images/test/data/ibl/brdfLUT.png'
  });

  const texture = await parse(manifestText, TextureLoader, {
    fetch,
    core: {
      baseUrl: IMAGE_TEXTURE_MANIFEST_URL
    }
  });

  t.equal(texture.type, '2d', 'resolves relative member URLs against core.baseUrl');
  t.deepEqual(
    requestedUrls,
    [memberUrl],
    'normalizes aliased relative member URLs against core.baseUrl'
  );
  checkImageTextureLevel(t, texture.data[0], 'level 0');
  t.end();
});

test('TextureLoader#parse with extensionless core.baseUrl', async (t) => {
  const requestedUrls: string[] = [];
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url);
    return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png');
  };

  const texture = await parse(
    JSON.stringify({
      shape: 'image-texture',
      image: 'member.png'
    }),
    TextureLoader,
    {
      fetch,
      core: {
        baseUrl: 'https://example.com/manifests/texture-manifest'
      }
    }
  );

  t.equal(texture.type, '2d', 'resolves against the source manifest directory');
  t.deepEqual(
    requestedUrls,
    ['https://example.com/manifests/member.png'],
    'extensionless manifest URLs still resolve sibling members'
  );
  checkImageTextureLevel(t, texture.data[0], 'level 0');
  t.end();
});

test('TextureLoader#template with auto mipLevels', async (t) => {
  const requestedUrls: string[] = [];
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url);
    if (!url.startsWith('@loaders.gl/images/test/data/ibl/papermill/specular/specular_back_')) {
      throw new Error(`Unexpected URL ${url}`);
    }
    return await fetchFile(url);
  };

  const manifestText = JSON.stringify({
    shape: 'image-texture',
    mipLevels: 'auto',
    template: '../../../../images/test/data/ibl/papermill/specular/specular_back_{lod}.jpg'
  });

  const texture = await parse(manifestText, TextureLoader, {
    fetch,
    core: {
      baseUrl: IMAGE_TEXTURE_MIPMAP_MANIFEST_URL
    }
  });

  t.equal(texture.type, '2d', 'returns a 2d texture');
  t.equal(texture.data.length, 10, 'template source expands the auto mip chain');
  t.ok(
    requestedUrls.includes(
      '@loaders.gl/images/test/data/ibl/papermill/specular/specular_back_0.jpg'
    ),
    'template source normalizes aliased relative member URLs'
  );
  texture.data.forEach((textureLevel, index) =>
    checkImageTextureLevel(t, textureLevel, `level ${index}`)
  );
  t.end();
});

test('TextureLoader#template supports escaped braces', async (t) => {
  const requestedUrls: string[] = [];
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url);
    return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png');
  };

  const texture = await parse(
    JSON.stringify({
      shape: 'image-texture',
      mipLevels: 1,
      template: 'file\\{literal\\}.png'
    }),
    TextureLoader,
    {
      fetch,
      core: {
        baseUrl: 'https://example.com/manifest.json'
      }
    }
  );

  checkImageTextureLevel(t, texture.data[0], 'level 0');
  t.deepEqual(
    requestedUrls,
    ['https://example.com/file{literal}.png'],
    'escaped braces are preserved'
  );
  t.end();
});

test('TextureLoader#template reports invalid placeholders', async (t) => {
  await t.rejects(
    parse(
      JSON.stringify({
        shape: 'image-texture',
        mipLevels: 1,
        template: 'texture-{unknown}.png'
      }),
      TextureLoader,
      {
        fetch: fetchFile,
        core: {
          baseUrl: 'https://example.com/manifest.json'
        }
      }
    ),
    /unsupported placeholder/,
    'invalid placeholders fail with a clear error'
  );
  t.end();
});

test('TextureArrayLoader#template supports index placeholder', async (t) => {
  const requestedUrls: string[] = [];
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url);
    return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png');
  };

  const texture = await parse(
    JSON.stringify({
      shape: 'image-texture-array',
      layers: [
        {mipLevels: 1, template: 'layer-{index}.png'},
        {mipLevels: 1, template: 'layer-{index}.png'}
      ]
    }),
    TextureArrayLoader,
    {
      fetch,
      core: {
        baseUrl: 'https://example.com/manifest.json'
      }
    }
  );

  t.equal(texture.type, '2d-array', 'template array returns a 2d array texture');
  t.equal(texture.data.length, 2, 'template array expands every layer');
  texture.data.forEach((layer, index) =>
    checkImageTextureLevel(t, layer[0], `layer ${index} level 0`)
  );
  t.deepEqual(
    requestedUrls,
    ['https://example.com/layer-0.png', 'https://example.com/layer-1.png'],
    'index placeholder is expanded for each layer'
  );
  t.end();
});

test('TextureLoader#uses the top-level fetch function for members', async (t) => {
  const requestedUrls: string[] = [];
  const manifestUrl = 'https://example.com/image-texture.json';
  const memberUrl = 'https://example.com/member.png';

  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url);

    if (url === manifestUrl) {
      return new Response(JSON.stringify({shape: 'image-texture', image: 'member.png'}), {
        headers: {'Content-Type': 'application/json'}
      });
    }

    if (url === memberUrl) {
      return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png');
    }

    throw new Error(`Unexpected URL ${url}`);
  };

  const texture = await load(manifestUrl, TextureLoader, {fetch});

  checkImageTextureLevel(t, texture.data[0], 'level 0');
  t.deepEqual(requestedUrls, [manifestUrl, memberUrl], 'top-level fetch is reused for members');
  t.end();
});

test('TextureLoader#uses top-level loaders for members', async (t) => {
  const manifestUrl = 'https://example.com/image-texture.json';
  const memberUrl = 'https://example.com/member.foo';
  const CustomMemberLoader = {
    id: 'custom-member',
    name: 'Custom Member',
    module: 'textures-test',
    version: 'latest',
    extensions: ['foo'],
    mimeTypes: ['application/x.foo'],
    parse: async () => [
      {
        shape: 'texture-level',
        compressed: true,
        width: 4,
        height: 4,
        data: new Uint8Array([1, 2, 3]),
        textureFormat: 'bc1-rgba-unorm'
      }
    ]
  };

  const fetch = async (url: string): Promise<Response> => {
    if (url === manifestUrl) {
      return new Response(JSON.stringify({shape: 'image-texture', image: 'member.foo'}), {
        headers: {'Content-Type': 'application/json'}
      });
    }

    if (url === memberUrl) {
      return new Response(new Uint8Array([1, 2, 3]), {
        headers: {'Content-Type': 'application/x.foo'}
      });
    }

    throw new Error(`Unexpected URL ${url}`);
  };

  const texture = await load(manifestUrl, [TextureLoader, CustomMemberLoader], {fetch});

  t.equal(texture.type, '2d', 'member parsing still wraps into a 2d texture');
  t.equal(texture.format, 'bc1-rgba-unorm', 'member parsing uses the custom loader result');
  t.equal(texture.data[0].compressed, true, 'member level remains compressed');
  t.deepEqual(Array.from(texture.data[0].data), [1, 2, 3], 'member level data is preserved');
  t.end();
});

test('TextureCubeLoader#template supports cube placeholders', async (t) => {
  const requestedUrls: string[] = [];
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url);
    return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png');
  };

  const texture = await parse(
    JSON.stringify({
      shape: 'image-texture-cube',
      faces: {
        '+X': {mipLevels: 1, template: 'cube-{face}-{direction}.png'},
        '-X': {mipLevels: 1, template: 'cube-{face}-{direction}.png'},
        '+Y': {mipLevels: 1, template: 'cube-{face}-{direction}.png'},
        '-Y': {mipLevels: 1, template: 'cube-{face}-{direction}.png'},
        '+Z': {mipLevels: 1, template: 'cube-{face}-{direction}.png'},
        '-Z': {mipLevels: 1, template: 'cube-{face}-{direction}.png'}
      }
    }),
    TextureCubeLoader,
    {
      fetch,
      core: {
        baseUrl: 'https://example.com/manifest.json'
      }
    }
  );

  t.equal(texture.type, 'cube', 'template cube returns a cube texture');
  t.equal(texture.data.length, 6, 'template cube expands every face');
  t.deepEqual(
    requestedUrls,
    [
      'https://example.com/cube-+X-right.png',
      'https://example.com/cube--X-left.png',
      'https://example.com/cube-+Y-top.png',
      'https://example.com/cube--Y-bottom.png',
      'https://example.com/cube-+Z-front.png',
      'https://example.com/cube--Z-back.png'
    ],
    'cube placeholders are expanded for every face'
  );
  t.end();
});

test('TextureCubeArrayLoader#template supports layer index and face placeholders', async (t) => {
  const requestedUrls: string[] = [];
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url);
    return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png');
  };

  const texture = await parse(
    JSON.stringify({
      shape: 'image-texture-cube-array',
      layers: [
        {
          faces: {
            '+X': {mipLevels: 1, template: 'cube-{index}-{face}.png'},
            '-X': {mipLevels: 1, template: 'cube-{index}-{face}.png'},
            '+Y': {mipLevels: 1, template: 'cube-{index}-{face}.png'},
            '-Y': {mipLevels: 1, template: 'cube-{index}-{face}.png'},
            '+Z': {mipLevels: 1, template: 'cube-{index}-{face}.png'},
            '-Z': {mipLevels: 1, template: 'cube-{index}-{face}.png'}
          }
        },
        {
          faces: {
            '+X': {mipLevels: 1, template: 'cube-{index}-{face}.png'},
            '-X': {mipLevels: 1, template: 'cube-{index}-{face}.png'},
            '+Y': {mipLevels: 1, template: 'cube-{index}-{face}.png'},
            '-Y': {mipLevels: 1, template: 'cube-{index}-{face}.png'},
            '+Z': {mipLevels: 1, template: 'cube-{index}-{face}.png'},
            '-Z': {mipLevels: 1, template: 'cube-{index}-{face}.png'}
          }
        }
      ]
    }),
    TextureCubeArrayLoader,
    {
      fetch,
      core: {
        baseUrl: 'https://example.com/manifest.json'
      }
    }
  );

  t.equal(texture.type, 'cube-array', 'cube array returns a cube-array texture');
  t.equal(texture.data.length, 2, 'cube array returns one cubemap per layer');
  t.equal(texture.data[0].length, 6, 'each layer contains six cube faces');
  t.equal(requestedUrls.length, 12, 'all cube array members are loaded');
  t.ok(requestedUrls.includes('https://example.com/cube-0-+X.png'), 'layer index 0 is expanded');
  t.ok(requestedUrls.includes('https://example.com/cube-1--Z.png'), 'layer index 1 is expanded');
  t.end();
});

test('Texture loaders#select by shape', async (t) => {
  const loader = await selectLoader(
    JSON.stringify({
      shape: 'image-texture-array',
      layers: ['layer-0.png']
    }),
    [TextureLoader, TextureArrayLoader, TextureCubeLoader, TextureCubeArrayLoader]
  );

  t.is(loader, TextureArrayLoader, 'shape discriminator selects the matching loader');
  t.end();
});

test('Texture loaders#load selects by shape for JSON responses', async (t) => {
  const manifestUrl = 'https://example.com/texture-manifest';
  const memberUrl = 'https://example.com/member.png';

  const fetch = async (url: string): Promise<Response> => {
    if (url === manifestUrl) {
      return new Response(
        JSON.stringify({
          shape: 'image-texture-array',
          layers: ['member.png']
        }),
        {
          headers: {'Content-Type': 'application/json'}
        }
      );
    }

    if (url === memberUrl) {
      return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png');
    }

    throw new Error(`Unexpected URL ${url}`);
  };

  const texture = await load(
    manifestUrl,
    [TextureLoader, TextureArrayLoader, TextureCubeLoader, TextureCubeArrayLoader],
    {fetch}
  );

  t.equal(texture.type, '2d-array', 'shape discriminator selects the matching manifest loader');
  t.equal(texture.data.length, 1, 'loads the array layer through URL-based auto-selection');
  checkImageTextureLevel(t, texture.data[0][0], 'layer 0 level 0');
  t.end();
});
