# Overview

The `@loaders.gl/images` module contains loader and writers for images that follow loaders.gl conventions and work under both node and browser.

## Installation

```bash
npm install @loaders.gl/images
npm install @loaders.gl/core
```

## API

| Loader                                                          | Description |
| --------------------------------------------------------------- | ----------- |
| [`ImageLoader`](modules/images/docs/api-reference/image-loader) |             |
| [`ImageWriter`](modules/images/docs/api-reference/image-writer) |             |

### Binary Image API

A set of functions that can extract information from "unparsed" binary memory representation of certain image formats. These functions are intended to be called on raw `ArrayBuffer` data, before the `ImageLoader` parses it and converts it to a parsed image type.

These functions are used internally to autodetect if image loader can be used to parse a certain `ArrayBuffer`, but are also available to applications.

| Function                                                                     | Description |
| ---------------------------------------------------------------------------- | ----------- | --- |
| `isBinaryImage(imageData : ArrayBuffer [, mimeType : String]) : Boolean`     |             |
| `getBinaryImageMIMEType(imageData : ArrayBuffer) : String                    | null`       |     |
| `getBinaryImageSize(imageData : ArrayBuffer [, mimeType : String]) : Object` |             |

### Parsed Image API

A set of functions to work with parsed images returned by the `ImageLoader`.

| Function                                        | Description                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `isImageTypeSupported(type : string) : boolean` | Check if type is supported by current run-time environment                                                |
| `getDefaultImageType() : string`                | Returns the image type selected by default ( `options.image.type: 'auto'` in current run-time environment |
| `isImage(image : any) : boolean`                | Checks any JavaScript value to see if it is an image of a type that loaders.gl can work with              |
| `getImageType(image : any) : string`            | Returns the type name for this image.                                                                     |
| `getImageData(image : any) : object`            | Returns an image data object with a `data` array representing the pixels of an image                      |

### Image Loading API for WebGL Textures

The images API also offers functions to load "composite" images for WebGL textures, cube textures and image mip levels.

These functions take a `getUrl` parameter that enables the app to supply the url for each "sub-image", and return a single promise enabling applications to for instance load all the faces of a cube texture, with one image for each mip level for each face in a single async operation.

| Function                                                               | Description                                                                                                           |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [`loadImage`](modules/images/docs/api-reference/load-image)            | Load a single image                                                                                                   |
| [`loadImageArray`](modules/images/docs/api-reference/load-image-array) | Load an array of images, e.g. for a `Texture2DArray` or `Texture3D`                                                   |
| [`loadImageCube`](modules/images/docs/api-reference/load-image-cube)   | Load a map of 6 images for the faces of a cube map, or a map of 6 arrays of images for the mip levels of the 6 faces. |

As with all loaders.gl functions, while these functions are intended for use in WebGL applications, they do not call any WebGL functions, and do not actually create any WebGL textures..

## Image Types

To support image loading on older browsers and Node.js, the `ImageLoader` can return different types, i.e. different representations of the parsed image.

- `ImageBitmap` - An `ImageBitmap` object represents a bitmap image that can be performantly painted to a canvas ("without undue latency"). Due to the signficant performance advantages, and the fact that `ImageBitmap` instances can be transferred efficiently between threads, `ImageBitmap` is the preferred parsed image representation in browsers, when available. Currently only available in Chrome and Firefox.
- `Image` (aka `HTMLImageElement`) - The traditional HTML image class. Available in all browsers.
- `data` - Raw binary memory representing the image pixels, typically in RGBA `Uint8Array` format. JavaScript computations can be done on this data. Also, Node.js texture creation functions in headless gl accept `data` images. and browser `ImageData` objects can be initialized with this data.

See [`ImageLoader`](modules/images/docs/api-reference/image-loader) for more details on options etc.
