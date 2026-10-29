glTF module · command line

![](/next/images/format-logos/gltf-logo.svg)GLB

# Look inside a GLB before you render it.

glbdump is a small diagnostic utility for checking the container structure, JSON chunk, and parsed glTF scenes in a terminal or CI job.

[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)[GLTFLoader](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md)[glTF format](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)

Three useful views

## Check the container, then the scene.

Start with the default summary to confirm the file is readable. Add JSON or glTF output when debugging extensions, linked resources, scenes, or application metadata.

01

Summary

Inspect GLB chunks and container structure

02

\--json

Pretty-print the embedded JSON chunk

03

\--gltf

Parse and print the glTF scene structure

04

Automation

Use the command in local checks or CI

Detailed guide

## glbdump usage details

The command reference below shows installation and invocation. Use GLTFLoader for application parsing and post-processing.

## glbdump[​](#glbdump "Direct link to glbdump")

`glbdump` is a utility for inspecting the structure of GLB/glTF binary container files.

Installing loaders.gl/gltf makes the `glbdump` command line tool available. It can be run using `npx`.

```
$ npx glbdump <filename>
```
