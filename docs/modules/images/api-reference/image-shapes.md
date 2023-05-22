# Image Shapes

## Image Shapes and Types

To support image loading on older browsers and Node.js, the `ImageLoader` can return different types, i.e. different representations of the parsed image.

| Shape                  | Type                         | Availability         | Description                                                    |
| ---------------------- | ---------------------------- |
| `imagebitmap`          | `ImageBitmap`                | Modern browsers      | Represents a bitmap image that can be painted to a canvas.     |
| `data`                 | `ImageDataType`              | Browsers and Node.js | The image pixels, typically in RGBA `Uint8Array` format.       |
| *`image` (deprecated)* | `Image` (`HTMLImageElement`) | *All browsers*       | *The traditional HTML image class. Available in all browsers.* |


`ImageBitmap` is the preferred parsed image representation in browsers, when available, due to performance advantages, and the fact that `ImageBitmap` instances can be transferred efficiently between threads, 

`ImageData` - Computations can be done on this data. Also, Node.js texture creation functions in headless gl accept `data` images. and browser `ImageData` objects can be initialized with this data.

See [`ImageLoader`](/docs/modules/images/api-reference/image-loader) for more details on options etc.
