# loadImage

## Usage

```js
import '@loaders.gl/polyfills'; // only needed if using under Node
import {loadImage} from `@loaders.gl/images`;

const image = await loadImage(url);
```

```js
import '@loaders.gl/polyfills'; // only needed if using under Node
import {loadImage} from `@loaders.gl/images`;

const URL = ...;

const image = await loadImage(({lod}) => `${URL}-${lod}.jpg`, {
  image: {
    mipLevels: 'auto'
  }
});

for (const lodImage of imageArray) {
  ...
}
```

## Function

### loadImage(getUrl : String | Function, options? : Object]) : image | image[]

A basic image loading function for loading a single image (or an array of mipmap images representing a single image).

- `getUrl`: A function that generates the url for each image, it is called for each image with the `lod` of that image.
- `options`: Supports the same options as [`ImageLoader`](modules/images/docs/api-reference/image-loader).

Returns

- image or array of images

## Options

Accepts the same options as [`ImageLoader`](modules/images/docs/api-reference/image-loader), and

| Option            | Type    | Default | Description |
| ----------------- | ------- | ------- | ----------- | ------------------------------------------------------ |
| `image.mipLevels` | `Number | String` | `0`         | If `'auto'` or non-zero, loads an array of mip images. |

Number of mip level images to load: Use `0` to indicate a single image with no mips. Supplying the string `'auto'` will infer the mipLevel from the size of the `lod`=`0` image.
