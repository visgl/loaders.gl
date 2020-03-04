/// <reference path="geojson.spec.d.ts" />

import { expect } from 'chai'
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter'
import WKTReader from 'jsts/org/locationtech/jts/io/WKTReader'
import 'mocha'

import { readFileSync } from 'fs'
import { TextDecoder, TextEncoder } from 'util'

import fetch from 'node-fetch'

global['fetch'] = fetch
global['TextDecoder'] = TextDecoder
global['TextEncoder'] = TextEncoder

import { arrayToStream, takeAsync } from './streams/utils'

import { deserialize, deserializeStream, deserializeFiltered, serialize } from './geojson'
import { IGeoJsonFeature } from './geojson/feature'
import { Rect } from './packedrtree'

function makeFeatureCollection(wkt: string, properties?: any) {
  return makeFeatureCollectionFromArray([wkt], properties)
}

function makeFeatureCollectionFromArray(wkts: string[], properties?: any) {
  const reader: any = new WKTReader()
  const writer: any = new GeoJSONWriter()
  const geometries = wkts.map(wkt => writer.write(reader.read(wkt)))
  const features = geometries.map(geometry => ({ type: 'Feature', geometry } as IGeoJsonFeature))
  if (properties)
    features.forEach(f => f.properties = properties)
  return {
    type: 'FeatureCollection',
    features,
  }
}

describe('geojson module', () => {

  describe('Geometry roundtrips', () => {

    it('Point', () => {
      const expected = makeFeatureCollection('POINT(1.2 -2.1)')
      const s = serialize(expected)
      const actual = deserialize(s)
      expect(actual).to.deep.equal(expected)
    })

    it('Point via stream', async () => {
      const expected = makeFeatureCollection('POINT(1.2 -2.1)')
      const s = serialize(expected)
      const stream = arrayToStream(s)
      const actual = await takeAsync(deserializeStream(stream))
      expect(actual).to.deep.equal(expected.features)
    })

    it('Points', () => {
      const expected = makeFeatureCollectionFromArray(['POINT(1.2 -2.1)', 'POINT(2.4 -4.8)'])
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('MultiPoint', () => {
      const expected = makeFeatureCollection('MULTIPOINT(10 40, 40 30, 20 20, 30 10)')
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('LineString', () => {
      const expected = makeFeatureCollection('LINESTRING(1.2 -2.1, 2.4 -4.8)')
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('MultiLineString', () => {
      const expected = makeFeatureCollection(`MULTILINESTRING((10 10, 20 20, 10 40),
 (40 40, 30 30, 40 20, 30 10), (50 50, 60 60, 50 90))`)
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('MultiLineStringSinglePart', () => {
      const expected = makeFeatureCollection(`MULTILINESTRING((1.2 -2.1, 2.4 -4.8))`)
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('Polygon', () => {
      const expected = makeFeatureCollection(`POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))`)
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('Polygon via stream', async () => {
      const expected = makeFeatureCollection(`POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))`)
      const s = serialize(expected)
      const stream = arrayToStream(s)
      const actual = await takeAsync(deserializeStream(stream))
      expect(actual).to.deep.equal(expected.features)
    })

    it('PolygonWithHole', () => {
      const expected = makeFeatureCollection(`POLYGON ((35 10, 45 45, 15 40, 10 20, 35 10),
 (20 30, 35 35, 30 20, 20 30))`)
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('MultiPolygon', () => {
      const expected = makeFeatureCollection(`MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)),
 ((15 5, 40 10, 10 20, 5 10, 15 5)))`)
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('MultiPolygonWithHole', () => {
      const expected = makeFeatureCollection(`MULTIPOLYGON (((40 40, 20 45, 45 30, 40 40)),
 ((20 35, 10 30, 10 10, 30 5, 45 20, 20 35), (30 20, 20 15, 20 25, 30 20)))`)
      const actual = deserialize(serialize(expected))
      // NOTE: 28 flat coords, ends = [4, 10, 14], endss = [1, 2]
      expect(actual).to.deep.equal(expected)
    })

    it('MultiPolygonSinglePart', () => {
      const expected = makeFeatureCollection(`MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)))`)
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('MultiPolygonSinglePartWithHole', () => {
      const expected = makeFeatureCollection(`MULTIPOLYGON (((35 10, 45 45, 15 40, 10 20, 35 10),
 (20 30, 35 35, 30 20, 20 30))))`)
      const actual = deserialize(serialize(expected))
      // NOTE: 18 flat coords, ends = [5, 9], endss = null
      expect(actual).to.deep.equal(expected)
    })

    it('GeometryCollection', () => {
      const expected = makeFeatureCollection(`GEOMETRYCOLLECTION(POINT(4 6),LINESTRING(4 6,7 10))`)
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('Bahamas', () => {
      const expected = {
          "type": "FeatureCollection",
          "features": [{
              "type":"Feature",
              "properties":{ "name":"The Bahamas" },
              "geometry": {
                  "type":"MultiPolygon","coordinates":
                      [[
                          [[-77.53466,23.75975],[-77.78,23.71],[-78.03405,24.28615],[-78.40848,24.57564],[-78.19087,25.2103],[-77.89,25.17],[-77.54,24.34],[-77.53466,23.75975]]
                      ],[
                          [[-77.82,26.58],[-78.91,26.42],[-78.98,26.79],[-78.51,26.87],[-77.85,26.84],[-77.82,26.58]]
                      ],[
                          [[-77,26.59],[-77.17255,25.87918],[-77.35641,26.00735],[-77.34,26.53],[-77.78802,26.92516],[-77.79,27.04],[-77,26.59]]
                      ]]
              }
          }]
      }
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

  })

  describe('Attribute roundtrips', () => {

    it('Number', () => {
      const expected = makeFeatureCollection('POINT(1 1)', {
        test: 1,
      })
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('NumberTwoAttribs', () => {
      const expected = makeFeatureCollection('POINT(1 1)', {
        test1: 1,
        test2: 1,
      })
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('NumberWithDecimal', () => {
      const expected = makeFeatureCollection('POINT(1 1)', {
        test: 1.1,
      })
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('Boolean', () => {
      const expected = makeFeatureCollection('POINT(1 1)', {
        test: true,
      })
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('String', () => {
      const expected = makeFeatureCollection('POINT(1 1)', {
        test: 'test',
      })
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

    it('Mixed', () => {
      const expected = makeFeatureCollection('POINT(1 1)', {
        test1: 1,
        test2: 1.1,
        test3: 'test',
        test4: true,
      })
      const actual = deserialize(serialize(expected))
      expect(actual).to.deep.equal(expected)
    })

  })

  describe('Prepared buffers tests', () => {
    it('Should parse countries fgb produced from GDAL', () => {
      const buffer = readFileSync('./test/data/countries.fgb')
      const bytes = new Uint8Array(buffer)
      const geojson = deserialize(bytes)
      expect(geojson.features.length).to.eq(179)
      for (let f of geojson.features)
        expect((f.geometry.coordinates[0] as number[]).length).to.be.greaterThan(0)
    })

    it('Should parse countries fgb produced from GDAL', async () => {
      const r: Rect = { minX: 12, minY: 56, maxX: 12, maxY: 56 }
      const features = await takeAsync(deserializeFiltered('http://127.0.0.1:8000/test/data/countries.fgb', r))
      expect(features.length).to.eq(3)
      for (let f of features)
        expect((f.geometry.coordinates[0] as number[]).length).to.be.greaterThan(0)
    })

    /*it('Should parse countries fgb produced from GDAL', async () => {
      const r: Rect = { minX: 665612, minY: 6169484, maxX: 665612, maxY: 6169484 }
      const features = await takeAsync(deserializeFiltered('https://storage.googleapis.com/flatgeobuf/JORDSTYKKE.fgb', r))
      expect(features.length).to.eq(2)
      for (let f of features)
        expect((f.geometry.coordinates[0] as number[]).length).to.be.greaterThan(0)
    })*/

    it('Should parse countries fgb produced from GDAL', () => {
      const buffer = readFileSync('./test/data/countries.fgb')
      const bytes = new Uint8Array(buffer)
      const geojson = deserialize(bytes)
      expect(geojson.features.length).to.eq(179)
      for (let f of geojson.features)
        expect((f.geometry.coordinates[0] as number[]).length).to.be.greaterThan(0)
    })

    it('Should parse UScounties fgb produced from GDAL', () => {
      const buffer = readFileSync('./test/data/UScounties.fgb')
      const bytes = new Uint8Array(buffer)
      const geojson = deserialize(bytes)
      expect(geojson.features.length).to.eq(3221)
      for (let f of geojson.features)
        expect((f.geometry.coordinates[0] as number[]).length).to.be.greaterThan(0)
    })

    /*it('Should parse topp:states fgb produced from GeoServer', () => {
      const buffer = readFileSync('./test/data/topp_states.fgb')
      const bytes = new Uint8Array(buffer)
      const geojson = deserialize(bytes)
      expect(geojson.features.length).to.eq(49)
      for (let f of geojson.features)
        expect((f.geometry.coordinates[0] as number[]).length).to.be.greaterThan(0)
    })*/
  })

})
