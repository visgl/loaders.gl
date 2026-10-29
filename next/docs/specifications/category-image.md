Loader category

# Images in a shape your application can use.

Image loaders hide browser-specific decoding details and expose predictable pixel data, dimensions, and image metadata. Choose an ImageBitmap when a renderer can use it directly, or a decoded image object when you need the pixels.

[Images module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)

Category data

### Load many formats into one application path.

Category data lets related loaders return compatible structures, so rendering, analysis, and export code can be shared.

MeshTableGISImageJSONScenegraph3D Tiles

Arrow TablePlain

Decode

[Image​Loader↗](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md)[Compressed​Texture​Loader↗](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)[Basis​Loader↗](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md)[Crunch​Worker​Loader↗](https://loaders.gl/next/docs/modules/textures/api-reference/crunch-loader.md)[RadianceHDR​Loader↗](https://loaders.gl/next/docs/modules/textures/api-reference/radiance-hdr-loader.md)[Texture​Loader↗](https://loaders.gl/next/docs/modules/textures/api-reference/texture-loader.md)[Texture​Array​Loader↗](https://loaders.gl/next/docs/modules/textures/api-reference/texture-array-loader.md)[Texture​Cube​Loader↗](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-loader.md)

Data

[Image category dataPixels / textures↗](https://loaders.gl/next/docs/specifications/category-image.md)

Encode

[Image​Writer↗](https://loaders.gl/next/docs/modules/images/api-reference/image-writer.md)[Compressed​Texture​Writer↗](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-writer.md)[KTX2​Basis​Universal​Texture​Writer↗](https://loaders.gl/next/docs/modules/textures/api-reference/ktx2-basis-texture-writer.md)

What comes back

## Decode once, then hand the pixels to the next layer.

The category separates ordinary raster images from GPU texture containers. That keeps image decoding useful for maps, previews, analysis, and rendering without forcing one runtime representation.

01

Browser path

ImageBitmap for direct rendering

02

Portable path

Decoded image data with typed pixels

03

Formats

PNG, JPEG, WebP, GIF, and other browser-supported inputs

04

Node.js

Use @loaders.gl/core/polyfills for image decoding support

The image loader category documents common data formats, options, conventions, and utilities for loaders and writers that work with raster images under loaders.gl conventions.

Detailed guide

## Image decoding details

The sections below cover loader selection, return shapes, browser and Node.js behavior, and writer conventions.

## Image Category Loaders[​](#image-category-loaders "Direct link to Image Category Loaders")

| Loader                                                                                                       | Notes                                       |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md) | Loads raster images as `ImageBitmap`        |
| [`ImageLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md)              | Deprecated compatibility image loader       |
| [`ImageWriter`](https://loaders.gl/next/docs/modules/images/api-reference/image-writer.md)              | Encodes raster image data to binary formats |

Core image category support is provided by the `@loaders.gl/images` module:

## Usage[​](#usage "Direct link to Usage")

The preferred loader for new code is `ImageBitmapLoader`:

```
import '@loaders.gl/core/polyfills'; // Only required if loading images under Node.js

import {ImageBitmapLoader} from '@loaders.gl/images';

import {registerLoaders, load} from '@loaders.gl/core';

registerLoaders(ImageBitmapLoader);

const image = await load('image.jpeg');
```

If application code needs raw pixels, convert the loaded image explicitly:

```
import '@loaders.gl/core/polyfills'; // Only required if loading images under Node.js

import {load} from '@loaders.gl/core';

import {ImageBitmapLoader, getImageData} from '@loaders.gl/images';



const image = await load('image.jpeg', ImageBitmapLoader);

const imageData = getImageData(image);
```

## Image Types[​](#image-types "Direct link to Image Types")

Images can be represented either as opaque image objects (`ImageBitmap` or `Image`) or as image data objects.

A loaded image can always be converted to an *image data* object (an object containing a `Uint8Array` with the pixel data, and metadata like `width` and `height`).

`ImageBitmapLoader` returns `ImageBitmap` in browsers. Under Node.js with `@loaders.gl/core/polyfills`, `ImageBitmapLoader` returns a minimal `ImageBitmap` polyfill backed by decoded image data. Deprecated `ImageLoader` preserves older compatibility return types and options.

Note that *type* is independent of the *format* of the image (see below).

| Image Type    | Class                                                                | Availability         | Workers         | Description                                                                                                                 |
| ------------- | -------------------------------------------------------------------- | -------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `data`        | Object with `{width: Number, height: Number, data: Uint8Array, ...}` | Node.js and browsers | ❌ No           | Compatible with headless GL and still supported by helper APIs.                                                             |
| `imagebitmap` | `ImageBitmap`                                                        | Browser, Node.js     | ⚠️ Browser only | The preferred type returned by `ImageBitmapLoader`. Browsers use the native API, while Node.js uses the installed polyfill. |
| `image`       | `Image` (aka `HTMLImageElement`)                                     | All browsers         | ❌ No           | The traditional DOM image class. It remains supported by helper APIs and by deprecated `ImageLoader`.                       |

## Image Data[​](#image-data "Direct link to Image Data")

Image data objects are images represented by an object that contains a typed array with the pixel data, size, and possibly additional metadata `{width: Number, height: Number, data: Uint8Array, ...}`.

To get an image data object from a loaded `Image` or `ImageBitmap`, call `getImageData(image)`.

### Image Formats[​](#image-formats "Direct link to Image Formats")

The *format* of the image describes how the memory is laid out. It is mainly important when working with `data` type images. The default format / memory layout for image data is `RGBA` and `UNSIGNED_BYTE`, i.e. four components per pixel, each a byte.

Some loaders may add additional fields to the image data structure to describe the data format. Currently the image category does not provide any documentation for how to describe alternate formats/memory layouts, however a preliminary recommendation is to follow OpenGL/WebGL conventions.

## Options[​](#options "Direct link to Options")

The image category supports some generic options (specified using `options.image.<option-name>`), that are applicable to image loaders.

| Option               | Default | Type   | Availability                                  | Description                                                                                      |
| -------------------- | ------- | ------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `options.image.type` | unset   | string | `ImageBitmapLoader`, deprecated `ImageLoader` | `ImageBitmapLoader` only accepts `imagebitmap`. Deprecated `ImageLoader` preserves legacy modes. |

## Notes[​](#notes "Direct link to Notes")

### About worker loading[​](#about-worker-loading "Direct link to About worker loading")

Worker loading is primarily tied to `ImageBitmap` support in the current runtime. Deprecated `ImageLoader` may still use compatibility fallbacks, while `ImageBitmapLoader` always targets bitmap output. Use `options.core.worker: false` to disable worker loading of images.

### About texture loaders[​](#about-texture-loaders "Direct link to About texture loaders")

Compressed GPU texture containers and texture-level return shapes are documented separately in [Texture Loaders](https://loaders.gl/next/docs/specifications/category-texture.md).

## Image API[​](#image-api "Direct link to Image API")

The image category also provides a few utilities:

* Detecting ("sniffing") mime type and size of image files before parsing them
* Getting image data (arrays of pixels) from an image without knowing which type was loaded with [`getImageData`](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md)

## Remarks[​](#remarks "Direct link to Remarks")

### ImageData[​](#imagedata "Direct link to ImageData")

Image data objects returned by image category loaders have the same fields (`width`, `height`, `data`) as the browser's built-in `ImageData` class, but are not actual instances of `ImageData`. However, should you need it, it is easy to create an `ImageData` instance from an image data object:

```
const image = await load(url, ImageBitmapLoader);

const data = getImageData(image);

const imageData = new ImageData(data.data, data.width, data.height);
```
