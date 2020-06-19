var fs = require("fs"),
    tape = require("tape"),
    shapefile = require("../");

testConversion("empty");
testConversion("boolean-property");
testConversion("number-property");
testConversion("number-null-property");
testConversion("string-property");
testConversion("mixed-properties");
testConversion("date-property");
testConversion("utf8-property", {encoding: "utf8"});
testConversion("latin1-property");
testConversion("points");
testConversion("multipoints");
testConversion("polylines");
testConversion("polygons");
testConversion("null");
testConversion("ignore-properties", {ignoreProperties: true});

function testConversion(name, options) {
  tape("shapefile.read(" + name + ")", function(test) {
    shapefile.read("test/" + name + ".shp", undefined, options)
      .then(actual => {
        var expected = JSON.parse(fs.readFileSync("test/" + name + ".json", "utf8"));
        actual.features.forEach(fixActualProperties);
        expected.features.forEach(fixExpectedProperties);
        test.deepEqual(actual, expected);
        test.end();
      })
      .catch(error => test.end(error));
  });
}

function fixActualProperties(feature) {
  for (var key in feature.properties) {
    if (feature.properties[key] == null) {
      delete feature.properties[key];
    }
  }
  delete feature.properties.FID; // ogr2ogr built-in?
}

function fixExpectedProperties(feature) {
  var d = feature.properties.date;
  if (d) feature.properties.date = new Date(+d.substring(0, 4), d.substring(4, 6) - 1, +d.substring(6, 8));
}
