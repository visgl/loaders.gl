# Image Loaders

The image loader category documents a common data format, options, conventions and utilities for loader and writers for images that follow loaders.gl conventions.

## Image Category Loaders

| Loader                | Notes |
| --------------------- | ----- |
| [`ImageLoader`](modules/images/docs/api-reference/image-loader)           |     Loads compressed images (PNG, JPG, etc)  |
| [`CompressedTextureLoader`](modules/basis/docs/api-reference/compressed-texture-loader)  | Parses compressed textures to image data mipmap array      |
| [`BasisLoader`](modules/basis/docs/api-reference/basis-loader)           | Transpiles into supported compressed texture format      |

## Features and Capabilities

A set of image loaders that integrate with loaders.gl

- Works under both node and browser.
- Loads images on workers (on supporting browsers)
- Uses ImageBitmap (on supporting browsers)
- Handles SVG images
- Image type detection (without loading images)

## Installation

Core image category support is provided by the `@loaders.gl/images` module:

```bash
npm install @loaders.gl/core @loaders.gl/images
```

Note that `@loaders.gl/polyfills` must be installed and imported to to enable loading images under node.js.

```bash
npm install @loaders.gl/polyfills
```

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

## Image Type

The image category referes to the type of the JavaScript object returned by the `ImageLoader` as the image _type_. It indicates which JavaScript class is used to represent the image. Note that this is not related to the "format" of the image (see below).

The type of the loaded image will vary based on the environment. For performance, in the browser, the `ImageLoader` uses native image loading functionality in browsers, preferring `ImageBitmap` when available, falling back to  `Image` (aka `HTMLImageElement`).

Additionally, a loaded image can optionally be returned as an _image data_ object (an object containing a `Uint8Array` with the pixel data, and some metadata like `width` and `height`. (In Node.js images are always loaded as image data objects).

| Image Type    | Class                           | Availability                           | Workers                | Description                                                                      |
| ------------- | -------------------------------- | -------------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| `image`       | `Image` (aka `HTMLImageElement`) | All browsers                           | No                     | The traditional HTML/JavaScript class used for image loading into DOM trees. WebGL compatible. |
| `imagebitmap` | `ImageBitmap`                    | Chrome/Firefox                         | Yes: **transferrable** | A newer JavaScript class designed for efficient loading of images, optimized for use in worker threads and with  WebGL        |
| `imagedata`   | Object with `{width: Number, height: Number, data: Uint8Array, ...}`                         | Node.js and browsers | No                     | Compatible with headless gl.                     |

## Image Data

Image data objects are images loaded as data, represented by an object that contains a typed array with the pixel data, size, and possibly additional metadata `{width: Number, height: Number, data: Uint8Array, ...}` 

To get an image data object from a loaded `Image` or `ImageBitmap`, call `getImageData(image)`. To load an image data object directly, set the `image.type: 'imagedata'` option when loading the image.

## Image Format

The _format_ of the image describes how the memory is laid out. It is mainly important when working with `imagedata` objects. The default format for `imagedata` objects is `RGBA` and `UNSIGNED_BYTE` i.e. four components per pixel, each a byte.

Some loaders may add additional fields to the image data structure to describe the data format. Currently there are no image category level conventions for how to describe alternate formats, however the preliminary recommendation is to follow OpenGL/WebGL conventions.

## Compressed Images

Compressed images are always returned as image data objects. They will have an additional field, `compressed: true`, indicating that the typed array in the `data` field contains compressed pixels and is not directly indexable. Applications that use e.g. the `CompressedTextureLoader` and/or the `BasisLoader` together with the `ImageLoader` can check this flag before indexing into the array.

## Options

The image category support some generic options (specified using `options.image.<option-name>`), that are applicable to all (or most) image loaders.

| Option                      | Default       | Type    | Availability   | Description                                     |
| --------------------------- | ------------- | ------- | -------------- | ----------------------------------------------- |
| `options.image.type`        | `'auto'`      | string  | See table      | One of `auto`, `imagebitmap`, `html`, `ndarray` |
| `options.image.decodeHTML`  | `true`        | boolean | No: Edge, IE11 | Wait for HTMLImages to be fully decoded.        |
| `options.image.crossOrigin` | `'anonymous'` | boolean | All Browsers   | Sets `crossOrigin` field for HTMLImage loads    |

## Notes

### About worker loading

- Worker loading is only supported for the `imagebitmap` format (on Chrome and Firefox).
- `ImageBitmap` is **transferrable** and can be moved back to main thread without copying.

Since image worker loading is only available on some browsers, the `ImageLoader` dynamically determines if worker loading is available. Use `options.worker: false` to disable worker loading of images.

## Image API

The image category also provides a few utilities:

- Detecting ("sniffing") mime type and size of image files before parsing them
- Getting image data (arrays of pixels) from an image without knowing which type was loaded (TBA)

## Remarks

- image data objects have the same fields as the browser's built-in `ImageData` class, but are not actual instances of `ImageData`. It is however easy to create an `ImageData` instance from an image data object:

```js
const imageData = new ImageData(imagedata.data, imagedata.width, imagedata.height);
```

Note that this assumes its image _format_ is the default 8-bit RGBA.
