# @loaders.gl/documents: sources and credits

Isaac Z. Schlueter and sax-js contributors supplied the SAX parser, via Maxim Mazurok's sax-ts TypeScript fork. [sax.ts](./src/sax-ts/sax.ts) retains the full ISC license and upstream copyright.

vis.gl supplies the native XML object conversion, validation, loader API, output normalization and streaming integration. Local SAX adaptations preserve case in tolerant mode, support validated raw entity spelling, and harden attribute/entity handling. There is no third-party XML parser runtime dependency.

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

YAML and TOML parsing code is developed by vis.gl contributors against the YAML and TOML specifications. Format design is credited separately from parser implementation.

BSON and Markdown codecs are original loaders.gl contributions. MongoDB js-bson supplied historical BSON fixtures and the serializer used to generate independent wire-reference fixtures; no js-bson runtime code is included. Fixture provenance and notices are retained beside the data.
