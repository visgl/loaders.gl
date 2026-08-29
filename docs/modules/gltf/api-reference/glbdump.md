---
title: glbdump
description: Inspect GLB and glTF containers from the command line before wiring them into an application.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="glTF module · command line"
  title="Look inside a GLB before you render it."
  description="glbdump is a small diagnostic utility for checking the container structure, JSON chunk, and parsed glTF scenes in a terminal or CI job."
  tone="blue"
  meta={['GLB inspection', 'CLI utility', 'CI-friendly']}
  links={[
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'},
    {label: 'GLTFLoader', to: '/docs/modules/gltf/api-reference/gltf-loader'},
    {label: 'glTF format', to: '/docs/modules/gltf/formats/gltf'}
  ]}
/>

<DocOrientation
  eyebrow="Three useful views"
  title="Check the container, then the scene."
  description="Start with the default summary to confirm the file is readable. Add JSON or glTF output when debugging extensions, linked resources, scenes, or application metadata."
  tone="blue"
  items={[
    {label: 'Summary', value: 'Inspect GLB chunks and container structure'},
    {label: '--json', value: 'Pretty-print the embedded JSON chunk'},
    {label: '--gltf', value: 'Parse and print the glTF scene structure'},
    {label: 'Automation', value: 'Use the command in local checks or CI'}
  ]}
/>

<ReferenceBoundary
  title="glbdump usage details"
  description="The command reference below shows installation and invocation. Use GLTFLoader for application parsing and post-processing."
  tone="blue"
/>

## glbdump

`glbdump` is a utility for inspecting the structure of GLB/glTF binary container files.

Installing loaders.gl/gltf makes the `glbdump` command line tool available. It can be run using `npx`.

```
$ npx glbdump <filename>
```
