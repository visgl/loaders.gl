# PCDLoader

A point cloud format defined by the [Point Cloud Library](https://en.wikipedia.org/wiki/Point_Cloud_Library).

| Loader                | Characteristic                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------- |
| File Extension        | `.pcd`                                                                                    |
| File Type             | Text/Binary                                                                               |
| File Format           | [Point Cloud Library](http://pointclouds.org/documentation/tutorials/pcd_file_format.php) |
| Data Format           | [Standardized Mesh](docs/api-reference/mesh-loaders/category-mesh.md)                     |
| Encoder Type          | Synchronous                                                                               |
| Worker Thread Support | Yes                                                                                       |
| Streaming Support     | No                                                                                        |

Note: Currently only `ascii` and `binary` subformats are supported. Compressed binary files are currently not supported.

## Usage

```js
import {PCDLoader} from '@loaders.gl/pcd';
import {load} from '@loaders.gl/core';

const {header, attributes} = await load(url, PCDLoader);
// Application code here, e.g:
// return new Geometry(attributes)
```

Loads `position`, `normal`, `color` attributes.

## Attribution/Credits

PCDLoader loader is a fork of the THREE.js PCDLoader under MIT License. The THREE.js source files contained the following attributions:

- @author Filipe Caixeta / http://filipecaixeta.com.br
- @author Mugen87 / https://github.com/Mugen87
