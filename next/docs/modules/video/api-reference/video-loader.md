Video API · experimental

# Bring browser video into the loading pipeline.

VideoLoader creates the browser-side video representation expected by the experimental video module. It handles loading; playback, controls, and rendering remain application concerns.

[Video module](https://loaders.gl/next/docs/modules/video.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/video.md)[Image module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)[Using loaders](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

The browser media boundary

## Load the resource. Own the playback experience.

The loader is deliberately narrow and browser-only. It gives an application a familiar loaders.gl entry point without hiding the platform’s media lifecycle or pretending to support Node.js.

01

Input

A browser-supported video URL or resource

02

Output

A browser video element representation

03

Runtime

Browser APIs only; no Node.js implementation

04

Status

Experimental and subject to change

Detailed guide

## VideoLoader reference

The sections below document the loader metadata, installation, usage, and current browser limitations.

![From-v2.2](https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square)

> The `VideoLoader` is experimental.

A basic Video element loader. Only works in the browser.

| VideoLoader    |                                                         |
| -------------- | ------------------------------------------------------- |
| File Extension | `.mp4`                                                  |
| File Type      | Binary                                                  |
| File Format    | Image                                                   |
| Data Format    | `Video` (browsers) (Not currently supported on node.js) |
| Supported APIs | `load`, `parse`                                         |

## Usage[​](#usage "Direct link to Usage")

```
import '@loaders.gl/core/polyfills'; // only needed if using under Node

import {VideoLoader} from '@loaders.gl/video';

import {load} from '@loaders.gl/core';



const image = await load(url, VideoLoader, options);
```

## Options[​](#options "Direct link to Options")

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
