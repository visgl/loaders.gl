# @loaders.gl/tables: sources and credits

Matthew Holt's [PapaParse](https://github.com/mholt/PapaParse) 5.0.0-beta.0 supplies the adapted [CSV parser](./src/csv/papaparse): [MIT license](./third-party-licenses/papaparse-LICENSE).

Nuno Job and Isaac Z. Schlueter's Clarinet supplies streaming JSON parsing: [BSD notice and full terms](./src/json/lib/clarinet/LICENSE).

ironSource's parquetjs and the parquets fork supply the retained [Parquet implementation](./src/parquet/parquetjs): [MIT license](./src/parquet/parquetjs/LICENSE). Hyperparam contributors' hyparquet supplies adapted delta decoders: [source](./src/parquet/parquetjs/codecs/delta.ts), [MIT license](./third-party-licenses/hyparquet-LICENSE). parquet-go inspired documentation, not the retained JavaScript parser license.

Kyle Barron and parquet-wasm contributors supply the optional WebAssembly reader/writer; SheetJS supplies optional xlsx. Those separately installed libraries retain their own licenses. Apache Arrow supplies columnar interchange. Paul Taylor at Graphistry provided extensive technical advice for the Arrow integration.

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

Parquet BSON support uses the native codec in @loaders.gl/documents. Its source and fixture notices are retained in that package.
