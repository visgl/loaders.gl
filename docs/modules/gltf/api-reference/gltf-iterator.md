# GLTFIterator

The `GLTFIterator` class traverses the original glTF JSON objects directly. Numeric references remain in their standard glTF fields and are resolved lazily through `getReferences()`, without wrapping, copying, linking, normalizing, or otherwise postprocessing the source document.

This makes it suitable for implementing glTF extensions that transform the standards-shaped JSON in place.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {GLTFIterator, GLTFLoader} from '@loaders.gl/gltf';

const gltf = await load(url, GLTFLoader);
const iterator = new GLTFIterator(gltf);

for (const mesh of iterator.meshes) {
  for (const primitive of iterator.getReferences(mesh).primitives) {
    const {attributes, material} = iterator.getReferences(primitive);
    const positions = attributes.get('POSITION');

    // Iterated values are the exact mutable raw JSON objects.
    primitive.mode = 4;
  }
}
```

## Raw identity and metadata

Every collection and resolved reference returns the exact object stored in `gltf.json`. The iterator keeps traversal metadata separately; call `getMetadata(object)` when it is needed:

- `type`: a stable tag such as `mesh`, `node`, `accessor`, or `primitive`;
- `index`: the top-level or parent-local array index;
- `path`: the raw object's glTF path; and
- `parent`: the containing raw object for nested objects.

Metadata and reference facades are cached by raw object identity. References resolve only when their properties are accessed.

## Collections and references

Top-level collection getters mirror the standard glTF arrays and return `IterableIterator` objects. They include `accessors`, `animations`, `buffers`, `bufferViews`, `cameras`, `images`, `materials`, `meshes`, `nodes`, `samplers`, `scenes`, `skins`, and `textures`, plus draft glTF 2.1 `files` and `externalAssets`.

Reference navigation is explicit so raw glTF field meanings remain unchanged:

```typescript
const [node] = Array.from(iterator.nodes);

node.mesh; // numeric source index
iterator.getReferences(node).mesh; // exact raw GLTFMesh | undefined
```

An absent optional reference returns `undefined`. An invalid present reference throws when accessed and includes the source JSON path in its error message.

`GLTFIterator` requires a `GLTFWithBuffers` container so JSON indices can be mapped to resolved resources without guesswork. Loaded companions remain separate from the raw JSON and are available through `getLoadedBuffer()`, `getLoadedBufferView()`, `getLoadedImage()`, `getLoadedFile()`, and `getLoadedExternalAsset()`. For extensions that need decoded bytes, `iterator.getTypedArrayForBufferView(index)`, `iterator.getTypedArrayForAccessor(index)`, and `iterator.getTypedArrayForImageData(index)` provide typed views over those mapped resources.

## Extension transformations

Raw objects deliberately remain mutable. `getExtension(object, name)`, `setExtension(object, name, value)`, and `removeExtension(object, name)` operate on individual objects. Omitting the object operates on the root extension payload and declarations.

```typescript
for (const texture of iterator.textures) {
  const extension = iterator.getExtension<{source: number}>(texture, 'VENDOR_texture_format');
  if (extension) {
    texture.source = extension.source;
    iterator.removeExtension(texture, 'VENDOR_texture_format');
  }
}
iterator.removeExtension('VENDOR_texture_format');
```

## Comparison with other glTF APIs

- `GLTFIterator` is a lazy navigation and extension-authoring view over the original document.
- [`GLTFScenegraph`](./gltf-scenegraph) is the established access and builder utility and includes higher-level binary authoring methods.
- [`postProcessGLTF()`](./post-process-gltf) creates a modified representation with references replaced by linked objects and selected data normalized for application use.
