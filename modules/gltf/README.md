# @loaders.gl/gltf

The module exports `GLTFSchema` and schemas for the individual glTF JSON objects. These are
[Zod](https://zod.dev/) schemas and can be used to validate a parsed document:

```ts
import {GLTFSchema} from '@loaders.gl/gltf';

const gltf = GLTFSchema.parse(json);
```

The same schema is published as JSON Schema at the `gltf.schema.json` package subpath. This can
be referenced by editors and other browser tools without bundling the JavaScript module:

```text
https://unpkg.com/@loaders.gl/gltf@5/gltf.schema.json
```

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loader and writers for the glTF format.

For documentation please visit the [website](https://loaders.gl).
