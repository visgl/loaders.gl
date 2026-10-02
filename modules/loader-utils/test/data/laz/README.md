# Legacy LASzip fixtures

These deterministic fixtures are generated test data under the loaders.gl MIT License.
They contain 128 points for PDRFs 0, 1, 2, 4 and 5, and 1,024 points for PDRF 3.
Each record includes four Extra Bytes. Matching `.las` files are the independent
uncompressed reference, and every compressed file was decoded with LASzip and
compared byte-for-byte with that reference before being checked in.

Compression uses LASzip 3.5.1 from https://github.com/LASzip/LASzip, downloaded on
2026-10-02. LASzip is licensed under Apache-2.0. Its `LASzip::setup()` receives the
point format and record length, `request_version(1)` selects the legacy item
codecs, and `LASwritePoint` writes the records with compressor 1 (pointwise).
`legacy-v1-pdrf3-chunked.laz` instead uses compressor 2 with 31-point chunks.
`legacy-v1-pdrf3-v2.laz` uses pointwise compressor 1 with `request_version(2)`.

The records exercise signed coordinate wraparound, median predictors, changed and
unchanged intensity/return/classification/scan-angle/source fields, GPS-time bit
differences including full 64-bit replacements, independent RGB bytes, waveform
references with offsets above `Number.MAX_SAFE_INTEGER`, and Extra Bytes changes.
Extra Bytes use xorshift32 with seed `0x4c415a01`. Every eleventh point repeats the preceding record. The larger PDRF 3 fixture
exceeds the decoder's lookahead so streaming tests can verify delivery before EOF.

The bug report's original `test.laz` and `Grass Lake Small.laz` files from
https://github.com/PDAL/data/tree/main/liblas are intentionally not checked in:
they expand to 3,604,786 and 6,190,800 points. They were independently decoded with
LASzip and all 100,934,008 and 123,816,000 raw record bytes, respectively, matched
the TypeScript decoder during implementation.
