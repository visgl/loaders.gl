# Overview

The `@loaders.gl/images` module contains loader and writers for images that follow loaders.gl conventions and work under both node and browser.

## Installation

```bash
npm install @loaders.gl/images
npm install @loaders.gl/core
```

## API

| Loader                                                                        | Description                         |
| ----------------------------------------------------------------------------- | ----------------------------------- |
| [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader) | Preferred pure `ImageBitmap` loader |
| [`ImageLoader`](/docs/modules/images/api-reference/image-loader)              | Deprecated compatibility loader     |
| [`ImageWriter`](/docs/modules/images/api-reference/image-writer)              |                                     |

### Parsed Image API

### Binary Image API

A set of functions that can extract information from "unparsed" binary memory representation of certain image formats. These functions are intended to be called on raw `ArrayBuffer` data, before an image loader parses it and converts it to a parsed image type.

These functions are used internally to autodetect if image loader can be used to parse a certain `ArrayBuffer`, but are also available to applications.

| Function                                                                     | Description |
| ---------------------------------------------------------------------------- | ----------- | --- |
| `isBinaryImage(imageData : ArrayBuffer [, mimeType : String]) : Boolean`     |             |
| `getBinaryImageMIMEType(imageData : ArrayBuffer) : String                    | null`       |     |
| `getBinaryImageSize(imageData : ArrayBuffer [, mimeType : String]) : Object` |             |

### Parsed Image API

A set of functions to work with parsed images returned by `ImageBitmapLoader`, deprecated `ImageLoader`, and other image-category APIs.

| Function                                        | Description                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `isImageTypeSupported(type : string) : boolean` | Check if type is supported by current run-time environment                                   |
| `getDefaultImageType() : string`                | Returns the preferred image type for the current run-time environment                        |
| `isImage(image : any) : boolean`                | Checks any JavaScript value to see if it is an image of a type that loaders.gl can work with |
| `getImageType(image : any) : string`            | Returns the type name for this image.                                                        |
| `getImageData(image : any) : object`            | Returns an image data object with a `data` array representing the pixels of an image         |

## Image Types

The parsed image APIs support multiple image representations.

- `ImageBitmap` - The preferred return type of `ImageBitmapLoader`.
- `Image` (aka `HTMLImageElement`) - Still supported by helper APIs such as `getImageData`, and remains available through deprecated `ImageLoader`.
- `data` - Raw binary memory representing the image pixels. This remains supported by helper APIs and can be produced from images with `getImageData(image)`.

Prefer [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader) for new code. See deprecated [`ImageLoader`](/docs/modules/images/api-reference/image-loader) for compatibility behavior and legacy options.
