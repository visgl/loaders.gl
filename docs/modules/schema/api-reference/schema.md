---
title: Schema
description: Serializable field and table metadata modeled after Apache Arrow.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Schema module · schema API"
  title="Schema"
  description="Describe table fields, types, and metadata in a serializable form that can travel with decoded data and remain useful across loaders."
  tone="cyan"
  meta={['Serializable', 'Arrow-modeled', 'Field metadata']}
  links={[
    {label: 'Schema module', to: '/docs/modules/schema'},
    {label: 'Table API', to: '/docs/modules/schema/api-reference/table'},
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="The schema boundary"
  title="Make the table’s meaning explicit."
  description="A schema records field names, types, and metadata so consumers do not have to rediscover the contract from values alone. This matters especially for binary and geospatial columns."
  tone="cyan"
  items={[
    {label: 'Fields', value: 'Names, types, nullability, and metadata'},
    {label: 'Inference', value: 'Useful for text, but not always reliable'},
    {label: 'Serialization', value: 'Portable descriptions for table boundaries'},
    {label: 'Arrow', value: 'A familiar model for typed columns'}
  ]}
/>

<ReferenceBoundary
  title="Schema reference"
  description="The sections below cover schema deduction, serialization, and Arrow-compatible schema concepts."
  tone="cyan"
/>

loaders.gl provides a simple serializable schema class to help describe tables and table like data.
The Schema is modelled after Arrow.

## Schema Deduction

Schemas can be deduced, but unless the data format is binary, this can lead to mistakes.

For instance, should a column with zip codes in a CSV be treated as strings or numbers? (Most auto detection systems would classify the type as numbers, but most users would prefer for that column to be classified as string, to avoid potential dropping of leading zeroes among other things.)

## Schema Serialization

..

## Apache Arrow Schemas

...
