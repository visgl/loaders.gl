# VideoLoader

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

```js
import '@loaders.gl/polyfills'; // only needed if using under Node
import {VideoLoader} from '@loaders.gl/video';
import {load} from '@loaders.gl/core';

const image = await load(url, VideoLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
