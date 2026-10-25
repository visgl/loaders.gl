# @loaders.gl/pcd: sources and credits

Filipe Caixeta, Mugen87 and the three.js contributors supplied the PCDLoader implementation adapted in [parse-pcd.ts](./src/lib/parse-pcd.ts). vis.gl adapted the parser for loaders.gl outputs. [Full three.js MIT license](./third-party-licenses/three-LICENSE).

The separate [LZF decompressor](./src/lib/decompress-lzf.ts) credits taketwo’s three-pcd-loader (https://gitlab.com/taketwo/three-pcd-loader). Its historical revision and full accompanying notice are not recorded locally; do not infer those from the current three.js license.

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
