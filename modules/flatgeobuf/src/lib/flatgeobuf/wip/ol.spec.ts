import { expect } from 'chai'
import 'mocha'

import { arrayToStream, takeAsync } from './streams/utils'
import { deserialize, deserializeStream, serialize } from './ol'

import { IFeature } from './generic/feature'

import Feature from 'ol/Feature'
import WKT from 'ol/format/WKT'
import GeoJSON from 'ol/format/GeoJSON'
import { TextDecoder, TextEncoder } from 'util'

global['TextDecoder'] = TextDecoder
global['TextEncoder'] = TextEncoder

const format = new WKT()
const geojson = new GeoJSON()

const g = (features: any) => geojson.writeFeatures(features)

function makeFeatureCollection(wkt: string, properties?: any) {
  return makeFeatureCollectionFromArray([wkt], properties)
}

function makeFeatureCollectionFromArray(wkts: string[], properties?: any) : IFeature[] {
  const geometries = wkts.map(wkt => format.readGeometry(wkt))
  const features = geometries.map(geometry => {
    const f = new Feature({ geometry })
    return f
  })
  /*if (properties)
    features.forEach(f => f.properties = properties)
  return {
    type: 'FeatureCollection',
    features,
  }*/
  return features
}

describe('ol module', () => {

  describe('Geometry roundtrips', () => {

    it('Point', () => {
      const expected = makeFeatureCollection('POINT(1.2 -2.1)')
      const s = serialize(expected)
      const actual = deserialize(s)
      expect(g(actual)).to.equal(g(expected))
    })

    it('Point via stream', async () => {
      const expected = makeFeatureCollection('POINT(1.2 -2.1)')
      const s = serialize(expected)
      const stream = arrayToStream(s)
      const actual = await takeAsync(deserializeStream(stream))
      expect(g(actual)).to.equal(g(expected))
    })

    it('Points', () => {
      const expected = makeFeatureCollectionFromArray(['POINT(1.2 -2.1)', 'POINT(2.4 -4.8)'])
      const actual = deserialize(serialize(expected))
      expect(g(actual)).to.equal(g(expected))
    })

    it('MultiPoint', () => {
      const expected = makeFeatureCollection('MULTIPOINT(10 40, 40 30, 20 20, 30 10)')
      const actual = deserialize(serialize(expected))
      expect(g(actual)).to.equal(g(expected))
    })

    it('LineString', () => {
      const expected = makeFeatureCollection('LINESTRING(1.2 -2.1, 2.4 -4.8)')
      const actual = deserialize(serialize(expected))
      expect(g(actual)).to.equal(g(expected))
    })

    it('MultiLineString', () => {
      const expected = makeFeatureCollection(`MULTILINESTRING((10 10, 20 20, 10 40),
 (40 40, 30 30, 40 20, 30 10), (50 50, 60 60, 50 90))`)
      const actual = deserialize(serialize(expected))
      expect(g(actual)).to.equal(g(expected))
    })

    it('MultiLineStringSinglePart', () => {
      const expected = makeFeatureCollection(`MULTILINESTRING((1.2 -2.1, 2.4 -4.8))`)
      const actual = deserialize(serialize(expected))
      expect(g(actual)).to.equal(g(expected))
    })

    it('Polygon', () => {
      const expected = makeFeatureCollection(`POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))`)
      const actual = deserialize(serialize(expected))
      expect(g(actual)).to.equal(g(expected))
    })

    it('PolygonWithHole', () => {
      const expected = makeFeatureCollection(`POLYGON ((35 10, 45 45, 15 40, 10 20, 35 10),
 (20 30, 35 35, 30 20, 20 30))`)
      const actual = deserialize(serialize(expected))
      expect(g(actual)).to.equal(g(expected))
    })

    it('PolygonWithTwoHoles', () => {
      const expected = makeFeatureCollection(`POLYGON ((35 10, 45 45, 15 40, 10 20, 35 10),
 (20 30, 35 35, 30 20, 20 30), (20 30, 35 35, 30 20, 20 30))`)
      const actual = deserialize(serialize(expected))
      expect(g(actual)).to.equal(g(expected))
    })

    it('MultiPolygon', () => {
      const expected = makeFeatureCollection(`MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)),
 ((15 5, 40 10, 10 20, 5 10, 15 5)))`)
      const actual = deserialize(serialize(expected))
      // should encode into 18 flat coords, ends [8, 16] endss [1, 1]
      expect(g(actual)).to.equal(g(expected))
    })

    it('MultiPolygonWithHole', () => {
      const expected = makeFeatureCollection(`MULTIPOLYGON (((40 40, 20 45, 45 30, 40 40)),
 ((20 35, 10 30, 10 10, 30 5, 45 20, 20 35), (30 20, 20 15, 20 25, 30 20)))`)
      const actual = deserialize(serialize(expected))
      // NOTE: 28 flat coords, ends = [4, 10, 14], endss = [1, 2]
      expect(g(actual)).to.equal(g(expected))
    })

    it('MultiPolygonSinglePart', () => {
      const expected = makeFeatureCollection(`MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)))`)
      const actual = deserialize(serialize(expected))
      expect(g(actual)).to.equal(g(expected))
    })

    it('MultiPolygonSinglePartWithHole', () => {
      const expected = makeFeatureCollection(`MULTIPOLYGON (((35 10, 45 45, 15 40, 10 20, 35 10),
 (20 30, 35 35, 30 20, 20 30))))`)
      const actual = deserialize(serialize(expected))
      expect(g(actual)).to.equal(g(expected))
    })

    it('MultiPolygon with two holes', () => {
      const expected = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties":{ "test": 1 },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [
                    [
                        [ [102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0] ]
                    ],
                    [
                        [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ],
                        [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2] ]
                    ]
                ]
            }
        }]
      }
      const actual = deserialize(serialize(geojson.readFeatures(expected)))
      expect(JSON.parse(g(actual))).to.deep.equal(expected)
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
      const actual = deserialize(serialize(geojson.readFeatures(expected)))
      expect(JSON.parse(g(actual))).to.deep.equal(expected)
    })

  })

})
