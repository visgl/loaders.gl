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

### `getBinaryImageMetadata(imageData: ArrayBuffer | DataView): object | null`

Parameters:

- `imageData`: Binary encoded image data.

Returns a metadata object with if the binary data represents a known binary image format.

```js
{
  mimeType: string;
  width: number;
  height: number;
}
```

If image is not in a supported binary format, `getBinaryImageMetadata` returns `null`.

## Remarks

This is not a fool-proof test. Only a few initial header bytes are checked, and you can potentially get false positives if you call this funtion on arbitrary ArrayBuffers. However, in practice it works well for loader selection among a list of loaders.
