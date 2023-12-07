// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked from https://github.com/chrelad/openlayers/blob/master/tests/Format/GML/v3.html
// under OpenLayers license (only used for test cases)
// See README.md in `./data` directory for full license text copy.

import test from 'tape-promise/tape';
import {GML_V3_TESTS} from '@loaders.gl/wms/test/data/gml/v3/tests';
// import {validateLoader} from 'test/common/conformance';

import {_GMLLoader as GMLLoader} from '@loaders.gl/wms';
import {GeoJSON} from '@loaders.gl/schema';
import {parse} from '@loaders.gl/core';

const VALID_TEST = {
  'v3/envelope.xml': true,
  'v3/linearring.xml': true,
  'v3/linestring.xml': true,
  'v3/curve.xml': true,
  'v3/multilinestring-plural.xml': true,
  'v3/multilinestring-singular.xml': true,
  'v3/multicurve-singular.xml': true,
  'v3/multicurve-curve.xml': true,
  'v3/multipoint-plural.xml': true,
  'v3/multipoint-singular.xml': true,
  'v3/multipolygon-plural.xml': true,
  'v3/multipolygon-singular.xml': true,
  'v3/multisurface-plural.xml': false,
  'v3/multisurface-singular.xml': false,
  'v3/multisurface-surface.xml': false,
  'v3/point.xml': true,
  'v3/polygon.xml': false,
  'v3/surface.xml': false,
  'v3/topp-states-gml.xml': true,
  'v3/topp-states-wfs.xml': true,
  'v2/point-coord.xml': true,
  'v2/point-coordinates.xml': true,
  'v2/linestring-coord.xml': false,
  'v2/linestring-coordinates.xml': false,
  'v2/multipoint-coord.xml': true,
  'v2/multipoint-coordinates.xml': true,
  'v2/multilinestring-coord.xml': true,
  'v2/multilinestring-coordinates.xml': true,
  'v3/repeated-name.xml': true
};

test('GMLLoader#parse', async (t) => {
  for (const [fileName, xmlText] of Object.entries(GML_V3_TESTS)) {
    if (VALID_TEST[fileName]) {
      const geojson = (await parse(xmlText, GMLLoader)) as GeoJSON;

      t.equal(typeof geojson, 'object', `Parsed ${fileName}`);
      t.comment(JSON.stringify(geojson));
    }
  }

  t.end();
});

/*
function test_boundedBy(t) {
    t.plan(5);
    
    var doc = readXML("v3/topp-states-wfs.xml");
    var format = new OpenLayers.Format.GML.v3({
        featureType: "states",
        featureNS: "http://www.openplans.org/topp",
        geometryName: "the_geom",
        xy: false
    });
    var features = format.read(doc.documentElement);
    var bounds = features[0].bounds;

    t.ok(bounds instanceof OpenLayers.Bounds, "feature given a bounds");
    t.eq(bounds.left.toFixed(2), "-91.52", "bounds left correct");
    t.eq(bounds.bottom.toFixed(2), "36.99", "bounds bottom correct");
    t.eq(bounds.right.toFixed(2), "-87.51", "bounds right correct");
    t.eq(bounds.top.toFixed(2), "42.51", "bounds top correct");
}

function test_read(t) {
    t.plan(8);
    var doc = readXML("v3/topp-states-wfs.xml");
    var format = new OpenLayers.Format.GML.v3({
        featureType: "states",
        featureNS: "http://www.openplans.org/topp",
        geometryName: "the_geom",
        xy: false
    });
    var features = format.read(doc.documentElement);
    
    t.eq(features.length, 3, "read 3 features");
    var feature = features[0];
    t.eq(feature.fid, "states.1", "read fid");
    t.eq(feature.geometry.CLASS_NAME, "OpenLayers.Geometry.MultiPolygon",
          "read multipolygon geometry");
    var attributes = feature.attributes;
    t.eq(attributes["STATE_NAME"], "Illinois", "read STATE_NAME");
    t.eq(attributes["STATE_FIPS"], "17", "read STATE_FIPS");
    t.eq(attributes["SUB_REGION"], "E N Cen", "read SUB_REGION");
    t.eq(attributes["STATE_ABBR"], "IL", "read STATE_ABBR");
    t.eq(attributes["LAND_KM"], "143986.61", "read LAND_KM");
}

function test_emptyAttribute(t) {
    t.plan(4);
    var str =
        '<gml:featureMembers xmlns:gml="http://www.opengis.net/gml">' +
            '<topp:gnis_pop gml:id="gnis_pop.148604" xmlns:topp="http://www.openplans.org/topp">' +
                '<gml:name>Aflu</gml:name>' +
                '<topp:the_geom>' +
                    '<gml:Point srsName="urn:x-ogc:def:crs:EPSG:4326">' +
                        '<gml:pos>34.12 2.09</gml:pos>' +
                    '</gml:Point>' +
                '</topp:the_geom>' +
                '<topp:population>84683</topp:population>' +
                '<topp:country>Algeria</topp:country>' +
                '<topp:type>place</topp:type>' +
                '<topp:name>Aflu</topp:name>' +
                '<topp:empty></topp:empty>' +
            '</topp:gnis_pop>' +
        '</gml:featureMembers>';

    var format = new OpenLayers.Format.GML.v3({
        featureType: "gnis_pop",
        featureNS: "http://www.openplans.org/topp",
        geometryName: "the_geom"
    });
    
    var features = format.read(str);
    t.eq(features.length, 1, "read one feature");
    var attr = features[0].attributes;
    t.eq(attr.name, "Aflu", "correctly read attribute value");
    t.eq(attr.foo, undefined, "bogus attribute is undefined");
    t.eq(attr.empty, "", "empty attribute value is empty string");
}

function test_repeatedName(t) {
    // test that if an attribute name matches the featureType, all goes well
    t.plan(2);
    var doc = readXML("v3/repeated-name.xml");
    var format = new OpenLayers.Format.GML.v3({
        featureType: "zoning",
        featureNS: "http://opengeo.org/#medford",
        geometryName: "the_geom",
        xy: false
    });
    var features = format.read(doc.documentElement);
    
    t.eq(features.length, 1, "read one feature");
    var atts = features[0].attributes;
    t.eq(atts.zoning, "I-L", "correct zoning attribute on zoning feature type");

}

function test_write(t) {
    t.plan(1);
    var doc = readXML("v3/topp-states-gml.xml");
    var format = new OpenLayers.Format.GML.v3({
        featureType: "states",
        featureNS: "http://www.openplans.org/topp",
        geometryName: "the_geom",
        srsName: "urn:x-ogc:def:crs:EPSG:4326",
        xy: false,
        schemaLocation: "http://www.openplans.org/topp http://sigma.openplans.org:80/geoserver/wfs?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=topp:states http://www.opengis.net/gml http://schemas.opengis.net/gml/3.2.1/gml.xsd"
    });
    var features = format.read(doc.documentElement);
    
    var got = format.write(features);
    t.xml_eq(got, doc.documentElement, "gml:featureMembers round trip");
}
*/
