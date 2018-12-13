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


### encodeAsMesh(attributes : Object) : ArrayBuffer

Encodes attributes as a DRACO mesh.


### encodeAsPointCloud(attributes: Object) : ArrayBuffer

Encodes attributes as a DRACO point cloud.
