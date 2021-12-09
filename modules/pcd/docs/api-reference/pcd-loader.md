# PCDLoader

The `PCDLoader` loads point cloud in the Point Cloud Data (PCD) format.

| Loader                | Characteristic                                                                         |
| --------------------- | -------------------------------------------------------------------------------------- |
| File Extension        | `.pcd`                                                                                 |
| File Type             | Text/Binary                                                                            |
| File Format           | [Point Cloud Data](http://pointclouds.org/documentation/tutorials/pcd_file_format.php) |
| Data Format           | [PointCloud](docs/specifications/category-mesh.md)                                     |
| Decoder Type          | Synchronous                                                                            |
| Worker Thread Support | Yes                                                                                    |
| Streaming Support     | No                                                                                     |

Note: Currently supports for `ascii`, `binary` and compressed binary files. 

## Usage

```js
import {PCDLoader} from '@loaders.gl/pcd';
import {load} from '@loaders.gl/core';

const data = await load(url, PCSLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
