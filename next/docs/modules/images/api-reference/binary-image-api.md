Image metadata utility

# Inspect an image header before paying to decode it.

Binary image utilities identify supported encoded images and extract dimensions from their headers. Use them to plan work, validate inputs, or choose a decoder without materializing the full pixel buffer.

[Images module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)[Image loader](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)[Image category](https://loaders.gl/next/docs/specifications/category-image.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-image.md)

The metadata path

## Read a few bytes. Decide what the rest of the pipeline should do.

Header inspection is intentionally lighter than image decoding. It returns enough information to route or size work while leaving pixel interpretation to the selected loader.

01

Input

ArrayBuffer or DataView of encoded image data

02

Inspect

Format signature and dimension headers

03

Return

MIME type, width, and height

04

Fallback

\`null\` when the format is not recognized

Utilities to extract metadata such as image format (MIME type) and size (dimensions) from binary images without parsing the full image. Looks for format-specific headers in the encoded binary data (e.g. encoded JPEG or PNG images).

Detailed guide

## Header inspection details

The reference below covers supported signatures, input types, returned metadata, MIME overrides, and unknown-format behavior.

The format is reported using MIME types strings. Supported binary formats and their MIME types are:

| Format | MIME Type    |
| ------ | ------------ |
| PNG    | `image/png`  |
| JPEG   | `image/jpeg` |
| BMP    | `image/bmp`  |
| GIF    | `image/gif`  |

## Usage[​](#usage "Direct link to Usage")

```
const response = await fetchFile(imageUrl);

const arrayBuffer = await response.arrayBuffer();



const metadata = getBinaryImageMetadata(arrayBuffer);

if (metadata) {

  const {width, height, mimeType} = metadata;

}
```

## Functions[​](#functions "Direct link to Functions")

### getBinaryImageMetadata(imageData: ArrayBuffer | DataView): object | null[​](#getbinaryimagemetadataimagedata-arraybuffer--dataview-object--null "Direct link to getBinaryImageMetadata(imageData: ArrayBuffer | DataView): object | null")

Parameters:

* `imageData`: Binary encoded image data.

Returns a metadata object describing the image. Returns `null` if the binary data does not represent a known binary image format.

PNG identification requires the full eight-byte signature and a complete first IHDR chunk with a 13-byte data length. This reads header metadata; it does not decode pixels, validate compressed image payloads, or verify chunk CRCs.

```
{

  mimeType: string;

  width: number;

  height: number;

}
```

This helper has no MIME-type override; it identifies the format from the bytes. Some recognized ISOBMFF image brands return zero dimensions because their dimension metadata is not decoded by this helper.
