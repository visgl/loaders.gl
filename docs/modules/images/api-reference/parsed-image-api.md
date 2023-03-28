# Image Utilities

A small set of image utility functions functions intended to help write image handling code that works across platforms.

Background: The image returned by the [`ImageLoader`](modules/images/docs/api-reference/image-loader.md) depends on the environment, i.e. whether the application is running in a new or old browser, or under Node.js.

## Usage

E.g., the `getImageData` method enables the application to get width, height and pixel data from an image returned by the `ImageLoader` in a platform independent way:

```js
import {ImageLoader, getImageSize, getImageData} from `@loaders.gl/images`;
import {load} from `@loaders.gl/core`;

const image = await load(URL, ImageLoader);

// Get an image data object regardless of whether the image is already an `Image`, `ImageBitmap` or already an image data object
const imageData = getImageData(image);
console.log(imageData.width, imageData.height, imageData.data);
```

## Functions

### getSupportedImageTypes(): `Promise<Set<string>>`

Returns a promise that resolves to a `Set` of MIME types that `@loaders.gl/images` can parse on the current platform (depends on the current browser, or whether the app is running under Node.js).

> Asynchronous testing of supported image formats is more reliable and is preferred in browsers. A small caveat is that some formats like AVIF and WebP support different options in terms of bit-depths and packing and this function just tests for basic image support.

### isImageTypeSupported(mimeType : string): boolean

- `mimeType`: value to test

Synchronously checks if an image type is supported. 

Returns `true` if `mimeType` is one of the MIME types that `@loaders.gl/images` can use on the current platform (depends on browser, or whether running under Node.js).

> Run-time checks for some recent image formats such as AVIF (and to a lesser extent, WEBP) can not reliably be done using synchronous techniques. If your code allows for asynchronous calls, use `getSupportedImageTypes()` for the most accurate results.

### isImage(image : any): boolean

- `image`: An image returned by an image category loader, such as `ImageLoader`

Returns `true` if `image` is one of the types that `@loaders.gl/images` can return.

### getImageType(image : any): String

Returns the type of an image. Can be used when loading images with the default setting of `options.type: 'auto'` to discover what type was actually returned.

- `image`: An image returned by an image category loader, such as `ImageLoader`

Returns

- a string describing the type of the image.

Throws

- if `image` is not of a recognized type.

| Type          | JavaScript Type                                 | Description                                                          |
| ------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| `data`        | Image data object: `data`, `width`, `height` .. | Node.js representation                                               |
| `imagebitmap` | `ImageBitmap`                                   | The newer HTML5 image class (modern browsers only)                   |
| `image`       | `Image` aka `HTMLImageElement`                  | More widely supported (but less performant and flexible) image class |

### getImageData(image : any): Object

- `image`: An image returned by an image category loader, such as `ImageLoader`

Returns and image data object with the following fields

- `data` typed array containing the pixels of the image
- `width`
- `height`

Throws

- if `image` is not of a recognized type.
