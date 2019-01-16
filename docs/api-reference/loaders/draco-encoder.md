# DracoEncoder (@loaders.gl/draco)

Encodes a mesh or point cloud (maps of attributes) using [DRACO](https://google.github.io/draco/) compression.


## Usage

```
import {DracoEncoder} from `@loaders.gl/draco';

new DracoEncoder();
```


## Methods

### constructor

Creates a `DracoEncoder` instance


### encodeMesh(attributes : Object) : ArrayBuffer

Encodes attributes as a DRACO mesh.


### encodePointCloud(attributes: Object) : ArrayBuffer

Encodes attributes as a DRACO point cloud.
