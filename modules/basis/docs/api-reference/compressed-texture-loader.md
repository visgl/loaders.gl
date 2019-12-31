# CompressedTextureLoader

> The `CompressedTextureLoader` is experimental

Loader for compressed textures in the PVR file format

| Loader         | Characteristic                                                                   |
| -------------- | -------------------------------------------------------------------------------- |
| File Format    | [PVR](http://cdn.imgtec.com/sdk-documentation/PVR+File+Format.Specification.pdf) |
| File Extension | `.dds`, `.pvr`                                                                   |
| File Type      | Binary                                                                           |
| Data Format    | Array of compressed image data objects                                           |
| Supported APIs | `load`, `parse`                                                                  |

## Usage

```js
import {CompressedTextureLoader} from '@loaders.gl/basis';
import {load} from '@loaders.gl/core';

const mipLevels = await load(url, CompressedTextureLoader);
for (const image of mipLevels) {
  ...
}
```

## Data Format

Returns an array of image data objects representing mip levels.

`{compressed: true, format, width, height, data: ...}`

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    |      |         |             |
