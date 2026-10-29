Images API · basic helper

GPU

# Load one image, or let the mip chain follow it.

loadImageTexture is the small helper for a single image resource. With mipLevels enabled, the same callback can describe the lower-resolution images needed by a texture upload.

[Images module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)[loadImageArray](https://loaders.gl/next/docs/modules/textures/api-reference/load-image-array.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/api-reference/load-image-array.md)[ImageBitmapLoader](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)

The image helper path

## Use one loading contract for pixels and mip levels.

The helper hides the repeated request and decode loop while leaving URL generation in your hands. That makes it useful for texture manifests, generated asset names, and level-of-detail resources.

01

Input

A URL or callback receiving the mip level

02

Output

One decoded image or an array of mip images

03

Mip policy

0 for one image, a count, or auto inference

04

Runtime

ImageBitmap in browsers; polyfill when needed in Node.js

Detailed guide

## loadImageTexture reference

The reference below covers callback signatures, mip-level discovery, image options, and the returned image contract.

## Usage[​](#usage "Direct link to Usage")

```
import '@loaders.gl/core/polyfills'; // only needed if using under Node

import {loadImageTexture} from '@loaders.gl/textures';



const image = await loadImageTexture(url);
```

```
import '@loaders.gl/core/polyfills'; // only needed if using under Node

import {loadImageTexture} from '@loaders.gl/textures';



const URL = ...;



const image = await loadImageTexture(({lod}) => `${URL}-${lod}.jpg`, {

  image: {

    mipLevels: 'auto'

  }

});



for (const lodImage of imageArray) {

  ...

}
```

## Function[​](#function "Direct link to Function")

### loadImageTexture(getUrl : String | Function, options? : Object) : image | image\[][​](#loadimagetexturegeturl--string--function-options--object--image--image "Direct link to loadImageTexture(getUrl : String | Function, options? : Object) : image | image\[]")

A basic image loading function for loading a single image (or an array of mipmap images representing a single image).

* `getUrl`: A function that generates the url for each image, it is called for each image with the `lod` of that image.
* `options`: Supports the same image parsing options as [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md).

Returns

* image or array of images

## Options[​](#options "Direct link to Options")

Accepts the same options as [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md), and

| Option            | Type               | Default | Description                                                                      |
| ----------------- | ------------------ | ------- | -------------------------------------------------------------------------------- |
| `image.mipLevels` | `number \| 'auto'` | `0`     | Number of mip images; `'auto'` derives the count from the base image dimensions. |

Number of mip level images to load: Use `0` to indicate a single image with no mips. Supplying the string `'auto'` will infer the mipLevel from the size of the `lod`=`0` image.

Returned images use the same runtime-dependent `ImageBitmap` contract as [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md): native `ImageBitmap` in supported browsers and the Node.js `ImageBitmap` polyfill when `@loaders.gl/core/polyfills` is installed.
