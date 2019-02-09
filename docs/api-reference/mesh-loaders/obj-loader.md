# OBJLoader (@loaders.gl/obj)

This loader handles the OBJ half of the classic Wavefront OBJ/MTL format. The OBJ format is a simple ASCII format that lists vertices, normals and faces on successive lines.

References

* [Wavefront OBJ file (Wikipedia)](https://en.wikipedia.org/wiki/Wavefront_.obj_file)


## Usage

```
import {OBJLoader} from '@loaders.gl/obj';
import {loadFile} from '@loaders.gl/core';

loadFile(url, OBJLoader).then(data => {
  // Application code here
  ...
});
```


## Loader Options

N/A


## Data Loaded

* `positions` -
* `normals` -
* `faces` -

