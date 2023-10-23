# Composite Loaders

loaders.gl enables loaders to call other loaders (referred to as "sub-loaders" in this section). 
This enables loaders for "composite formats" to be "composed" out of loaders for the primitive parts.

An example of sub-loaders can be seen in the `GLTFLoader`, which delegates:
- Draco mesh decoding to the `DracoLoader` 
- image decoding to the various `ImageLoaders` and the `BasisLoader`.

Naturally, composite loaders can call other composite loaders, which is for instance used by 
the `Tiles3DLoader` which uses the `GLTFLoader` to parse embedded glTF data in certain tiles.

## Calling loaders inside loaders

To call another loader from the parse function of your loader, use the appropriate `parse*WithContext()` function provided by `@loaders.gl/loader-utils`.
Make sure to supply in the `context` parameter .

A conceptual example of a 3D Tiles loader calling the `GLTFLoader` with some additional options.

```typescript
import {parseWithContext} from '@loaders.gl/loader-utils';

export async function parse3DTile(arrayBuffer, options, context) {
  const tile = {};
  // Extract embedded GLB (if present) into `tile.gltfArrayBuffer`
  ...
  if (tile.gltfArrayBuffer) {
    tile.gltf = await parseWithContext(tile.gltfArrayBuffer, GLTFLoader, {gltf: {...}}, context);
  }
}
```

:::caution
While loaders could import `@loaders.gl/core` and use the core `parse*()` functions to call sub-loaders, 
it is strongly discouraged for multiple reasons. 
Most importantly it prevents loaders.gl from properly handling certain use cases 
such as allowing worker-loaders to call other loaders. 
The `parse*WithContext()` functions exported by `@loaders.gl/loader-utils` are the right tool for the job.
:::

- 
## LoaderContext

When a loader is being called (i.e. one of its `parse*()` functions is being called), a `LoaderContext` object is supplied.
