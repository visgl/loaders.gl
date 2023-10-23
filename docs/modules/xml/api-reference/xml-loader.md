# XMLLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
  &nbsp;
	<img src="https://img.shields.io/badge/-BETA-teal.svg" alt="BETA" />
</p>

The `XMLLoader` parses XML-encoded data.

| Loader                | Characteristic                                           |
| --------------------- | -------------------------------------------------------- |
| File Extension        | `.xml`                                                   |
| MIME Type             | `application/xml`, `text/xml`                            |
| File Type             | Text                                                     |
| File Format           | [eXtensible Markup Language](https://www.w3.org/TR/xml/) |
| Data Format           | Free format data structure                               |
| Decoder Type          | Synchronous                                              |
| Worker Thread Support | No                                                       |
| Streaming Support     | No                                                       |

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

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `uncapitalizeKeys` | `boolean` | `false` |  XML tags are typically "PascalCase", JavaScript and JSON prefers "camelCase" fields. This setting uncapitalizes all keys in the parsed data (e.g. `ValueList` => `valueList`). | 
| `removeNSPrefix` | `boolean` | `false` |  XML tags sometimes have namespace prefixes. These namespaces are inconvenient in JavaScript field names and can be stripped by setting this option (e.g. `ogc:Feature` -> `Feature`). |


Remarks:
- It is possible to pass options to the underlying parser, currently `fast-xml-parser`, however there are no guarantees that loaders.gl will continue to use this underlying parser or continue to support those options.

## Attributions

The `XMLLoader` is a wrapper around [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser).
