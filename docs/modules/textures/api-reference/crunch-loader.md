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
| Data Format    | `TextureLevel[]`                             |
| Supported APIs | `load`, `parse`                              |

## Usage

```typescript
import {CrunchWorkerLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const mipLevels = await load(url, CrunchWorkerLoader);
for (const level of mipLevels) {
  console.log(level.shape, level.format, level.textureFormat);
}
```

## Data Format

Returns `TextureLevel[]`, one entry per mip level.

Each level includes:

- `shape: 'texture-level'` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `compressed`
- `format` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `textureFormat` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `width`
- `height`
- `data`
- `levelSize` when available

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    |      |         |             |
