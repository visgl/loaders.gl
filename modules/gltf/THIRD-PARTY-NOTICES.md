# @loaders.gl/gltf: sources and credits

Benjamin Wasty's [gltf-loader-ts](https://github.com/bwasty/gltf-loader-ts) supplied adapted schema types in [gltf-json-schema.ts](./src/lib/types/gltf-json-schema.ts): [full MIT license](./third-party-licenses/gltf-loader-ts-LICENSE).

Arseny Kapoulkine and meshoptimizer contributors supply the vendored meshopt decoder 1.3.0: [source/version/checksum](./src/libs/README.md) and [MIT license](./src/libs/meshoptimizer-LICENSE.md). Google Draco and Binomial Basis Universal are credited in their owning packages. Khronos and its contributors develop the glTF specification and extensions.

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
