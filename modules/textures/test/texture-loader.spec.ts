// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile, load, parse, selectLoader} from '@loaders.gl/core';
import {getImageData, getImageType} from '@loaders.gl/images';
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
function checkImageTextureLevel(textureLevel, message: string) {
  expect(textureLevel.shape, `${message} has texture-level shape`).toBe('texture-level');
  expect(textureLevel.compressed, `${message} is uncompressed`).toBeFalsy();
  expect(textureLevel.width > 0, `${message} has width`).toBeTruthy();
  expect(textureLevel.height > 0, `${message} has height`).toBeTruthy();
  expect(
    textureLevel.data instanceof Uint8Array,
    `${message} uses a Uint8Array payload`
  ).toBeTruthy();
  expect(textureLevel.data.length, `${message} uses an empty byte payload`).toBe(0);
  expect(textureLevel.textureFormat, `${message} has canonical texture format`).toBe('rgba8unorm');
  if (typeof ImageBitmap !== 'undefined') {
    expect(
      textureLevel.imageBitmap instanceof ImageBitmap,
      `${message} preserves the ImageBitmap`
    ).toBeTruthy();
    expect(getImageType(textureLevel.imageBitmap), `${message} is a bitmap`).toBe('imagebitmap');
    const imageData = getImageData(textureLevel.imageBitmap);
    expect(imageData.width, `${message} bitmap data preserves width`).toBe(textureLevel.width);
    expect(imageData.height, `${message} bitmap data preserves height`).toBe(textureLevel.height);
  }
}
test('TextureLoader#load manifest', async () => {
  const texture = await load(IMAGE_TEXTURE_MANIFEST_URL, TextureLoader);
  expect(texture.shape, 'returns a texture').toBe('texture');
  expect(texture.type, 'returns a 2d texture').toBe('2d');
  expect(texture.data.length, 'returns one level').toBe(1);
  checkImageTextureLevel(texture.data[0], 'level 0');
});
test('TextureLoader#load mipmaps manifest', async () => {
  const texture = await load(IMAGE_TEXTURE_MIPMAP_MANIFEST_URL, TextureLoader);
  expect(texture.shape, 'returns a texture').toBe('texture');
  expect(texture.type, 'returns a 2d texture').toBe('2d');
  expect(texture.data.length, 'loads all mip levels').toBe(3);
  texture.data.forEach((textureLevel, index) =>
    checkImageTextureLevel(textureLevel, `level ${index}`)
  );
});
test('TextureLoader#rejects deprecated image output modes', async () => {
  await expect(
    load(IMAGE_TEXTURE_MANIFEST_URL, TextureLoader, {image: {type: 'data'}} as any),
    'manifest member parsing rejects deprecated image output modes'
  ).rejects.toThrow(/ImageBitmapLoader only accepts options\.image\.type='imagebitmap'/);
});
test('TextureArrayLoader#load manifest', async () => {
  const texture = await load(IMAGE_TEXTURE_ARRAY_MANIFEST_URL, TextureArrayLoader);
  expect(texture.shape, 'returns a texture').toBe('texture');
  expect(texture.type, 'returns a 2d array texture').toBe('2d-array');
  expect(texture.data.length, 'loads every layer').toBe(2);
  texture.data.forEach((layer, index) => {
    expect(layer.length, `layer ${index} has one mip level`).toBe(1);
    checkImageTextureLevel(layer[0], `layer ${index} level 0`);
  });
});
test('TextureCubeLoader#load manifest', async () => {
  const texture = await load(IMAGE_TEXTURE_CUBE_MANIFEST_URL, TextureCubeLoader);
  expect(texture.shape, 'returns a texture').toBe('texture');
  expect(texture.type, 'returns a cube texture').toBe('cube');
  expect(texture.data.length, 'loads six cube faces').toBe(6);
  texture.data.forEach((faceLevels, index) => {
    expect(faceLevels.length, `face ${index} has one mip level`).toBe(1);
    checkImageTextureLevel(faceLevels[0], `face ${index} level 0`);
  });
});
test('TextureLoader#parse with core.baseUrl', async () => {
  const requestedUrls: string[] = [];
  const memberUrl = '@loaders.gl/images/test/data/ibl/brdfLUT.png';
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url);
    if (!url.endsWith('images/test/data/ibl/brdfLUT.png')) {
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
  expect(texture.type, 'resolves relative member URLs against core.baseUrl').toBe('2d');
  expect(
    requestedUrls[0]?.endsWith('images/test/data/ibl/brdfLUT.png'),
    'normalizes aliased relative member URLs against core.baseUrl'
  ).toBeTruthy();
  checkImageTextureLevel(texture.data[0], 'level 0');
});
test('TextureLoader#parse with extensionless core.baseUrl', async () => {
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
  expect(texture.type, 'resolves against the source manifest directory').toBe('2d');
  expect(requestedUrls, 'extensionless manifest URLs still resolve sibling members').toEqual([
    'https://example.com/manifests/member.png'
  ]);
  checkImageTextureLevel(texture.data[0], 'level 0');
});
test('TextureLoader#template with auto mipLevels', async () => {
  const requestedUrls: string[] = [];
  const specularImagePattern =
    /images\/test\/data\/ibl\/papermill\/specular\/specular_back_(\d+)\.jpg$/;
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url);
    const match = url.match(specularImagePattern);
    if (!match) {
      throw new Error(`Unexpected URL ${url}`);
    }
    return await fetchFile(
      `@loaders.gl/images/test/data/ibl/papermill/specular/specular_back_${match[1]}.jpg`
    );
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
  expect(texture.type, 'returns a 2d texture').toBe('2d');
  expect(texture.data.length, 'template source expands the auto mip chain').toBe(10);
  expect(
    requestedUrls.some(url =>
      url.endsWith('images/test/data/ibl/papermill/specular/specular_back_0.jpg')
    ),
    'template source resolves aliased relative member URLs'
  ).toBeTruthy();
  texture.data.forEach((textureLevel, index) =>
    checkImageTextureLevel(textureLevel, `level ${index}`)
  );
});
test('TextureLoader#template supports escaped braces', async () => {
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
  checkImageTextureLevel(texture.data[0], 'level 0');
  expect(decodeURIComponent(requestedUrls[0]), 'escaped braces are preserved').toBe(
    'https://example.com/file{literal}.png'
  );
});
test('TextureLoader#template reports invalid placeholders', async () => {
  await expect(
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
    'invalid placeholders fail with a clear error'
  ).rejects.toThrow(/unsupported placeholder/);
});
test('TextureArrayLoader#template supports index placeholder', async () => {
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
  expect(texture.type, 'template array returns a 2d array texture').toBe('2d-array');
  expect(texture.data.length, 'template array expands every layer').toBe(2);
  texture.data.forEach((layer, index) =>
    checkImageTextureLevel(layer[0], `layer ${index} level 0`)
  );
  expect(requestedUrls, 'index placeholder is expanded for each layer').toEqual([
    'https://example.com/layer-0.png',
    'https://example.com/layer-1.png'
  ]);
});
test('TextureLoader#uses the top-level fetch function for members', async () => {
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
  checkImageTextureLevel(texture.data[0], 'level 0');
  expect(requestedUrls, 'top-level fetch is reused for members').toEqual([manifestUrl, memberUrl]);
});
test('TextureLoader#uses top-level loaders for members', async () => {
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
  expect(texture.type, 'member parsing still wraps into a 2d texture').toBe('2d');
  expect(texture.format, 'member parsing uses the custom loader result').toBe('bc1-rgba-unorm');
  expect(texture.data[0].compressed, 'member level remains compressed').toBe(true);
  expect(Array.from(texture.data[0].data), 'member level data is preserved').toEqual([1, 2, 3]);
});
test('TextureCubeLoader#template supports cube placeholders', async () => {
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
  expect(texture.type, 'template cube returns a cube texture').toBe('cube');
  expect(texture.data.length, 'template cube expands every face').toBe(6);
  expect(requestedUrls, 'cube placeholders are expanded for every face').toEqual([
    'https://example.com/cube-+X-right.png',
    'https://example.com/cube--X-left.png',
    'https://example.com/cube-+Y-top.png',
    'https://example.com/cube--Y-bottom.png',
    'https://example.com/cube-+Z-front.png',
    'https://example.com/cube--Z-back.png'
  ]);
});
test('TextureCubeArrayLoader#template supports layer index and face placeholders', async () => {
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
  expect(texture.type, 'cube array returns a cube-array texture').toBe('cube-array');
  expect(texture.data.length, 'cube array returns one cubemap per layer').toBe(2);
  expect(texture.data[0].length, 'each layer contains six cube faces').toBe(6);
  texture.data.forEach((layer, layerIndex) =>
    layer.forEach((faceLevels, faceIndex) => {
      expect(faceLevels.length, `layer ${layerIndex} face ${faceIndex} has one mip level`).toBe(1);
      checkImageTextureLevel(faceLevels[0], `layer ${layerIndex} face ${faceIndex} level 0`);
    })
  );
  expect(requestedUrls.length, 'all cube array members are loaded').toBe(12);
  expect(
    requestedUrls.includes('https://example.com/cube-0-+X.png'),
    'layer index 0 is expanded'
  ).toBeTruthy();
  expect(
    requestedUrls.includes('https://example.com/cube-1--Z.png'),
    'layer index 1 is expanded'
  ).toBeTruthy();
});
test('Texture loaders#select by shape', async () => {
  const loader = await selectLoader(
    JSON.stringify({
      shape: 'image-texture-array',
      layers: ['layer-0.png']
    }),
    [TextureLoader, TextureArrayLoader, TextureCubeLoader, TextureCubeArrayLoader]
  );
  expect(loader, 'shape discriminator selects the matching loader').toBe(TextureArrayLoader);
});
test('Texture loaders#load selects by shape for JSON responses', async () => {
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
  expect(texture.type, 'shape discriminator selects the matching manifest loader').toBe('2d-array');
  expect(texture.data.length, 'loads the array layer through URL-based auto-selection').toBe(1);
  checkImageTextureLevel(texture.data[0][0], 'layer 0 level 0');
});
