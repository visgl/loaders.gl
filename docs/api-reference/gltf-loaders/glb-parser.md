## `GLBParser` class (@loaders.gl/gltf)

The `GLBLoader` module exposes the `GLBParser` class with the following methods


## Usage

```
import {GLTFParser} from '@loaders.gl/gltf';
```


## Methods

### constructor

Creates a new `GLBParser` instance.

### parse(arrayBuffer : ArrayBuffer) : Object

Parses an in-memory, GLB formatted `ArrayBuffer` into:

* `arrayBuffer` - just returns the input array buffer
* `binaryByteOffset` - offset to the first byte in the binary chunk
* `json` - a JavaScript "JSON" data structure with inlined binary data fields.
