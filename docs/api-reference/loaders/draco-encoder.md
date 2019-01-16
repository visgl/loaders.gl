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

Parameters:

* `opts` (Object)
  - `method` (String, optional) - set Draco's encoding method. Default `MESH_EDGEBREAKER_ENCODING`.
  - `speed` ([Number, Number], optional) - set Draco's speed options. Default `[5, 5]`.
  - `quantization` (Object, optional) - set Draco's attribute quantization. Default `{
POSITION: 10}`.
  - `log` (Function, optional) - callback for debug info.


### encodeMesh(attributes : Object) : ArrayBuffer

Encodes attributes as a DRACO mesh.


### encodePointCloud(attributes: Object) : ArrayBuffer

Encodes attributes as a DRACO point cloud.
