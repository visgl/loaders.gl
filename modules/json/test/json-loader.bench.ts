// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {JSONLoader, _FastJSONLoader as FastJSONLoader} from '@loaders.gl/json';
import {load, loadInBatches, parse} from '@loaders.gl/core';

import clarinetBench from './lib/clarinet/clarinet.bench';

const GEOJSON_URL = '@loaders.gl/json/test/data/geojson-big.json';
const GEOJSON_FEATURE_COUNT = 308;
const GEOJSON_TEXT = await loadText('./data/geojson-big.json');

export default async function jsonLoaderBench(suite) {
  suite.group('JSONLoader');

  const options = {multiplier: GEOJSON_FEATURE_COUNT, unit: 'features'};

  suite.addAsync('loadInBatches(JSONLoader) - Streaming GeoJSON load', options, async () => {
    const asyncIterator = await loadInBatches(GEOJSON_URL, JSONLoader);
    // const asyncIterator = await parseInBatches(STRING, JSONLoader);
    const data: unknown[] = [];
    for await (const batch of asyncIterator) {
      if (batch.shape === 'object-row-table') {
        data.push(...batch.data);
      }
    }
  });

  suite.addAsync('loadInBatches(FastJSONLoader) - Streaming GeoJSON load', options, async () => {
    const asyncIterator = await loadInBatches(GEOJSON_URL, FastJSONLoader);
    const data: unknown[] = [];
    for await (const batch of asyncIterator) {
      if (batch.shape === 'object-row-table') {
        data.push(...batch.data);
      }
    }
  });

  suite.addAsync('load(JSONLoader) - Atomic GeoJSON load (JSON.parse)', options, async () => {
    await load(GEOJSON_URL, JSONLoader);
  });

  suite.addAsync('load(FastJSONLoader) - Atomic GeoJSON load (JSON.parse)', options, async () => {
    await load(GEOJSON_URL, FastJSONLoader);
  });

  suite.addAsync('parse(JSONLoader) - Atomic GeoJSON parse (JSON.parse)', options, async () => {
    await parse(GEOJSON_TEXT, JSONLoader);
  });

  suite.addAsync('parse(FastJSONLoader) - Atomic GeoJSON parse (JSON.parse)', options, async () => {
    await parse(GEOJSON_TEXT, FastJSONLoader);
  });

  suite.add('JSON.parse - Atomic GeoJSON parse from string', options, () => {
    JSON.parse(GEOJSON_TEXT);
  });

  // Test underlying clarinet library
  clarinetBench(suite);
}

/**
 * Loads benchmark fixture text in both Node and browser environments.
 */
async function loadText(relativePath: string): Promise<string> {
  const url = new URL(relativePath, import.meta.url);

  if (url.protocol === 'file:' && typeof window === 'undefined') {
    const {readFile} = await import('fs/promises');
    return await readFile(url, 'utf8');
  }

  const response = await fetch(url);
  return await response.text();
}
