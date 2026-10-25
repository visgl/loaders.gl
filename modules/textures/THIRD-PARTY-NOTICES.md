# @loaders.gl/textures: sources and credits

Tarek Sherif's PicoGL utilities supplied the compressed-texture parser foundation; [parse-pvr.ts](./src/lib/parsers/parse-pvr.ts) retains the 2017 credit. [Full MIT terms](./third-party-licenses/picogl-LICENSE).

Binomial and Basis Universal contributors supply the vendored encoder and transcoder: [pinned commit, artifacts and hashes](./src/libs/README.md), [Apache-2.0 license](./src/libs/BASIS-LICENSE), [notice](./src/libs/BASIS-NOTICE). The historical [crunch.js](./src/libs/crunch.js) asset carries a Zlib SPDX identifier, but its exact source revision and full accompanying notice have not been recovered. This provenance gap is tracked in the repository attribution audit; do not infer its terms from a newer Crunch fork.

Tim van Scherpenzeel's texture-compressor is an application-installed tool used by CompressedTextureWriter, not a dependency bundled by this package. Khronos develops the KTX/KTX2 formats.

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
