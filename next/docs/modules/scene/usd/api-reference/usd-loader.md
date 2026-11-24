<!-- -->

<!-- -->

Scene API / OpenUSD

# Load a composed stage, not just a bag of meshes.

USDLoader parses supported USDA, USDC, USD, and USDZ scene descriptions into a typed USDStage. References, variants, overrides, transforms, and prim relationships remain available for applications to inspect or hand to a renderer.

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

USDA text, the initial USDC crate subset, and stored USDZ assets.

02

Compose

ASCII references, variants, and overrides; binary support is narrower.

03

Output

A shared USDStage with prims and encoded USDZ asset bytes.

04

Control

Bound reference depth and reference loading through options.

Detailed guide

## USDLoader reference

The detailed reference covers input formats, composition options, reference resolution, parser entry points, and current limitations.

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`USDLoader` parses [OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md) scene descriptions into a typed stage containing metadata and a hierarchy of prims.

| Property       | Value                             |
| -------------- | --------------------------------- |
| Extensions     | `.usd`, `.usda`, `.usdc`, `.usdz` |
| Input type     | `ArrayBuffer` or USDA text        |
| Output type    | `USDStage`                        |
| Supported APIs | `load`, `parse`                   |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {USDLoader} from '@loaders.gl/scene/usd';



const stage = await load('scene.usda', USDLoader);
```

The format subpath exports a metadata-only loader. Async core APIs preload the parser automatically. Applications that need the parser-bearing object can import `USDLoaderWithParser` from `@loaders.gl/scene/usd`.

## Options[​](#options "Direct link to Options")

| Option                  | Type                     | Default | Description                                   |
| ----------------------- | ------------------------ | ------- | --------------------------------------------- |
| `usd.compose`           | `boolean`                | `true`  | Composes references, variants, and overrides. |
| `usd.loadReferences`    | `boolean`                | `true`  | Loads referenced layers during composition.   |
| `usd.maxReferenceDepth` | `number`                 | `12`    | Limits recursive composition depth.           |
| `usd.variantSelections` | `Record<string, string>` | `{}`    | Overrides authored variant selections.        |

Relative references require a source URL from `load()` or `core.baseUrl` when parsing in-memory content.

## Embedded USDZ assets[​](#embedded-usdz-assets "Direct link to Embedded USDZ assets")

For USDZ input, `stage.assets` contains every stored package file, including texture images, USD layers and files with unknown extensions. Standalone USD/USDA/USDC layers omit this property. Extraction also runs when `usd.compose` is `false`.

The collection is a plain data record keyed by resolved package URLs. Resolve an authored asset path relative to the attribute's `sourceUrl`, falling back to the owning prim's `sourceUrl` when needed. Attribute source URLs survive composition, even when one prim combines local attributes and attributes inherited from a layer in a different directory. `stage.url` identifies the input archive and is not the base URL for its embedded files.

```
import {load} from '@loaders.gl/core';

import {USDLoader} from '@loaders.gl/scene/usd';

import type {USDAssetPath} from '@loaders.gl/scene/usd';



const stage = await load('model.usdz', USDLoader);

// Find the shader prim using your application's scene traversal.

const shader = stage.rootPrims[0].children[0];

const attribute = shader.attributes['inputs:file'];

const texturePath = attribute?.value as USDAssetPath | undefined;

const sourceUrl = attribute?.sourceUrl || shader.sourceUrl;

const textureUrl = texturePath && sourceUrl

  ? new URL(texturePath.assetPath, sourceUrl).href

  : undefined;

const texture = textureUrl ? stage.assets?.[textureUrl] : undefined;

if (texture) {

  // Pass the original encoded bytes to an image decoder chosen by the application.

  console.log(texture.path, texture.mimeType, texture.data.byteLength);

}
```

Each `USDEmbeddedAsset` contains:

| Field      | Type               | Meaning                                                             |
| ---------- | ------------------ | ------------------------------------------------------------------- |
| `path`     | `string`           | Original archive-relative filename, including directories and case  |
| `data`     | `ArrayBuffer`      | Exact encoded file bytes, copied from the input archive             |
| `mimeType` | `string` or absent | Filename-based PNG/JPEG hint, not validation of the encoded content |

The returned files do not share the caller's input buffer. They do share storage with the loader's internal package lookup, so extraction does not make another copy of every file. Their lifetime is the lifetime of the returned stage or references retained by the application. No object URLs, image objects, GPU textures, color conversion or pixel decoding are created.

Missing asset paths have no entry; texture extraction never fetches them. Reference loading is controlled separately by `usd.loadReferences`. Unsupported image encodings are still available as bytes with no MIME hint. Invalid/truncated stored entries, encryption, duplicate names and ambiguous package URLs reject instead of returning misleading assets. This includes literal or percent-encoded dot segments and control/edge-whitespace names that URL parsing would normalize. Ordinary interior spaces and dots within filenames are preserved. The sum of copied stored bytes cannot exceed the input archive size.

## Limitations[​](#limitations "Direct link to Limitations")

The same loader returns USDStage for text and binary layers. Binary USDC support is the crate 0.8.0 subset introduced by [PR #4416](https://github.com/visgl/loaders.gl/pull/4416); use a version containing that change. See the [USDC encoding reference](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md#binary-usdc-reference) for supported values and limits. Binary references/payloads, variants, unsupported crate versions and encodings, and compressed entries in USDZ archives reject. The composition options above describe the existing ASCII behavior; they do not enable unsupported binary features.

## Shared output[​](#shared-output "Direct link to Shared output")

A stage contains format, optional url, metadata, rootPrims, layers and an optional USDZ assets collection. Each prim retains name, path, type, specifier, attributes, metadata, variants, and children. Attributes contain name, authored type, value, metadata and optional sourceUrl provenance. Supported USDC values use this same contract, including asset/path objects and authored time samples. No mesh construction or renderer object is implied by a prim type such as Mesh.
