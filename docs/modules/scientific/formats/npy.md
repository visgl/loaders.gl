---
title: NumPy NPY
description: Typed multidimensional NumPy arrays loaded as scientific data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';

<DocPageHeader
  format="npy"
  eyebrow="Scientific array format"
  title="NumPy NPY"
  description="Load numeric array values together with dtype, dimensions, and storage-order metadata."
  tone="cyan"
  meta={['Binary arrays', 'Synchronous parser', 'Worker support']}
  links={[
    {label: 'NPYLoader', to: '/docs/modules/scientific/api-reference/npy-loader'},
    {label: 'Scientific module', to: '/docs/modules/scientific'}
  ]}
/>

NPY stores one NumPy array with a header describing its dtype, shape, and Fortran-order flag.
`NPYLoader` returns `{header, data}` without turning the array into an image or reordering values.
The native parser's supported numeric dtypes and behavior remain unchanged by its move from images.
Use the [loader reference](/docs/modules/scientific/api-reference/npy-loader) for usage and options.

The reader retains its existing supported header and primitive dtype subset. Structured/object
dtypes and Fortran-order (`True`) headers are not currently supported; no Python code is evaluated.
