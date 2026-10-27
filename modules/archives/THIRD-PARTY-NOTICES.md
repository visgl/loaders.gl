# @loaders.gl/archives: sources and credits

TAR construction adapts T. Jameson Little's [tar-js](https://github.com/beatgammit/tar-js) (MIT). The retained implementation is in [src/tar/lib](./src/tar/lib); full terms are in [tar-js-LICENSE](./third-party-licenses/tar-js-LICENSE).

ZIP readers, writers, indexed archives and filesystem adapters are developed by vis.gl contributors. Compression is supplied through `@loaders.gl/compression`. Earlier ZipLoader releases wrapped JSZip; the current package does not import JSZip.

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
