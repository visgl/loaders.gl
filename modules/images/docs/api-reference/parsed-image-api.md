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

### isImageTypeSupported(type : string) : boolean

- `type`: value to test

Returns `true` if `type` is one of the types that `@loaders.gl/images` can use on the current platform (depends on browser, or whether running under Node.js).

### isImage(image : any) : boolean

- `image`: An image returned by an image category loader, such as `ImageLoader`

Returns `true` if `image` is one of the types that `@loaders.gl/images` can return.

### getImageType(image : any) : String

Returns the type of an image. Can be used when loading images with the default setting of `options.type: 'auto'` to discover what type was actually returned.

- `image`: An image returned by an image category loader, such as `ImageLoader`

Returns

- a string describing the type of the image.

Throws

- if `image` is not of a recognized type.

| Type          | JavaScript Type                                 | Description                                        |
| ------------- | ----------------------------------------------- | -------------------------------------------------- |
| `data`        | Image data object: `data`, `width`, `height` .. | Node.js representation                             |
| `imagebitmap` | `ImageBitmap`                                   | The newer HTML5 image class (modern browsers only) |
| `image`       | `Image` aka `HTMLImageElement`                  | The older, less flexible HTML image element        |

### getImageData(image : any) : Object

- `image`: An image returned by an image category loader, such as `ImageLoader`

Returns and image data object with the following fields

- `data` typed array containing the pixels of the image
- `width`
- `height`

Throws

- if `image` is not of a recognized type.
