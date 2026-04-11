# Image Loaders

The image loader category documents common data formats, options, conventions, and utilities for loaders and writers that work with raster images under loaders.gl conventions.

## Image Category Loaders

| Loader                                                                        | Notes                                       |
| ----------------------------------------------------------------------------- | ------------------------------------------- |
| [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader) | Loads raster images as `ImageBitmap`        |
| [`ImageLoader`](/docs/modules/images/api-reference/image-loader)              | Deprecated compatibility image loader       |
| [`ImageWriter`](/docs/modules/images/api-reference/image-writer)              | Encodes raster image data to binary formats |

Core image category support is provided by the `@loaders.gl/images` module:

## Usage

The preferred loader for new code is `ImageBitmapLoader`:

```typescript
import '@loaders.gl/polyfills'; // Only required if loading images under Node.js
import {ImageBitmapLoader} from '@loaders.gl/images';
import {registerLoaders, load} from '@loaders.gl/core';
registerLoaders(ImageBitmapLoader);
const image = await load('image.jpeg');
```

If application code needs raw pixels, convert the loaded image explicitly:

```typescript
import '@loaders.gl/polyfills'; // Only required if loading images under Node.js
import {load} from '@loaders.gl/core';
import {ImageBitmapLoader, getImageData} from '@loaders.gl/images';

const image = await load('image.jpeg', ImageBitmapLoader);
const imageData = getImageData(image);
```

## Image Types

Images can be represented either as opaque image objects (`ImageBitmap` or `Image`) or as image data objects.

A loaded image can always be converted to an _image data_ object (an object containing a `Uint8Array` with the pixel data, and metadata like `width` and `height`).

`ImageBitmapLoader` returns `ImageBitmap` in browsers. Under Node.js with `@loaders.gl/polyfills`, `ImageBitmapLoader` returns a minimal `ImageBitmap` polyfill backed by decoded image data. Deprecated `ImageLoader` preserves older compatibility return types and options.

Note that _type_ is independent of the _format_ of the image (see below).

| Image Type    | Class                                                                | Availability         | Workers      | Description                                                                                                                 |
| ------------- | -------------------------------------------------------------------- | -------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `data`        | Object with `{width: Number, height: Number, data: Uint8Array, ...}` | Node.js and browsers | No           | Compatible with headless GL and still supported by helper APIs.                                                             |
| `imagebitmap` | `ImageBitmap`                                                        | Browser, Node.js     | Browser only | The preferred type returned by `ImageBitmapLoader`. Browsers use the native API, while Node.js uses the installed polyfill. |
| `image`       | `Image` (aka `HTMLImageElement`)                                     | All browsers         | No           | The traditional DOM image class. It remains supported by helper APIs and by deprecated `ImageLoader`.                       |

## Image Data

Image data objects are images represented by an object that contains a typed array with the pixel data, size, and possibly additional metadata `{width: Number, height: Number, data: Uint8Array, ...}`.

To get an image data object from a loaded `Image` or `ImageBitmap`, call `getImageData(image)`.

### Image Formats

The _format_ of the image describes how the memory is laid out. It is mainly important when working with `data` type images. The default format / memory layout for image data is `RGBA` and `UNSIGNED_BYTE`, i.e. four components per pixel, each a byte.

Some loaders may add additional fields to the image data structure to describe the data format. Currently the image category does not provide any documentation for how to describe alternate formats/memory layouts, however a preliminary recommendation is to follow OpenGL/WebGL conventions.

## Options

The image category supports some generic options (specified using `options.image.<option-name>`), that are applicable to image loaders.

| Option               | Default | Type   | Availability                                   | Description                                                                                     |
| -------------------- | ------- | ------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `options.image.type` | unset   | string | `ImageBitmapLoader`, deprecated `ImageLoader` | `ImageBitmapLoader` only accepts `imagebitmap`. Deprecated `ImageLoader` preserves legacy modes. |

## Notes

### About worker loading

Worker loading is primarily tied to `ImageBitmap` support in the current runtime. Deprecated `ImageLoader` may still use compatibility fallbacks, while `ImageBitmapLoader` always targets bitmap output. Use `options.core.worker: false` to disable worker loading of images.

### About texture loaders

Compressed GPU texture containers and texture-level return shapes are documented separately in [Texture Loaders](/docs/specifications/category-texture).

## Image API

The image category also provides a few utilities:

- Detecting ("sniffing") mime type and size of image files before parsing them
- Getting image data (arrays of pixels) from an image without knowing which type was loaded (TBA)

## Remarks

### ImageData

Image data objects returned by image category loaders have the same fields (`width`, `height`, `data`) as the browser's built-in `ImageData` class, but are not actual instances of `ImageData`. However, should you need it, it is easy to create an `ImageData` instance from an image data object:

```typescript
const image = await load(url, ImageBitmapLoader);
const data = getImageData(image);
const imageData = new ImageData(data.data, data.width, data.height);
```
