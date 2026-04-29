import {XmlDocsTabs} from '@site/src/components/docs/xml-docs-tabs';

# XML Format

<XmlDocsTabs active="format" />

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [XML](/docs/modules/xml/formats/xml), [HTML](/docs/modules/xml/formats/html)                |
| Data Format          | Free-form JavaScript object tree                                                           |
| File Extensions      | `.xml`, `.html`, `.htm`                                                                    |
| MIME Types           | `application/xml`, `text/xml`, `text/html`                                                  |
| File Type            | Text                                                                                       |
| Loader APIs          | `load`, `parse`, `parseTextSync`                                                           |
| Loader Worker Thread | No                                                                                         |
| Loader Streaming     | No                                                                                         |

## Loaders

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/xml/api-reference/xml-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>XMLLoader</strong>
    <span>Parses XML text into JavaScript object trees.</span>
    <span className="docs-api-card__meta">Output: object tree</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseTextSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/xml/api-reference/html-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>HTMLLoader</strong>
    <span>Parses simple HTML text through the XML parsing path.</span>
    <span className="docs-api-card__meta">Output: object tree</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseTextSync</span>
  </a>
</div>

## Markup

XML and HTML are text markup formats. loaders.gl converts elements, attributes, and text content into JavaScript object structures for application-level processing.

## HTML

`HTMLLoader` is intentionally limited. It is useful for extracting small pieces of information from simple HTML responses, not for browser-grade HTML parsing or rendering.
