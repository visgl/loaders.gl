Images API · array helper

GPU

# Load an image array without repeating the request loop.

loadImageTextureArray generates and decodes a predictable sequence of images for texture arrays, volume slices, or mip-level sets. The callback receives the image index and level of detail.

[Images module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)[loadImage](https://loaders.gl/next/docs/modules/textures/api-reference/load-image.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/api-reference/load-image.md)[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)

The array helper path

## Make index and level-of-detail part of the URL contract.

The helper keeps the two dimensions of an image resource explicit: which array member is being loaded and which mip level belongs to it.

01

Input

Count plus a URL callback

02

Callback

Receives index and optional mip level

03

Output

An image array or an array of mip arrays

04

Use it for

Texture arrays, 3D slices, or repeated face resources

Detailed guide

## loadImageTextureArray reference

The reference below documents callback parameters, mip-level behavior, return values, and image decoding options.

A function that loads an array of images. Primarily intended for loading:

* an array of images for a WebGL `TEXTURE_2D_ARRAY` or `TEXTURE_3D` textures
* an array of images representing mip levels of a single WebGL `TEXTURE_2D` texture or one `TEXTURE_CUBE` face.

## Usage[​](#usage "Direct link to Usage")

Loading an array of images

```
import '@loaders.gl/core/polyfills'; // only needed for Node.js support

import {loadImageTextureArray} from '@loaders.gl/textures';



const images = await loadImageTextureArray(count, ({index}) => `filename-${index}`);



for (const image of images) {

  ...

}
```

```
import '@loaders.gl/core/polyfills'; // only needed for Node.js support

import {loadImageTextureArray} from '@loaders.gl/textures';



const images = await loadImageTextureArray(count,  ({index}) => `filename-${index}`, {

  image: {mipLevels: 'auto'}

});



for (const imageArray of images) {

  for (const lodImage of imageArray) {

    ...

  }

}
```

## getUrl Callback Parameters[​](#geturl-callback-parameters "Direct link to getUrl Callback Parameters")

the `getUrl` callback will be called for each image with the following parameters:

| Parameter | Description                                                    |
| --------- | -------------------------------------------------------------- |
| `index`   | The index of the image being loaded, from '0' to `count - 1`.  |
| `lod`     | The mip level image being loaded, from '0' to `mipLevels - 1`. |

Note: In addition to these values, all `options` passed in to `loadImageTextureArray` are also available in the `getUrl` method.

### loadImageTextureArray(count : Number | String, getUrl : `({index}) => String`, options? : Object) : `image[] | image[][]`[​](#loadimagetexturearraycount--number--string-geturl--index--string-options--object--image--image "Direct link to loadimagetexturearraycount--number--string-geturl--index--string-options--object--image--image")

Parameters:

* `count`: Number of images to load.
* `getUrl`: A function that generates the url for each image, it is called for each image with the `index` of that image.
* `options`: Supports the same image parsing options as [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md).

Returns

* an array of images (or array of arrays of mip images)

## Options[​](#options "Direct link to Options")

Accepts the same options as [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md), and

| Option            | Type               | Default | Description                                                                      |
| ----------------- | ------------------ | ------- | -------------------------------------------------------------------------------- |
| `image.mipLevels` | `number \| 'auto'` | `0`     | Number of mip images; `'auto'` derives the count from the base image dimensions. |

Number of mip level images to load: Use `0` to indicate a single image with no mips. Supplying the string `'auto'` will infer the mipLevel from the size of the `lod`=`0` image.

## Remarks[​](#remarks "Direct link to Remarks")

* Returned images can be passed directly to WebGL texture methods. See [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md) for details about the returned `ImageBitmap` contract.
