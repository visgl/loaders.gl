---
title: Video
description: Load browser video data through the experimental loaders.gl API.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Images package · video APIs"
  title="Keep browser video loading inside the data pipeline."
  description="`@loaders.gl/images` provides an experimental browser-only loader for video data. It follows loaders.gl conventions while leaving playback and rendering decisions to the application."
  tone="blue"
  meta={['Experimental', 'Browser only', 'VideoLoader']}
  links={[
    {label: 'Video loader', to: '/docs/modules/images/video/api-reference/video-loader'},
    {label: 'Image and media data', to: '/docs/modules/images'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="The browser media path"
  title="Load media data. Let the application decide how to play it."
  description="The module is intentionally small: it prepares browser video data for an application and does not attempt to provide a Node.js implementation or a full playback framework."
  tone="blue"
  items={[
    {label: 'Input', value: 'Browser-supported video resources'},
    {label: 'Runtime', value: 'Browser APIs only'},
    {label: 'Loader', value: 'VideoLoader'},
    {label: 'Next step', value: 'Application-owned playback or rendering'}
  ]}
/>

<ReferenceBoundary
  title="Experimental API details"
  description="The reference below covers installation, the current loader surface, browser limitations, and related media APIs."
  tone="blue"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square" alt="From-v2.2" /> 
</p>

The `@loaders.gl/images` module provides browser video loading and GIF encoding through `VideoLoader` and `GIFBuilder`.

> Video support is still experimental, and does not work in Node.js.

## Installation

```bash
npm install @loaders.gl/images
npm install @loaders.gl/core
```

## API

| Loader                                                          | Description |
| --------------------------------------------------------------- | ----------- |
| [`VideoLoader`](/docs/modules/images/video/api-reference/video-loader) |             |

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/images/video/THIRD-PARTY-NOTICES.md)
and the project-wide [References and credits](/docs/references-and-credits).

## Imports

```typescript
import {load} from '@loaders.gl/core';
import {VideoLoader} from '@loaders.gl/images';
import GIFBuilder from '@loaders.gl/images/gif-builder';
```

`VideoLoader` is metadata-only and preloads its browser implementation through
async core APIs. Direct parser access is `VideoLoaderWithParser` from
`@loaders.gl/images/video-loader`. GIF building remains a browser-only direct
entry point. Neither API is pulled into the image root implementation eagerly.
