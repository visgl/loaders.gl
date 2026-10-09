---
title: GIFBuilder
description: Build animated GIFs from browser images, image URLs, video, or webcam frames.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Video API · experimental builder"
  title="Turn a sequence of frames into a shareable GIF."
  description="GIFBuilder collects browser images or media frames and produces a base64-encoded GIF. It is useful for small capture and preview workflows, but remains experimental and browser-only."
  tone="violet"
  meta={['From v2.2', 'Browser only', 'Experimental']}
  links={[
    {label: 'Video module', to: '/docs/modules/video'},
    {label: 'ImageBitmapLoader', to: '/docs/modules/images/api-reference/image-bitmap-loader'},
    {label: 'VideoLoader', to: '/docs/modules/video/api-reference/video-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The capture path"
  title="Collect frames first. Encode once at the edge."
  description="GIFBuilder accepts decoded images, URLs, video, and webcam input depending on the selected source. The surrounding application still owns permission, timing, and lifecycle decisions."
  tone="violet"
  items={[
    {label: 'Sources', value: 'Images, image URLs, video, or webcam frames'},
    {label: 'Output', value: 'Base64-encoded GIF image data'},
    {label: 'Runtime', value: 'Browser APIs only'},
    {label: 'Status', value: 'Experimental; pin versions for production experiments'}
  ]}
/>

<ReferenceBoundary
  title="GIFBuilder reference"
  description="The sections below document construction, frame input, text overlays, webcam capture, methods, and experimental limitations."
  tone="violet"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square" alt="From-v2.2" /> 
</p>

> This `GIFBuilder` is experimental and may change significantly in minor releases and ev en patch releases. Pin down your loaders.gl version if you wish to use it.

The `GIFBuilder` class creates a base64 encoded GIF image from either:

- a series of images
- a series of image URLs
- a video URL
- or by capturing the webcam.

> The `GIFBuilder` only works in the browser, and many features are experimental.

## Usage

Build a GIF from images

```typescript
import {load} from '@loaders.gl/core';
import {ImageBitmapLoader} from '@loaders.gl/images';
import {GIFBuilder} from '@loaders.gl/video';

const gifBuilder = new GIFBuilder({source: 'images', width: 400, height: 400});
gifBuilder.add(await load('http://i.imgur.com/2OO33vX.jpg', ImageBitmapLoader));
gifBuilder.add(await load('http://i.imgur.com/qOwVaSN.png', ImageBitmapLoader));
gifBuilder.add(await load('http://i.imgur.com/Vo5mFZJ.gif', ImageBitmapLoader));
gifBuilder.build();
```

Build a GIF from image URLs (Experimental)

```typescript
import {GIFBuilder} from '@loaders.gl/video';

const gifBuilder = new GIFBuilder({source: 'images', width: 400, height: 400});
gifBuilder.add('http://i.imgur.com/2OO33vX.jpg');
gifBuilder.add('http://i.imgur.com/qOwVaSN.png');
gifBuilder.add('http://i.imgur.com/Vo5mFZJ.gif');
gifBuilder.build();
```

Build a GIF from image URLs, with frame-specific Text (Experimental)

```typescript
import {GIFBuilder} from '@loaders.gl/video';

const gifBuilder = new GIFBuilder({source: 'images', width: 400, height: 400});
gifBuilder.add({src: 'http://i.imgur.com/2OO33vX.jpg', text: 'First image text'});
gifBuilder.add({src: 'http://i.imgur.com/qOwVaSN.png', text: 'Second image text'});
gifBuilder.add({src: 'http://i.imgur.com/Vo5mFZJ.gif', text: 'This image text'});
gifBuilder.build();
```

Build a GIF from the webcam (Experimental)

```typescript
import {GIFBuilder} from '@loaders.gl/video';
const gifBuilder = new GIFBuilder({source: webcam, width: 400, height: 400});
gifBuilder.build();
```

## Methods

### constructor(options: object)

Creates a new `GIFBuilder` instance.

`options` See the Options section below.

### add(file: ImageBitmap | Image | string | object)

- **images** -- `ImageBitmap` and `Image` objects can be added.

Experimentally, the following types can currently be added (may be removed in upcoming release)

- **string URLs for images** If this option is used, then a GIF will be created using these images e.g. ,.'http://i.imgur.com/2OO33vX.jpg', 'http://i.imgur.com/qOwVaSN.png', 'http://i.imgur.com/Vo5mFZJ.gif'

- **a video** a GIF will be created using the first supplied video that is supported by the current browser's video codecs. E.g. 'example.mp4', 'example.ogv'.

> Also note that a mix of types is not supported. All added elements must be of the same type (images, image URLs, video URLs).

### build(): string

The build method will actually build the GIF. It returns a base 64 encoded GIF.

Note: After calling `build()` this builder instance is not intended to be used further. Create new `GIFBuilder` instances to build additional GIFs.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `source` | `'images'` | Input kind: 'images', 'video', or 'webcam'. |
| `width` | `200` | Output width in pixels. |
| `height` | `200` | Output height in pixels. |
| `crossOrigin` | `'Anonymous'` | CORS mode for requested images and video. |
| `sampleInterval` | `10` | Palette sampling interval; smaller values increase work. |
| `numWorkers` | `2` | Frame-processing workers. |
| `interval` | `0.1` | Seconds between captured frames. |
| `offset` | `null` | Video capture start offset in seconds. |
| `numFrames` | `10` | Number of frames to capture. |
| `frameDuration` | `1` | Frame duration in tenths of a second. |

Smaller `sampleInterval` values improve palette sampling at the cost of more work.

### Experimental options

These settings are forwarded to the bundled gifshot implementation. They are
experimental and may depend on browser image, canvas, and video support.

| Option | Default | Description |
| --- | --- | --- |
| `filter` | `''` | CSS filter applied to frames. |
| `waterMark` | `null` | Watermark image. |
| `waterMarkHeight` | `null` | Watermark height. |
| `waterMarkWidth` | `null` | Watermark width. |
| `waterMarkXCoordinate` | `1` | Horizontal watermark position. |
| `waterMarkYCoordinate` | `1` | Vertical watermark position. |
| `text` | `''` | Text displayed over the GIF. |
| `showFrameText` | `true` | Show per-frame text when supplied. |
| `fontWeight` | `'normal'` | Text weight. |
| `fontSize` | `'16px'` | Text size. |
| `minFontSize` | `'10px'` | Minimum fitted text size. |
| `resizeFont` | `false` | Resize text to fit the GIF. |
| `fontFamily` | `'sans-serif'` | Text font family. |
| `fontColor` | `'#ffffff'` | Text color. |
| `textAlign` | `'center'` | Horizontal text alignment. |
| `textBaseline` | `'bottom'` | Vertical text baseline. |
| `textXCoordinate` | `null` | Override horizontal text position. |
| `textYCoordinate` | `null` | Override vertical text position. |

## Remarks

- Make sure these image resources are CORS enabled to prevent any cross-origin JavaScript errors
- You may also pass a NodeList of existing image elements on the page

## Attribution

`GIFBuilder` is based on Yahoo's awesome [`gifshot`](https://github.com/yahoo/gifshot) module, and is MIT licensed.
