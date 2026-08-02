# LAS Test Data

## Sample Data Licenses

- `ellipsoid-1.4.laz` is copied from `modules/copc/test/data/ellipsoid-1.4.laz`. The original sample data was forked from https://github.com/connormanning/copc.js under the MIT License, Copyright (c) 2021 Connor Manning.
- `points-1.4.las` is a generated loaders.gl test fixture under the loaders.gl MIT License. It contains three LAS 1.4 point-format 7 records with RGB color.
- `pdrf6-1.4.las` and `pdrf6-1.4.laz` are deterministic 1,024-point LAS 1.4 point-format 6 fixtures generated with the laz-perf 3.4.0 `random` tool. They include four Extra Bytes per point; the LAZ file uses four 256-point chunks.
- `pdrf8-1.4.las` and `pdrf8-1.4.laz` are deterministic 1,024-point LAS 1.4 point-format 8 fixtures generated with the laz-perf 3.4.0 `random` tool. They include NIR and four Extra Bytes per point; the LAZ file uses four 256-point chunks.
- `pdrf4-1.3.las`/`.laz` and `pdrf5-1.3.las`/`.laz` are deterministic 1,024-point LAS 1.3 legacy waveform fixtures compressed and decompressed byte-for-byte with LASzip commit `b17291d`. Their WavePacket13 references cover all four offset coding modes, offsets above `Number.MAX_SAFE_INTEGER`, varied packet sizes, return locations, vectors, and four Extra Bytes per point; PDRF 5 also includes RGB.
- `pdrf9-1.4.las`/`.laz` and `pdrf10-1.4.las`/`.laz` are deterministic 1,024-point LAS 1.4 waveform fixtures derived from the PDRF 6 and 8 point sequences and compressed with laz-rs 0.12.2. They add waveform packet references that cover all four LAZ offset coding modes, offsets above `Number.MAX_SAFE_INTEGER`, varied packet sizes and vectors, and four Extra Bytes per point; PDRF 10 also includes RGB and NIR. Each LAZ file uses four 256-point chunks. Scanner channel is held at zero because laz-rs 0.12.2 initializes waveform compression contexts inconsistently when channels change.
- `pdrf9-1.5.las`/`.laz` and `pdrf10-1.5.las`/`.laz` are deterministic 1,024-point LAS 1.5 waveform fixtures compressed and decompressed byte-for-byte with LASzip commit `b17291d`. The LAZ files use WavePacket14 item version 4, four fixed 256-point chunks, all four scanner-channel contexts, and four Extra Bytes per point; PDRF 10 also includes RGB and NIR.

The PDRF 6/8 fixtures use seed `0x4c415a14` and a 15% bit-change rate. The matching
uncompressed and compressed files are generated from the same point sequence so tests can compare
every decoded point-record byte. The [laz-perf generator](https://github.com/hobuinc/laz-perf/blob/3.4.0/cpp/tools/random.cpp)
is available under the BSD 3-Clause License, Copyright (c) 2022 Hobu Inc.

The [laz-rs codec](https://github.com/laz-rs/laz-rs/tree/0.12.2) used for the PDRF 10
fixture is available under the Apache License 2.0.

The [LASzip codec](https://github.com/LASzip/LASzip/tree/b17291db32150970ad36d77f1dc560c6dcf71ab0)
used for the LAS 1.5 fixture is available under the Apache License 2.0.
