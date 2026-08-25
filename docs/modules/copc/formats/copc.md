import {CopcDocsTabs} from '@site/src/components/docs/copc-docs-tabs';

# COPC

<CopcDocsTabs active="format" />

- _[Specification at COPC.io](https://copc.io/)_
- _[Video Overview](https://www.youtube.com/watch?v=rWkKKZYN86A)_

COPC, short for Cloud-Optimized Point Cloud, is a LAZ 1.4 file that stores point data organized in a clustered octree. It contains a VLR (LAS Variable Length Record) that describe the octree organization of data that are stored in LAZ 1.4 chunks.

Data organization of COPC is modeled after the [EPT data format](https://entwine.io/en/latest/entwine-point-tile.html), but COPC clusters the storage of the octree as variably-chunked LAZ data in a single file. This allows the data to be consumed sequentially by any reader than can handle variably-chunked LAZ 1.4 (LASzip, for example), or as a spatial subset for readers that interpret the COPC hierarchy.

## Implementation

Key aspects distinguish an organized COPC LAZ file from an LAZ 1.4 that is unorganized:

- It MUST contain ONLY LAS PDRFs 6, 7, or 8 formatted data
- It MUST contain a COPC info VLR
- It MUST contain a COPC hierarchy VLR or EVLR

`COPCWriter` emits LAS 1.4 PDRF 6-8 data with the COPC info VLR, variable-size LASzip chunks, a version 0 variable chunk table, and a single hierarchy EVLR. Points are sampled deterministically into parent levels and remaining points are partitioned spatially into child octants.
