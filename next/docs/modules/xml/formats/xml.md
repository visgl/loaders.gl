Extensible Markup Language

XML

# Parse the structure without hiding the details.

XML supplies a portable tree of elements, attributes, namespaces, and text. loaders.gl exposes that structure as JavaScript data so applications can work with XML-based formats without committing to a single schema.

[XML module](https://loaders.gl/next/docs/modules/xml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml.md)[XMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)

XML[Try It](https://loaders.gl/next/examples/table/xml)[Overview](https://loaders.gl/next/docs/modules/xml/formats/xml.md)[Format](https://loaders.gl/next/docs/modules/xml/format.md)[XMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)[HTML](https://loaders.gl/next/docs/modules/xml/formats/html.md)[HTMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader.md)

Structured data boundaries

## Keep the source shape. Choose the application shape.

JSON, delimited text, BSON, and XML describe data differently. loaders.gl keeps those input boundaries explicit while letting applications choose documents, tables, features, or trees for the next stage.

Input families

[**JSON**nested documents↗](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[**NDJSON**one record per line↗](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[**CSV / TSV**delimited rows↗](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[**BSON**typed binary documents↗](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)[**XML**namespaced trees↗](https://loaders.gl/next/docs/modules/xml/formats/xml.md)

pars&#x65;**→**

load()

Common API boundary

documentbatchstream

load · parse · write

shap&#x65;**→**

Application results

**Document**nested objects and arrays

**Table**rows, columns, or Arrow batches

**Features**geometry plus properties

**Tree**format-specific document structure

A readable interchange format can stay readable at the edge, or become a typed table when that is what the application needs.

The XML model

## A tree first. Meaning comes from the schema.

XML defines the syntax for nested data, but not the domain meaning. Individual standards add that meaning through their own element names, namespaces, and schemas.

01

Elements

Nested nodes with names and content

02

Attributes

Compact metadata attached to nodes

03

Namespaces

Names that remain distinct across vocabularies

04

Schemas

Domain rules supplied by each XML format

* *[`@loaders.gl/xml`](https://loaders.gl/next/docs/modules/xml.md)*
* *[Wikipedia article](https://en.wikipedia.org/wiki/XML)*

Detailed guide

## XML and JavaScript data

The sections below cover the practical conversion choices made when XML is represented as JavaScript objects.

XML (eXtensible Markup Language) is a markup language and file format for storing, transmitting, and reconstructing arbitrary data.

Just like JSON, XML is not quite a format in itself, in that it doesn't define a schema. Rather other formats are defined as XML-based formats.

The "schema" of specific XML based formats are typically described in the documentation of that format or standard. However a format specific schema can also be formally described using *XML Schemas*. This article does not go deeply into these, but here are some notes on XML Schemas below.

XML was very successful and experienced a huge wave of adoption in the late 1990s and early 2000s, and it sometimes feels like most things were XML encoded one way or another at that time.

However, XML is not a client friendly format, and it has largely fallen out of favor, being replaced (often by JSON) as the base syntax for new formats. While it is rare to see a new format today being based on XML, we still have a large number of XML-based data formats that remain in use, meaning that we still need to parse (and in some, more rare cases, generate) XML for a long time to come.

## Converting between XML and JavaScript / JSON data structures[​](#converting-between-xml-and-javascript--json-data-structures "Direct link to Converting between XML and JavaScript / JSON data structures")

### Arrays[​](#arrays "Direct link to Arrays")

Structurally, XML does not have a formal array type. A repetition of XML elements with the same tag name is typically converted into a JS array with that name, however when only a single element or no element with that tag is provided in an XML file, it is not possible for an XML parser to conclude that this is intended to be an array.

### Tag Names[​](#tag-names "Direct link to Tag Names")

* JavaScript prefers camelCase where XML favors PascalCase, so a simple conversion step can make the parsed data more natural to use in JS.
* Namespaced tags complicate things in JavaScripts and it is often simplest to just strip XML namespaces from tags.

## Converting between JavaScript / JSON and XML[​](#converting-between-javascript--json-and-xml "Direct link to Converting between JavaScript / JSON and XML")

### Arrays[​](#arrays-1 "Direct link to Arrays")

XML has no standalone array type. A sequence of sibling elements with the same name is commonly represented as a JavaScript array, while a single occurrence is represented as one value. This means a consumer that needs a stable array shape should normalize both cases at its application boundary, and should keep XML schema knowledge outside the generic XML parser.

## XML schemas[​](#xml-schemas "Direct link to XML schemas")

As XML is really just a lexical format without semantics, actual XML-based formats define the "schema" of the XML file. These schemas can optionally be formally defined by so called XML schemas (which are of course are also defined in XML).

Although it would seem to be appealing to be able to automatically generate parsers, typescript types and even JSON schema from XML schemas, this is not trivial.

In fact, XML schemas are not always practical to work with in JavaScript.

* The XML schema definition is sophisticated and takes time to learn.
* Schemas tend to get very verbose and can be in the megabytes.
* Creating an XML schema from scratch is usually out of the question unless you have time to devote to this.
* Even if you find high-quality XML schemas for the formats you are interested in, using them in order to implement small specific parsers quickly becomes overkill.

(Naturally, it could be a different story in server languages like Java, with extensive mature framework support for XML).
