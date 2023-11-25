# LAS / LAZ

- *[`@loaders.gl/las`](/docs/modules/las)*
- *[Wikipedia](https://en.wikipedia.org/wiki/LAS_file_format)* - *[LAS Spec](https://www.loc.gov/preservation/digital/formats/fdd/fdd000418.shtml)* - *[LASER file format](https://www.asprs.org/divisions-committees/lidar-division/laser-las-file-format-exchange-activities)* - *[LASzip project](https://github.com/LASzip/LASzip)* - *[LAZ spec](https://www.cs.unc.edu/~isenburg/lastools/download/laszip.pdf)*

The *LASER file format* (LAS) and its compressed version (LAZ) are public formats for the interchange of 3-dimensional point cloud data data, developed for LIDAR mapping purposes.

## Variants

LAS file format is not compressed. However there is an open source project (LASzip) which defined and implemented the open file format LAZ to losslessly compress LAS data.

| Variant | Description           |
| ------- | --------------------- |
| LAS     | Uncompressed          |
| LAZ     | Lossless compression. |

## Version History

| **Version** | **Date** | **loaders.gl<br />Support** | **Description**                                                 |
| ----------- | -------- | --------------------------- | --------------------------------------------------------------- |
| 1.4         |          | ❌                           | 64 bit support                                                  |
| 1.3         |          | ✅                           | Extended variable length records (EVLR) to hold longer metadata |
| 1.2         |          | ✅                           |                                                                 |
| 1.1         |          | ✅                           |                                                                 |
| 1.0         |          | ✅                           |                                                                 |

Notes:
- Work on LAS 2.0 was started but was suspended indefinitely.

## File Structure

A LAS file consists of sections:

| Section                                 | Description                                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public header block                     | Describes format, number of points, extent of the point cloud and other generic data.                                                                                                |
| Variable length records (VLR)           | Any number of optional records (up to 64K bytes) to provide various data such as the spatial reference system used, metadata, waveform packet information and user application data. |
| Point data records                      | Data for each of the individual points in the point cloud, including coordinates, classification (e.g. terrain or building), flight and scan data, etc.                              |
| Extended variable length records (EVLR) | From v1.3. Similar to VLRs but located after the point data records and allow a much larger data payload per record due to the use of 8-byte size descriptors.                       |
| Point data records                      | A LAS file contains point records in one of the point data record formats defined by the LAS specification                                                                           |

Notes: 
- As of LAS 1.4, there are 11 point data record formats (0 through 10) available. All point data records must be of the same format within the file. The various formats differ in the data fields available, such as GPS time, RGB and NIR color and wave packet information.
- The 3D point coordinates are represented within the point data records by 32-bit integers, to which a scaling and offset defined in the public header must be applied in order to obtain the actual coordinates.
- As the number of bytes used per point data record is explicitly given in the public header block, it is possible to add user-defined fields in "extra bytes" to the fields given by the specification-defined point data record formats. A standardized way of interpreting such extra bytes was introduced in the LAS 1.4 specification, in the form of a specific EVLR.


