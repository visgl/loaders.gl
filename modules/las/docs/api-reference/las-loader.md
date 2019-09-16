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
import {LASLoader, LASWorkerLoader} from '@loaders.gl/las';
import {load} from '@loaders.gl/core';

// Decode on main thread
const data = await load(url, LASLoader, options);
// Decode on worker thread
const data = await load(url, LASWorkerLoader, options);
```

## Options

| Option       | Type     | Default | Description                                                               |
| ------------ | -------- | ------- | ------------------------------------------------------------------------- |
| `skip`       | Number   | `1`     | Read one from every _n_ points.                                           |
| `onProgress` | Function | -       | Callback when a new chunk of data is read. Only works on the main thread. |
