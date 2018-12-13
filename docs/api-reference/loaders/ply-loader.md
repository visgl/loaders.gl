# PLYLoader (@loaders.gl/ply)

PLY is a computer file format known as the Polygon File Format or the Stanford Triangle Format. It was principally designed to store three-dimensional data from 3D scanners.


References

* [PLY format (Wikipedia)](https://en.wikipedia.org/wiki/PLY_(file_format))


## Usage

```
import {PLYLoader} from '@loaders.gl/ply';
import {loadFile} from '@loaders.gl/core';

loadFile(url, PLYLoader).then(data => {
  // Application code here
  ...
});
```
