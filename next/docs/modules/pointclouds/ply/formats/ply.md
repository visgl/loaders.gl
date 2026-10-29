Polygon and vertex format

PLY

# Let the header describe the mesh you have.

PLY defines elements and properties in its header, then stores those records as readable text or compact binary data. It is flexible enough for meshes and many point-cloud workflows.

[PLY module](https://loaders.gl/next/docs/modules/pointclouds/ply.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/ply.md)[PLYLoader](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md)

PLY[Try It](https://loaders.gl/next/examples/pointclouds/ply)[Overview](https://loaders.gl/next/docs/modules/pointclouds/ply/formats/ply.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/ply/format.md)[PLYLoader](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md)[PLYWriter](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-writer.md)[Benchmarks](https://loaders.gl/next/docs/modules/pointclouds/ply/benchmarks.md)

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

The element model

## Declare the records before reading them.

A PLY reader uses the header as a schema: it knows which elements exist, how many records to expect, and how to interpret every property before it reaches the payload.

01

Format

ASCII or little/big-endian binary representation

02

Elements

Vertices, faces, and application-defined records

03

Properties

Coordinates, color, normals, UVs, and confidence

04

Output

Mesh data, including point-cloud-style vertices

PLY (Polygon File Format, also known as the Stanford Triangle Format) stores 3D graphical objects as a collection of vertices, faces, and other polygon-oriented elements.

Detailed guide

## PLY structure and examples

The sections below cover ASCII and binary variants, common properties, element ordering, and a complete example file.

* *[`@loaders.gl/pointclouds/ply`](https://loaders.gl/next/docs/modules/pointclouds/ply.md)*
* *[PLY documentation](http://paulbourke.net/dataformats/ply/)*

## About PLY[​](#about-ply "Direct link to About PLY")

The PLY format has two sub-formats: an ASCII representation for easy inspection and a binary representation for compact storage and faster loading.

PLY files are sometimes used for point clouds, but the format is designed for mesh objects made from vertices, faces, and other elements. Properties such as color, normals, texture coordinates, transparency, and confidence values can be attached to those elements.

## Columns[​](#columns "Direct link to Columns")

Columns, called properties in the PLY specification, may include color, surface normals, texture coordinates, transparency, range data confidence, and different properties for the front and back of a polygon.

## Detailed File Structure[​](#detailed-file-structure "Direct link to Detailed File Structure")

A typical PLY file contains:

* Header
* Vertex list
* Face list
* Lists of other elements

The header is a series of text lines that describe the rest of the file. It declares each element type, how many elements of that type are present, the properties associated with each element, and whether the file body is ASCII or binary.

Following the header, each element list appears in the order described by the header.

## Example File[​](#example-file "Direct link to Example File")

Below is the complete ASCII description for a cube. Comments in files are ordinary keyword-identified lines that begin with `comment`.

```
ply

format ascii 1.0

comment made by Greg Turk

comment this file is a cube

element vertex 8

property float x

property float y

property float z

element face 6

property list uchar int vertex_index

end_header

0 0 0

0 0 1

0 1 1

0 1 0

1 0 0

1 0 1

1 1 1

1 1 0

4 0 1 2 3

4 7 6 5 4

4 0 4 5 1

4 1 5 6 2

4 2 6 7 3

4 3 7 4 0
```
