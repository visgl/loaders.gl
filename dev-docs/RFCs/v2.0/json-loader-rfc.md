# RFC: JSONTableLoader

- **Authors**: Ib Green
- **Date**: Jun 2019
- **Status**: Draft

## Abstract

This RFC proposes creating a special JSON Loader for parsing JSON "tables", i.e JSON files that contain arrays of similar objects. In contrast to `JSON.parse()`, this loader would support batched parsing ("streaming"), binary columnar output, and performant operation on a worker.

## Background

This RFC provides appendices with information on "Streaming JSON formats" and "Survey of Prior Art" looking at existing OSS solutions.

### Why JSON.parse is not good enough

In JavaScript, JSON is supported natively through `JSON.parse` (which because it is native function can be expected to perform at least as good as any JS implementation). However there are a number of reasons why you might consider a custom JSON loader:

- **Atomic/No streaming** `JSON.parse` is atomic. It requires a complete string and produces a complete output. It can not work on partial data chunks as they arrive.
- \*Defeats Worker performance gains\*\* - The input to `JSON.parse` is a string (not binary) output is a non-binary and will have to be serialized and deserialized if sent from a worker to the main thread - essentially triggering a new `JSON.parse` on the main thread, more than negating any benefits from moving to a worker.
- **Poor error messages**: `JSON.parse` tends to have unhelpful error messages: `Syntax error at "a"`, with no indication that this is was related to JSON parsing or what line or even position in the file that caused the error.

## Proposals

### Proposal: New `JSONTableLoader` in new `@loaders.gl/json` module

A new JSON loader would be provided by the loaders, tentatively names `JSONTableLoader`.

The new loader would parse tabular data from loaders in a streaming fashion:

```js
import {parse} from '@loaders.gl/core`;
import {JSONTableLoader} from '@loaders.gl/json`;
const table = parse(fetch('geo.json'), JSONTableLoader, {jsonpath: "features"});
```

We would also provide a worker loader variant for binary output:

```js
import {parse} from '@loaders.gl/core`;
import {JSONTableWorkerLoader} from '@loaders.gl/json`;
const table parse(fetch('geo.json'), JSONTableWorkerLoader, {binary: true, jsonpath: 'features'});
```

Notes:

- The new loader could replace the existing `JSONLoader` loader (and take its name), though perhaps the generic, trivial `JSONLoader` should be kept as a fallback JSON loader (perhaps even moved into core) as it is very small (very low bundle size impact).

### Binary Columnar AsyncIterator output

As for all _table category_ loaders, when called with `parseInBatches`, the `JSONTable*Loader` would return an `AsyncIterator` that yields binary columnar batches, essentially serving up slices of the full JSON-encoded table as the binary data chunks arrive over the network.

```js
import {parseInBatches} from '@loaders.gl/core`;
import {JSONTableWorkerLoader} from '@loaders.gl/json`;
const table parseInBatches(fetch('geo.json'), JSONTableWorkerLoader, {binary: true, jsonpath: 'features'});
```

Note that deck.gl is being extended to accept AsyncIterators as `data` props. The `AsyncIterator` returned by `parseInBatches` could be passed directly to deck.gl which would start incrementally rendering the data rows in the json file as they arrive over the wire.

### Proposal: JSONTableLoader Options

- `table`: `auto` - assume the file contains a table of objects with the same "schema". E.g. multiple top level JSON objects (or a top-level array of objects).
- `jsonpath`: `auto` - A JSONPath string. Specifies how to extract the table rows from the JSON payload with one or more wildcard paths (see JSONPath discussion below).

Low-priority

- `lengthPrefixed`: `auto` - Enable support for length prefixed json (we don't need the prefixes, but we'd need to ignore them). `auto` - If the first value in the file is a number, assumes the file is length prefixed and discards every other value assuming it is a number.

## Proposal: Specifying how to extract rows (JSONPath)

For non-trivial JSON formats (i.e. when the top level JSON object is not an array), we need a mechanism for the user to tell the `JSONTableLoader` (through a loader option) how to find the array and extract the individual table rows.

E.g. in the case of geojson, we would be looking for the array in the `features` key (possibly merged with additional arrays in `FeatureCollection` objects).

A (possibly partial) implementation of the `JSONPath` specification seems like a good choice.

```js
import {parse} from '@loaders.gl/core`;
import {JSONTableLoader} from '@loaders.gl/json`;
const table parse(fetch('geo.json'), JSONTableLoader, {jsonpath: "features"});
```

JSONPath is inspired by XPath, a specification for how to access tree nodes in XML documents.

- [JSONPath original page?](https://goessner.net/articles/JsonPath/)
- [JSONPath Playground](https://jsonpath.com/)
- [JSONPath Syntax](https://restfulapi.net/json-jsonpath/)

The [JSONStream] module contains a minimal JSONPath implementation, together with some conventions for expressing paths as JavaScript arrays (rather than strings).

Possible alternatives to JSONPath:

- JSON pointers, while well specified/standardized, they do not seem to support wildcarding.
- IBM has developed [jsonata](http://jsonata.org/) which has some proponents

### Proposal (P1): Arrow-like columnar data packing of variable-length data

Arrow supports variable length values, both strings, and binary blobs. It would be good to be able to pack such non-fixed-length values into binary columns according to conventions that would allow them to be parsed on the client side.

Using geojson as a pilot use case:

- feature.coordinates contains nested arrays of coordinates (which are variable length)
- feature.properties can contain strings (which are variable length)

Binary packing of variable length data is a more general topic for the "table loader category", but the geojson pilot use case means that realistically it will be solved as part of this effort.

## Proposal (P2): Support Streaming JSON

As described in the appendices, there are several variants of streaming JSON (they all involve multiple top-level JSON objects, one per "row", rather than wrapping the rows in an array).

This will be easy to support using our own JSON parser, as we can keep just looking for new top-level JSON objects in the stream. However unclear if we have any use cases.

### Proposal (P2): Autodetection of "tabular" JSON

The `JSONTableLoader` would be expected to fail if it could not detect a table.

For data in non-streaming JSON format, the presence of a top-level array will start streaming of objects.

A number of hints can be used to determine if the data is formatted using a streaming JSON format

- if the filename extension is `.jsonl`
- if the MIMETYPE is `application/json-seq`
- if the first value in the file is a number, assume the file is length prefixed.

For embedded arrays, we could look for first array (would cover geojson case), but for more general handling, we'll need a path specifier may need to be supplied (or

## JSON Parser Implementation Thoughts

The implementation needs a JSON parser

- works on binary input (which means it needs to recognize UTF8 character sequences).
- that can accept chunks of input, generate objects and keep the unused bytes until next chunk arrives.
- tokenizes the input bytes
- recognizes the JSON structure and calls callbacks.
- stringifies keys
- does not automatically create JS objects/arrays for unneeded parts
- does not automatically stringify strings/numbers.

### Appendix: Streaming JSON Formats

- Overview of [JSON Streaming Formats](https://en.wikipedia.org/wiki/JSON_streaming) (Wikipedia).

- [Line-delimited JSON](http://jsonlines.org/) (LDJSON) (aka JSON lines) (JSONL).
- [NewLine delimited JSON](https://github.com/ndjson/ndjson-spec)
- [Record separator-delimited JSON](https://tools.ietf.org/html/rfc7464) (IETF RFC 7464) (aka Json Text Sequences).
- Concatenated JSON
- Length-prefixed JSON

### Appendix: MIME Types and File Extensions

Overview of extensions and MIME types defined by JSON and delimited JSON formats.

| Format                          | Extension | MIME Media Type [RFC4288](https://www.ietf.org/rfc/rfc4288.txt) |
| ------------------------------- | --------- | --------------------------------------------------------------- |
| Standard JSON                   | `.json`   | `application/json`                                              |
| Line-delimited JSON             | `.jsonl`  | -                                                               |
| NewLine delimited JSON          | `.ndjson` | `application/x-ndjson`                                          |
| Record separator-delimited JSON | -         | `application/json-seq`                                          |

`@loaders.gl/core` does not currently use or generate MIME types but this would be a natural extension to e.g. the loader selection subsystem.

## Appendix: Prior Art

There are a number of open source modules on that tackle the problem of parsing JSON in a more streaming fashion in JavaScript. To make sure we are not reinventing the wheel.

Some issues with these modules are that they are often

- Focused on Node.js only - Use `Stream`s and more seriously `Buffer` classes.
- Do not provide granular control of object creation.

### jsonstream

Contains a small implementation of JSONPath that is potentially of interest, otherwise relies on `jsonparse`. Stream parts can be replaced with async iterators.

### jsonparse

The underlying `JSONParser` class is a fork of Tim Caswell's [`jsonparse`](https://github.com/creationix/jsonparse) under MIT license, and looks quite usable.

### [oboe](http://oboejs.com/)

A JSON parser with a high-level (JSONPath like API)

Comparison of [DOM vs SAX (Clarinet) vs Oboe APIs](http://oboejs.com/parsers).

- PRO: High level API good for letting app pick "rows" from table.
- CON: Not enough low-level control of object build-up for efficient binary data generation (without incurring excessive temporary object creation).

### [clarinet](https://github.com/dscape/clarinet)

A "sax-style" JSON Parser with a fine grain API:

- PRO: Very fine grain API (see below)
- CON: Builtin Stream (not useful as we want to work on async iterators)
- CON: Uses `Buffer` instead of `ArrayBuffer` (pulls in Node polyfills)

clarinet sample code, illustrating the "sax-like" callbacks

```js
var clarinet = require('clarinet'),
  parser = clarinet.parser();

parser.onerror = function (e) {
  // an error happened. e is the error.
};
parser.onvalue = function (v) {
  // got some value.  v is the value. can be string, double, bool, or null.
};
parser.onopenobject = function (key) {
  // opened an object. key is the first key.
};
parser.onkey = function (key) {
  // got a subsequent key in an object.
};
parser.oncloseobject = function () {
  // closed an object.
};
parser.onopenarray = function () {
  // opened an array.
};
parser.onclosearray = function () {
  // closed an array.
};
parser.onend = function () {
  // parser stream is done, and ready to have more stuff written to it.
};

parser.write('{"foo": "bar"}').close();
```

### [sax](http://www.saxproject.org/)

Not a JSON parser per se, however many of the JavaScript JSON loaders refer to sax, callinh themselves a "sax-style" parser etc.

From the webpage: SAX is the _Simple API for XML_, originally a Java-only API. SAX was the first widely adopted API for XML in Java, and is a “de facto” standard. The current version is SAX 2.0.1, and there are versions for several programming language environments other than Java.

[sax-js](https://github.com/isaacs/sax-js) is a (Node.js-first) JavaScript implementation.

Side Note: We may consider adopting SAX API for a streaming XML / KML parser...

`sax-js` sample code, illustrating the callbacks:

```js
var sax = require('./lib/sax'),
  strict = true, // set to false for html-mode
  parser = sax.parser(strict);

parser.onerror = function (e) {
  // an error happened.
};
parser.ontext = function (t) {
  // got some text.  t is the string of text.
};
parser.onopentag = function (node) {
  // opened a tag.  node has "name" and "attributes"
};
parser.onattribute = function (attr) {
  // an attribute.  attr has "name" and "value"
};
parser.onend = function () {
  // parser stream is done, and ready to have more stuff written to it.
};

parser.write('<xml>Hello, <who name="world">world</who>!</xml>').close();
```

## Appendix: Full stack approaches

There are several articles worth reading dealing with the problem of loading large JSON/GeoJSON, involving not just loading optimizations but also rendering or server side solutions:

- [Working with large GeoJSON sources in Mapbox GL JS](https://docs.mapbox.com/help/troubleshooting/working-with-large-geojson-data/) some tips for large geojson in mapbox
- [Manage large data files for Mapbox Studio with Tippecanoe](https://docs.mapbox.com/help/troubleshooting/large-data-tippecanoe/) - Off-line "data splitter".
