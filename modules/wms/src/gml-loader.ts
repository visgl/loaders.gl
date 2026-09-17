// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeTableScanBatch, type LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, Feature} from '@loaders.gl/schema';
import {convertFeaturesToWKBArrowTable, getGeoMetadata, setGeoMetadata} from '@loaders.gl/gis';
import type {GMLFeatureCollection, Geometry} from './lib/parsers/gml/parse-gml';
import {parseGML} from './lib/parsers/gml/parse-gml';
import {GMLLoader as GMLLoaderMetadata, type GMLLoaderOptions} from './gml-loader-types';

const {preload: _GMLLoaderPreload, ...GMLLoaderMetadataWithoutPreload} = GMLLoaderMetadata;

/**
 * Parses GML features and geometries into Arrow tables or explicit GeoJSON.
 */
export const GMLLoaderWithParser = {
  ...GMLLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: GMLLoaderOptions) =>
    parseGMLText(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseGMLText,
  parseInBatches: parseGMLInRequestedShape
} as const satisfies LoaderWithParser<
  ArrowTable | Geometry | GMLFeatureCollection | null,
  ArrowTableBatch | GMLFeatureCollection,
  GMLLoaderOptions
>;

/** Parses one GML document, representing a bare geometry as one Arrow row. */
function parseGMLText(text: string, options?: GMLLoaderOptions) {
  const result = parseGML(text, {...options, ...options?.gml});
  if (options?.gml?.shape === 'geojson') return result;
  const features =
    result?.type === 'FeatureCollection'
      ? result.features
      : result
        ? [{type: 'Feature' as const, geometry: result, properties: {}}]
        : [];
  return makeGMLArrowTable(features);
}

/** Keeps GML coordinates unchanged without incorrectly declaring the GeoParquet CRS84 default. */
function makeGMLArrowTable(features: GMLFeatureCollection['features']): ArrowTable {
  const hasFeatureIds = features.some(feature => feature.id !== undefined);
  for (const feature of features) {
    if (
      Object.hasOwn(feature.properties, 'geometry') ||
      (hasFeatureIds && Object.hasOwn(feature.properties, 'id'))
    ) {
      throw new Error(
        'GMLLoader: property collides with an Arrow geometry or id column; use gml.shape: "geojson" to preserve both'
      );
    }
  }
  // The shared encoder supports null geometry although the GeoJSON Feature type excludes it.
  const table = convertFeaturesToWKBArrowTable(features as Feature[]);
  const geoMetadata = getGeoMetadata(table.data.schema.metadata)!;
  geoMetadata.columns.geometry.crs = null;
  setGeoMetadata(table.data.schema.metadata, geoMetadata);
  const geometryField = table.data.schema.fields.find(field => field.name === 'geometry');
  geometryField?.metadata.set('ARROW:extension:metadata', JSON.stringify({crs: null}));
  if (table.schema) {
    table.schema.metadata = Object.fromEntries(table.data.schema.metadata);
    const field = table.schema.fields.find(field => field.name === 'geometry');
    if (field) field.metadata = Object.fromEntries(geometryField!.metadata);
  }
  return table;
}

/** Converts streamed feature collections to Arrow batches unless legacy output is requested. */
async function* parseGMLInRequestedShape(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: GMLLoaderOptions
): AsyncIterable<ArrowTableBatch | GMLFeatureCollection> {
  for await (const collection of parseGMLInBatches(iterator, options)) {
    if (options?.gml?.shape === 'geojson') {
      yield collection;
    } else {
      const table = makeGMLArrowTable(collection.features);
      yield makeTableScanBatch(table);
    }
  }
}

/** Parses GML feature-member fragments as they become available from a fetch stream. */
async function* parseGMLInBatches(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: GMLLoaderOptions
): AsyncIterable<GMLFeatureCollection> {
  const decoder = new TextDecoder();
  const parser = new GMLFeatureStreamParser();
  let features: GMLFeatureCollection['features'] = [];
  const batchSize = options?.gml?.batchSize || 1000;

  for await (const chunk of iterator) {
    const fragments = parser.push(
      decoder.decode(chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : chunk, {
        stream: true
      })
    );
    for (const fragment of fragments) {
      const parsed = parseGMLFeatureFragment(fragment, {...options, ...options?.gml});
      if (parsed && parsed.type === 'FeatureCollection') features.push(...parsed.features);
      if (features.length >= batchSize) {
        yield {type: 'FeatureCollection', features: features.splice(0, batchSize)};
      }
    }
  }
  for (const fragment of parser.finish(decoder.decode())) {
    const parsed = parseGMLFeatureFragment(fragment, {...options, ...options?.gml});
    if (parsed && parsed.type === 'FeatureCollection') features.push(...parsed.features);
  }
  if (features.length) yield {type: 'FeatureCollection', features};
}

function parseGMLFeatureFragment(
  fragment: string,
  options?: GMLLoaderOptions['gml'] | GMLLoaderOptions
): Geometry | GMLFeatureCollection | null {
  return fragment.match(/<[^/!?][^>]*featureMember\b/i)
    ? parseGML(fragment, options)
    : parseGML(`<gml:featureMember>${fragment}</gml:featureMember>`, options);
}

class GMLFeatureStreamParser {
  private _text = '';
  private _insideFeatureMembers = false;
  private _featureMemberStart = -1;
  private _featureMemberDepth = 0;
  private _featureStart = -1;
  private _featureDepth = 0;

  push(text: string): string[] {
    this._text += text;
    return this._scan(false);
  }

  finish(text: string): string[] {
    this._text += text;
    return this._scan(true);
  }

  private _scan(isFinal: boolean): string[] {
    const fragments: string[] = [];
    const tokenPattern =
      /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<\/?\s*([A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?)\b[^>]*?>/g;
    let consumedTextLength = 0;
    let match: RegExpExecArray | null = tokenPattern.exec(this._text);
    while (match) {
      const token = match[0];
      if (token.startsWith('<!--') || token.startsWith('<?')) {
        match = tokenPattern.exec(this._text);
        continue;
      }
      const localName = match[1].split(':').pop()!;
      const isClosing = token.startsWith('</');
      const isSelfClosing = /\/\s*>$/.test(token);

      if (!isClosing && localName === 'featureMember') {
        this._featureMemberStart = match.index;
        this._featureMemberDepth = isSelfClosing ? 0 : 1;
        if (isSelfClosing) {
          fragments.push(this._text.slice(this._featureMemberStart, tokenPattern.lastIndex));
          consumedTextLength = tokenPattern.lastIndex;
          this._featureMemberStart = -1;
        }
        match = tokenPattern.exec(this._text);
        continue;
      }
      if (this._featureMemberDepth > 0) {
        if (!isClosing && !isSelfClosing) this._featureMemberDepth++;
        if (isClosing) this._featureMemberDepth--;
        if (this._featureMemberDepth === 0) {
          fragments.push(this._text.slice(this._featureMemberStart, tokenPattern.lastIndex));
          consumedTextLength = tokenPattern.lastIndex;
          this._featureMemberStart = -1;
        }
        match = tokenPattern.exec(this._text);
        continue;
      }

      if (!isClosing && localName === 'featureMembers') {
        this._insideFeatureMembers = true;
        match = tokenPattern.exec(this._text);
        continue;
      }
      if (
        this._insideFeatureMembers &&
        this._featureDepth === 0 &&
        !isClosing &&
        localName !== 'featureMembers'
      ) {
        this._featureStart = match.index;
        this._featureDepth = isSelfClosing ? 0 : 1;
        if (isSelfClosing) {
          fragments.push(this._text.slice(this._featureStart, tokenPattern.lastIndex));
          consumedTextLength = tokenPattern.lastIndex;
          this._featureStart = -1;
        }
        match = tokenPattern.exec(this._text);
        continue;
      }
      if (this._featureDepth > 0) {
        if (!isClosing && !isSelfClosing) this._featureDepth++;
        if (isClosing) this._featureDepth--;
        if (this._featureDepth === 0) {
          fragments.push(this._text.slice(this._featureStart, tokenPattern.lastIndex));
          consumedTextLength = tokenPattern.lastIndex;
          this._featureStart = -1;
        }
      }
      if (isClosing && localName === 'featureMembers') this._insideFeatureMembers = false;
      match = tokenPattern.exec(this._text);
    }

    if (consumedTextLength > 0) {
      this._text = this._text.slice(consumedTextLength);
    } else if (isFinal && this._text.trim()) {
      this._text = '';
    }
    return fragments;
  }
}
