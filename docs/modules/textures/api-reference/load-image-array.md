---
title: loadImageArray
description: Load a counted image array or mip-level image set through one URL callback.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Images API · array helper"
  title="Load an image array without repeating the request loop."
  description="loadImageArray generates and decodes a predictable sequence of images for texture arrays, volume slices, or mip-level sets. The callback receives the image index and level of detail."
  tone="blue"
  meta={['Texture arrays', 'Volume slices', 'Optional mip levels']}
  links={[
    {label: 'Images module', to: '/docs/modules/images'},
    {label: 'loadImage', to: '/docs/modules/textures/api-reference/load-image'},
    {label: 'Texture category', to: '/docs/specifications/category-texture'}
  ]}
/>

<DocOrientation
  eyebrow="The array helper path"
  title="Make index and level-of-detail part of the URL contract."
  description="The helper keeps the two dimensions of an image resource explicit: which array member is being loaded and which mip level belongs to it."
  tone="blue"
  items={[
    {label: 'Input', value: 'Count plus a URL callback'},
    {label: 'Callback', value: 'Receives index and optional mip level'},
    {label: 'Output', value: 'An image array or an array of mip arrays'},
    {label: 'Use it for', value: 'Texture arrays, 3D slices, or repeated face resources'}
  ]}
/>

<ReferenceBoundary
  title="loadImageArray reference"
  description="The reference below documents callback parameters, mip-level behavior, return values, and image decoding options."
  tone="blue"
/>

A function that loads an array of images. Primarily intended for loading:

- an array of images for a WebGL `TEXTURE_2D_ARRAY` or `TEXTURE_3D` textures
- an array of images representing mip levels of a single WebGL `TEXTURE_2D` texture or one `TEXTURE_CUBE` face.

## Usage

Loading an array of images

```typescript
import '@loaders.gl/polyfills'; // only needed for Node.js support
import {loadImageArray} from `@loaders.gl/images`;

const images = await loadImageArray(count, ({index}) => `filename-${index}`);

for (const image of images) {
  ...
}
```

```typescript
import '@loaders.gl/polyfills'; // only needed for Node.js support
import {loadImageArray} from `@loaders.gl/images`;

const images = await loadImageArray(count,  ({index}) => `filename-${index}`, {
  mipLevels: 'auto'
});

for (const imageArray of images) {
  for (const lodImage of imageArray) {
    ...
  }
}
```

## getUrl Callback Parameters

the `getUrl` callback will be called for each image with the following parameters:

| Parameter | Description                                                    |
| --------- | -------------------------------------------------------------- |
| `index`   | The index of the image being loaded, from `0` to `count - 1`.  |
| `lod`     | The mip level image being loaded, from `0` to `mipLevels - 1`. |

Note: In addition to these values, all `options` passed in to `loadImageArray` are also available in the `getUrl` method.

### loadImageArray(count : Number | String, getUrl : `({index}) => String`, options? : Object) : `image[] | image[][]`

Parameters:

- `count`: Number of images to load.
- `getUrl`: A function that generates the url for each image, it is called for each image with the `index` of that image.
- `options`: Supports the same image parsing options as [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader).

Returns

- an array of images (or array of arrays of mip images)

## Options

Accepts the same options as [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader), and

| Option            | Type    | Default | Description |
| ----------------- | ------- | ------- | ----------- | ------------------------------------------------------ |
| `image.mipLevels` | `Number | String` | `0`         | If `'auto'` or non-zero, loads an array of mip images. |

Number of mip level images to load: Use `0` to indicate a single image with no mips. Supplying the string `'auto'` will infer the mipLevel from the size of the `lod`=`0` image.

## Remarks

- Returned images can be passed directly to WebGL texture methods. See [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader) for details about the returned `ImageBitmap` contract.
