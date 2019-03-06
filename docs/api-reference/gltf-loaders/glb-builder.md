# GLBBuilder

The `GLBBuilder` class allows applications to use a "fluent" API to dynamically build up a hybrid JSON/binary GLB file. The `GLBBuilder` would normally be used if you want to save custom mixed JSON/binary data in a "GLB envelope".

References:
* For more information, see [glTF and GLB support](docs/) in the Developer's Guide.


## Usage

Adding binary data sub chunks to the GLB file, then calling encode to generate the complete `arrayBuffer`.

```js
import {GLBBuilder} from '@loaders.gl/gltf';
import {saveBinaryFile} from '@loaders.gl/core';

const gltfBuilder = new GLBBuilder();

const IMAGE_DATA = ...; // Image as ArrayBuffer
const imageIndex = gltfBuilder.addImage(IMAGE_DATA);

// Add custom JSON in top-level glTF object
gltfBuilder.addApplicationData('app-key', {...});

// All data added, we can encode
const arrayBuffer = gltfBuilder.encodeAsGLB();

// The encoded `ArrayBuffer` represents a complete binary representation of the data that can be written atomically to file
saveBinaryFile(filename, arrayBuffer);
```


## Methods

### constructor(options: Object)

Creates a new `GLBBuilder` instance.

* `options.DracoEncoder` - To enable DRACO encoding, the application needs to import and supply the `DracoEncoder` class.
* `options.DracoDecoder` - To enable DRACO encoding, the application needs to import and supply the `DracoDecoder` class.


### encodeAsGLB(options : Object) : ArrayBuffer

Combines your added JSON data structures () with any generated JavaScript and any binary subchunks, into a single GLB encoded `ArrayBuffer` that can be written directly to file.

Note: `encode()` is a one time operation. It should only be called once all data and binary buffers have been added to the builder.


### encodeAsGLBWithJSON(options : Object) : Object

A version of `encode` that returns the final arrayBuffer together with the generated JSON. Note that the returned `arrayBuffer` contains the JSON and is identical to the `encodeAsGLB`.


### addApplicationData(key : String, data : any [, packOptions: Object])

Stores the supplied `data` in the given top-level field given by `key`.

The data object will be encoded as JSON before being stored. By default, any typed arrays in the data object will be removed fromn the data payload and packed in the binary chunk.

* `packOptions.packTypedArrays` - Packs typed arrays into the binary chunk
* `packOptions.flattenArrays` - Flatten "nested" standard JavaScript arrays into typed arrays (and then pack them into the binary chunk).


### addBuffer(typedArray : TypedArray, accessor = {size: 3} : Object) : Number

Adds one binary array intended to be loaded back as a WebGL buffer.

* `typedArray` -
* `accessor` - {size, type, ...}.

Type is autodeduced from the type of the typed array.

The binary data will be added to the GLB BIN chunk, and glTF `bufferView` and `accessor` fields will be populated.


### addImage(typedArray: TypedArray) : Number

Adds a glTF image. The binary image data will be added to the GLB BIN chunk, and glTF `bufferView` and `image` fields will be populated.

