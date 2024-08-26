# COPC - Cloud-Optimized Point Cloud

- *[Specification at COPC.io](https://copc.io/)*
- *[Video Overview](https://www.youtube.com/watch?v=rWkKKZYN86A)*

A COPC file is a LAZ 1.4 file that stores point data organized in a clustered octree. It contains a VLR (LAS Variable Length Record) that describe the octree organization of data that are stored in LAZ 1.4 chunks.

Data organization of COPC is modeled after the [EPT data format](https://entwine.io/en/latest/entwine-point-tile.html), but COPC clusters the storage of the octree as variably-chunked LAZ data in a single file. This allows the data to be consumed sequentially by any reader than can handle variably-chunked LAZ 1.4 (LASzip, for example), or as a spatial subset for readers that interpret the COPC hierarchy. 

## Implementation

Key aspects distinguish an organized COPC LAZ file from an LAZ 1.4 that is unorganized:

- It MUST contain ONLY LAS PDRFs 6, 7, or 8 formatted data
- It MUST contain a COPC info VLR
- It MUST contain a COPC hierarchy VLR
