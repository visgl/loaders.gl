var fs = require("fs"),
    tape = require("tape"),
    shapefile = require("../");

testConversion("ignore-properties");
testConversion("multipointm");
testConversion("pointm");
testConversion("polygonm");
testConversion("polylinem");
testConversion("ne_10m_time_zones");
testConversion("ne_10m_railroads");

function testConversion(name, options) {
  tape("shapefile.openShp(" + name + ")", function(test) {
    shapefile.openShp("test/" + name + ".shp", options)
      .then(source => {
        var values = [];
        return source.read().then(function read(result) {
          if (result.done) return values;
          values.push(result.value);
          return source.read().then(read);
        });
      })
      .then(values => (test.deepEqual(values, JSON.parse(fs.readFileSync("test/" + name + ".json", "utf8")).features.map(geometry)), test.end()))
      .catch(error => test.end(error));
  });
}

function geometry(feature) {
  return feature.geometry;
}
