---
title: Video
description: Load browser video data through the experimental loaders.gl API.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Video module"
  title="Keep browser video loading inside the data pipeline."
  description="`@loaders.gl/video` provides an experimental browser-only loader for video data. It follows loaders.gl conventions while leaving playback and rendering decisions to the application."
  tone="blue"
  meta={['Experimental', 'Browser only', 'VideoLoader']}
  links={[
    {label: 'Video loader', to: '/docs/modules/video/api-reference/video-loader'},
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

The `@loaders.gl/video` module contains loader and writers for images that follow loaders.gl conventions.

> Video support is still experimental, and does not work in Node.js.

## Installation

```bash
npm install @loaders.gl/video
npm install @loaders.gl/core
```

## API

| Loader                                                          | Description |
| --------------------------------------------------------------- | ----------- |
| [`VideoLoader`](/docs/modules/video/api-reference/video-loader) |             |
