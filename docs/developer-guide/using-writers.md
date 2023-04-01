# Using Writers

Writers allow applications to encoded data for a number of the formats supported by loaders.gl.

For a detailed specification of the writer object format see the [API reference](docs/specifications/writer-object-format).

> Writers and the `encode` functions are available for use, however they are considered experimental.
Writer support is still in development, and have issues. Also not all formats have writers.

## Usage

As an example, to Draco-compress a mesh using the `DracoWriter`:

```typescript
import {DracoWriter} from '@loaders.gl/draco';
import {encode} from '@loaders.gl/core';

const mesh = {
  attributes: {
    POSITION: {...}
  }
};

const data = await encode(mesh, DracoWriter, options);
```

## Input Data

_Writers_ accept the same format of data that is produced by the corresponding loaders. This format is documented either in each loader or usually as part of the documentation for that loader category.

If applications have data in a different format, they will need to first transform the data to the format expected by the _writer_.
