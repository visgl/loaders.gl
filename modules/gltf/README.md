# @loaders.gl/gltf

The module exports [Zod](https://zod.dev/) schemas for glTF 1.0, glTF 2.0, draft glTF 2.1,
all Khronos extension schema fragments, and the individual glTF 2.0 JSON objects:

```ts
import {
  GLTF1Schema,
  GLTF2Schema,
  GLTF21Schema,
  GLTFVersionSchema
} from '@loaders.gl/gltf/schema';

const gltf = GLTF2Schema.parse(json);
```

`GLTFSchema` remains the glTF 2.0-compatible export. Extension schemas are grouped by version,
registry status, extension name, and schema fragment because an extension may augment several
different glTF object types.

Standalone JSON Schemas are published per version for Monaco and other editor integrations.
`gltf.schema.json` remains the glTF 2.0 alias, while `gltf-all.schema.json` is an opt-in union:

```text
https://unpkg.com/@loaders.gl/gltf@5/gltf.schema.json
https://unpkg.com/@loaders.gl/gltf@5/gltf-1.schema.json
https://unpkg.com/@loaders.gl/gltf@5/gltf-2.schema.json
https://unpkg.com/@loaders.gl/gltf@5/gltf-2.1.schema.json
https://unpkg.com/@loaders.gl/gltf@5/gltf-all.schema.json
```

Every official extension fragment is addressable below
`schemas/extensions/<version>/<status>/<extension>/<fragment>.schema.json`. The glTF 2.1 schema
tracks Khronos's draft and may change before ratification.

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loader and writers for the glTF format.

For documentation please visit the [website](https://loaders.gl).
