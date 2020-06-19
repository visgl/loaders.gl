var fs = require("fs"),
    tape = require("tape"),
    shapefile = require("../");

testConversion("number-null-property");
testConversion("string-property");
testConversion("mixed-properties");
testConversion("date-property");
testConversion("utf8-property", {encoding: "utf8"});

function testConversion(name, options) {
  tape("shapefile.openDbf(" + name + ")", function(test) {
    shapefile.openDbf("test/" + name + ".dbf", options)
      .then(source => {
        var values = [];
        return source.read().then(function read(result) {
          if (result.done) return values;
          fixActualProperties(result.value);
          values.push(result.value);
          return source.read().then(read);
        });
      })
      .then(values => (test.deepEqual(values, JSON.parse(fs.readFileSync("test/" + name + ".json", "utf8")).features.map(properties)), test.end()))
      .catch(error => test.end(error));
  });
}

function properties(feature) {
  fixExpectedProperties(feature.properties);
  return feature.properties;
}

function fixActualProperties(properties) {
  for (var key in properties) {
    if (properties[key] == null) {
      delete properties[key];
    }
  }
  delete properties.FID; // ogr2ogr built-in?
}

function fixExpectedProperties(properties) {
  var d = properties.date;
  if (d) properties.date = new Date(+d.substring(0, 4), d.substring(4, 6) - 1, +d.substring(6, 8));
}
