Point-cloud format

PCD

# Name the point fields before storing the points.

PCD starts with a compact ASCII header that defines the fields and their physical layout, then stores records in a representation suited to inspection or fast transfer.

[PCD module](https://loaders.gl/next/docs/modules/pointclouds/pcd.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd.md)[PCDLoader](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)

PCD[Try It](https://loaders.gl/next/examples/pointclouds/pcd)[Overview](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/pcd/format.md)[PCDLoader](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)[PCDWriter](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-writer.md)

One point-cloud family

## Keep the points. Change the delivery layer.

LAS defines the record, LAZ compresses it, and COPC indexes it for cloud range reads. The logical attributes can continue into Arrow, rendering, or a writer without being reduced to positions alone.

Formats

[LASuncompressed records↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[LAZlossless compression↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md#las-laz-and-copc)[COPChierarchy + ranges↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

decod&#x65;**→**

point record

Typed point columns

POSITIONintensityclassificationCOLOR\_0GPS\_TIMEEXTRA\_BYTES

scale · offset · metadata

shap&#x65;**→**

Application paths

[Arrow point tabletyped columns↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)[Mesh / point cloudrender-ready positions↗](https://loaders.gl/next/docs/specifications/category-mesh.md)[LAS / LAZ writerexchange the records↗](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)

Select raw records, typed columns, or spatial ranges according to the next operation.

The point-cloud contract

## Schema in the header. Records in the payload.

The header tells the reader how to interpret every record, including custom attributes and whether the cloud is organized like an image or stored as an unstructured list.

01

Schema

Fields, sizes, types, and component counts

02

Organization

Width and height describe the point arrangement

03

Encoding

ASCII, binary, or binary-compressed data

04

Fields

Position, normals, color, intensity, and custom values

PCD (Point Cloud Data) stores 3D point clouds as named numeric fields with an ASCII header and ASCII, binary, or compressed binary point data.

Detailed guide

## PCD fields and file structure

The sections below describe common columns, header fields, versions, and a complete example payload.

* *[`@loaders.gl/pointclouds/pcd`](https://loaders.gl/next/docs/modules/pointclouds/pcd.md)*
* *[PCD documentation](https://pcl.readthedocs.io/projects/tutorials/en/latest/pcd_file_format.html)*
* *[Wikipedia article](https://en.wikipedia.org/wiki/Point_Cloud_Library)*

## About PCD[​](#about-pcd "Direct link to About PCD")

PCD stores point cloud datasets with a human-readable ASCII header. The point records can be stored in ASCII for inspection, binary for faster loading, or compressed binary for smaller files.

PCD supports organized point clouds, where records are arranged in an image-like structure, and unorganized point clouds, where each point is independent.

## Columns[​](#columns "Direct link to Columns")

PCD files can contain arbitrarily named columns, but some names have predefined semantics:

| Column name | Format    | Description                     |
| ----------- | --------- | ------------------------------- |
| `x`         | `float32` | Spatial coordinate, x dimension |
| `y`         | `float32` | Spatial coordinate, y dimension |
| `z`         | `float32` | Spatial coordinate, z dimension |
| `normal_x`  | `float32` | Normal vector, x component      |
| `normal_y`  | `float32` | Normal vector, y component      |
| `normal_z`  | `float32` | Normal vector, z component      |
| `color_r`   | `uint8`   | Color, red component            |
| `color_g`   | `uint8`   | Color, green component          |
| `color_b`   | `uint8`   | Color, blue component           |
| `color_a`   | `uint8`   | Color, alpha component          |
| `rgb`       |           | Color without alpha component   |
| `rgba`      |           | Color with alpha component      |
| `intensity` |           |                                 |

PCD supports color with a 4-byte `rgb` or `rgba` component. This contains the same information as the group of `color_r`, `color_g`, `color_b`, and `color_a` components.

## Detailed File Structure[​](#detailed-file-structure "Direct link to Detailed File Structure")

The PCD file is divided into a header and data section.

The header contains the information needed to interpret the point cloud data stored in the file. It is encoded in ASCII and has one named field per line. Header entry order is significant.

In version 0.7, the PCD version appears at the beginning of the header, followed by the name, size, and type of each stored dimension.

| Header field      | Description                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `VERSION`         | PCD version, normally `.7`.                                                              |
| `FIELDS`          | Name of each dimension in the stored data.                                               |
| `SIZE`            | Size of each dimension in bytes.                                                         |
| `TYPE`            | Type of each dimension.                                                                  |
| `WIDTH`, `HEIGHT` | Number of points and whether the point cloud dataset is organized or unorganized.        |
| `DATA`            | The data encoding used for the point records: `ascii`, `binary`, or `binary_compressed`. |

## Versions[​](#versions "Direct link to Versions")

The PCD version is specified with a 0.x version number, such as 0.5, 0.6, or 0.7, in the header of each file.

PCD was originally released in 2011. It was created because existing formats such as PLY, IFS, VTK, STL, OBJ, and X3D lacked features, flexibility, and speed required by the [Point Cloud Library](https://pointclouds.org/documentation/) project.

### PCD 0.7[​](#pcd-07 "Direct link to PCD 0.7")

PCD 0.7 added the `VIEWPOINT` header field, which specifies the sensor orientation relative to the dataset.

## Example File[​](#example-file "Direct link to Example File")

```
# .PCD v.7 - Point Cloud Data file format

VERSION .7

FIELDS x y z rgb

SIZE 4 4 4 4

TYPE F F F F

COUNT 1 1 1 1

WIDTH 213

HEIGHT 1

VIEWPOINT 0 0 0 1 0 0 0

POINTS 213

DATA ascii

0.93773 0.33763 0 4.2108e+06

0.90805 0.35641 0 4.2108e+06

0.81915 0.32 0 4.2108e+06

0.97192 0.278 0 4.2108e+06

0.944 0.29474 0 4.2108e+06

0.98111 0.24247 0 4.2108e+06
```
