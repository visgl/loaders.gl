# PLYLoader

The `PLYLoader` parses simple meshes in the Polygon File Format or the Stanford Triangle Format.

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.ply`                                        |
| File Type             | Binary/Text                                   |
| File Format           | [PLY](http://paulbourke.net/dataformats/ply/) |
| Data Format           | [Mesh](docs/specifications/category-mesh.md)  |
| Decoder Type          | Synchronous                                   |
| Worker Thread Support | Yes                                           |
| Streaming Support     | No                                            |

## Usage

```js
import {PLYLoader} from '@loaders.gl/ply';
import {load} from '@loaders.gl/core';

const data = await load(url, PLYLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
