# @loaders.gl/compression: sources and credits

Arjun Barrett's [fflate](https://github.com/101arrowz/fflate) 0.7.4 supplies retained DEFLATE/GZIP/ZLIB code: [full MIT license](./src/lib/fflate/LICENSE). Pierre Curto's LZ4 implementation is adapted in [lz4-compression.ts](./src/lib/lz4-compression.ts), including its full MIT notice.

Optional codec entry points use separately installed compress-utils, Brotli, fzstd, hysnappy, lz4js, pako, snappyjs and zstd-codec. Those implementations retain their own licenses. The package metadata identifies the supported dependency ranges; an adapter is not a claim to authorship of a codec.

Google’s [JavaScript Brotli decoder](./src/brotli/decode.ts) is also retained, with its 2017 Google copyright header: [MIT terms](./third-party-licenses/brotli-LICENSE). This is separate from optional externally installed Brotli codecs.

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
