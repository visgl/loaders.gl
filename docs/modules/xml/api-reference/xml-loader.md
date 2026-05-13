import {XmlDocsTabs} from '@site/src/components/docs/xml-docs-tabs';

# XMLLoader

<XmlDocsTabs active="xmlloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `XMLLoader` parses XML-encoded data.

The goal of the `XMLLoader` is to make it easy for JavaScript applications to access XML formatted data.
It is not intended to be a tool for advanced manipulation of XML data, and options provided are focused
on making the returned data easier to use in JavaScript applications.

## Usage

Load XML data into a javascript data structure and preserve the original structure

```typescript
import {XMLLoader} from '@loaders.gl/xml';
import {load} from '@loaders.gl/core';

const data = await load(url, XMLLoader);
```

Load XML data into a javascript data structure and set options that make the returned data more "JavaScript friendly":

```typescript
import {XMLLoader} from '@loaders.gl/xml';
import {load} from '@loaders.gl/core';

const data = await load(url, XMLLoader, {xml: {uncapitalizeKeys: true, removeNSPrefix: true}});
```

## Data Format

Unstructured, untyped data in the form a tree of JavaScrip objects representing the hierarchy of tags in the XML file.

## Options

| Option             | Type      | Default | Description                                                                                                                                                                           |
| ------------------ | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uncapitalizeKeys` | `boolean` | `false` | XML tags are typically "PascalCase", JavaScript and JSON prefers "camelCase" fields. This setting uncapitalizes all keys in the parsed data (e.g. `ValueList` => `valueList`).        |
| `removeNSPrefix`   | `boolean` | `false` | XML tags sometimes have namespace prefixes. These namespaces are inconvenient in JavaScript field names and can be stripped by setting this option (e.g. `ogc:Feature` -> `Feature`). |
| `_parser`          | `string`  | `'fast-xml-parser'` | Experimental. Selects the XML parser implementation. Use `'internal'` to test the loaders.gl internal parser. |

Remarks:

- It is possible to pass options to the underlying parser, currently `fast-xml-parser`, however there are no guarantees that loaders.gl will continue to use this underlying parser or continue to support those options.
- The internal parser is experimental and opt-in. It is intended to eventually replace the default parser, but the default parser remains `fast-xml-parser` until compatibility has been validated.

## Attributions

The `XMLLoader` is a wrapper around [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser).
