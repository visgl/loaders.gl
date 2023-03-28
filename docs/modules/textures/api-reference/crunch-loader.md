# Worker

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Loader for compressed textures in the Crunch file format

| Loader         | Characteristic                               |
| -------------- | -------------------------------------------- |
| File Format    | [CRN](https://github.com/BinomialLLC/crunch) |
| File Extension | `.crn`                                       |
| File Type      | Binary                                       |
| Data Format    | Array of compressed image data objects       |
| Supported APIs | `load`, `parse`                              |

## Usage

```js
import {CrunchWorkerLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const mipLevels = await load(url, CrunchWorkerLoader);
for (const image of mipLevels) {
  ...
}
```

## Data Format

Returns an array of image data objects representing mip levels.

`{compressed: true, format, width, height, data: ..., levelSize}`

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    |      |         |             |
