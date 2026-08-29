---
title: Wavefront OBJ format
description: A line-oriented text format for vertices, normals, texture coordinates, and faces.
hide_title: true
page_style: designed
---

import {ObjDocsTabs} from '@site/src/components/docs/obj-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Text mesh format"
  title="A simple text description of 3D geometry."
  description="Wavefront OBJ keeps mesh interchange readable: vertices, normals, texture coordinates, and face indices are written as line-oriented records that tools can inspect and share."
  tone="orange"
  meta={['Wavefront OBJ', 'Line-oriented', 'Geometry interchange']}
  links={[
    {label: 'OBJ module', to: '/docs/modules/obj'},
    {label: 'OBJLoader', to: '/docs/modules/obj/api-reference/obj-loader'}
  ]}
/>

<ObjDocsTabs active="overview" />

<DocOrientation
  eyebrow="The record vocabulary"
  title="Declare points, then connect them into faces."
  description="OBJ separates geometry declarations from face references. The parser can therefore build a mesh while leaving material and scene-graph concerns to higher-level formats."
  tone="orange"
  items={[
    {label: 'Positions', value: '`v` records define vertex coordinates'},
    {label: 'Surface data', value: '`vn` normals and `vt` texture coordinates'},
    {label: 'Topology', value: '`f` records reference the declared vertices'},
    {label: 'Companion', value: 'MTL files may describe materials separately'}
  ]}
/>

- _[`@loaders.gl/obj`](/docs/modules/obj)_
- _[Wavefront OBJ on Wikipedia](https://en.wikipedia.org/wiki/Wavefront_.obj_file)_

OBJ is a text format for exchanging 3D geometry. It stores vertex positions, texture coordinates, normals, and polygon faces, and is commonly paired with MTL files for material definitions.

<ReferenceBoundary
  title="OBJ syntax and variants"
  description="The sections below cover the line-oriented records, MTL companion files, and the scope of the loaders.gl geometry parser."
  tone="orange"
/>

## Syntax

OBJ files are line-oriented text files. Common records include `v` for vertex positions, `vt` for texture coordinates, `vn` for vertex normals, and `f` for faces. Face records reference previously declared vertices, texture coordinates, and normals by index.

## Variants

The base OBJ format is often used with a companion MTL material file. loaders.gl's OBJ support focuses on geometry; material workflows are handled separately by higher level scene graph formats.

## History

The OBJ format was developed by Wavefront Technologies for Advanced Visualizer and remains widely used because it is simple, text-based, and supported by many 3D tools.
