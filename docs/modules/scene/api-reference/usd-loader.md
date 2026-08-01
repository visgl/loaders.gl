# USDLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`USDLoader` parses [OpenUSD](/docs/modules/scene/formats/usd) scene descriptions into a typed stage
containing metadata and a hierarchy of prims.

| Property | Value |
| -------- | ----- |
| Extensions | `.usd`, `.usda`, `.usdz` |
| Input type | `ArrayBuffer` or USDA text |
| Output type | `USDStage` |
| Supported APIs | `load`, `parse` |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {USDLoader} from '@loaders.gl/scene';

const stage = await load('scene.usda', USDLoader);
```

The package root exports a metadata-only loader. Async core APIs preload the parser automatically.
Applications that need the parser-bearing object can import `USDLoaderWithParser` from
`@loaders.gl/scene/usd-loader`.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `usd.compose` | `boolean` | `true` | Composes references, variants, and overrides. |
| `usd.loadReferences` | `boolean` | `true` | Loads referenced layers during composition. |
| `usd.maxReferenceDepth` | `number` | `12` | Limits recursive composition depth. |
| `usd.variantSelections` | `Record<string, string>` | `{}` | Overrides authored variant selections. |

Relative references require a source URL from `load()` or `core.baseUrl` when parsing in-memory
content.

## Limitations

Binary USDC crate layers and compressed entries in USDZ archives are rejected with explicit errors.
