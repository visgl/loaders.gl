# Image Loaders

The image loader category documents a common data format, options, conventions and utilities for loader and writers for images that follow loaders.gl conventions.

## Image Category Loaders

| Loader                                                                                  | Notes                                                 |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`ImageLoader`](modules/images/docs/api-reference/image-loader)                         | Loads compressed images (PNG, JPG, etc)               |
| [`CompressedTextureLoader`](modules/basis/docs/api-reference/compressed-texture-loader) | Parses compressed textures to image data mipmap array |
| [`BasisLoader`](modules/basis/docs/api-reference/basis-loader)                          | Transpiles into supported compressed texture format   |

Core image category support is provided by the `@loaders.gl/images` module:

## Usage

Individual loaders for specific image formats can be imported for `@loaders.gl/images`:

```js
import '@loaders.gl/polyfills'; // Only required if loading images under Node.js
import {ImageLoader} from '@loaders.gl/images';
import {registerLoaders, load} from '@loaders.gl/core';
registerLoaders(ImageLoader);
const image = await load('image.jpeg');
```

However since each image loader is quite small (in terms of code size and bundle size impact), most applications will just install all image loaders in one go:

```js
import '@loaders.gl/polyfills'; // Only required if loading images under Node.js
import {ImageLoaders} from '@loaders.gl/images';
import {registerLoader, load} from '@loaders.gl/core';
registerLoaders(ImageLoader);
const image = await load('image.jpeg');
```

## Image Types

Images can be loaded as image data or as opaque image objects (`Image` or `ImageBitmap`), and the image _type_ option can be used to control the type of image object produced by the `ImageLoader`.

A loaded image can always be returned as an _image data_ object (an object containing a `Uint8Array` with the pixel data, and metadata like `width` and `height`, and in Node.js images are always loaded as image data objects).

In the browser, the `ImageLoader` uses the browser's native image loading functionality, and if direct access to the image data is not required, it is more efficient to load data into an opaque image object. The `ImageLoader` prefers `ImageBitmap` when supported, falling back to `Image` (aka `HTMLImageElement`) on older browsers.

Note that _type_ is independent of the _format_ of the image (see below).

| Image Type    | Class                                                                | Availability         | Workers                | Description                                                                                                           |
| ------------- | -------------------------------------------------------------------- | -------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `data`        | Object with `{width: Number, height: Number, data: Uint8Array, ...}` | Node.js and browsers | No                     | Compatible with headless gl.                                                                                          |
| `imagebitmap` | `ImageBitmap`                                                        | Chrome/Firefox       | Yes: **transferrable** | A newer JavaScript class designed for efficient loading of images, optimized for use in worker threads and with WebGL |
| `image`       | `Image` (aka `HTMLImageElement`)                                     | All browsers         | No                     | The traditional HTML/JavaScript class used for image loading into DOM trees. WebGL compatible.                        |

## Image Data

Image data objects are images loaded as data, represented by an object that contains a typed array with the pixel data, size, and possibly additional metadata `{width: Number, height: Number, data: Uint8Array, ...}`

To get an image data object from a loaded `Image` or `ImageBitmap`, call `getImageData(image)`. To load an image data object directly, set the `image.type: 'data'` option when loading the image.

### Image Formats

The _format_ of the image describes how the memory is laid out. It is mainly important when working with `data` _type_ images. The default format / memory layout for image data is `RGBA` and `UNSIGNED_BYTE` i.e. four components per pixel, each a byte.

Some loaders may add additional fields to the image data structure to describe the data format. Currently the image category does not provide any documentation for how to describe alternate formats/memory layouts, however a preliminary recommendation is to follow OpenGL/WebGL conventions.

## Compressed Images

Compressed images are always returned as image data objects. They will have an additional field, `compressed: true`, indicating that the typed array in the `data` field contains compressed pixels and is not directly indexable.

Applications that use e.g. the `CompressedTextureLoader` and/or the `BasisLoader` together with the `ImageLoader` can check this flag before attempting to access the image data.

## Options

The image category support some generic options (specified using `options.image.<option-name>`), that are applicable to all (or most) image loaders.

| Option                 | Default  | Type    | Availability   | Description                                   |
| ---------------------- | -------- | ------- | -------------- | --------------------------------------------- |
| `options.image.type`   | `'auto'` | string  | See table      | One of `auto`, `data`, `imagebitmap`, `image` |
| `options.image.decode` | `true`   | boolean | No: Edge, IE11 | Wait for HTMLImages to be fully decoded.      |

## Notes

### About worker loading

Worker loading is only supported for the `data` and `imagebitmap` formats. Since image worker loading is only available on some browsers (Chrome and Firefox), the `ImageLoader` dynamically determines if worker loading is available. Use `options.worker: false` to disable worker loading of images.

## Image API

The image category also provides a few utilities:

- Detecting ("sniffing") mime type and size of image files before parsing them
- Getting image data (arrays of pixels) from an image without knowing which type was loaded (TBA)

## Remarks

### ImageData

Image data objects return by image category loaders have the same fields (`width`, `height`, `data`) as the browser's built-in `ImageData` class, but are not actual instances of `ImageData`. However, should you need it, it is easy to create an `ImageData` instance from an image data object:

```js
const data = load(url, ImageLoader, {image: {type: 'data'}});
const imageData = new ImageData(data.data, data.width, data.height);
```
