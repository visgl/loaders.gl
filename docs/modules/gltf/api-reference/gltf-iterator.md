# GLTFIterator

The `GLTFIterator` class traverses the original glTF JSON through lightweight typed JavaScript `Proxy` objects. Raw properties are available naturally, while numeric references resolve lazily without copying, linking, normalizing, or otherwise postprocessing the source document.

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

    // Ordinary raw JSON fields remain directly available and mutable.
    primitive.mode = 4;
  }
}
```

## Wrapper identity

Every Proxy exposes its navigation metadata under `_proxy` so that metadata does not collide with raw glTF fields such as an accessor's `type` or a texture info's `index`:

- `_proxy.gltf`: the original `GLTFWithBuffers` container;
- `_proxy.type`: a stable tag such as `mesh`, `node`, `accessor`, or `primitive`;
- `_proxy.index`: the top-level or parent-local array index;
- `_proxy.raw`: the exact raw JSON object;
- `_proxy.path`: the raw object's glTF path; and
- `_proxy.parent`: the containing Proxy for nested objects such as primitives and animation channels.

`_proxy` refers specifically to the JavaScript `Proxy` control surface. It is not enumerable and is omitted from JSON serialization. Proxies are cached by raw object identity. Resolving the same mesh through `iterator.meshes` and `node.mesh`, for example, returns the same Proxy instance.

## Collections and references

Top-level collection getters mirror the standard glTF arrays and return `IterableIterator` objects. They include `accessors`, `animations`, `buffers`, `bufferViews`, `cameras`, `images`, `materials`, `meshes`, `nodes`, `samplers`, `scenes`, `skins`, and `textures`, plus draft glTF 2.1 `files` and `externalAssets`.

Reference getters use the corresponding glTF field name while the numeric source remains on `_proxy.raw`:

```typescript
const [node] = Array.from(iterator.nodes);

node._proxy.raw.mesh; // numeric source index
node.mesh; // GLTFMeshIterator | undefined
```

An absent optional reference returns `undefined`. An invalid present reference throws when accessed and includes the source JSON path in its error message.

Loaded resource companions are exposed separately, such as `buffer.loadedBuffer`, `bufferView.loadedBufferView`, `image.loadedImage`, and `file.loadedFile`.

## Extension transformations

Ordinary non-reference assignments are forwarded to the raw object. Reference assignment is deliberately explicit through `_proxy.raw`, avoiding ambiguity between assigning a numeric glTF index and assigning another Proxy. `_proxy.getExtension()`, `_proxy.setExtension()`, and `_proxy.removeExtension()` operate on individual objects, while the root iterator provides top-level extension declaration and payload helpers.

```typescript
for (const texture of iterator.textures) {
  const extension = texture._proxy.getExtension<{source: number}>('VENDOR_texture_format');
  if (extension) {
    texture._proxy.raw.source = extension.source;
    texture._proxy.removeExtension('VENDOR_texture_format');
  }
}
iterator.removeExtension('VENDOR_texture_format');
```

## Comparison with other glTF APIs

- `GLTFIterator` is a lazy navigation and extension-authoring view over the original document.
- [`GLTFScenegraph`](./gltf-scenegraph) is the established access and builder utility and includes higher-level binary authoring methods.
- [`postProcessGLTF()`](./post-process-gltf) creates a modified representation with references replaced by linked objects and selected data normalized for application use.
