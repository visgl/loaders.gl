# @loaders.gl/orc

> **Status:** v5.0 experimental / work in progress. The Arrow-based ORC loader and writer are available for evaluation and do not yet provide complete ORC feature coverage.

Initial Apache ORC support for loaders.gl.

The loader returns a loaders.gl `arrow-table` containing an Apache Arrow `Table`. It validates the ORC envelope, parses footer and stripe stream metadata, and currently decodes uncompressed primitive columns, non-null nested structs, null PRESENT streams, and multiple stripes.

`ORCWriter` accepts an Apache Arrow `Table` through the loaders.gl table wrapper and emits uncompressed primitive ORC files. Set `orc.stripeSize` to split output into multiple stripes. Compression, nested types, dictionary encoding, and other RLEv2 variants remain work in progress.
