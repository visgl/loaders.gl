Scene API / OpenUSD

# Load a composed stage, not just a bag of meshes.

USDLoader parses USDA, USD, and USDZ scene descriptions into a typed USDStage. References, variants, overrides, transforms, and prim relationships remain available for applications to inspect or hand to a renderer.

[Scene module](https://loaders.gl/next/docs/modules/scene.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene.md)[OpenUSD format](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md)[Scenegraph category](https://loaders.gl/next/docs/specifications/category-scenegraph.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-scenegraph.md)

Stage loading

## Keep composition decisions inspectable.

A USD scene can spread authored data across references, variants, and overrides. The loader composes the supported inputs into a stage while leaving the resulting hierarchy and metadata visible to application code.

01

Input

USD, USDA text, and uncompressed USDZ assets.

02

Compose

Resolve references, variants, and authored overrides.

03

Output

A typed USDStage with a hierarchy of prims.

04

Control

Bound reference depth and reference loading through options.

Detailed guide

## USDLoader reference

The detailed reference covers input formats, composition options, reference resolution, parser entry points, and current limitations.

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`USDLoader` parses [OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md) scene descriptions into a typed stage containing metadata and a hierarchy of prims.

| Property       | Value                      |
| -------------- | -------------------------- |
| Extensions     | `.usd`, `.usda`, `.usdz`   |
| Input type     | `ArrayBuffer` or USDA text |
| Output type    | `USDStage`                 |
| Supported APIs | `load`, `parse`            |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {USDLoader} from '@loaders.gl/scene';



const stage = await load('scene.usda', USDLoader);
```

The package root exports a metadata-only loader. Async core APIs preload the parser automatically. Applications that need the parser-bearing object can import `USDLoaderWithParser` from `@loaders.gl/scene/usd-loader`.

## Options[​](#options "Direct link to Options")

| Option                  | Type                     | Default | Description                                   |
| ----------------------- | ------------------------ | ------- | --------------------------------------------- |
| `usd.compose`           | `boolean`                | `true`  | Composes references, variants, and overrides. |
| `usd.loadReferences`    | `boolean`                | `true`  | Loads referenced layers during composition.   |
| `usd.maxReferenceDepth` | `number`                 | `12`    | Limits recursive composition depth.           |
| `usd.variantSelections` | `Record<string, string>` | `{}`    | Overrides authored variant selections.        |

Relative references require a source URL from `load()` or `core.baseUrl` when parsing in-memory content.

## Limitations[​](#limitations "Direct link to Limitations")

Binary USDC crate layers and compressed entries in USDZ archives are rejected with explicit errors.
