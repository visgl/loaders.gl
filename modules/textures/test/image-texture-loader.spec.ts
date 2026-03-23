// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape'
import {isImage} from '@loaders.gl/images'
import {fetchFile, load, parse, selectLoader} from '@loaders.gl/core'
import {
  ImageTextureArrayLoader,
  ImageTextureCubeArrayLoader,
  ImageTextureCubeLoader,
  ImageTextureLoader
} from '@loaders.gl/textures'

const IMAGE_TEXTURE_MANIFEST_URL =
  '@loaders.gl/textures/test/data/composite-image/image-texture.json'
const IMAGE_TEXTURE_MIPMAP_MANIFEST_URL =
  '@loaders.gl/textures/test/data/composite-image/image-texture-mipmaps.json'
const IMAGE_TEXTURE_ARRAY_MANIFEST_URL =
  '@loaders.gl/textures/test/data/composite-image/image-texture-array.json'
const IMAGE_TEXTURE_CUBE_MANIFEST_URL =
  '@loaders.gl/textures/test/data/composite-image/image-texture-cube.json'

test('ImageTextureLoader#load manifest', async (t) => {
  const image = await load(IMAGE_TEXTURE_MANIFEST_URL, ImageTextureLoader)
  t.ok(isImage(image), 'loads a single image from a manifest')
  t.end()
})

test('ImageTextureLoader#load mipmaps manifest', async (t) => {
  const images = await load(IMAGE_TEXTURE_MIPMAP_MANIFEST_URL, ImageTextureLoader)
  t.equal(images.length, 3, 'loads all mip levels')
  t.ok(images.every(isImage), 'each mip level is an image')
  t.end()
})

test('ImageTextureArrayLoader#load manifest', async (t) => {
  const images = await load(IMAGE_TEXTURE_ARRAY_MANIFEST_URL, ImageTextureArrayLoader)
  t.equal(images.length, 2, 'loads every layer')
  t.ok(images.every(isImage), 'each layer is an image')
  t.end()
})

test('ImageTextureCubeLoader#load manifest', async (t) => {
  const imageCube = await load(IMAGE_TEXTURE_CUBE_MANIFEST_URL, ImageTextureCubeLoader)
  t.equal(Object.keys(imageCube).length, 6, 'loads six cube faces')
  for (const face in imageCube) {
    t.ok(isImage(imageCube[face]), `face ${face} is an image`)
  }
  t.end()
})

test('ImageTextureLoader#parse with core.baseUrl', async (t) => {
  const manifestText = JSON.stringify({
    shape: 'image-texture',
    image: '../../../../images/test/data/ibl/brdfLUT.png'
  })

  const image = await parse(manifestText, ImageTextureLoader, {
    fetch: fetchFile,
    core: {
      baseUrl: IMAGE_TEXTURE_MANIFEST_URL
    }
  })

  t.ok(isImage(image), 'resolves relative member URLs against core.baseUrl')
  t.end()
})

test('ImageTextureLoader#template with auto mipLevels', async (t) => {
  const manifestText = JSON.stringify({
    shape: 'image-texture',
    mipLevels: 'auto',
    template: '../../../../images/test/data/ibl/papermill/specular/specular_back_{lod}.jpg'
  })

  const images = await parse(manifestText, ImageTextureLoader, {
    fetch: fetchFile,
    core: {
      baseUrl: IMAGE_TEXTURE_MIPMAP_MANIFEST_URL
    }
  })

  t.equal(images.length, 10, 'template source expands the auto mip chain')
  t.ok(images.every(isImage), 'template-generated mip levels are images')
  t.end()
})

test('ImageTextureLoader#template supports escaped braces', async (t) => {
  const requestedUrls: string[] = []
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url)
    return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png')
  }

  const image = await parse(
    JSON.stringify({
      shape: 'image-texture',
      mipLevels: 1,
      template: 'file\\{literal\\}.png'
    }),
    ImageTextureLoader,
    {
      fetch,
      core: {
        baseUrl: 'https://example.com/manifest.json'
      }
    }
  )

  t.ok(isImage(image[0]), 'escaped-brace template loads successfully')
  t.deepEqual(requestedUrls, ['https://example.com/file{literal}.png'], 'escaped braces are preserved')
  t.end()
})

test('ImageTextureLoader#template reports invalid placeholders', async (t) => {
  await t.rejects(
    parse(
      JSON.stringify({
        shape: 'image-texture',
        mipLevels: 1,
        template: 'texture-{unknown}.png'
      }),
      ImageTextureLoader,
      {
        fetch: fetchFile,
        core: {
          baseUrl: 'https://example.com/manifest.json'
        }
      }
    ),
    /unsupported placeholder/,
    'invalid placeholders fail with a clear error'
  )
  t.end()
})

test('ImageTextureArrayLoader#template supports index placeholder', async (t) => {
  const requestedUrls: string[] = []
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url)
    return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png')
  }

  const images = await parse(
    JSON.stringify({
      shape: 'image-texture-array',
      layers: [
        {mipLevels: 1, template: 'layer-{index}.png'},
        {mipLevels: 1, template: 'layer-{index}.png'}
      ]
    }),
    ImageTextureArrayLoader,
    {
      fetch,
      core: {
        baseUrl: 'https://example.com/manifest.json'
      }
    }
  )

  t.equal(images.length, 2, 'template array expands every layer')
  t.ok(images.every((image) => isImage(image[0])), 'template array loads images')
  t.deepEqual(
    requestedUrls,
    ['https://example.com/layer-0.png', 'https://example.com/layer-1.png'],
    'index placeholder is expanded for each layer'
  )
  t.end()
})

test('ImageTextureLoader#uses the top-level fetch function for members', async (t) => {
  const requestedUrls: string[] = []
  const manifestUrl = 'https://example.com/image-texture.json'
  const memberUrl = 'https://example.com/member.png'

  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url)

    if (url === manifestUrl) {
      return new Response(JSON.stringify({shape: 'image-texture', image: 'member.png'}), {
        headers: {'Content-Type': 'application/json'}
      })
    }

    if (url === memberUrl) {
      return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png')
    }

    throw new Error(`Unexpected URL ${url}`)
  }

  const image = await load(manifestUrl, ImageTextureLoader, {fetch})

  t.ok(isImage(image), 'loads the member image')
  t.deepEqual(requestedUrls, [manifestUrl, memberUrl], 'top-level fetch is reused for members')
  t.end()
})

test('ImageTextureLoader#uses top-level loaders for members', async (t) => {
  const manifestUrl = 'https://example.com/image-texture.json'
  const memberUrl = 'https://example.com/member.foo'
  const CustomMemberLoader = {
    id: 'custom-member',
    name: 'Custom Member',
    module: 'textures-test',
    version: 'latest',
    extensions: ['foo'],
    mimeTypes: ['application/x.foo'],
    parse: async (_arrayBuffer, _options, context) => ({
      shape: 'custom-member',
      url: context?.url,
      baseUrl: context?.baseUrl
    })
  }

  const fetch = async (url: string): Promise<Response> => {
    if (url === manifestUrl) {
      return new Response(JSON.stringify({shape: 'image-texture', image: 'member.foo'}), {
        headers: {'Content-Type': 'application/json'}
      })
    }

    if (url === memberUrl) {
      return new Response(new Uint8Array([1, 2, 3]), {
        headers: {'Content-Type': 'application/x.foo'}
      })
    }

    throw new Error(`Unexpected URL ${url}`)
  }

  const image = await load(manifestUrl, [ImageTextureLoader, CustomMemberLoader], {fetch})

  t.deepEqual(
    image,
    {
      shape: 'custom-member',
      url: memberUrl,
      baseUrl: 'https://example.com'
    },
    'member parsing can use top-level loaders in addition to ImageLoader'
  )
  t.end()
})

test('ImageTextureCubeLoader#template supports cube placeholders', async (t) => {
  const requestedUrls: string[] = []
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url)
    return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png')
  }

  const imageCube = await parse(
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
    ImageTextureCubeLoader,
    {
      fetch,
      core: {
        baseUrl: 'https://example.com/manifest.json'
      }
    }
  )

  t.equal(Object.keys(imageCube).length, 6, 'template cube expands every face')
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
  )
  t.end()
})

test('ImageTextureCubeArrayLoader#template supports layer index and face placeholders', async (t) => {
  const requestedUrls: string[] = []
  const fetch = async (url: string): Promise<Response> => {
    requestedUrls.push(url)
    return await fetchFile('@loaders.gl/images/test/data/ibl/brdfLUT.png')
  }

  const imageCubeArray = await parse(
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
    ImageTextureCubeArrayLoader,
    {
      fetch,
      core: {
        baseUrl: 'https://example.com/manifest.json'
      }
    }
  )

  t.equal(imageCubeArray.length, 2, 'cube array returns one cubemap per layer')
  t.equal(Object.keys(imageCubeArray[0]).length, 6, 'each layer contains six cube faces')
  t.equal(requestedUrls.length, 12, 'all cube array members are loaded')
  t.ok(requestedUrls.includes('https://example.com/cube-0-+X.png'), 'layer index 0 is expanded')
  t.ok(requestedUrls.includes('https://example.com/cube-1--Z.png'), 'layer index 1 is expanded')
  t.end()
})

test('ImageTexture loaders#select by shape', async (t) => {
  const loader = await selectLoader(
    JSON.stringify({
      shape: 'image-texture-array',
      layers: ['layer-0.png']
    }),
    [
      ImageTextureLoader,
      ImageTextureArrayLoader,
      ImageTextureCubeLoader,
      ImageTextureCubeArrayLoader
    ]
  )

  t.is(loader, ImageTextureArrayLoader, 'shape discriminator selects the matching loader')
  t.end()
})
