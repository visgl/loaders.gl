# @loaders.gl/draco: sources and credits

Google's [Draco](https://github.com/google/draco) supplies encoding and decoding, including adapted Web IDL types. The vendored assets are pinned to 1.5.7 with upstream URLs and SHA-256 hashes in [src/libs/README.md](./src/libs/README.md).

Retain the [Apache-2.0 license](./src/libs/DRACO-LICENSE) with the runtime and generated worker distributions. vis.gl supplies the loader/writer integration.

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
