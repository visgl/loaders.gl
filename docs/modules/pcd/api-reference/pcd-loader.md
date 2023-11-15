# PCDLoader

The `PCDLoader` loads point cloud in the Point Cloud Data (PCD) format.

| Loader                | Characteristic                                     |
| --------------------- | -------------------------------------------------- |
| File Format           | [Point Cloud Data](/docs/modules/pcd/formats/pcd)) |
| Data Format           | [PointCloud](/docs/specifications/category-mesh)   |
| File Extension        | `.pcd`                                             |
| File Type             | Text/Binary                                        |
| Decoder Type          | Synchronous                                        |
| Worker Thread Support | Yes                                                |
| Streaming Support     | No                                                 |

Note: Currently supports `ascii`, `binary` and compressed binary files. 

## Usage

```typescript
import {PCDLoader} from '@loaders.gl/pcd';
import {load} from '@loaders.gl/core';

const data = await load(url, PCDLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
