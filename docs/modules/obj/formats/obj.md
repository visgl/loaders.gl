import {ObjDocsTabs} from '@site/src/components/docs/obj-docs-tabs';

# OBJ - Wavefront OBJ

<ObjDocsTabs active="overview" />

- _[`@loaders.gl/obj`](/docs/modules/obj)_
- _[Wavefront OBJ on Wikipedia](https://en.wikipedia.org/wiki/Wavefront_.obj_file)_

OBJ is a text format for exchanging 3D geometry. It stores vertex positions, texture coordinates, normals, and polygon faces, and is commonly paired with MTL files for material definitions.

## Syntax

OBJ files are line-oriented text files. Common records include `v` for vertex positions, `vt` for texture coordinates, `vn` for vertex normals, and `f` for faces. Face records reference previously declared vertices, texture coordinates, and normals by index.

## Variants

The base OBJ format is often used with a companion MTL material file. loaders.gl's OBJ support focuses on geometry; material workflows are handled separately by higher level scene graph formats.

## History

The OBJ format was developed by Wavefront Technologies for Advanced Visualizer and remains widely used because it is simple, text-based, and supported by many 3D tools.
