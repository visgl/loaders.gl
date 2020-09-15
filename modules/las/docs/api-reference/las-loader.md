# LASLoader

The `LASLoader` parses a point cloud in the LASER file format.

| Loader                | Characteristic                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| File Extension        | `.las`, `.laz`                                                                                                           |
| File Type             | Binary                                                                                                                   |
| File Format           | [LASER file format](https://www.asprs.org/divisions-committees/lidar-division/laser-las-file-format-exchange-activities) |
| Data Format           | [PointCloud](docs/specifications/category-mesh.md)                                                                       |
| Decoder Type          | Synchronous                                                                                                              |
| Worker Thread Support | Yes                                                                                                                      |
| Streaming Support     | No                                                                                                                       |

## Usage

```js
import {LASLoader} from '@loaders.gl/las';
import {load} from '@loaders.gl/core';

const data = await load(url, LASLoader, options);
```

## Options

| Option                   | Type             | Default | Description                                                                                                    |
| ------------------------ | ---------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `options.las.skip`       | Number           | `1`     | Read one from every _n_ points.                                                                                |
| `options.las.colorDepth` | Number or string | `8`     | Whether colors encoded using 8 or 16 bits? Can be set to `'auto'`. Note: LAS specification recommends 16 bits. |
| `options.onProgress`     | Function         | -       | Callback when a new chunk of data is read. Only works on the main thread.                                      |
