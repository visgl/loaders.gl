# PLY - Polygon File Format

- *[`@loaders.gl/ply`](/docs/modules/ply)*
- *[PLY documentation](http://paulbourke.net/dataformats/ply/)*

PLY (Polygon File Format, also known as the Stanford Triangle Format) is a format for storing graphical objects that are described as a collection of polygons.

The PLY format has two sub-formats: an ASCII representation for easily getting started, and a binary version for compact storage and for rapid saving and loading.

PLY files are sometimes used for storing point clouds, however the format is designed to describes a mesh object as a collection of vertices, faces and other elements, along with properties such as color and normal direction that can be attached to these elements. 

Sources

## Columns

Columns (properties) that might be stored include: color, surface normals, texture coordinates, transparency, range data confidence, and different properties for the front and back of a polygon.

## Detailed File Structure

This is the structure of a typical PLY file:

- Header
- Vertex List
- Face List
- (lists of other elements)

The header is a series of carriage-return terminated lines of text that describe the remainder of the file. The ASCII header contains lines such as 
- a description of each element type, including the element's name (e.g. "edge"), 
- how many such elements are in the object, and a list of the various properties associated with the element. 
- whether the file is binary or ASCII. 

Following the header is one list of elements for each element type, presented in the order described in the header.


## Example File

Below is the complete ASCII description for a cube. The header of a binary version of the same object would differ only in substituting the word "binary_little_endian" or "binary_big_endian" for the word "ascii". The comments in brackets are NOT part of the file, they are annotations to this example. Comments in files are ordinary keyword-identified lines that begin with the word "comment".

```
ply
format ascii 1.0           { ascii/binary, format version number }
comment made by Greg Turk  { comments keyword specified, like all lines }
comment this file is a cube
element vertex 8           { define "vertex" element, 8 of them in file }
property float x           { vertex contains float "x" coordinate }
property float y           { y coordinate is also a vertex property }
property float z           { z coordinate, too }
element face 6             { there are 6 "face" elements in the file }
property list uchar int vertex_index { "vertex_indices" is a list of ints }
end_header                 { delimits the end of the header }
0 0 0                      { start of vertex list }
0 0 1
0 1 1
0 1 0
1 0 0
1 0 1
1 1 1
1 1 0
4 0 1 2 3                  { start of face list }
4 7 6 5 4
4 0 4 5 1
4 1 5 6 2
4 2 6 7 3
4 3 7 4 0
```