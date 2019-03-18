# PLYLoader (@loaders.gl/ply)

PLY is a computer file format known as the Polygon File Format or the Stanford Triangle Format. It was principally designed to store three-dimensional data from 3D scanners.

| Loader                | Characteristic                                                        |
| --------------------- | --------------------------------------------------------------------- |
| File Extension        | `.ply`                                                                |
| File Type             | Binary/Text                                                           |
| File Format           | [PLY format](<https://en.wikipedia.org/wiki/PLY_(file_format)>)       |
| Data Format           | [Standardized Mesh](docs/api-reference/mesh-loaders/category-mesh.md) |
| Encoder Type          | Synchronous                                                           |
| Worker Thread Support | Yes                                                                   |
| Streaming Support     | No                                                                    |

## Usage

```js
import {PLYLoader} from '@loaders.gl/ply';
import {loadFile} from '@loaders.gl/core';

const data = await loadFile(url, PLYLoader);
```

## Attribution/Credits

PLYLoader is a fork of the THREE.js PLYLoader under MIT License. The THREE.js source files contained the following attributions:

@author Wei Meng / http://about.me/menway
