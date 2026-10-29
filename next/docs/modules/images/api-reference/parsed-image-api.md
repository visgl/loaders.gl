Image utility API

# Keep image handling independent of the runtime’s image class.

The image utilities recognize loaders.gl image values and expose common operations for size, pixels, MIME types, and supported formats. They let application code work across `ImageBitmap`, `Image`, and raw image-data values.

[Images module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)[Image loader](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)[Image category](https://loaders.gl/next/docs/specifications/category-image.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-image.md)

The platform boundary

## Accept the image value you have. Ask for the information you need.

These helpers keep browser-specific image classes out of most application code. Decode with a loader, then use the same utility calls for inspection or pixel access.

01

Recognize

ImageBitmap, Image, or image-data values

02

Inspect

Type, dimensions, and supported MIME types

03

Extract

Portable raw pixels when analysis needs them

04

Compose

Use the result with loaders and writers

A small set of image utility functions intended to help write image handling code that works across platforms.

Detailed guide

## Image utility details

The reference below covers supported image values, type detection, pixel extraction, dimensions, and platform-dependent format support.

Background: The image returned by [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md) is always `ImageBitmap`, while deprecated [`ImageLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md) preserves older compatibility return types.

## Usage[​](#usage "Direct link to Usage")

E.g., the `getImageData` method enables the application to get width, height and pixel data from an image returned by an image category loader in a platform independent way:

```
import {ImageBitmapLoader, getImageSize, getImageData} from '@loaders.gl/images';

import {load} from '@loaders.gl/core';



const image = await load(URL, ImageBitmapLoader);



// Get an image data object regardless of whether the image is already an `Image`, `ImageBitmap` or already an image data object

const imageData = getImageData(image);

console.log(imageData.width, imageData.height, imageData.data);
```

## Functions[​](#functions "Direct link to Functions")

### getSupportedImageTypes()[​](#getsupportedimagetypes "Direct link to getSupportedImageTypes()")

![From-3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)

```
getSupportedImageTypes(): Promise<Set<string>>
```

Returns a promise that resolves to a `Set` of MIME types that `@loaders.gl/images` can parse on the current platform (depends on the current browser, or whether the app is running under Node.js).

> This function is asynchronous which can be inconvenient to use. However, for technical reasons, asynchronous testing of supported image formats is significantly more reliable and is recommended in browsers.
>
> A small caveat is that some formats like AVIF and WebP support different options in terms of bit-depths and packing and a specific browser may not support all combinations, this function just tests for basic image support.

### isImageTypeSupported()[​](#isimagetypesupported "Direct link to isImageTypeSupported()")

![From-3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)

```
isImageTypeSupported(mimeType : string): boolean
```

* `mimeType`: value to test

Synchronously checks if an image type is supported.

Returns `true` if `mimeType` is one of the MIME types that `@loaders.gl/images` can use on the current platform (depends on browser, or whether running under Node.js).

> At this time, run-time checks for some recently added image formats such as AVIF (and to a lesser extent, WEBP) can not reliably be done in browsers using synchronous techniques. If your code allows for asynchronous calls, use `getSupportedImageTypes()` for the most accurate results.

### isImage()[​](#isimage "Direct link to isImage()")

```
isImage(image : any): boolean
```

* `image`: An image returned by an image category loader, such as `ImageBitmapLoader` or deprecated `ImageLoader`

Returns `true` if `image` is one of the types that `@loaders.gl/images` can return.

### getImageType()[​](#getimagetype "Direct link to getImageType()")

```
getImageType(image : any): 'imagebitmap' | 'image' | 'data'
```

Returns the type of an image.

* `image`: An image returned by an image category loader, such as `ImageBitmapLoader` or deprecated `ImageLoader`

Returns

* a string describing the type of the image.

Throws

* if `image` is not of a recognized type.

The following image types are distinguished

| Image Type      | JavaScript Type                                                                                             | Description                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `'data'`        | A simple JavaScript object with `data`, `width`, `height` etc. fields..                                     | Useful when additional manipulation of the image data is desired. Helper APIs continue to accept this shape directly.                         |
| `'imagebitmap'` | [`ImageBitmap`](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap)                               | The preferred image type returned by `ImageBitmapLoader` and by the Node.js `ImageBitmap` polyfill installed by `@loaders.gl/core/polyfills`. |
| `'image'`       | [`Image`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image) (aka `HTMLImageElement`) | Supported by helper APIs for compatibility and still available through deprecated `ImageLoader`.                                              |

### getImageData()[​](#getimagedata "Direct link to getImageData()")

```
getImageData(image : any): Object
```

* `image`: An image returned by an image category loader, such as `ImageBitmapLoader` or deprecated `ImageLoader`

Returns and image data object with the following fields

* `data` typed array containing the pixels of the image
* `width`
* `height`

Throws

* if `image` is not of a recognized type.
