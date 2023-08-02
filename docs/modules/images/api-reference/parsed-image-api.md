# Image Utilities

A small set of image utility functions functions intended to help write image handling code that works across platforms.

Background: The image returned by the [`ImageLoader`](/docs/modules/images/api-reference/image-loader) depends on the environment, i.e. whether the application is running in a new or old browser, or under Node.js.

## Usage

E.g., the `getImageData` method enables the application to get width, height and pixel data from an image returned by the `ImageLoader` in a platform independent way:

```typescript
import {ImageLoader, getImageSize, getImageData} from `@loaders.gl/images`;
import {load} from `@loaders.gl/core`;

const image = await load(URL, ImageLoader);

// Get an image data object regardless of whether the image is already an `Image`, `ImageBitmap` or already an image data object
const imageData = getImageData(image);
console.log(imageData.width, imageData.height, imageData.data);
```

## Functions

### getSupportedImageTypes()

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-3.4" />
</p>

```typescript
getSupportedImageTypes(): Promise<Set<string>>
```

Returns a promise that resolves to a `Set` of MIME types that `@loaders.gl/images` can parse on the current platform (depends on the current browser, or whether the app is running under Node.js).

> This function is asynchronous which can be inconvenient to use. However, for technical reasons, asynchronous testing of supported image formats is significantly more reliable and is recommended in browsers. 
>
> A small caveat is that some formats like AVIF and WebP support different options in terms of bit-depths and packing and a specific browser may not support all combinations, this function just tests for basic image support.

### isImageTypeSupported()

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-3.4" />
</p>

```typescript
isImageTypeSupported(mimeType : string): boolean
```

- `mimeType`: value to test

Synchronously checks if an image type is supported. 

Returns `true` if `mimeType` is one of the MIME types that `@loaders.gl/images` can use on the current platform (depends on browser, or whether running under Node.js).

> At this time, run-time checks for some recently added image formats such as AVIF (and to a lesser extent, WEBP) can not reliably be done in browsers using synchronous techniques. If your code allows for asynchronous calls, use `getSupportedImageTypes()` for the most accurate results.

### isImage()

```typescript
isImage(image : any): boolean
```

- `image`: An image returned by an image category loader, such as `ImageLoader`

Returns `true` if `image` is one of the types that `@loaders.gl/images` can return.

### getImageType()

```typescript
getImageType(image : any): 'imagebitmap' | 'image' | 'data'
```

Returns the type of an image. Can be used when loading images with the default setting of `options.type: 'auto'` to discover what type was actually returned.

- `image`: An image returned by an image category loader, such as `ImageLoader`

Returns

- a string describing the type of the image.

Throws

- if `image` is not of a recognized type.

The following image types are distinguished

| Image Type      | JavaScript Type                                                         | Description                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'data'`        | A simple JavaScript object with `data`, `width`, `height` etc. fields.. | Useful when additional manipulation of the image data is desired. Always used in Node.js since `ImageBitmap` and `Image` types are not available. |
| `'imagebitmap'` | [`ImageBitmap`][image_bitmap]                                                           | The preferred new HTML5 image class that is optimized for fast rendering (avialble in modern browsers only)                                    |
| `'image'`       | [`Image`][image] (aka `HTMLImageElement`)                                          | Fallback, supported in all browsers (but less performant and flexible than ImageBitmap)                                                           |

[image_bitmap]: https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap
[image]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image
### getImageData()

```typescript
getImageData(image : any): Object
```

- `image`: An image returned by an image category loader, such as `ImageLoader`

Returns and image data object with the following fields

- `data` typed array containing the pixels of the image
- `width`
- `height`

Throws

- if `image` is not of a recognized type.
