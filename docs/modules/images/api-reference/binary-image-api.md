---
title: Binary Image Utilities
description: Read image dimensions and MIME types from encoded headers without decoding pixels.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Image metadata utility"
  title="Inspect an image header before paying to decode it."
  description="Binary image utilities identify supported encoded images and extract dimensions from their headers. Use them to plan work, validate inputs, or choose a decoder without materializing the full pixel buffer."
  tone="orange"
  meta={['PNG, JPEG, BMP, GIF', 'Header-only inspection', 'MIME and dimensions']}
  links={[
    {label: 'Images module', to: '/docs/modules/images'},
    {label: 'Image loader', to: '/docs/modules/images/api-reference/image-bitmap-loader'},
    {label: 'Image category', to: '/docs/specifications/category-image'}
  ]}
/>

<DocOrientation
  eyebrow="The metadata path"
  title="Read a few bytes. Decide what the rest of the pipeline should do."
  description="Header inspection is intentionally lighter than image decoding. It returns enough information to route or size work while leaving pixel interpretation to the selected loader."
  tone="orange"
  items={[
    {label: 'Input', value: 'ArrayBuffer or DataView of encoded image data'},
    {label: 'Inspect', value: 'Format signature and dimension headers'},
    {label: 'Return', value: 'MIME type, width, and height'},
    {label: 'Fallback', value: '`null` when the format is not recognized'}
  ]}
/>

Utilities to extract metadata such as image format (MIME type) and size (dimensions) from binary images without parsing the full image. Looks for format-specific headers in the encoded binary data (e.g. encoded JPEG or PNG images).

<ReferenceBoundary
  title="Header inspection details"
  description="The reference below covers supported signatures, input types, returned metadata, MIME overrides, and unknown-format behavior."
  tone="orange"
/>

The format is reported using MIME types strings. Supported binary formats and their MIME types are:

| Format | MIME Type    |
| ------ | ------------ |
| PNG    | `image/png`  |
| JPEG   | `image/jpeg` |
| BMP    | `image/bmp`  |
| GIF    | `image/gif`  |

## Usage

```typescript
const response = await fetchFile(imageUrl);
const arrayBuffer = await response.arrayBuffer();

const metadata = getBinaryImageMetadata(arrayBuffer);
if (medata) {
  const {width, height, mimeType} = metadata;
}
```

## Functions

### getBinaryImageMetadata(imageData: ArrayBuffer | DataView): object | null

Parameters:

- `imageData`: Binary encoded image data.

Returns a metadata object describing the image. Returns `null` if the binary data does not represent a known binary image format.

```typescript
{
  mimeType: string;
  width: number;
  height: number;
}
```

If `mimeType` is supplied, assumes the image is of that type. If not supplied, first attempts to auto deduce the image format (see `getImageMIMEType`).
