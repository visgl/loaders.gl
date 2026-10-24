# glTF accessor helpers

Read and replace accessor storage directly on `GLTFWithBuffers`, without changing numeric scene,
mesh, material, or texture references into linked objects.

```typescript
import {getGLTFAccessor, getGLTFAccessorValue, setGLTFAccessorValue} from '@loaders.gl/gltf';

const primitive = gltf.json.meshes[0].primitives[0];
const accessor = getGLTFAccessor(gltf, primitive.attributes.POSITION);
const positions = getGLTFAccessorValue(gltf, primitive.attributes.POSITION);
```

## `getGLTFAccessor(gltf, reference)`

Accepts a `GLTFAccessorReference` and returns its accessor definition. A reference is an index or
an inline accessor with optional decoder-provided typed `.value` storage. Inline accessors
support decoder-provided data such as Draco output. The definition is borrowed from the input.

## `getGLTFAccessorValue(gltf, reference)`

Returns a typed array matching the accessor component type. Packed, aligned dense storage is
borrowed. Interleaved, unaligned, padded matrix, and sparse accessors are materialized. An accessor
without a buffer view starts with zero values. Decoder-provided `.value` arrays are retained.
Sparse substitutions copy their base values and never mutate source buffers or decoder arrays.

Integer values remain in their stored representation, including normalized integers. Apply
normalization at the consumer boundary. The reader enforces the loaded buffer's borrowed byte range.
The same reader backs `GLTFIterator.getTypedArrayForAccessor()` and
`GLTFScenegraph.getTypedArrayForAccessor()`.

## `setGLTFAccessorValue(gltf, reference, value)`

Replaces an accessor's storage by appending a packed buffer and buffer view. Packed typed arrays are borrowed, including their byte offset and length. Matrix columns that
require four-byte alignment are copied into padded storage. The accessor's component type is updated;
its count and type must match the supplied value length. Numeric references remain valid, and other
accessors keep their original storage. Sparse and decoder overrides are cleared so subsequent reads
and writers see the replacement. Recalculate `min` and `max` when changing position bounds.

```typescript
const transformed = Float32Array.from(positions, value => Number(value) * 2);
setGLTFAccessorValue(gltf, primitive.attributes.POSITION, transformed);
accessor.min = [/* updated bounds */];
accessor.max = [/* updated bounds */];
```

The helpers do not synthesize IDs, insert material defaults, resolve texture references, or convert
primitive topology. Applications that need a linked rendering scene can explicitly postprocess it
at their rendering boundary.
