# GLTFScenegraph

The `GLTFScenegraph` class provides an API for accessing and modifying glTF data.

> Caveat: Modification of existing binary data chunks has limitations, this class is not intended to be a generic utility for modifying existing glTF data.

## Usage

```js
import {GLTFLoader, GLTFScenegraph} from '@loaders.gl/gltf';
import {load} from '@loaders.gl/core';

// Load and parse a file
const gltfData = await parse(fetch(GLTF_URL), GLTFLoader);

// Create a parser
const gltf = new GLTFScenegraph(gltfData);

// Get the complete glTF JSON structure
const gltfJson = gltf.getJSON();

// Get specific top-level fields from the glTF JSON chunk
const appData = gltf.getApplicationData('customData');

// Get a top level extension from the glTF JSON chunk
const topLevelExtension = gltf.getExtension('ORGNAME_extensionName');
if (topLevelExtension) {
  ...
}

// Get images from the binary chunk (together with metadata)
const imageIndex = 0;
const image = gltf.getImage(imageIndex);

// Get default glTF scenegraph
const scenegraph = gltf.getScene();
// Get specific glTF scenegraph
const scenegraph = gltf.getScene(2);
```

## Accessor Methods

### constructor(gltf : Object)

Creates a new `GLTFScenegraph` instance from a pure JavaScript object.

#### json()

#### getApplicationData(key : String) : Object

Returns the given data field in the top-level glTF JSON object.

#### getExtraData(key : String) : Object?

Returns a key in the top-level glTF `extras` JSON object.

#### getExtension(name : String) : Object?

Returns the top-level extension by `name`, if present.

#### getUsedExtensions() : String[]

Returns an array of extension names (covering all extensions used at any level of the glTF hierarchy).

#### getRequiredExtensions() : String[]

Returns an array of extensions at any level of the glTF hierarchy that are required to properly display this file (covering all extensions used at any level of the glTF hierarchy).

#### getObjectExtension(object, extensionName)

#### getScene([index : Number]) : Object?

Returns the scene (scenegraph) with the given index, or the default scene if no index is specified.

#### getScene(index : Number) : Object

#### getNode(index : Number) : Object

#### getSkin(index : Number) : Object

#### getMesh(index : Number) : Object

#### getMaterial(index : Number) : Object

#### getAccessor(index : Number) : Object

#### getCamera(index : Number) : Object

#### getTexture(index : Number) : Object

#### getSampler(index : Number) : Object

#### getImage(index : Number) : Object

Returns the image with specified index

#### getBufferView(index : Number) : Object

#### getBuffer(index : Number) : Object

#### getTypedArrayForBufferView(bufferView : Number | Object) : Uint8Array

Accepts buffer view index or buffer view object

#### getTypedArrayForAccessor(accessor : Number | Object) : Uint8Array | Float32Array | ...

Accepts accessor index or accessor object.

Returns a typed array with type that matches the types

#### getTypedArrayForImageData(image : Number | Object) : Uint8Array

accepts accessor index or accessor object

## Modifiers

#### addApplicationData(key, data)

Add an extra application-defined key to the top-level data structure

#### addExtraData(key, data)

`extras` - Standard GLTF field for storing application specific data

Add to GLTF top level extension object, mark as used

##### addRequiredExtension(extensionName, data)

Add GLTF top level extension object, mark as used and required

#### registerUsedExtension(extensionName)

Add extensionName to list of used extensions

#### registerRequiredExtension(extensionName)

Add extensionName to list of required extensions

#### removeExtension(extensionName)

Removes an extension from the top-level list

#### setObjectExtension(object, extensionName, data)

#### addMesh(attributes, indices, mode = 4)

#### addPointCloud(attributes)

#### addBufferView(buffer)

Add one untyped source buffer, create a matching glTF `bufferView`, and return its index

> The binary data will not be added to the gltf buffer until `createBinChunk()` is called.

#### addAccessor(bufferViewIndex, accessor)

Adds an accessor to a bufferView

> The binary data will not be added to the gltf buffer until `createBinChunk()` is called.

#### addImage(imageData, mimeType)

Adds a binary image. Builds glTF "JSON metadata" and saves buffer reference
Buffer will be copied into BIN chunk during "pack"

> The binary data will not be added to the gltf buffer until `createBinChunk()` is called.

#### createBinChunk()

Packs any pending binary data into the first binary glTF buffer.

Note: Overwrites the existing first buffer if present.
