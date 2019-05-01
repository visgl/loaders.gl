# GLTF Loader Category

## Data format

A gltf scenegraph is described by a parsed JSON object (with top level arrays for `scenes`, `nodes` etc) together with a list of `ArrayBuffer`s representing binary blocks into which `bufferViews` and `images` in the JSON point).

At their core glTF and GLB loaders extract this information, however additional classes are provided to make processing of the returned data easier.

While the glTF "category" is obviously quite specific glTF, loaders for other scenegraph formats (e.g. COLLADA) could potentially also choose to "convert" the loaded data to this glTF format and thus enable interoperabiity with applications that are already designed to use the `GLTFLoader`.

## GLTFBuilder API

A glTF file can be built programmatically using the GLTFBuilder's "fluent API":

```js
const builder = new GLTFBuilder(...)
  .addApplicationData(...);
  .addExtras(...);
  .addExtension(...);
  .addRequiredExtension(...)
  .encodeAsGLB(...);
```

## Adding Custom Payloads to glTF files

glTF provides multiple mechanisms for adding custom data to a glTF conformant file. The application just needs to decide where to store it. Normally it should be added using one of the `addApplicationData`, `addExtras`, `addExtension` or `addRequiredExtension` methods.

## Binary Packing of Typed Arrays in JSON Data

The `GLTFLoader` and `GLTFBuilder` classes include support for moving (packing) typed arrays in the application JSON into the binary GLB chunk.

The packing process extracts binary (typed) arrays from the supplied `json` data structure, placing these in compact binary chunks (by calling the appropriate `add...` methods on the builder). The "stripped" JSON chunk will contain "JSON pointers" that the `GLTFParser` can later use to restore the JSON structure on load.

### Flattening Nested Numeric Arrays

As an option, standard JavaScript arrays can also be stored in the binary chunk under certain conditions. This feature supports arrays that contain only numbers. It also supports arrays that also contain nested arrays that only contain numbers.

The major complication when packing nested arrays is that the internal structure is lost. For instance, a coordinate array `[[1, 2, 0], [2, 1, 0]]` will be packed and unpacked as `[1, 2, 0, 2, 1, 0]`. To assist with recovering this information, the flattening process estimates the `size` of top-level elements and stored as a named field on the typed array.

## Using GLB as a "Binary Container" for Arbitrary Data

The GLB binary container format used by glTF addresses a general need to store a mix of JSON and binary data, and can potentially be used as a foundation for building custom loaders and writers.

To allow for this (and also to generally improve the glTF code structure), the `GLTFLoader` and `GLTFBuilder` classes are built on top of GLB focused classes (`GLBLoader` and `GLBBuilder`) that can be used independently of the bigger glTF classes.

## glTF Extension Support

Certain glTF extensions are fully or partially supported by the glTF classes. For details on which extensions are supported, see [glTF Extensions](docs/api-reference/gltf-loaders/gltf-extensions).

## Draco Mesh and Point Cloud Compression

Draco encoding and decoding is supported by the `GLTFBuilder` and `GLTFParser` classes but requires the DracoWriter and DracoLoader dependencies to be "injected" by the application.

```js
import {GLTFBuilder} from '@loaders.gl/gltf';
import {DracoWriter, DracoLoader} from '@loaders.gl/draco';

const gltfBuilder = new GLTFBuilder({DracoWriter, DracoLoader});
```
