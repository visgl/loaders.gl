# @loaders.gl/xml: sources and credits

Isaac Z. Schlueter and sax-js contributors supplied the SAX parser, via Maxim Mazurok's sax-ts TypeScript fork. [sax.ts](./src/sax-ts/sax.ts) retains the full ISC license and upstream copyright.

Natural Intelligence and fast-xml-parser contributors supply the separately installed alternate XML parser. vis.gl supplies the loader API, output normalization and streaming integration.

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
