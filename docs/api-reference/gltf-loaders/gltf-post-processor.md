# GLTFPostProcessor

The `GLTFPostProcessor` class transforms the GLTF JSON to make it easier to use.

## Usage

To post process just pass a gltf object to the `GLTFPostProcessor`
```js
const gltf = await parse(..., GLTFLoader);
const gltfPostProcessor = new GLTFPostProcessor();
const processedGLTF = new gltfPostProcessor.postProcesss(gltf);
````

After post-processing, the gltf scenegraphs are now easier to iterate over
```js
for (const node of scenegraph.nodes) { // no need to resolve indices
  if (node.mesh.primitives) { // Ditto
  	// ...
  }
}
```

## Methods

### constructor()

Creates a new `GLTFPostProcessor` instance.

### postProcess(gltf, options = {})

The GLTF post processor copies objects as necessary to avoid modifying the input JSON, but does not do a deep copy on sub-objects that do not need to be modified.


## General Post Processing

### Replace indices with references

The GLTF file format links nodes through indices. The `nodes` field in an object in the top-level glTF `scenegraph` array. is an array of indices into the top-level `nodes` array. Each node has a `mesh` attribute that is an index into to the `meshes` array, and so on.

Having to follow indices is inconvenient when working with the gltf data in JavaScript. So during post processing, indices will be replaced with references to the indexed objects, enabling applications to use simple iteration to follow the scenegraph.


### Adds `id` to every node

Unless already present.

## Node Specific Post Processing

### BufferViews

* Typed arrays (`Uint8Arrays`) will be created for buffer views and added to `bufferView.data` field. These typed arrays can be used to upload data to WebGL buffers.

### Accessors

The accessor parameters which are textual strings in glTF will be resolved into WebGL constants.

### Texture

Modifies
- `sampler` - will be resolved the the corresponding image object.
- `source` - will be resolved the the corresponding image object.

### Samplers

Modifies
- `parameters` - see table

Sampler parameters (which are textual in glTF) will be resolved into WebGL constants.

| glTF constant | WebGL constant |
| --- | --- |
| `magFilter` | `GL.TEXTURE_MAG_FILTER` |
| `minFilter` | `GL.TEXTURE_MIN_FILTER` |
| `wrapS` | `GL.TEXTURE_WRAP_S` |
| `wrapT` | `GL.TEXTURE_WRAP_T` |


### Materials

Adds:
- Since each texture object in the material has an `index` field next to other fields, the post processor will add a `texture` field instead of replacing the `index` field.
