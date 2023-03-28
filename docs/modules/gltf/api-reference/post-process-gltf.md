# postProcessGLTF

The `postProcessGLTF` function transforms parsed GLTF JSON to make it easier to use.

- It adds loaded buffers and images to the glTF JSON objects
- It creates typed arrays for buffer views

## Usage

Postprocessing is done by default by the `GLTFLoader`:

```js
import {GLTFLoader} from '@loaders.gl/gltf';
const processedGLTF = await parse(..., GLTFLoader,);
```

To turn post processing off, and then optionally post process via `postProcessGLTF` function:

```js
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
const gltf = await parse(..., GLTFLoader, {gltf: {postProcess: false}});
const processedGLTF = postProcessGLTF(gltf);
```

After post-processing, the gltf scenegraphs are now easier to iterate over as indices have been resolved to object references:

```js
const scenegraph = processedGLTF.scenegraphs[0];
for (const node of scenegraph.nodes) {
  // no need to resolve indices
  if (node.mesh.primitives) {
    // Ditto
    // ...
  }
}
```

## Functions

### postProcessGLTF(gltf : Object, options? : Object) : Object

- `gltf` is expected to have `json` and `buffers` fields per the GLTF Data Format Category.
- `options.uri` - Set base URI (for image loading)

The GLTF post processor copies objects in the input gltf json field as necessary to avoid modifying the input JSON, but does not do a deep copy on sub-objects that do not need to be modified.

## General Post Processing

### Replace indices with references

The first thing that `postProcessGLTF` does is replace glTF indices with object references to simplify iteration over the scenegraph.

Background: The GLTF file format describes a tree structure, however it links nodes through numeric indices rather than direct references. (As an example the `nodes` field in the top-level glTF `scenegraph` array is an array of indices into the top-level `nodes` array. Each node has a `mesh` attribute that is an index into to the `meshes` array, and so on).

### Adds `id` to every node

The postprocessor makes sure each node and an `id` value, unless already present.

## Node Specific Post Processing

### Buffers

The following fields will be populated from the supplied `gltf.buffers` parameter (this parameter is populated by the loader via `options.loadLinkedResources: true`):

- `buffer.arrayBuffer` -
- `buffer.byteOffset` -
- `buffer.byteLength` -

### BufferViews

- `bufferView.data` - Typed arrays (`Uint8Arrays`) will be created for buffer views and stored in this field. These typed arrays can be used to upload data to WebGL buffers.

### Accessors

The accessor parameters which are textual strings in glTF will be resolved into WebGL constants (which are just numbers, e.g. `5126` = `GL.FLOAT`), to prepare for use with WebGL frameworks.

- `accessor.value` - This will be set to a typed array that is a view into the underlying bufferView.

Remarks:

- While it can be very convenient to initialize WebGL buffers from `accessor.value`, this approach will defeat any memory sharing on the GPU that the glTF file specifies through accessors sharing `bufferViews`. The canonical way of instantitating a glTF model is for an application to create one WebGL buffer for each `bufferView` and then use accessors to reference data chunks inside those WebGL buffers with `offset` and `stride`.

## Images

- `image.image` - Populated from the supplied `gltf.images` array. This array is populated by the `GLTFLoader` via `options.loadImages: true`):
- `image.uri` - If loaded image in the `images` array is not available, uses `gltf.baseUri` or `options.baseUri` is available, to resolve a relative URI and replaces this value.

### Materials

- `...texture` - Since each texture object in the material has an `...index` field next to other fields, the post processor will add a `...texture` field instead of replacing the `...index` field.

### Samplers

Modifies

- `parameters` - see table

Sampler parameters (which are textual in glTF) will be resolved into WebGL constants.

| glTF constant | WebGL constant          |
| ------------- | ----------------------- |
| `magFilter`   | `GL.TEXTURE_MAG_FILTER` |
| `minFilter`   | `GL.TEXTURE_MIN_FILTER` |
| `wrapS`       | `GL.TEXTURE_WRAP_S`     |
| `wrapT`       | `GL.TEXTURE_WRAP_T`     |

### Texture

Modifies

- `sampler` - will be resolved the the corresponding image object.
- `source` - will be resolved the the corresponding image object.
