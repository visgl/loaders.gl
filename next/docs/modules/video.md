Video module

# Keep browser video loading inside the data pipeline.

`@loaders.gl/video` provides an experimental browser-only loader for video data. It follows loaders.gl conventions while leaving playback and rendering decisions to the application.

[Video loader](https://loaders.gl/next/docs/modules/video/api-reference/video-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/video/api-reference/video-loader.md)[Image and media data](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)[Using loaders](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

The browser media path

## Load media data. Let the application decide how to play it.

The module is intentionally small: it prepares browser video data for an application and does not attempt to provide a Node.js implementation or a full playback framework.

01

Input

Browser-supported video resources

02

Runtime

Browser APIs only

03

Loader

VideoLoader

04

Next step

Application-owned playback or rendering

Detailed guide

## Experimental API details

The reference below covers installation, the current loader surface, browser limitations, and related media APIs.

![From-v2.2](https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square)

The `@loaders.gl/video` module provides browser video loading and GIF encoding through `VideoLoader` and `GIFBuilder`.

> Video support is still experimental, and does not work in Node.js.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/video

npm install @loaders.gl/core
```

## API[​](#api "Direct link to API")

| Loader                                                                                         | Description |
| ---------------------------------------------------------------------------------------------- | ----------- |
| [`VideoLoader`](https://loaders.gl/next/docs/modules/video/api-reference/video-loader.md) |             |

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/video/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
