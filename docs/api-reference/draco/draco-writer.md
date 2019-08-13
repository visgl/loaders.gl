# DracoWriter

The `DracoWriter` encodes a mesh or point cloud (maps of attributes) using [Draco3D](https://google.github.io/draco/) compression.

| Loader                | Characteristic   |
| --------------------- | ---------------- |
| File Extension        | `.drc`           |
| File Typoe            | Binary           |
| Data Format           | [Mesh](docs/specifications/category-mesh.md) |
| File Format           | [Draco](https://google.github.io/draco/) |
| Encoder Type          | Synchronous      |
| Worker Thread Support | Yes              |
| Streaming Support     | No               |

## Usage

```js
import {DracoWriter} from '@loaders.gl/draco';
import {encode} from '@loaders.gl/core';

const mesh = {
  attributes: {
    POSITION: {...}
  }
};

const data = await encode(mesh, DracoWriter, options);
```

## Options

| Option        | Type      | Default     | Description       |
| ------------- | --------- | ----------- | ----------------- |
| `pointcloud`  | Boolean   | `false`     | set to `true` to compress pointclouds (mode=`0` and no `indices`). |
| `method`      | String    | `MESH_EDGEBREAKER_ENCODING` | set Draco encoding method (applies to meshes only). |
| `speed`       | [Number, Number] | set Draco speed options. |
| `log`         | Function  | callback for debug info. |
