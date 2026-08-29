---
title: loadImage
description: Load one image or a mip chain through the standard image decoding path.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Images API · basic helper"
  title="Load one image, or let the mip chain follow it."
  description="loadImage is the small helper for a single image resource. With mipLevels enabled, the same callback can describe the lower-resolution images needed by a texture upload."
  tone="blue"
  meta={['Single image', 'Optional mip chain', 'ImageBitmapLoader options']}
  links={[
    {label: 'Images module', to: '/docs/modules/images'},
    {label: 'loadImageArray', to: '/docs/modules/textures/api-reference/load-image-array'},
    {label: 'ImageBitmapLoader', to: '/docs/modules/images/api-reference/image-bitmap-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The image helper path"
  title="Use one loading contract for pixels and mip levels."
  description="The helper hides the repeated request and decode loop while leaving URL generation in your hands. That makes it useful for texture manifests, generated asset names, and level-of-detail resources."
  tone="blue"
  items={[
    {label: 'Input', value: 'A URL or callback receiving the mip level'},
    {label: 'Output', value: 'One decoded image or an array of mip images'},
    {label: 'Mip policy', value: '0 for one image, a count, or auto inference'},
    {label: 'Runtime', value: 'ImageBitmap in browsers; polyfill when needed in Node.js'}
  ]}
/>

<ReferenceBoundary
  title="loadImage reference"
  description="The reference below covers callback signatures, mip-level discovery, image options, and the returned image contract."
  tone="blue"
/>

## Usage

```typescript
import '@loaders.gl/polyfills'; // only needed if using under Node
import {loadImage} from `@loaders.gl/images`;

const image = await loadImage(url);
```

```typescript
import '@loaders.gl/polyfills'; // only needed if using under Node
import {loadImage} from `@loaders.gl/images`;

const URL = ...;

const image = await loadImage(({lod}) => `${URL}-${lod}.jpg`, {
  image: {
    mipLevels: 'auto'
  }
});

for (const lodImage of imageArray) {
  ...
}
```

## Function

### loadImage(getUrl : String | Function, options? : Object]) : image | image[]

A basic image loading function for loading a single image (or an array of mipmap images representing a single image).

- `getUrl`: A function that generates the url for each image, it is called for each image with the `lod` of that image.
- `options`: Supports the same image parsing options as [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader).

Returns

- image or array of images

## Options

Accepts the same options as [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader), and

| Option            | Type    | Default | Description |
| ----------------- | ------- | ------- | ----------- | ------------------------------------------------------ |
| `image.mipLevels` | `Number | String` | `0`         | If `'auto'` or non-zero, loads an array of mip images. |

Number of mip level images to load: Use `0` to indicate a single image with no mips. Supplying the string `'auto'` will infer the mipLevel from the size of the `lod`=`0` image.

Returned images use the same runtime-dependent `ImageBitmap` contract as [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader): native `ImageBitmap` in supported browsers and the Node.js `ImageBitmap` polyfill when `@loaders.gl/polyfills` is installed.
