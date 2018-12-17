# `GLTFBuilder` class (@loaders.gl/gltf)

The `GLTFBuilder` class allows applications to dynamically build up a hybrid JSON/binary GLB file.

The `GLTFBuilder` would normally be used if you want to save custom mixed JSON/binary data in a "GLB envelope".

The `GLTFBuilder` class supports the `GLTFWriter` class.


## Usage

Adding binary data sub chunks to the GLB file, then calling encode to generate the complete `arrayBuffer`.

```js
import {GLTFBuilder} from '@loaders.gl/gltf';
import {saveBinaryFile} from '@loaders.gl/core';

const gltfBuilder = new GLTFBuilder();

const imageIndex = gltfBuilder.addImage();

// Add custom JSON in glTF extras field
gltfBuilder.addExtras({...});

// Add custom JSON in glTF extension object
gltfBuilder.addExtension('ORGNAME_extension_1', {...});

// JSON can be "packed", extracting binary data and replacing it with tokens.
const packedJSON = packJSON(gltfBuilder, json);

// Don't forget to add the packed JSON, it needs to be stored somewhere
gltfBuilder.addRequiredExtension('ORGNAME_extension_2', packedJSON);

// All data added, we can encode
const arrayBuffer = gltfBuilder.encode();

// The encoded `ArrayBuffer` represents a complete image of the data
saveBinaryFile(filename, arrayBuffer);
```


## Methods

### constructor

Creates a new `GLTFBuilder` instance.


### encodeAsGLB(options : Object) : ArrayBuffer

Combines your added JSON data structures (in extras, extensions etc) with any generated JavaScript and any binary subchunks, into a single GLB encoded `ArrayBuffer` that can be written directly to file.

Note: `encode()` is a one time operation. It should only be called once all data and binary buffers have been added to the builder.


### encodeAsGLBWithJSON(options : Object) : Object

A version of `encode` that returns the final arrayBuffer together with the generated JSON. Note that the returned `arrayBuffer` contains the JSON and is identical to the `encodeAsGLB`.


### packJSON(json : any [, options : Object]) : any

Extracting binary fields from the supplied `json` data structure, placing these in compact binary chunks by calling the appropriate `add...` methods on the builder. The "stripped" JSON chunk will contain "JSON pointers" that the parser can use to restore the JSON structure on load.

Note: While the extracted binary data IS added to the `GLTFBuilder` instance, the returned JSON chunk IS NOT automatically added, since the application needs to decide where to store it. Normally it should be added using one of the `addExtras`, `addExtension` or `addRequiredExtension` methods.


### addApplicationData(key : String, data : any)

Stores the supplied `data` in the given top-level field given by `key`.


### addExtras(extras : Object)

Populates (merges into) the top-level glTF `extras` field, which the glTF specification reserves for application specific data.


### addExtension(extensionName : String, extension :)

Adds a top-level glTF extension object, and marks it as used.


### addRequiredExtension(extensionName : String, extension : any)

Adds a top-level glTF extension object, and marks it as used and required.

Note: If possible, use `addExtension` instead of `addRequiredExtension`. It is recommended to avoid using required extensions if possible, as they can reduce the ability to use glTF tools on the resulting file.


### isImage(imageData)

Returns `true` if the binary data represents a well-known binary image format.

Note: This is a utility that is provided to make it easier for decoders to choose whether a binary chunk of data should be stored as an "image" or a "buffer".


### addBuffer(typedArray : TypedArray, accessor = {size: 3} : Object) : Number

Adds one binary array intended to be loaded back as a WebGL buffer.

* `typedArray` -
* `accessor` - {size, type, ...}.

Type is autodeduced from the type of the typed array.

The binary data will be added to the GLB BIN chunk, and glTF `bufferView` and `accessor` fields will be populated.


### addImage(typedArray: TypedArray) : Number

Adds a glTF image. The binary image data will be added to the GLB BIN chunk, and glTF `bufferView` and `image` fields will be populated.


### addMesh(attributes: Object [, indices : TypedArray [, mode = 4 : Number ]]) : Number

Adds a glTF mesh. The glTF Mesh will contain one primitive with the supplied attributes.


### addCompressedMesh(attributes: Object [, indices : TypedArray [, mode = 4 : Number ]]) : Number

Adds a glTF mesh. The glTF Mesh will contain one primitive with the supplied attributes, compressed using DRACO compression.


### addPointCloud(attributes: Object) : Number

Adds a glTF mesh. The glTF Mesh will contain one primitive with the supplied attributes, representing a point cloud (no `indices`, mode will default to `0` etc).


### addCompressedPointCloud(attributes: Object) : Number

Adds a glTF mesh. The glTF Mesh will contain one primitive with the supplied attributes, representing a point cloud (no `indices`, mode will default to `0` etc). The point cloud will be compressed using DRACO compression.
