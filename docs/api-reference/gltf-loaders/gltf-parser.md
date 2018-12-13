## `GLTFParser` class (@loaders.gl/gltf)

the `GLTFParser` class parses GLB-encoded glTF files. glTF files can contain complex scenegraphs with extensions and application defined data annotations.

To facilitiate working with the loaded data, the `GLTFParser` class provides:

* A set of accessor methods to facilitate traversal the parsed glTF data.
* A `resolveScenegraphs` method that resolves the index based linking between objects into a hierarchical javascript structure.


## Usage

```
import {GLTFParser} from '@loaders.gl/gltf';

const gltfWalker = new GLTFParse();
gltfWalker.parse(...);
gltfWalker.resolveScenegraphs();

const myExtension = gltfWalker.getExtension('ORGNAME_extensionName');
if (myExtension) {
  ...
}

const scenegraph = gltfWalker.getScenegraph();
```


## Structure of Loaded Data

The structure of the parsed data is as described in the glTF specification, with binary buffers and images resolved into typed arrays.

Calling the `resolveScenegraphs` method adds a hierarchical structure that makes the scenegraph easier to traverse. After the call, each parent object in the scenegraph will contain an array of child objects, instead of a list of child indices.


## Methods

### constructor

Creates a new `GLTFParser` instance.


### parse(arrayBuffer : ArrayBuffer) : Object

Parses an in-memory, glTF/GLB formatted `ArrayBuffer` a JSON tree with binary typed arrays and image nodes.

Once the `parse()` method has successfully completed the accessors in this class can be used.


### resolveScenegraphs() : Object

The `resolveScenegraphs` method resolves the index based linking between objects into a hierarchical javascript structure, making the scenegraphs 


### getUserData(key : String) : Object

Returns a top-level data field.


### getExtras() : Object?

Returns the top-level extras object


### getExtension() : Object?

Returns a top-level extension, if present.


### getUsedExtensions() : String[]

Returns an array of extensions used at any level of the glTF hierarchy.


### getRequiredExtensions() : String[]

Returns an array of extensions at any level of the glTF hierarchy that are required to properly display this file.


### getScenegraph([index : Number]) : Object?

Returns the Scenegraph with the given index, or the default scenegraph if no index is specified.


### getImage(index : Number) : Object

Returns the image with specified index
