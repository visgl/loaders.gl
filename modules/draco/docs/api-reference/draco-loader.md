# DracoLoader

The `DracoLoader` decodes a mesh or point cloud (maps of attributes) using [DRACO](https://google.github.io/draco/) compression.

| Loader                | Characteristic                               |
| --------------------- | -------------------------------------------- |
| File Extension        | `.drc`                                       |
| File Type             | Binary                                       |
| File Format           | [Draco](https://google.github.io/draco/)     |
| Data Format           | [Mesh](docs/specifications/category-mesh.md) |
| Decoder Type          | Synchronous                                  |
| Worker Thread Support | Yes                                          |
| Streaming Support     | No                                           |

## Usage

```js
import {DracoLoader} from '@loaders.gl/draco';
import {load} from '@loaders.gl/core';

const data = await load(url, DracoLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

