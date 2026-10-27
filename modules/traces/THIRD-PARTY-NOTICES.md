# @loaders.gl/traces: sources and credits

Trace parsers are developed by vis.gl contributors against Chrome Trace Event, Perfetto and related format definitions. Google and the Perfetto contributors publish the protobuf schemas and format documentation. Buf's separately installed protobuf runtime supplies decoding infrastructure; Apache Arrow and Zod supply tables and validation.

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
