# @loaders.gl/tiles-3d: sources and credits

Copyright 2011-2018 CesiumJS Contributors. CesiumJS supplied adapted tileset traversal, bounding-volume and collection utilities. Retained source headers identify the ports in [src/utils](./src/utils) and [tileset helpers](./src/tileset-3d/helpers); [Apache-2.0 terms](./third-party-licenses/Apache-2.0). The 3D Tiles integration was developed in collaboration with the Cesium engineering team.

Markus Schütz's Potree supplies point-cloud loader lineage: [retained BSD-2-Clause and Plasio notices](./potree/LICENSE). Connor Manning's copc.js informed the original COPC module; the current primary reader is implemented in loaders.gl and has no copc runtime dependency.

Esri publishes I3S and LEPCC specifications and reference code, and funded and contributed the tile-converter development effort. I3S integration and conversion code are developed by loaders.gl contributors. math.gl supplies separately installed spatial algorithms.

## Scope and maintenance

Original loaders.gl contributions are covered by [LICENSE](./LICENSE). The upstream
notices above apply to their respective portions and do not change those terms.
Source adaptations, separately installed libraries, format definitions and test
data are different contributions. This index is not a transitive dependency
bill of materials. Runtime dependencies can bring additional notices.

Version information is recorded where the repository preserves it. Unpinned
historical ports are identified by retained source and Git history; no upstream
version is inferred from a current dependency. Keep copyright headers, full
terms, source/version information and material modification notes when updating.
Retain this file and the applicable licenses when redistributing bundles or workers.
