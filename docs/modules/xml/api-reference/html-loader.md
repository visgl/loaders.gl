# HTMLLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
  &nbsp;
	<img src="https://img.shields.io/badge/-BETA-teal.svg" alt="BETA" />
</p>

The `HTMLLoader` parses HTML-encoded data.

> The `HTMLoader` attempts to parse an HTML file as an XML file. It does not have any understanding of the structure of HTML or the document.

| Loader                | Characteristic                                           |
| --------------------- | -------------------------------------------------------- |
| File Extension        | `.html`, `.htm`                                          |
| MIME Type             | `text/html`                                              |
| File Type             | Text                                                     |
| File Format           | [eXtensible Markup Language](https://www.w3.org/TR/xml/) |
| Data Format           | Free format data structure                               |
| Decoder Type          | Synchronous                                              |
| Worker Thread Support | No                                                       |
| Streaming Support     | No                                                       |

> The `HTMLLoader` is only expected to be fit-for-purpose for a few limited use cases. 
> It is not intended for full fidelity parsing or display of HTML files. It is designed for minimal ad-hoc use cases such as 
> - the extraction of an error string from an HTML formatted error response from a server
> - or possibly to extract some valuable information (perhaps the URL to a geospatial service) from a server that doesn't provide more structured return formats (such as JSON or XML).

## Usage

```typescript
import {HTMLLoader} from '@loaders.gl/xml';
import {load} from '@loaders.gl/core';

const data = await load(url, HTMLLoader, options);
```

## Data Format

Unstructured, untyped data in the form a tree of JavaScrip objects representing the hierarchy of tags in the HTML file.

## Options

For options, see the [`XMLLoader`](./xml-loader).

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

## Attributions

The `HTMLLoader` is a wrapper around [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser).
