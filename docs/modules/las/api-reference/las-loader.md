# LASLoader

:::caution
The `@loaders.gl/las` only supports LAS/lAZ files up to LAS v1.3. The `LAZLoader` does not support LAS v1.4 files. 
There is a discussion in [Github Issues](https://github.com/visgl/loaders.gl/issues/591).
:::

The `LASLoader` parses a point cloud in the LASER file format.

| Loader                | Characteristic                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| File Extension        | `.las`, `.laz`                                                                                                           |
| File Type             | Binary                                                                                                                   |
| File Format           | [LASER file format](https://www.asprs.org/divisions-committees/lidar-division/laser-las-file-format-exchange-activities) |
| Data Format           | [PointCloud](/docs/specifications/category-mesh)                                                                       |
| Decoder Type          | Synchronous                                                                                                              |
| Worker Thread Support | Yes                                                                                                                      |
| Streaming Support     | No                                                                                                                       |

## Usage

```typescript
import {LASLoader} from '@loaders.gl/las';
import {load} from '@loaders.gl/core';

const data = await load(url, LASLoader, options);
```

## Options

| Option                   | Type             | Default | Description                                                                                                    |
| ------------------------ | ---------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `options.las.shape`      | `string`           | `mesh`     | Format of parsed data, e.g: `'mesh'`, `'columnar-table'`, `'arrow-table'`.                                                                                |
| `options.las.skip`       | `number`           | `1`     | Read one from every _n_ points.                                                                                |
| `options.las.fp64`       | `number`           | `false` | If `true`, positions are stored in 64-bit floats instead of 32-bit.                                            |
| `options.las.colorDepth` | `number` or `string` | `8`     | Whether colors encoded using 8 or 16 bits? Can be set to `'auto'`. Note: LAS specification recommends 16 bits. |
| `options.onProgress`     | `function`         | -       | Callback when a new chunk of data is read. Only works on the main thread.                                      |
