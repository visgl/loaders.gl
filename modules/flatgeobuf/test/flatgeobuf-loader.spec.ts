// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {setLoaderOptions, load, loadInBatches} from '@loaders.gl/core';

const FLATGEOBUF_COUNTRIES_DATA_URL = '@loaders.gl/flatgeobuf/test/data/countries.fgb';
const FGB_METADATA = {
  metadata: {
    title: '',
    description: '',
    crs: '{"org":"EPSG","code":4326,"name":"WGS 84","description":null,"wkt":"GEOGCRS[\\"WGS 84\\",DATUM[\\"World Geodetic System 1984\\",ELLIPSOID[\\"WGS 84\\",6378137,298.257223563,LENGTHUNIT[\\"metre\\",1]]],PRIMEM[\\"Greenwich\\",0,ANGLEUNIT[\\"degree\\",0.0174532925199433]],CS[ellipsoidal,2],AXIS[\\"latitude\\",north,ORDER[1],ANGLEUNIT[\\"degree\\",0.0174532925199433]],AXIS[\\"longitude\\",east,ORDER[2],ANGLEUNIT[\\"degree\\",0.0174532925199433]],ID[\\"EPSG\\",4326]]","code_string":null}',
    metadata: '',
    geometryType: '6',
    indexNodeSize: '16',
    featureCount: '179',
    bounds: ''
  },
  fields: [
    {
      name: 'id',
      type: 'utf8',
      nullable: true,
      metadata: {
        title: '',
        description: '',
        width: '-1',
        precision: '-1',
        scale: '-1',
        unique: 'false',
        primary_key: 'false'
      }
    },
    {
      name: 'name',
      type: 'utf8',
      nullable: true,
      metadata: {
        title: '',
        description: '',
        width: '-1',
        precision: '-1',
        scale: '-1',
        unique: 'false',
        primary_key: 'false'
      }
    }
  ]
};

setLoaderOptions({
  _workerType: 'test'
});

test('FlatGeobufLoader#load', async (t) => {
  const geojsonTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {worker: false});
  t.equal(geojsonTable.features.length, 179);
  t.equal(geojsonTable.schema.fields.length, 2);
  t.deepEqual(geojsonTable.schema, FGB_METADATA);
  t.end();
});

test('FlatGeobufLoader#loadInBatches', async (t) => {
  const iterator = await loadInBatches(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    worker: false
  });
  t.ok(iterator);

  const features: any[] = [];
  for await (const feature of iterator) {
    features.push(feature);
  }

  // t.equal(features.length, 179);
  t.ok(features.length);
  t.end();
});
