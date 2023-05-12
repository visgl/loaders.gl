# GML - Geography Markup Language

- *[`loaders.gl/wms`](/docs/modules/wms)*
- *[Wikpedia article](https://en.wikipedia.org/wiki/Geography_Markup_Language)*

The Geography Markup Language (GML) is an XML grammar defined by the Open Geospatial Consortium (OGC) to express geographical features.

GML serves as a modeling language for geographic systems as well as an open interchange format for geographic transactions on the Internet. Key to GML's utility is its ability to integrate all forms of geographic information, including not only conventional "vector" or discrete objects, but coverages (see also GMLJP2) and sensor data.

## Limitations

GML is a very ambitious format, with a large set of primitives and many ways to express similar geometries by composing different primitives. Parsing GML is generally considered challenging, even when the goal is only to support the "GeoJSON subset" of primitives.  Because of this, full support for GML is currently out of scope for loaders.gl.

The `GMLLoader` only supports parsing the standard geospatial subset of features (points, multipoints, lines, linestrings, polygons and multipolygons), on a "best effort" basis. Because of this, the `GMLLoader` is treated as a geospatial loader and can return GeoJSON style output.

A fun read that illustrates the challenge is the [GML madness](http://erouault.blogspot.com/2014/04/gml-madness.html) article by Even Rouault.

## Examples

These examples are copied from [w3.org](https://www.w3.org/Mobile/posdep/GMLIntroduction.html):

The following example encodes the geometry of a feature (a building in this case):

```xml
<Feature   fid="142" featureType="school"  Description="A middle school">
    <Polygon name="extent" srsName="epsg:27354">
        <LineString name="extent" srsName="epsg:27354">
            <CData>
              491888.999999459,5458045.99963358 491904.999999458,5458044.99963358
              491908.999999462,5458064.99963358 491924.999999461,5458064.99963358
              491925.999999462,5458079.99963359 491977.999999466,5458120.9996336
              491953.999999466,5458017.99963357 
            </CData>
        </LineString>
    </Polygon>
</Feature>
```

Properties (in addition to the geometry the geometry) can also be added:

```xml
<Feature   fid="142" featureType="school" >
    <Description>Balmoral Middle School</Description>>
    <Property Name="NumFloors" type="Integer" value="3"/>
    <Property Name="NumStudents" type="Integer" value="987"/>
    <Polygon  name="extent" srsName="epsg:27354">
        <LineString  name="extent" srsName="epsg:27354">
            <CData>
              491888.999999459,5458045.99963358 491904.999999458,5458044.99963358
              491908.999999462,5458064.99963358 491924.999999461,5458064.99963358
              491925.999999462,5458079.99963359 491977.999999466,5458120.9996336
              491953.999999466,5458017.99963357 
            </CData>
    </LineString>
  </Polygon>
</Feature>
```

