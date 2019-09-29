# Image Accessors

The actual JavaScript type of parsed images returned by the [`ImageLoader`](modules/images/docs/api-reference/image-loader.md) depends on whether you are running in a newer or older browser, or under Node.js.

To simplify writing cross-platform image handling code that is optimized on newer browsers and works on older browsers and on Node.js, a set of image accessor functions are provided.

## Usage

To get width, height and pixel data from an image returned by the `ImageLoader` in a cross-platform way:

```js
import {ImageLoader, getImageSize, getImageData} from `@loaders.gl/images`;
import {load} from `@loaders.gl/core`;

const image = await load(URL, ImageLoader);

const {width, height} = getImageSize(image);
const pixelArray = getImageData(image);
```

### isImageTypeSupported(type : string) : boolean

- `type`: value to test

Returns `true` if `type` is one of the types that `@loaders.gl/images` can use on the current platform (depends on browser, or whether running under Node.js).

### isImage(image : any) : boolean

- `image`: value to test

Returns `true` if `image` is one of the types that `@loaders.gl/images` can return.

### getImageType(image : any) : String

Returns the type of an image. Can be used when loading images with the default setting of `options.type: 'auto'` to discover what type was actually returned.

- `image`: value to test

Returns

- a string describing the type of the image.

Throws

- if `image` is not of a recognized type.

| Type      | JavaScript Type                                         | Description                                        |
| --------- | ------------------------------------------------------- | -------------------------------------------------- |
| `bitmap`  | `ImageBitmap`                                           | The newer HTML5 image class (modern browsers only) |
| `html`    | `Image` aka `HTMLImageElement`                          | The older, less flexible HTML image element        |
| `ndarray` | `Object` of ndarray shape: `data`, `width`, `height` .. | Node.js representation                             |

### getImageSize(image : any) : Object

- `image`: an image instance

Returns

- And object `{widht, height}` describing the size of the image

Throws

- if `image` is not of a recognized type.

### getImageData(image : any) : TypedArray

- `image`: an image instance

Returns

- And typed array containing the pixels of the image

Throws

- if `image` is not of a recognized type.
