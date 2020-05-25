# Binary Image Utilities

Utilities to extract metadata such as image format (MIME type) and size (dimensions) from binary images without parsing the full image. Looks for format-specific headers in the encoded binary data (e.g. encoded JPEG or PNG images).

The format is reported using MIME types strings. Supported binary formats and their MIME types are:

| Format | MIME Type    |
| ------ | ------------ |
| PNG    | `image/png`  |
| JPEG   | `image/jpeg` |
| BMP    | `image/bmp`  |
| GIF    | `image/gif`  |

## Usage

```js
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

```js
{
  mimeType: string;
  width: number;
  height: number;
}
```

Throws:

- if image is not in a supported binary format.

If `mimeType` is supplied, assumes the image is of that type. If not supplied, first attempts to auto deduce the image format (see `getImageMIMEType`).
