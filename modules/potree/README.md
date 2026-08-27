# @loaders.gl/potree

This module contains loaders for the [potree](https://github.com/potree/potree) format.

`PotreeNodesSource.scan()` executes portable point-cloud queries with hierarchy bounds and
level-of-detail pruning, residual predicates, projection, global limits, cancellation, and bounded
Arrow batches. Potree attributes including positions, colors, intensity, classification, and
encoded normals are available to the scan schema when present in the source metadata.

`PotreeMetadataSchema` is available from the `@loaders.gl/potree/potree-metadata-schema` subpath for runtime validation. The package root exports the corresponding `PotreeMetadata` TypeScript type without loading Zod. The equivalent generated JSON Schema is available from `@loaders.gl/potree/potree-metadata.schema.json`.

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial loaders (parsers).

For documentation please visit the [website](https://loaders.gl).
