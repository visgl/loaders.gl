Readable feature format

GeoJSON

# GeoJSON

GeoJSON represents geographic features as JSON objects with explicit geometry and application properties. It is easy to inspect, exchange, and connect to web mapping code.

[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)[GeoJSON loader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)

⛶⛶ Explore fullscreen

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

The object model

## Features first. Geometry stays explicit.

A GeoJSON document can describe one geometry, one feature, or a collection of features. loaders.gl preserves that shape while making large inputs available through batches and table views.

01

Geometry

Point, line, polygon, and collections

02

Feature

Geometry plus an optional identifier and properties

03

Collection

A list of features under one document

04

Streaming

NDJSON for one feature per line

* [IETF standard](https://datatracker.ietf.org/doc/html/rfc7946)
* [geojson.org](https://geojson.org/)

GeoJSON is a format for encoding a variety of geographic data structures together with properties.

Detailed guide

## GeoJSON objects and alternatives

The sections below describe geometry shapes, feature collections, loader behavior, and related geographic formats.

## Geometries[​](#geometries "Direct link to Geometries")

Since GeoJSON geometries can be independently useful they are described on a [separate page](https://loaders.gl/next/docs/modules/tables/json/formats/geojson-geometry.md).

## Alternatives[​](#alternatives "Direct link to Alternatives")

| Format   | Support | Description                                   |
| -------- | ------- | --------------------------------------------- |
| TopoJSON | ✕       | A more compact version that encodes topology. |
