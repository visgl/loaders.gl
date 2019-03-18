# LASLoader (@loaders.gl/las)

The LASER (LAS) file format is a public format for the interchange of 3-dimensional point cloud data data, developed for LIDAR mapping purposes.

| Loader                | Characteristic                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| File Extension        | `.las`                                                                                                                   | `.laz` |
| File Type             | Binary                                                                                                                   |
| File Format           | [LASER FILE FORMAT](https://www.asprs.org/divisions-committees/lidar-division/laser-las-file-format-exchange-activities) |
| Data Format           | [Standardized Mesh](docs/api-reference/mesh-loaders/category-mesh.md)                                                    |
| Encoder Type          | Synchronous                                                                                                              |
| Worker Thread Support | Yes                                                                                                                      |
| Streaming Support     | No                                                                                                                       |

Note: LAZ is the compressed version of LAS

## Usage

```js
import {LASLoader} from '@loaders.gl/las';
import {loadFile} from '@loaders.gl/core';

const data = await loadFile(url, LASLoader, options);
```

## Options

- `skip`=`1` (Number) - Read one from every _n_ points. Default `1`.
- `onProgress`= (Number) - Callback when a new chunk of data is read.

## Attribution/Credits

LASLoader is a fork of Uday Verma and Howard Butler's [plasio](https://github.com/verma/plasio/) under MIT License.
