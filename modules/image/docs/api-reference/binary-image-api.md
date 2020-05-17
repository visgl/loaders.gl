# Binary Image Utilities

Utilities to extract metadata such as image format and size (dimensions) from binary images without parsing the full image. Works by by looking for format-specific headers in the encoded binary data (e.g. encoded JPEG or PNG images).

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

const mimeType = getBinaryImageMIMEType(arrayBuffer);
const {width, height} = getBinaryImageSize(arrayBuffer, mimeType);
```

## Functions

### isBinaryImage(imageData : ArrayBuffer [, mimeType : String]) : Boolean

Parameters:

- `imageData`: Binary encoded image data.
- `mimeType`: A MIME type string.

Returns `true` if the binary data represents a known binary image format or matches the supplied `mimeType`.

Parameters:

- `mimeType`: If supplied, checks if the image is of that type. If not supplied, returns `true` if imageData corresponds to a know supported image format.

### getBinaryImageMIMEType(imageData : ArrayBuffer) : String | null

Parameters:

- `imageData`: Binary encoded image data.

Returns:

- the MIME type of the image represented by the data, or `null` if it could not be identified.

### getBinaryImageSize(imageData : ArrayBuffer, mimeType? : String) : Object

Extracts the size of the image in `imageData`.

Parameters:

- `imageData`: Binary encoded image data.
- `mimeType`: A MIME type string

Returns:

- an object with fields containing the size of the image represented by the data.

```js
{
  width: Number,
  height: Number
}
```

Throws:

- if image is not in a supported binary format.

If `mimeType` is supplied, assumes the image is of that type. If not supplied, first attempts to auto deduce the image format (see `getImageMIMEType`).
