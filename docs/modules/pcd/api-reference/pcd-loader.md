# PCDLoader

The `PCDArrowLoader` loads point cloud data in the Point Cloud Data (PCD) format and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

`PCDLoader` parses the same PCD format and returns the legacy [PointCloud](/docs/specifications/category-mesh) object.

| Loader                | Characteristic                                     |
| --------------------- | -------------------------------------------------- |
| File Format           | [Point Cloud Data](/docs/modules/pcd/formats/pcd)) |
| Data Format           | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [PointCloud](/docs/specifications/category-mesh) |
| File Extension        | `.pcd`                                             |
| File Type             | Text/Binary                                        |
| Decoder Type          | Synchronous                                        |
| Worker Thread Support | Yes                                                |
| Streaming Support     | No                                                 |

Note: Currently supports `ascii`, `binary` and compressed binary files.

## Usage

```typescript
import {PCDArrowLoader, PCDLoader} from '@loaders.gl/pcd';
import {load} from '@loaders.gl/core';

const table = await load(url, PCDArrowLoader, options);
const data = await load(url, PCDLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
