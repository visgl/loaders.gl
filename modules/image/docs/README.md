# Overview

The `@loaders.gl/image` module contains loader and writers for images that follow loaders.gl conventions and work under both node and browser.

## Installation

```bash
npm install @loaders.gl/image
npm install @loaders.gl/core
```

## API

| Loader                                                         | Description |
| -------------------------------------------------------------- | ----------- |
| [`ImageLoader`](modules/image/docs/api-reference/image-loader) |             |
| [`ImageWriter`](modules/image/docs/api-reference/image-writer) |             |

### Binary Image API

A set of functions that can extract information from "unparsed" binary memory representation of certain image formats. These functions are intended to be called on raw `ArrayBuffer` data, before the `ImageLoader` parses it and converts it to a parsed image type.

These functions are used internally to autodetect if image loader can be used to parse a certain `ArrayBuffer`, but are also available to applications.

| Function                                                   | Description |
| ---------------------------------------------------------- | ----------- |
| `getBinaryImageMetadata(imageData : ArrayBuffer) : Object` |             |

### Image Type API

A set of functions to help anticipate and control the type of images return by the `ImageLoader`.

| Function                                        | Description                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `isImageTypeSupported(type : string) : boolean` | Check if type is supported by current run-time environment                                                |
| `getDefaultImageType() : string`                | Returns the image type selected by default ( `options.image.type: 'auto'` in current run-time environment |

## Image Types

To support image loading on older browsers and Node.js, the `ImageLoader` can return different types, i.e. different representations of the parsed image.

- `ImageBitmap` - An `ImageBitmap` object represents a bitmap image that can be painted to a canvas without undue latency. This is the preferred parsed image representation in the browser. It can also be transferred efficiently between threads. Not available in some older browsers.
- `Image` (aka `HTMLImageElement`) - The traditional HTML image class. Available in all browsers.
- `data` - a memory layout for parsed pixels in node.js. Texture creation functions in headless gl accept `data` images.

See [`ImageLoader`](modules/image/docs/api-reference/image-loader) for more details on options etc.
