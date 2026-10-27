# @loaders.gl/images: sources and credits

Karl Cheng's [binary-gltf-utils](https://github.com/Qantas94Heavy/binary-gltf-utils) (MIT, Copyright (c) 2016-17 Karl Cheng) supplied the binary image inspection foundation in [binary-image-api.ts](./src/lib/category-api/binary-image-api.ts).

Sindre Sorhus and file-type contributors supplied adapted ISO BMFF detection in [parse-isobmff-binary.ts](./src/lib/category-api/parse-isobmff-binary.ts). See the retained source credits and [binary-gltf-utils MIT terms](./third-party-licenses/retained-MIT-LICENSE) and [file-type MIT terms](./third-party-licenses/file-type-LICENSE). Browser and Node image providers are separate implementations.

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
