# @loaders.gl/crypto: sources and credits

Brian Todd Button’s md5-wasm supplied the [MD5 implementation](./src/lib/algorithms/md5-wasm.ts) and adapter lineage: [MIT terms](./third-party-licenses/md5-wasm-LICENSE). The [base64 decoder](./src/lib/utils/base64-utils.ts) credits jsdom’s abab under BSD-3-Clause in its source comment. The exact historical abab revision and corresponding full license still need recovery; newer abab releases use different W3C terms and are not substituted here. The [CRC32 implementation](./src/lib/algorithms/crc32.ts) cites wqli78’s published gist as inspiration. vis.gl contributes the hash interfaces and integration. Platform crypto APIs and the algorithms they implement are distinct from loaders.gl code. crypto-js is a development comparison dependency, not a runtime dependency.

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
