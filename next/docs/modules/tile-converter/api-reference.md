# @loaders.gl/tile-converter

Use the tile-converter APIs to make dataset conversion part of a JavaScript application or processing pipeline. For command-line workflows, installation, and build instructions, see the [Tile Converter application](https://loaders.gl/next/docs/modules/tile-converter.md).

## Package API[​](#package-api "Direct link to Package API")

The package root exports the portable v5 API. Existing `/v5` imports remain aliases.

```
import {inspectTileset, convertTileset, validateTileset} from '@loaders.gl/tile-converter';
```

The [v5 conversion reference](https://loaders.gl/next/docs/modules/tile-converter/api-reference/v5-conversion.md) shows how to supply a conversion source, codec, and output sink. Use `@loaders.gl/tile-converter/v5/node` for the Node.js adapters.

## Experimental v5 APIs[​](#experimental-v5-apis "Direct link to Experimental v5 APIs")

The [v5 conversion reference](https://loaders.gl/next/docs/modules/tile-converter/api-reference/v5-conversion.md) documents the portable conversion core and its format adapters. Use `@loaders.gl/tile-converter/v5/core` for inspection, conversion, validation, and the shared contracts; use `@loaders.gl/tile-converter/v5/adapters` for format-specific integration.

See each API's reference for supported inputs, runtime requirements, options, and current limitations.
