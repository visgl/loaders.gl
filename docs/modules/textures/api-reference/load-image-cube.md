---
title: loadImageCube
description: Load the six images that make up a cubemap, with optional mip levels per face.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Images API · cubemap helper"
  title="Load six images with one callback."
  description="loadImageCube turns a face naming function into a cubemap image set. Use it when the images are already described by application logic rather than a JSON manifest."
  tone="blue"
  meta={['Six directional faces', 'Optional mip levels', 'Browser and Node polyfills']}
  links={[
    {label: 'Images module', to: '/docs/modules/images'},
    {label: 'TextureCubeLoader', to: '/docs/modules/textures/api-reference/texture-cube-loader'},
    {label: 'ImageBitmapLoader', to: '/docs/modules/images/api-reference/image-bitmap-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The helper path"
  title="Generate face URLs without hand-writing six loads."
  description="The callback receives stable face and direction information for every request. Add mip loading when each direction has a resolution chain, or keep one image per face for a simple environment map."
  tone="blue"
  items={[
    {label: 'Callback', value: 'Receives face, direction, axis, sign, and index'},
    {label: 'Output', value: 'Six images keyed by WebGL cube-face constants'},
    {label: 'Mip levels', value: 'Single images or arrays of images per face'},
    {label: 'Options', value: 'ImageBitmapLoader options plus image.mipLevels'}
  ]}
/>

<ReferenceBoundary
  title="loadImageCube reference"
  description="The sections below document URL callbacks, directional names, mip-level loading, return values, and image options."
  tone="blue"
/>

A function that loads 6 images representing the faces of a cube. Primarily intended for loading images for WebGL `GL.TEXTURE_CUBE` textures.

## Usage

Load images for a cubemap with one image per face

```typescript
import '@loaders.gl/polyfills'; // only needed for Node.js support
import {loadImageCube} from `@loaders.gl/images`;

const imageCube = await loadImageCube(({direction}) => `diffuse-${direction}.png`);

for (const face in imageCube) {
  const image = imageCube[face];
}
```

Load images for a cubemap with an array of mip images per face

```typescript
import '@loaders.gl/polyfills'; // only needed for Node.js support
import {loadImageCube} from `@loaders.gl/images`;

const imageCube = await loadImageCube('mips', ({direction}) => `diffuse-${direction}.png`);

for (const face in imageCube) {
  const imageArray = imageCube[face];
  for (const lodImage of imageArray) {
    ...
  }
}
```

## getUrl Callback Parameters

The following fields will be supplied as named parameters to the `getUrl` function when loading cube maps:

| `faceIndex` | `face`                                    | `direction` | `axis` | `sign`       |
| ----------- | ----------------------------------------- | ----------- | ------ | ------------ |
| 0           | `GL.TEXTURE_CUBE_MAP_POSITIVE_X` (0x8515) | `'right'`   | `'x'`  | `'positive'` |
| 1           | `GL.TEXTURE_CUBE_MAP_NEGATIVE_X` (0x8516) | `'left'`    | `'x'`  | `'negative'` |
| 2           | `GL.TEXTURE_CUBE_MAP_POSITIVE_Y` (0x8517) | `'top'`     | `'y'`  | `'positive'` |
| 3           | `GL.TEXTURE_CUBE_MAP_NEGATIVE_Y` (0x8518) | `'bottom'`  | `'y'`  | `'negative'` |
| 4           | `GL.TEXTURE_CUBE_MAP_POSITIVE_Z` (0x8519) | `'front'`   | `'z'`  | `'positive'` |
| 5           | `GL.TEXTURE_CUBE_MAP_NEGATIVE_Z` (0x851a) | `'back'`    | `'z'`  | `'negative'` |

Note: In addition to these values, all `options` passed in to `loadImageCube` are also available in the `getUrl` method.

### loadImageCube(getUrl : `({face, direction, index}) => String`, options? : Object) : Object

Loads and image cube, i.e. 6 images keyed by WebGL face constants (see table).

Parameters:

- `getUrl`: A function that generates the url for each image, it is called for each image with the `index` of that image.
- `options`: Supports the same image parsing options as [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader).

Returns

- An object with 6 key/value pairs containing images (or arrays of mip images) for each cube face. The keys are the (stringified) numeric values of the GL constant for the respective faces of the cube.

## Options

Accepts the same options as [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader), and

| Option            | Type    | Default | Description |
| ----------------- | ------- | ------- | ----------- | ------------------------------------------------------ |
| `image.mipLevels` | `Number | String` | `0`         | If `'auto'` or non-zero, loads an array of mip images. |

Number of mip level images to load: Use `0` to indicate a single image with no mips. Supplying the string `'auto'` will infer the mipLevel from the size of the `lod`=`0` image.

## Remarks

- Returned images can be passed directly to WebGL texture methods. See [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader) for details about the returned `ImageBitmap` contract.
