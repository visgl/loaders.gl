# CompressedTextureLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Loader for compressed textures in the PVR file format

| Loader         | Characteristic                                                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format    | [PVR](http://cdn.imgtec.com/sdk-documentation/PVR+File+Format.Specification.pdf), [DDS](https://docs.microsoft.com/en-us/windows/win32/direct3ddds/dx-graphics-dds-pguide) |
| File Extension | `.dds`, `.pvr`                                                                                                                                                             |
| File Type      | Binary                                                                                                                                                                     |
| Data Format    | Array of compressed image data objects                                                                                                                                     |
| Supported APIs | `load`, `parse`                                                                                                                                                            |

## Usage

```js
import {CompressedTextureLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const mipLevels = await load(url, CompressedTextureLoader);
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
