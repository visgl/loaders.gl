# LAS Test Data

## Sample Data Licenses

- `ellipsoid-1.4.laz` is copied from `modules/copc/test/data/ellipsoid-1.4.laz`. The original sample data was forked from https://github.com/connormanning/copc.js under the MIT License, Copyright (c) 2021 Connor Manning.
- `points-1.4.las` is a generated loaders.gl test fixture under the loaders.gl MIT License. It contains three LAS 1.4 point-format 7 records with RGB color.
- `pdrf6-1.4.las` and `pdrf6-1.4.laz` are deterministic 1,024-point LAS 1.4 point-format 6 fixtures generated with the laz-perf 3.4.0 `random` tool. They include four Extra Bytes per point; the LAZ file uses four 256-point chunks.
- `pdrf8-1.4.las` and `pdrf8-1.4.laz` are deterministic 1,024-point LAS 1.4 point-format 8 fixtures generated with the laz-perf 3.4.0 `random` tool. They include NIR and four Extra Bytes per point; the LAZ file uses four 256-point chunks.

The PDRF 6/8 fixtures use seed `0x4c415a14` and a 15% bit-change rate. The matching
uncompressed and compressed files are generated from the same point sequence so tests can compare
every decoded point-record byte. The [laz-perf generator](https://github.com/hobuinc/laz-perf/blob/3.4.0/cpp/tools/random.cpp)
is available under the BSD 3-Clause License, Copyright (c) 2022 Hobu Inc.
