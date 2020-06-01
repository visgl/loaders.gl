# Encoding Enhancements for loaders.gl

Status: Work-In-Progress

## Summary

This RFC proposes enhancements to the loaders.gl encode API.

## Requirements and Use Cases

- **Video Encoding** Video encoding is obviously a very complex topic and loaders.gl very intentionally does not aspire to be even a remotely complete solution for this. That said, some basic ability to load and generate videos does make sense.

## Encoder APIs

## encode

Simple atomic encode should reverse the effects of load.

```js
const {load, encode, write} from '@loaders.gl/core`;
const parsedBatchIterator = load(filename, ShapefileLoader);
const encodedBatchIterator = encode(parsedBatchIterator, KMLEncoder);
write(encodedBatch)
```

## encodeInBatches

Since loaders.gl has a growing number of streaming loaders that accept an async iterator with input and yields and async iterator with output batches, it is tempting to enable a streaming encoder that can be fed with the output of a parser for another format in the same category - enabling trivial streaming converter to be written.

```js
const {parseInBatches, encodeInBatches, writeBatches} from '@loaders.gl/core`;

const parsedBatchIterator = loadInBatches(SHAPEFILE_URL, ShapefileLoader);
const encodedBatchIterator = encodeInBatches(parsedBatchIterator, KMLEncoder);
writeBatches(encodedBatchIterator);
```

Format of encoded batches

- binary formats - array buffer chunks
- text formats - string chunks (typically, but not necessarily broken after newlines).

## Not a transport format

Note that the category formats do not aim to preserve all details during conversion, i.e. `encode(parse(URL))` can be lossy.

## Builders / Encoders

Builders are an alternative to loaders. they build a data object from components.

- `GLBBuilder`
- `GLTFBuilder`
- `GIFBuilder`
