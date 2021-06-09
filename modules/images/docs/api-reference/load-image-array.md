# loadImages

A function that loads an array of images. Primarily intended for loading:

- an array of images for a WebGL `TEXTURE_2D_ARRAY` or `TEXTURE_3D` textures
- an array of images representing mip levels of a single WebGL `TEXTURE_2D` texture or one `TEXTURE_CUBE` face.

## Usage

Loading an array of images

```js
import '@loaders.gl/polyfills'; // only needed for Node.js support
import {loadImageArray} from `@loaders.gl/images`;

const images = await loadImageArray(count, ({index}) => `filename-${index}`);

for (const image of images) {
  ...
}
```

```js
import '@loaders.gl/polyfills'; // only needed for Node.js support
import {loadImageArray} from `@loaders.gl/images`;

const images = await loadImageArray(count,  ({index}) => `filename-${index}`, {
  mipLevels: 'auto'
});

for (const imageArray of images) {
  for (const lodImage of imageArray) {
    ...
  }
}
```

## getUrl Callback Parameters

the `getUrl` callback will be called for each image with the following parameters:

| Parameter | Description                                                    |
| --------- | -------------------------------------------------------------- |
| `index`   | The index of the image being loaded, from `0` to `count - 1`.  |
| `lod`     | The mip level image being loaded, from `0` to `mipLevels - 1`. |

Note: In addition to these values, all `options` passed in to `loadImageArray` are also available in the `getUrl` method.

### loadImageArray(count : Number | String, getUrl : ({index}) => String, options? : Object) : image[] | image[][]

Parameters:

- `count`: Number of images to load.
- `getUrl`: A function that generates the url for each image, it is called for each image with the `index` of that image.
- `options`: Supports the same options as [`ImageLoader`](modules/images/docs/api-reference/image-loader).

Returns

- an array of images (or array of arrays of mip images)

## Options

Accepts the same options as [`ImageLoader`](modules/images/docs/api-reference/image-loader), and

| Option            | Type    | Default | Description |
| ----------------- | ------- | ------- | ----------- | ------------------------------------------------------ |
| `image.mipLevels` | `Number | String` | `0`         | If `'auto'` or non-zero, loads an array of mip images. |

Number of mip level images to load: Use `0` to indicate a single image with no mips. Supplying the string `'auto'` will infer the mipLevel from the size of the `lod`=`0` image.

## Remarks

- Returned images can be passed directly to WebGL texture methods. See [`ImageLoader`](modules/images/docs/api-reference/image-loader) for details about the type of the returned images.
