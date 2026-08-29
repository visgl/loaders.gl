---
title: VideoLoader
description: Load browser-supported video resources through the experimental loaders.gl media API.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Video API · experimental"
  title="Bring browser video into the loading pipeline."
  description="VideoLoader creates the browser-side video representation expected by the experimental video module. It handles loading; playback, controls, and rendering remain application concerns."
  tone="blue"
  meta={['From v2.2', 'Browser only', 'Experimental']}
  links={[
    {label: 'Video module', to: '/docs/modules/video'},
    {label: 'Image module', to: '/docs/modules/images'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="The browser media boundary"
  title="Load the resource. Own the playback experience."
  description="The loader is deliberately narrow and browser-only. It gives an application a familiar loaders.gl entry point without hiding the platform’s media lifecycle or pretending to support Node.js."
  tone="blue"
  items={[
    {label: 'Input', value: 'A browser-supported video URL or resource'},
    {label: 'Output', value: 'A browser video element representation'},
    {label: 'Runtime', value: 'Browser APIs only; no Node.js implementation'},
    {label: 'Status', value: 'Experimental and subject to change'}
  ]}
/>

<ReferenceBoundary
  title="VideoLoader reference"
  description="The sections below document the loader metadata, installation, usage, and current browser limitations."
  tone="blue"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square" alt="From-v2.2" /> 
</p>

> The `VideoLoader` is experimental.

A basic Video element loader. Only works in the browser.

| Loader         | Characteristic                                          |
| -------------- | ------------------------------------------------------- |
| File Extension | `.mp4`                                                  |
| File Type      | Binary                                                  |
| File Format    | Image                                                   |
| Data Format    | `Video` (browsers) (Not currently supported on node.js) |
| Supported APIs | `load`, `parse`                                         |

## Usage

```typescript
import '@loaders.gl/polyfills'; // only needed if using under Node
import {VideoLoader} from '@loaders.gl/video';
import {load} from '@loaders.gl/core';

const image = await load(url, VideoLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
