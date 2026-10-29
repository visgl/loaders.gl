Image module

# Use the image representation the next stage understands.

The images module detects and loads common image payloads using loaders.gl conventions, with separate APIs for parsed images, binary metadata, browser bitmaps, and writing.

[Image category](https://loaders.gl/next/docs/specifications/category-image.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-image.md)[Image loader](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md)

Two useful boundaries

## Inspect bytes first. Decode pixels only when needed.

Applications can identify image type and dimensions from binary data, or ask for a parsed image when they need pixels. Keeping those paths separate avoids unnecessary decoding.

01

Binary API

Detect type and dimensions from bytes

02

Parsed API

Work with ImageBitmap and decoded pixels

03

Loader

Use the standard load and worker integration

04

Writer

Encode supported image representations

The `@loaders.gl/images` module contains loader and writers for images that follow loaders.gl conventions and work under both node and browser.

See [Image Loaders](https://loaders.gl/next/docs/specifications/category-image.md) for the shared category conventions.

Detailed guide

## Image loading and representation APIs

The sections below cover installation, loaders and writers, parsed image helpers, and binary image inspection.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/images

npm install @loaders.gl/core
```

## API[​](#api "Direct link to API")

| Loader                                                                                                       | Description                                          |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md) | Preferred pure `ImageBitmap` loader                  |
| [`ImageLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md)              | Deprecated compatibility loader                      |
| [`ImageWriter`](https://loaders.gl/next/docs/modules/images/api-reference/image-writer.md)              | Encodes decoded images into supported image formats. |

### Binary Image API[​](#binary-image-api "Direct link to Binary Image API")

A set of functions that can extract information from "unparsed" binary memory representation of certain image formats. These functions are intended to be called on raw `ArrayBuffer` data, before an image loader parses it and converts it to a parsed image type.

These functions are used internally to autodetect if image loader can be used to parse a certain `ArrayBuffer`, but are also available to applications.

| Function                            | Description                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `getBinaryImageMetadata(imageData)` | Detects the MIME type and dimensions of supported encoded image bytes; returns `null` when detection fails. |

Use this metadata helper instead of the removed `isBinaryImage`, `getBinaryImageMIMEType`, and `getBinaryImageSize` exports.

### Parsed Image API[​](#parsed-image-api "Direct link to Parsed Image API")

A set of functions to work with parsed images returned by `ImageBitmapLoader`, deprecated `ImageLoader`, and other image-category APIs.

| Function                                        | Description                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `isImageTypeSupported(type : string) : boolean` | Check if type is supported by current run-time environment                                   |
| `getDefaultImageType() : string`                | Returns the preferred image type for the current run-time environment                        |
| `isImage(image : any) : boolean`                | Checks any JavaScript value to see if it is an image of a type that loaders.gl can work with |
| `getImageType(image : any) : string`            | Returns the type name for this image.                                                        |
| `getImageData(image : any) : object`            | Returns an image data object with a `data` array representing the pixels of an image         |

## Image Types[​](#image-types "Direct link to Image Types")

The parsed image APIs support multiple image representations.

* `ImageBitmap` - The preferred return type of `ImageBitmapLoader`.
* `Image` (aka `HTMLImageElement`) - Still supported by helper APIs such as `getImageData`, and remains available through deprecated `ImageLoader`.
* `data` - Raw binary memory representing the image pixels. This remains supported by helper APIs and can be produced from images with `getImageData(image)`.

Prefer [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md) for new code. See deprecated [`ImageLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md) for compatibility behavior and legacy options.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/images/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
