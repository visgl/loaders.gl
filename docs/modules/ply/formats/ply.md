import {PlyDocsTabs} from '@site/src/components/docs/ply-docs-tabs';

# PLY - Polygon File Format

<PlyDocsTabs active="overview" />

PLY (Polygon File Format, also known as the Stanford Triangle Format) stores 3D graphical objects as a collection of vertices, faces, and other polygon-oriented elements.

- _[`@loaders.gl/ply`](/docs/modules/ply)_
- _[PLY documentation](http://paulbourke.net/dataformats/ply/)_

## About PLY

The PLY format has two sub-formats: an ASCII representation for easy inspection and a binary representation for compact storage and faster loading.

PLY files are sometimes used for point clouds, but the format is designed for mesh objects made from vertices, faces, and other elements. Properties such as color, normals, texture coordinates, transparency, and confidence values can be attached to those elements.

## Columns

Columns, called properties in the PLY specification, may include color, surface normals, texture coordinates, transparency, range data confidence, and different properties for the front and back of a polygon.

## Detailed File Structure

A typical PLY file contains:

- Header
- Vertex list
- Face list
- Lists of other elements

The header is a series of text lines that describe the rest of the file. It declares each element type, how many elements of that type are present, the properties associated with each element, and whether the file body is ASCII or binary.

Following the header, each element list appears in the order described by the header.

## Example File

Below is the complete ASCII description for a cube. Comments in files are ordinary keyword-identified lines that begin with `comment`.

```text
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
