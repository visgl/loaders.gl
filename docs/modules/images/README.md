# Overview

The `@loaders.gl/images` module contains loader and writers for images that follow loaders.gl conventions and work under both node and browser.

## Installation

```bash
npm install @loaders.gl/images
npm install @loaders.gl/core
```

## API

| Loader                                                           | Description |
| ---------------------------------------------------------------- | ----------- |
| [`ImageLoader`](/docs/modules/images/api-reference/image-loader) |             |
| [`ImageWriter`](/docs/modules/images/api-reference/image-writer) |             |

### Parsed Image API

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

| Function                                        | Description                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `isImageTypeSupported(type : string) : boolean` | Check if type is supported by current run-time environment                                   |
| `getDefaultImageType() : string`                | Returns the preferred image type for the current run-time environment                        |
| `isImage(image : any) : boolean`                | Checks any JavaScript value to see if it is an image of a type that loaders.gl can work with |
| `getImageType(image : any) : string`            | Returns the type name for this image.                                                        |
| `getImageData(image : any) : object`            | Returns an image data object with a `data` array representing the pixels of an image         |

## Image Types

The parsed image APIs support multiple image representations.

- `ImageBitmap` - The browser return type of `ImageLoader`.
- `Image` (aka `HTMLImageElement`) - Still supported by helper APIs such as `getImageData`, but no longer returned by `ImageLoader`.
- `data` - Raw binary memory representing the image pixels. This is the Node.js return type of `ImageLoader`, and can also be produced from browser images with `getImageData(image)`.

See [`ImageLoader`](/docs/modules/images/api-reference/image-loader) for more details on options etc.
