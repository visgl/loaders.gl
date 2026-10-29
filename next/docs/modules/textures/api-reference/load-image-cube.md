Images API · cubemap helper

GPU

# Load six images with one callback.

loadImageTextureCube turns a face naming function into a cubemap image set. Use it when the images are already described by application logic rather than a JSON manifest.

[Images module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)[TextureCubeLoader](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-loader.md)[ImageBitmapLoader](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)

The helper path

## Generate face URLs without hand-writing six loads.

The callback receives stable face and direction information for every request. Add mip loading when each direction has a resolution chain, or keep one image per face for a simple environment map.

01

Callback

Receives face, direction, axis, sign, and index

02

Output

Six images keyed by WebGL cube-face constants

03

Mip levels

Single images or arrays of images per face

04

Options

ImageBitmapLoader options plus image.mipLevels

Detailed guide

## loadImageTextureCube reference

The sections below document URL callbacks, directional names, mip-level loading, return values, and image options.

A function that loads 6 images representing the faces of a cube. This helper is deprecated; use `TextureCubeLoader` for manifest-driven loading. Primarily intended for loading images for WebGL `GL.TEXTURE_CUBE` textures.

## Usage[​](#usage "Direct link to Usage")

Load images for a cubemap with one image per face

```
import '@loaders.gl/core/polyfills'; // only needed for Node.js support

import {loadImageTextureCube} from '@loaders.gl/textures';



const imageCube = await loadImageTextureCube(({direction}) => `diffuse-${direction}.png`);



for (const face in imageCube) {

  const image = imageCube[face];

}
```

Load images for a cubemap with an array of mip images per face

```
import '@loaders.gl/core/polyfills'; // only needed for Node.js support

import {loadImageTextureCube} from '@loaders.gl/textures';



const imageCube = await loadImageTextureCube(({direction, lod}) => `diffuse-${direction}-${lod}.png`, {image: {mipLevels: 'auto'}});



for (const face in imageCube) {

  const imageArray = imageCube[face];

  for (const lodImage of imageArray) {

    ...

  }

}
```

## getUrl Callback Parameters[​](#geturl-callback-parameters "Direct link to getUrl Callback Parameters")

The following fields will be supplied as named parameters to the `getUrl` function when loading cube maps:

| `faceIndex` | `face`                                    | `direction` | `axis` | `sign`       |
| ----------- | ----------------------------------------- | ----------- | ------ | ------------ |
| 0           | `GL.TEXTURE_CUBE_MAP_POSITIVE_X` (0x8515) | `'right'`   | `'x'`  | `'positive'` |
| 1           | `GL.TEXTURE_CUBE_MAP_NEGATIVE_X` (0x8516) | `'left'`    | `'x'`  | `'negative'` |
| 2           | `GL.TEXTURE_CUBE_MAP_POSITIVE_Y` (0x8517) | `'top'`     | `'y'`  | `'positive'` |
| 3           | `GL.TEXTURE_CUBE_MAP_NEGATIVE_Y` (0x8518) | `'bottom'`  | `'y'`  | `'negative'` |
| 4           | `GL.TEXTURE_CUBE_MAP_POSITIVE_Z` (0x8519) | `'front'`   | `'z'`  | `'positive'` |
| 5           | `GL.TEXTURE_CUBE_MAP_NEGATIVE_Z` (0x851a) | `'back'`    | `'z'`  | `'negative'` |

Note: In addition to these values, all `options` passed in to `loadImageTextureCube` are also available in the `getUrl` method.

### loadImageTextureCube(getUrl : `({face, direction, index}) => String`, options? : Object) : Object[​](#loadimagetexturecubegeturl--face-direction-index--string-options--object--object "Direct link to loadimagetexturecubegeturl--face-direction-index--string-options--object--object")

Loads and image cube, i.e. 6 images keyed by WebGL face constants (see table).

Parameters:

* `getUrl`: A function that generates the url for each image, it is called for each image with the `index` of that image.
* `options`: Supports the same image parsing options as [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md).

Returns

* An object with 6 key/value pairs containing images (or arrays of mip images) for each cube face. The keys are the (stringified) numeric values of the GL constant for the respective faces of the cube.

## Options[​](#options "Direct link to Options")

Accepts the same options as [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md), and

| Option            | Type               | Default | Description                                                                      |
| ----------------- | ------------------ | ------- | -------------------------------------------------------------------------------- |
| `image.mipLevels` | `number \| 'auto'` | `0`     | Number of mip images; `'auto'` derives the count from the base image dimensions. |

Number of mip level images to load: Use `0` to indicate a single image with no mips. Supplying the string `'auto'` will infer the mipLevel from the size of the `lod`=`0` image.

## Remarks[​](#remarks "Direct link to Remarks")

* Returned images can be passed directly to WebGL texture methods. See [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md) for details about the returned `ImageBitmap` contract.
