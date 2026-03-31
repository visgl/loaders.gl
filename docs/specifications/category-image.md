# Image Loaders

The image loader category documents a common data format, options, conventions and utilities for loader and writers for images that follow loaders.gl conventions.

## Image Category Loaders

| Loader                                                                                      | Notes                                                 |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader)               | Loads compressed images as `ImageBitmap`              |
| [`ImageLoader`](/docs/modules/images/api-reference/image-loader)                            | Deprecated compatibility image loader                 |
| [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader) | Parses compressed textures to image data mipmap array |
| [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader)                          | Transpiles into supported compressed texture format   |

Core image category support is provided by the `@loaders.gl/images` module:

## Usage

Individual loaders for specific image formats can be imported for `@loaders.gl/images`:

```typescript
import '@loaders.gl/polyfills'; // Only required if loading images under Node.js
import {ImageBitmapLoader} from '@loaders.gl/images';
import {registerLoaders, load} from '@loaders.gl/core';
registerLoaders(ImageBitmapLoader);
const image = await load('image.jpeg');
```

Since the preferred bitmap loader already supports the standard raster formats, most applications can just register `ImageBitmapLoader` once:

```typescript
import '@loaders.gl/polyfills'; // Only required if loading images under Node.js
import {ImageBitmapLoader} from '@loaders.gl/images';
import {registerLoaders, load} from '@loaders.gl/core';
registerLoaders(ImageBitmapLoader);
const image = await load('image.jpeg');
```

## Image Types

Images can be loaded as image data or as opaque image objects (`Image` or `ImageBitmap`).

A loaded image can always be converted to an _image data_ object (an object containing a `Uint8Array` with the pixel data, and metadata like `width` and `height`).

`ImageBitmapLoader` returns `ImageBitmap` in browsers. Under Node.js with `@loaders.gl/polyfills`, `ImageBitmapLoader` returns a minimal `ImageBitmap` polyfill backed by decoded image data. Deprecated `ImageLoader` preserves older compatibility return types and options.

Note that _type_ is independent of the _format_ of the image (see below).

| Image Type    | Class                                                                | Availability         | Workers      | Description                                                                                                             |
| ------------- | -------------------------------------------------------------------- | -------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `data`        | Object with `{width: Number, height: Number, data: Uint8Array, ...}` | Node.js and browsers | No           | Compatible with headless gl and still supported by helper APIs.                                                         |
| `imagebitmap` | `ImageBitmap`                                                        | Browser, Node.js     | Browser only | The preferred image type returned by `ImageBitmapLoader`; Node.js uses a minimal polyfill, browsers use the native API. |
| `image`       | `Image` (aka `HTMLImageElement`)                                     | All browsers         | No           | The traditional HTML/JavaScript class used for image loading into DOM trees. WebGL compatible.                          |

## Image Data

Image data objects are images loaded as data, represented by an object that contains a typed array with the pixel data, size, and possibly additional metadata `{width: Number, height: Number, data: Uint8Array, ...}`

To get an image data object from a loaded `Image` or `ImageBitmap`, call `getImageData(image)`.

### Image Formats

The _format_ of the image describes how the memory is laid out. It is mainly important when working with `data` _type_ images. The default format / memory layout for image data is `RGBA` and `UNSIGNED_BYTE` i.e. four components per pixel, each a byte.

Some loaders may add additional fields to the image data structure to describe the data format. Currently the image category does not provide any documentation for how to describe alternate formats/memory layouts, however a preliminary recommendation is to follow OpenGL/WebGL conventions.

## Compressed Images

Compressed images are always returned as image data objects. They will have an additional field, `compressed: true`, indicating that the typed array in the `data` field contains compressed pixels and is not directly indexable.

Applications that use e.g. the `CompressedTextureLoader` and/or the `BasisLoader` together with image category loaders can check this flag before attempting to access the image data.

## Options

The image category support some generic options (specified using `options.image.<option-name>`), that are applicable to all (or most) image loaders.

| Option               | Default | Type   | Availability  | Description                                                   |
| -------------------- | ------- | ------ | ------------- | ------------------------------------------------------------- |
| `options.image.type` | unset   | string | `ImageLoader` | Optional compatibility alias. Only `imagebitmap` is accepted. |

## Notes

### About worker loading

Worker loading is primarily tied to `ImageBitmap` support in the current runtime. Deprecated `ImageLoader` may still use compatibility fallbacks, while `ImageBitmapLoader` always targets bitmap output. Use `options.core.worker: false` to disable worker loading of images.

## Image API

The image category also provides a few utilities:

- Detecting ("sniffing") mime type and size of image files before parsing them
- Getting image data (arrays of pixels) from an image without knowing which type was loaded (TBA)

## Remarks

### ImageData

Image data objects return by image category loaders have the same fields (`width`, `height`, `data`) as the browser's built-in `ImageData` class, but are not actual instances of `ImageData`. However, should you need it, it is easy to create an `ImageData` instance from an image data object:

```typescript
const image = await load(url, ImageBitmapLoader);
const data = getImageData(image);
const imageData = new ImageData(data.data, data.width, data.height);
```
