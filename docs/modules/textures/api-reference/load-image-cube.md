# loadCubeImages

A function that loads 6 images representing the faces of a cube. Primarily intended for loading images for WebGL `GL.TEXTURE_CUBE` textures.

## Usage

Load images for a cubemap with one image per face

```js
import '@loaders.gl/polyfills'; // only needed for Node.js support
import {loadImageCube} from `@loaders.gl/images`;

const imageCube = await loadImageCube(({direction}) => `diffuse-${direction}.png`);

for (const face in imageCube) {
  const image = imageCube[face];
}
```

Load images for a cubemap with an array of mip images per face

```js
import '@loaders.gl/polyfills'; // only needed for Node.js support
import {loadImageCube} from `@loaders.gl/images`;

const imageCube = await loadImageCube('mips', ({direction}) => `diffuse-${direction}.png`);

for (const face in imageCube) {
  const imageArray = imageCube[face];
  for (const lodImage of imageArray) {
    ...
  }
}
```

## getUrl Callback Parameters

The following fields will be supplied as named parameters to the `getUrl` function when loading cube maps:

| `faceIndex` | `face`                                    | `direction` | `axis` | `sign`       |
| ----------- | ----------------------------------------- | ----------- | ------ | ------------ |
| 0           | `GL.TEXTURE_CUBE_MAP_POSITIVE_X` (0x8515) | `'right'`   | `'x'`  | `'positive'` |
| 1           | `GL.TEXTURE_CUBE_MAP_NEGATIVE_X` (0x8516) | `'left'`    | `'x'`  | `'negative'` |
| 2           | `GL.TEXTURE_CUBE_MAP_POSITIVE_Y` (0x8517) | `'top'`     | `'y'`  | `'positive'` |
| 3           | `GL.TEXTURE_CUBE_MAP_NEGATIVE_Y` (0x8518) | `'bottom'`  | `'y'`  | `'negative'` |
| 4           | `GL.TEXTURE_CUBE_MAP_POSITIVE_Z` (0x8519) | `'front'`   | `'z'`  | `'positive'` |
| 5           | `GL.TEXTURE_CUBE_MAP_NEGATIVE_Z` (0x851a) | `'back'`    | `'z'`  | `'negative'` |

Note: In addition to these values, all `options` passed in to `loadImageCube` are also available in the `getUrl` method.

### loadImageCube(getUrl : ({face, direction, index}) => String, options? : Object) : Object

Loads and image cube, i.e. 6 images keyed by WebGL face constants (see table).

Parameters:

- `getUrl`: A function that generates the url for each image, it is called for each image with the `index` of that image.
- `options`: Supports the same options as [`ImageLoader`](modules/images/docs/api-reference/image-loader).

Returns

- An object with 6 key/value pairs containing images (or arrays of mip images) for for each cube face. They keys are the (stringified) numeric values of the GL constant for the respective faces of the cube

## Options

Accepts the same options as [`ImageLoader`](modules/images/docs/api-reference/image-loader), and

| Option            | Type    | Default | Description |
| ----------------- | ------- | ------- | ----------- | ------------------------------------------------------ |
| `image.mipLevels` | `Number | String` | `0`         | If `'auto'` or non-zero, loads an array of mip images. |

Number of mip level images to load: Use `0` to indicate a single image with no mips. Supplying the string `'auto'` will infer the mipLevel from the size of the `lod`=`0` image.

## Remarks

- Returned images can be passed directly to WebGL texture methods. See [`ImageLoader`](modules/images/docs/api-reference/image-loader) for details about the type of the returned images.
