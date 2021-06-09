# GIFBuilder

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square" alt="From-v2.2" /> 
</p>

> This `GIFBuilder` is currenly highly experimental and may change significantly in minor releases and ev en patch releases. Pin down your loaders.gl version if you wish to use it.

The `GIFBuilder` class creates a base64 encoded GIF image from either:

- a series of images
- a series of image URLs
- a video URL
- or by capturing the webcam.

> The `GIFBuilder` only works in the browser, and many features are experimental.

## Usage

Build a GIF from images

```js
import {load} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import {GIFBuilder} from '@loaders.gl/video';

const gifBuilder = new GIFBuilder({source: 'images', width: 400, height: 400});
gifBuilder.add(
  await load('http://i.imgur.com/2OO33vX.jpg', ImageLoader, {images: {type: 'image'}})
);
gifBuilder.add(
  await load('http://i.imgur.com/qOwVaSN.png', ImageLoader, {images: {type: 'image'}})
);
gifBuilder.add(
  await load('http://i.imgur.com/Vo5mFZJ.gif', ImageLoader, {images: {type: 'image'}})
);
gifBuilder.build();
```

Build a GIF from image URLs (Experimental)

```js
import {GIFBuilder} from '@loaders.gl/video';

const gifBuilder = new GIFBuilder({source: 'images', width: 400, height: 400});
gifBuilder.add('http://i.imgur.com/2OO33vX.jpg');
gifBuilder.add('http://i.imgur.com/qOwVaSN.png');
gifBuilder.add('http://i.imgur.com/Vo5mFZJ.gif');
gifBuilder.build();
```

Build a GIF from image URLs, with frame-specific Text (Experimental)

```js
import {GIFBuilder} from '@loaders.gl/video';

const gifBuilder = new GIFBuilder({source: 'images', width: 400, height: 400});
gifBuilder.add({src: 'http://i.imgur.com/2OO33vX.jpg', text: 'First image text'});
gifBuilder.add({src: 'http://i.imgur.com/qOwVaSN.png', text: 'Second image text'});
gifBuilder.add({src: 'http://i.imgur.com/Vo5mFZJ.gif', text: 'This image text'});
gifBuilder.build();
```

Build a GIF from the webcam (Experimental)

```js
import {GIFBuilder} from '@loaders.gl/video';
const gifBuilder = new GIFBuilder({source: webcam, width: 400, height: 400});
gifBuilder.build();
```

## Methods

### constructor(options: object)

Creates a new `GIFBuilder` instance.

`options` See the Options section below.

### add(file: Image | string | object)

- **images** -- `Image` objects can be added.(Note: `ImageBitmap` is not currently supported).

Experimentally, tha following types can currently be added (may be removed in upcoming release)

- **string URLs for images** If this option is used, then a GIF will be created using these images e.g. ,.'http://i.imgur.com/2OO33vX.jpg', 'http://i.imgur.com/qOwVaSN.png', 'http://i.imgur.com/Vo5mFZJ.gif'

- **a video** a GIF will be created using the first supplied video that is supported by the current browser's video codecs. E.g. 'example.mp4', 'example.ogv'.

> Also note that a mix of types is not supported. All added elements must be of the same type (images, image URLs, video URLs).

### build(): string

The build method will actually build the GIF. It returns a base 64 encoded GIF.

Note: After calling `build()` this builder instance is not intended to be used further. Create new `GLTBuilder` instances to build additional GIFs.

## Options

| Option           | Type     | Default                                                        | Description                                                                          |
| ---------------- | -------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source`         | `string` | `'images'`                                                     | Either `'images'`, `'video'` or `'webcam'`                                           |
| `width`          | `number` | `200`                                                          | Desired width of the generated GIF image                                             |
| `height`         | `number` | `200`                                                          | Desired height of the generated GIF image                                            |
| `crossOrigin`    | `string` | CORS attribute for requesting image or video URLs. 'Anonymous' | 'Anonymous', 'use-credentials', or '' (to not set).                                  |
| QUALITY SETTINGS |          |                                                                |
| `sampleInterval` |          | `10`                                                           | pixels to skip when creating the palette. Default is 10. Less is better, but slower. |
| `numWorkers`     |          | `2`                                                            |                                                                                      | how many web workers to use to process the animated GIF frames. Default is 2.                                                                     |
| `interval`       |          | `0.1`                                                          | The amount of time (in seconds) to wait between each frame capture                   |
| `offset`         |          | `null`                                                         |                                                                                      | The amount of time (in seconds) to start capturing the GIF (only for HTML5 videos)                                                                |
| `numFrames`      |          | `10`                                                           |                                                                                      | The number of frames to use to create the animated GIF. Each frame is captured every 100 milliseconds of a video and every ms for existing images |
| `frameDuration`  |          | `1`                                                            |                                                                                      | The amount of time (10 = 1s) to stay on each frame                                                                                                |

Notes:

- By adjusting the sample interval, you can either produce extremely high-quality images slowly, or produce good images in reasonable times. With a sampleInterval of 1, the entire image is used in the learning phase, while with an interval of 10, a pseudo-random subset of 1/10 of the pixels are used in the learning phase. A sampling factor of 10 gives a substantial speed-up, with a small quality penalty.

### Experimental Options

These options are forwarded directly to the underlying [`gifshot`](https://github.com/yahoo/gifshot) module. They are not officially supported by loaders.gl, but can still be useful. In case things are unclear it is recommended to search the documentation and issues in that module.

| Option                              | Type                                                                 | Default                     | Description                                                            |
| ----------------------------------- | -------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| when the current image is completed |
| CSS FILTER OPTIONS                  |                                                                      |                             |
| `filter`                            | `'', // CSS filter that will be applied to the image (eg. blur(5px)) |
| WATERMARK OPTIONS                   |                                                                      |                             |
| `waterMark`                         | `null`                                                               |                             | If an image is given here, it will be stamped on top of the GIF frames |
| `waterMarkHeight`                   | `null`                                                               | ,// Height of the waterMark |
| `waterMarkWidth`                    | `null`                                                               |                             | Height of the waterMark                                                |
| `waterMarkXCoordinate`              | `1`                                                                  |                             | The X (horizontal) Coordinate of the watermark image                   |
| `waterMarkYCoordinate`              | `1`                                                                  |                             | The Y (vertical) Coordinate of the watermark image                     |

| TEXT OPTIONS
| `text` | `'', // The text that covers the animated GIF | |`showFrameText`|`true | If frame-specific text is supplied with the image array, you can force the |frame-specific text to not be displayed by making this option 'false'.
| `fontWeight` | `'normal' | The font weight of the text that covers the animated GIF | |`fontSize`|`'16px' | The font size of the text that covers the animated GIF |
| `minFontSize` | `'10px' | The minimum font size of the text that covers the animated GIF (Note` | `This |option is only applied if the text being applied is cut off) |`resizeFont`|`false | Whether or not the animated GIF text will be resized to fit within the GIF |container
| `fontFamily` | `'sans-serif' | The font family of the text that covers the animated GIF | |`fontColor`|`'#ffffff' | The font color of the text that covers the animated GIF |
| `textAlign` | `'center' | The horizontal text alignment of the text that covers the animated GIF | |`textBaseline`|`'bottom' | The vertical text alignment of the text that covers the animated GIF |
| `textXCoordinate` | `null | The X (horizontal) Coordinate of the text that covers the animated GIF (only |use this if the default textAlign and textBaseline options don't work for you) |`textYCoordinate`|`null | The Y (vertical) Coordinate of the text that covers the animated GIF (only |use this if the default textAlign and textBaseline options don't work for you)

## Remarks

- Make sure these image resources are CORS enabled to prevent any cross-origin JavaScript errors
- You may also pass a NodeList of existing image elements on the page

## Attribution

`GIFBuilder` is based on Yahoo's awesome [`gifshot`](https://github.com/yahoo/gifshot) module, and is MIT licensed.
