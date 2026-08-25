# GLTFIterator

The `GLTFIterator` class traverses the original glTF JSON through lightweight typed wrappers. It resolves numeric references lazily without copying, linking, normalizing, or otherwise postprocessing the source document.

This makes it suitable for implementing glTF extensions that transform the standards-shaped JSON in place.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {GLTFIterator, GLTFLoader} from '@loaders.gl/gltf';

const gltf = await load(url, GLTFLoader);
const iterator = new GLTFIterator(gltf);

for (const mesh of iterator.meshes) {
  for (const primitive of mesh.primitives) {
    const positions = primitive.attributes.get('POSITION');
    const material = primitive.material;

    // The raw JSON remains available and mutable.
    primitive.data.mode = 4;
  }
}
```

## Wrapper identity

Every wrapper contains enough information to identify its source object:

- `gltf`: the original `GLTFWithBuffers` container;
- `type`: a stable tag such as `mesh`, `node`, `accessor`, or `primitive`;
- `index`: the top-level or parent-local array index;
- `data`: the exact raw JSON object; and
- `parent`: the containing wrapper for nested objects such as primitives and animation channels.

Wrappers are cached by raw object identity. Resolving the same mesh through `iterator.meshes` and `node.mesh`, for example, returns the same wrapper instance.

## Collections and references

Top-level collection getters mirror the standard glTF arrays and return `IterableIterator` objects. They include `accessors`, `animations`, `buffers`, `bufferViews`, `cameras`, `images`, `materials`, `meshes`, `nodes`, `samplers`, `scenes`, `skins`, and `textures`, plus draft glTF 2.1 `files` and `externalAssets`.

Reference getters use the corresponding glTF field name while the numeric source remains on `data`:

```typescript
const [node] = Array.from(iterator.nodes);

node.data.mesh; // numeric source index
node.mesh; // GLTFMeshIterator | undefined
```

An absent optional reference returns `undefined`. An invalid present reference throws when accessed and includes the source JSON path in its error message.

Loaded resource companions are exposed separately, such as `buffer.loadedBuffer`, `bufferView.loadedBufferView`, `image.loadedImage`, and `file.loadedFile`.

## Extension transformations

`data` deliberately remains mutable. `getExtension()`, `setExtension()`, and `removeExtension()` operate on individual wrappers, while the root iterator provides top-level extension declaration and payload helpers.

```typescript
for (const texture of iterator.textures) {
  const extension = texture.getExtension<{source: number}>('VENDOR_texture_format');
  if (extension) {
    texture.data.source = extension.source;
    texture.removeExtension('VENDOR_texture_format');
  }
}
iterator.removeExtension('VENDOR_texture_format');
```

## Comparison with other glTF APIs

- `GLTFIterator` is a lazy navigation and extension-authoring view over the original document.
- [`GLTFScenegraph`](./gltf-scenegraph) is the established access and builder utility and includes higher-level binary authoring methods.
- [`postProcessGLTF()`](./post-process-gltf) creates a modified representation with references replaced by linked objects and selected data normalized for application use.
