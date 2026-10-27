# @loaders.gl/pointclouds: sources and credits

Uday Verma and Howard Butler's [plasio](https://github.com/verma/plasio) supplies the historical LAS/LAZ parser lineage; the [laz-perf parser](./src/las/lib/laz-perf/parse-las.ts) retains that reference. Plasio's MIT terms are reproduced in [plasio-LICENSE](./third-party-licenses/plasio-LICENSE).

LAZ decoding integrations use [laz-perf](https://github.com/hobuinc/laz-perf) and [laz-rs](https://github.com/laz-rs/laz-rs). Compatibility reconstruction follows LASzip by rapidlasso GmbH: [Apache-2.0 license](./src/las/lib/LASZIP-LICENSE) and [notice](./src/las/lib/LASZIP-NOTICE). Runtime/backend choices do not erase the original parser lineage. The embedded laz-rs-wasm 0.1.0 manifest credits Thomas Montaigu and Chris Lee; its exact build revision/full notice is not recorded. The legacy embedded laz-perf asset also has conflicting SPDX/comment license labels. These historical gaps are tracked in the [repository audit](https://github.com/visgl/loaders.gl/blob/master/dev-docs/attribution-audit.md); the npm backend’s current license is not used to infer the older binary’s terms.

The Plasio license text is copied from [upstream license commit 2a3856699c5416b8a609ad496f22e25f5cf60315](https://github.com/verma/plasio/blob/2a3856699c5416b8a609ad496f22e25f5cf60315/LICENSE). This identifies the license source, not an inferred parser fork revision.

Filipe Caixeta, Mugen87 and the three.js contributors supplied the PCDLoader implementation adapted in [parse-pcd.ts](./src/pcd/lib/parse-pcd.ts). vis.gl adapted the parser for loaders.gl outputs. [Full three.js MIT license](./third-party-licenses/three-LICENSE).

The separate [LZF decompressor](./src/pcd/lib/decompress-lzf.ts) credits taketwo’s three-pcd-loader (https://gitlab.com/taketwo/three-pcd-loader). Its historical revision and full accompanying notice are not recorded locally; do not infer those from the current three.js license.

Wei Meng and the three.js contributors supplied the PLYLoader foundation adapted in [parse-ply.ts](./src/ply/lib/parse-ply.ts) and [parse-ply-in-batches.ts](./src/ply/lib/parse-ply-in-batches.ts). vis.gl supplies the streaming/table integration. [Full three.js MIT license](./third-party-licenses/three-LICENSE).

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
