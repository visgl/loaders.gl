# Category: Image

> The Image Category is being defined for loaders.gl v2.0 and is currently experimental and unstable.

The image category documents a common data format, options, conventions and utilities for loader and writers for images that follow loaders.gl conventions.

Image category loaders includes: `JPEGLoader`, `PNGLoader`, `GIFLoader`, `BMPLoader`, `SVGLoader` and of course all the loaders in the `ImageLoaders` composite loader.

## Features and Capabilities

Apart from providing a set of image loaders that integrate with loaders.gl, there are a number of capabilities that are provided for

- Worka under both node and browser.
- Transparently uses ImageBitmap on supporting browsers
- Loads images on workers
- Handles SVG images
- Image type detection (without loading images)

## Installation and Usage

Image category support is bundled in the `@loaders.gl/images` module:

```bash
npm install @loaders.gl/core @loaders.gl/images
```

Individual loaders for specific image formats can be imported for `@loaders.gl/images`:

```js
import {JEPGLoader, PNGLoader} from '@loaders.gl/images';
import {registerLoaders, load} from '@loaders.gl/core';
registerLoaders([JEPGLoader, PNGLoader]);
const image = await load('image.jpeg');
```

However since each image loader is quite small (in terms of code size and bundle size impact), most applications will just install all image loaders in one go:

```js
import {ImageLoaders} from '@loaders.gl/images';
import {registerLoaders, load} from '@loaders.gl/core';
registerLoaders(ImageLoaders);
const image = await load('image.jpeg');
```

## Data Formats

The loaded image representation can vary somewhat based on your environment. For performance, image loaders use native image loading functionality in browsers. Browsers can load into two types of image classes (`ImageBitmap` and `HTMLImageElement`) and on Node.js images are represented using `ndarray`. The following table summarizes the situation:

| Format Name   | Format                           | Availability                           | Workers                | Description                                                                      |
| ------------- | -------------------------------- | -------------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| `imagebitmap` | `ImageBitmap`                    | Chrome/Firefox                         | Yes: **transferrable** | A newer class designed for efficient loading of images for use with WebGL        |
| `html`        | `Image` (aka `HTMLImageElement`) | All browsers                           | No                     | The original HTML class used for image loading into DOM trees. WebGL compatible. |
| `ndarray`     | ndarray                          | Node only, via `@loaders.gl/polyfills` | No                     | Used to load images under node. Compatible with headless gl.                     |

## Options

The image category support some generic options (specified using `options.image.<option-name>`), that are applicable to all (or most) image loaders.

| Option                           | Default       | Type    | Availability    | Description                                          |
| -------------------------------- | ------------- | ------- | --------------- | ---------------------------------------------------- |
| `options.image.format`           | `'auto'`      | string  | See table       | One of `auto`, `imagebitmap`, `html`, `ndarray`      |
| `options.image.decodeHTML`       | `true`        | boolean | No: Edge, IE11  | Wait for HTMLImages to be fully decoded.             |
| `options.image.crossOrigin`      | `'anonymous'` | boolean | All Browsers    | Sets `crossOrigin` field for HTMLImage loads         |
| `options.image.useWorkers` (TBA) | `true`        | boolean | Chrome, Firefox | If true, uses worker loaders on supported platforms. |

## Notes

### About worker support

- Worker loading is only supported for the `imagebitmap` format (on Chrome and Firefox).
- `ImageBitmap` is **transferrable** and can be moved back to main thread without copying.ß
- There should be no technical limitations to loading images on workers in node, however node workers are not supported yet.

In contrast to other modules, where worker loaders have to be separately installed, since image workers are small and worker loading is only available on some browsers, the image loaders dynamically determines if worker loading is available.
Use `options.image.useWorkers: false` to disable worker loading of images on all platforms.

## Utilities

The image category also provides a few utilities:

- Detecting ("sniffing") mime type and size of image files before parsing them
- Getting image data (arrays of pixels) from an image without knowing which type was loaded (TBA)
