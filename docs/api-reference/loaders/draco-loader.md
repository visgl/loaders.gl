# DracoLoader

Decodes a mesh or point cloud (maps of attributes) using [DRACO](https://google.github.io/draco/) compression.


## Methods

### constructor

Creates a `DracoLoader` instance.


### decodeMesh(dracoMesh: ArrayBuffer) : Object

Decodes an encoded DRACO mesh into a map of attributes


### decodePointCloud(dracoPointCloud: ArrayBuffer) : Object

Decodes an encoded DRACO point cloud into a map of attributes
