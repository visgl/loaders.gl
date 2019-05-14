# GLTFScenegraph

The `GLTFScenegraph` class provides an API for accessing and modifying glTF data.

glTF files can contain complex scenegraphs with extensions and application defined data annotations.

To facilitiate working with the loaded data, the `GLTFScenegraph` class provides:

- A set of accessor methods to facilitate traversal the parsed glTF data.
- A `resolveScenegraphs` method that resolves the index based linking between objects into a hierarchical javascript structure.

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
const scenegraph = gltf.getScenegraph();
// Get specific glTF scenegraph
const scenegraph = gltf.getScenegraph(2);
```


## Methods

### constructor(gltf : Object)

Creates a new `GLTFScenegraph` instance from a pure JavaScript object.

### getApplicationData(key : String) : Object

Returns the given data field in the top-level glTF JSON object.

### getExtraData(key : String) : Object?

Returns a key in the top-level glTF `extras` JSON object.

### getExtension(name : String) : Object?

Returns the top-level extension by `name`, if present.

### getUsedExtensionNames() : String[]

Returns an array of extension names (covering all extensions used at any level of the glTF hierarchy).

### getRequiredExtensionNames() : String[]

Returns an array of extensions at any level of the glTF hierarchy that are required to properly display this file (covering all extensions used at any level of the glTF hierarchy).

### getScenegraph([index : Number]) : Object?

Returns the Scenegraph with the given index, or the default scenegraph if no index is specified.

### getImage(index : Number) : Object

Returns the image with specified index

### resolveScenegraphs() : Object

The `resolveScenegraphs` method resolves the index based linking between objects into a hierarchical javascript structure, making scenegraph traversal simpler.
