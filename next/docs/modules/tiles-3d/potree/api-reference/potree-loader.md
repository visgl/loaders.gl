Potree loader

# Connect a Potree hierarchy to a point-cloud pipeline.

`PotreeLoader` is the entry point for Potree point-cloud assets. The format is still evolving in loaders.gl, so this page makes the current support boundary explicit before the detailed reference.

[Potree module](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

The Potree path

## Discover the hierarchy first. Stream point data as support grows.

Potree assets separate metadata and hierarchy from point payloads. Keep traversal and rendering concerns in the source or layer while the loader owns format decoding.

01

Input

Potree metadata and point-cloud resources

02

Discover

Hierarchy, bounds, spacing, and attributes

03

Decode

Point records as support is implemented

04

Status

Work in progress; verify current coverage

![From-v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

[Try It](https://loaders.gl/next/examples/pointclouds/potree-source)[Overview](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/potree/formats/potree.md)[PotreeLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-loader.md)[PotreeSourceLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)

Detailed guide

## Current Potree support

The reference below records the current implementation boundary and will expand as hierarchy traversal and point decoding mature.

Work in progress

## Metadata versions[​](#metadata-versions "Direct link to Metadata versions")

`PotreeLoader` parses both legacy `cloud.js` declarations (1.0–1.8) and modern `metadata.json` declarations (2.0), selecting the validator from the declared dataset version. It returns `PotreeDatasetMetadata`; inspect `version` before accessing layout-specific fields. The package root is metadata-only. Async core parsing preloads the implementation; synchronous parsing uses `PotreeLoaderWithParser` from `@loaders.gl/tiles-3d/potree/potree-loader`.

Use [PotreeSourceLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md) for hierarchy traversal and decoded point tiles.
