# Image Utilities

A set of functions to help determine the type and size of binary images.

## Usage

```js
const arrayBuffer = await fetchFile(imageUrl).then(response => response.arrayBuffer());

const mimeType = getImageMIMEType(arrayBuffer);
const {width, height} = getImageSize(arrayBuffer, mimeType);
```

## Functions

### isImage(imageData : ArrayBuffer [, mimeType : String]) : Boolean

Parameters:

- `imageData`: Binary encoded image data.
- `mimeType`: A MIME type string.

Returns `true` if the binary data represents a known binary image format or matches the supplied `mimeType`.

Parameters:

- `mimeType`: If supplied, checks if the image is of that type. If not supplied, returns `true` if imageData corresponds to a know supported image format.

### getImageMIMEType(imageData : ArrayBuffer) : String | null

Parameters:

- `imageData`: Binary encoded image data.

Returns:

- the MIME type of the image represented by the data, or `null` if it could not be identified.

### getImageSize(imageData : ArrayBuffer [, mimeType : String]) : Object

Extracts the size of the image in `imageData`. If `mimeType` is supplied, assumes the image is of that type. If not supplied, first attempts to auto deduce the image format (see `getImageMIMEType`).

Parameters:

- `imageData`: Binary encoded image data.
- `mimeType`: A MIME type string.

Returns:

- an object with fields containing the size of the image represented by the data.

```js
{
  width: Number,
  height: Number
}
```

Throws:

- if image is not in a supported format.

### getImageMetadata(imageData : ArrayBuffer [, mimeType : String]) : Object

Extracts the size of the image in `imageData`. If `mimeType` is supplied, assumes the image is of that type. If not supplied, first attempts to auto deduce the image format (see `getImageMIMEType`).

Parameters:

- `imageData`: Binary encoded image data.
- `mimeType`: A MIME type string.

Returns:

- an object with fields containing the size and mimeType of the image represented by the data.

```js
{
  width: Number,
  height: Number,
  mimeType: String
}
```

Throws:

- if image is not in a supported format.

## Supported Formats

Currently supported image formats and MIME types are:

| Format | MIME Type    |
| ------ | ------------ |
| PNG    | `image/png`  |
| JPEG   | `image/jpeg` |
| GIF    | `image/gif`  |
| BMP    | `image/bmp`  |
