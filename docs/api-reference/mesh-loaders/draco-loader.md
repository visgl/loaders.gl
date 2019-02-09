# DracoLoader (@loaders.gl/draco)

Decodes a mesh or point cloud (maps of attributes) using [DRACO compression](https://google.github.io/draco/) compression.


## Usage

```
import {DracoLoader} from `@loaders.gl/draco';

new DracoLoader();
```


## Structure of Loaded Data

`DracoLoader` loads a single primitive geometry for a point cloud or mesh and the return data follows the conventions for those categories.


## Methods

### constructor

Creates a `DracoLoader` instance.


### decodeMesh(dracoMesh: ArrayBuffer) : Object

Decodes an encoded DRACO mesh into a map of attributes


### decodePointCloud(dracoPointCloud: ArrayBuffer) : Object

Decodes an encoded DRACO point cloud into a map of attributes
