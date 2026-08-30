// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {encode, parse} from '@loaders.gl/core';
import {ZipWriter} from '@loaders.gl/zip';
import {
  KMLWriter,
  KMZSourceLoader,
  KMZVectorSource,
  KMZWriter,
  convertKMLDocumentToFeatureCollection,
  openKMZArchive,
  parseKMLDocument
} from '@loaders.gl/kml';
import {parseGPXTextToFeatureCollection} from '../src/gpx-loader-with-parser';
import {parseTCXTextToFeatureCollection} from '../src/tcx-loader-with-parser';

const EDGE_KML = `<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <name>Edge cases</name><description>All the details</description>
  <Style id="rich"><LineStyle><color>7f112233</color><width>2</width></LineStyle>
    <PolyStyle><color>ff445566</color><fill>1</fill><outline>0</outline></PolyStyle>
    <IconStyle><scale>1.5</scale><Icon><href>icons/pin.png</href></Icon></IconStyle>
    <LabelStyle><color>ff00ff00</color><scale>0.8</scale></LabelStyle>
  </Style>
  <StyleMap id="fallback"><Pair><key>highlight</key><styleUrl>#rich</styleUrl></Pair></StyleMap>
  <Placemark><name>Styled</name><description>Text</description><visibility>1</visibility><open>true</open>
    <address>A&amp;B</address><phoneNumber>123</phoneNumber><styleUrl>#fallback</styleUrl>
    <ExtendedData><Data name="kind"><value>place</value></Data><SchemaData><SimpleData name="rank">3</SimpleData></SchemaData></ExtendedData>
    <TimeStamp><when>2024-01-01</when></TimeStamp><Point><coordinates>1,2,3</coordinates></Point>
  </Placemark>
  <Placemark><TimeSpan><begin>2024-01-01</begin><end>2024-01-02</end></TimeSpan><Polygon>
    <outerBoundaryIs><LinearRing><coordinates>0,0 4,0 4,4 0,0</coordinates></LinearRing></outerBoundaryIs>
    <innerBoundaryIs><LinearRing><coordinates>1,1 2,1 1,1</coordinates></LinearRing></innerBoundaryIs>
  </Polygon></Placemark>
  <Placemark><MultiGeometry><Point><coordinates>5,6</coordinates></Point><LineString><coordinates>5,6 7,8</coordinates></LineString></MultiGeometry></Placemark>
  <Placemark><Track><coord>9 10 11</coord><coord>12 13 14</coord></Track></Placemark>
  <Placemark><MultiTrack><Track><coordinates>15,16 17,18</coordinates></Track><Track><coordinates>19,20 21,22</coordinates></Track></MultiTrack></Placemark>
  <Folder><name>Outer</name><description>Folder description</description><Placemark><Point><coordinates>30,31</coordinates></Point></Placemark>
    <Folder><name>Inner</name><Placemark><LineString><coordinates>32,33 34,35</coordinates></LineString></Placemark></Folder>
  </Folder>
  <GroundOverlay><name>Ground</name><Icon><href>ground.png</href></Icon><LatLonBox><north>4</north><south>1</south><east>3</east><west>0</west><rotation>5</rotation></LatLonBox></GroundOverlay>
  <ScreenOverlay><name>Screen</name><Icon><href>screen.png</href></Icon></ScreenOverlay>
  <PhotoOverlay><name>Photo</name><LatLonBox><north>bad</north></LatLonBox></PhotoOverlay>
  <NetworkLink><name>Link</name><Link><href>remote.kml</href><refreshMode>onInterval</refreshMode><refreshInterval>10</refreshInterval><viewRefreshMode>onStop</viewRefreshMode></Link></NetworkLink>
  <NetworkLink><name>Legacy</name><Url><href>legacy.kml</href></Url></NetworkLink>
  <Model><name>Building</name><Location><longitude>40</longitude><latitude>41</latitude></Location><Scale><x>2</x></Scale><Link><href>building.dae</href></Link></Model>
</Document></kml>`;

test('KML parser covers document metadata, geometry variants, and optional elements', () => {
  const document = parseKMLDocument(EDGE_KML);

  expect(document.name).toBe('Edge cases');
  expect(document.features).toHaveLength(7);
  expect(document.features[0].properties).toMatchObject({
    name: 'Styled',
    visibility: '1',
    open: 'true',
    address: 'A&B',
    kind: 'place',
    rank: '3',
    stroke: '#332211',
    fill: '#665544',
    icon: 'icons/pin.png'
  });
  expect(document.features[1].geometry).toMatchObject({type: 'Polygon'});
  expect(document.features[2].geometry).toMatchObject({type: 'GeometryCollection'});
  expect(document.features[3].geometry).toBeNull();
  expect(document.features[4].geometry).toBeNull();
  expect(document.folders[0].path).toEqual(['Outer']);
  expect(document.folders[0].folders[0].path).toEqual(['Outer', 'Inner']);
  expect(document.overlays).toHaveLength(3);
  expect(document.overlays[0].bounds).toEqual({north: 4, south: 1, east: 3, west: 0, rotation: 5});
  expect(document.overlays[2].bounds).toBeUndefined();
  expect(document.networkLinks).toHaveLength(2);
  expect(document.networkLinks[0].refreshInterval).toBe(10);
  expect(document.networkLinks[1].href).toBe('legacy.kml');
  expect(document.models[0]).toMatchObject({
    href: 'building.dae',
    location: undefined,
    scale: {x: 2}
  });

  expect(convertKMLDocumentToFeatureCollection(document).features[0].properties).not.toHaveProperty(
    'kml'
  );
  expect(
    convertKMLDocumentToFeatureCollection(document, {includeKMLMetadata: true}).features[0]
      .properties
  ).toHaveProperty('kml');
});

test('GPX parser covers tracks, routes, waypoints, extensions, and empty segments', () => {
  const result = parseGPXTextToFeatureCollection(`<gpx>
    <trk><name>Ride</name><type>cycling</type><link href="ride"><text>Ride link</text><type>text</type></link>
      <extensions><line><color>#fff</color><opacity>0.5</opacity><width>2.54</width></line><custom>value</custom></extensions>
      <trkseg><trkpt lon="1" lat="2"><ele>3</ele><time>t1</time><extensions><TrackPointExtension><heart>150</heart></TrackPointExtension></extensions></trkpt><trkpt lon="4" lat="5"><time>t2</time><extensions><cadence>90</cadence></extensions></trkpt></trkseg>
      <trkseg><trkpt lon="6" lat="7"/><trkpt lon="8" lat="9"/></trkseg><trkseg><trkpt lon="0" lat="0"/></trkseg>
    </trk>
    <rte><name>Route</name><rtept lon="10" lat="11"/><rtept lon="12" lat="13"/></rte>
    <wpt lon="14" lat="15"><name>Waypoint</name><sym>Flag</sym></wpt>
  </gpx>`);

  expect(result.features).toHaveLength(3);
  expect(result.features[0].geometry?.type).toBe('MultiLineString');
  expect(result.features[0].properties).toMatchObject({
    _gpxType: 'trk',
    name: 'Ride',
    type: 'cycling'
  });
  expect(result.features[0].properties?.coordinateProperties).toMatchObject({
    times: [['t1', 't2']],
    heart: [
      [150, null],
      [null, null]
    ],
    cadences: [
      [null, 90],
      [null, null]
    ]
  });
  expect(result.features[1].properties).toMatchObject({_gpxType: 'rte', name: 'Route'});
  expect(result.features[2].properties).toMatchObject({name: 'Waypoint', sym: 'Flag'});
});

test('TCX parser covers activity properties, multiple tracks, and sensor values', () => {
  const result = parseTCXTextToFeatureCollection(`<TrainingCenterDatabase>
    <Activities><Activity><Lap><Name>Lap 1</Name><TotalTimeSeconds>10</TotalTimeSeconds><DistanceMeters>20</DistanceMeters><MaximumSpeed>3</MaximumSpeed><AverageHeartRateBpm>140</AverageHeartRateBpm><MaximumHeartRateBpm>160</MaximumHeartRateBpm><AvgSpeed>2</AvgSpeed><AvgWatts>100</AvgWatts><MaxWatts>200</MaxWatts>
      <Track><Trackpoint><Time>t1</Time><Position><LatitudeDegrees>1</LatitudeDegrees><LongitudeDegrees>2</LongitudeDegrees></Position><AltitudeMeters>3</AltitudeMeters><HeartRateBpm>140</HeartRateBpm><Cadence>90</Cadence><Speed>2</Speed><Watts>100</Watts></Trackpoint><Trackpoint><Position><LatitudeDegrees>4</LatitudeDegrees><LongitudeDegrees>5</LongitudeDegrees></Position><heartRate>150</heartRate></Trackpoint></Track>
    </Lap></Activity></Activities>
    <Courses><Course><Track><Trackpoint><Position><LatitudeDegrees>6</LatitudeDegrees><LongitudeDegrees>7</LongitudeDegrees></Position></Trackpoint><Trackpoint><Position><LatitudeDegrees>8</LatitudeDegrees><LongitudeDegrees>9</LongitudeDegrees></Position></Trackpoint></Track><Track><Trackpoint><Position><LatitudeDegrees>10</LatitudeDegrees><LongitudeDegrees>11</LongitudeDegrees></Position></Trackpoint><Trackpoint><Position><LatitudeDegrees>12</LatitudeDegrees><LongitudeDegrees>13</LongitudeDegrees></Position></Trackpoint></Track></Course></Courses>
  </TrainingCenterDatabase>`);

  expect(result.features).toHaveLength(2);
  expect(result.features[0].properties).toMatchObject({
    name: 'Lap 1',
    totalTimeSeconds: 10,
    distanceMeters: 20
  });
  expect(result.features[0].properties?.coordinateProperties).toMatchObject({
    times: ['t1'],
    heart: [140]
  });
  expect(result.features[1].geometry?.type).toBe('MultiLineString');
});

test('KML writers cover table inputs, geometry families, escaping, and options', async () => {
  const features = [
    {
      type: 'Feature' as const,
      properties: {
        name: 'A&B',
        description: '<tag>',
        visibility: true,
        open: false,
        address: 'x',
        phoneNumber: 'y',
        styleUrl: '#style',
        value: {nested: true},
        kml: {altitudeMode: 'absolute', extrude: true, tessellate: false}
      },
      geometry: {type: 'Point' as const, coordinates: [1, 2]}
    },
    {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [1, 2],
          [3, 4]
        ]
      }
    },
    {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [1, 2],
            [3, 4],
            [1, 2]
          ],
          [
            [2, 2],
            [2, 3],
            [2, 2]
          ]
        ]
      }
    },
    {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'GeometryCollection' as const,
        geometries: [{type: 'Point' as const, coordinates: [1, 2]}]
      }
    },
    {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'MultiPoint' as const,
        coordinates: [
          [1, 2],
          [3, 4]
        ]
      }
    },
    {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'MultiLineString' as const,
        coordinates: [
          [
            [1, 2],
            [3, 4]
          ]
        ]
      }
    },
    {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'MultiPolygon' as const,
        coordinates: [
          [
            [
              [1, 2],
              [3, 4],
              [1, 2]
            ]
          ]
        ]
      }
    }
  ];
  const featureCollection = {type: 'FeatureCollection' as const, features};
  const text = KMLWriter.encodeTextSync(featureCollection, {
    kml: {name: 'A&B', description: 'Description <x>', coordinateReferenceSystem: 'EPSG:4326'}
  });
  expect(text).toContain('&amp;');
  expect(text).toContain('&lt;x&gt;');
  expect(text).toContain('<MultiGeometry>');
  expect(text).toContain('<altitudeMode>absolute</altitudeMode>');
  expect(
    await KMLWriter.encode({
      shape: 'geojson-table',
      type: 'FeatureCollection',
      schema: {},
      features
    } as never)
  ).toBeInstanceOf(ArrayBuffer);
  expect(KMLWriter.encodeTextSync({shape: 'object-row-table', data: features} as never)).toContain(
    '<Placemark>'
  );
  expect(() =>
    KMLWriter.encodeTextSync(featureCollection, {
      kml: {coordinateReferenceSystem: 'EPSG:3857' as never}
    })
  ).toThrow();
  expect(() => KMLWriter.encodeTextSync({type: 'invalid'} as never)).toThrow();
  expect(() =>
    KMLWriter.encodeTextSync({
      type: 'FeatureCollection',
      features: [{type: 'Feature', properties: {}, geometry: {type: 'Unsupported'}}]
    } as never)
  ).toThrow();

  const subarray = new Uint8Array([0, 1, 2]).subarray(1);
  const kmz = await encode(featureCollection, KMZWriter, {
    kmz: {kmlFileName: 'maps/main.kml', files: {'data.bin': subarray}}
  });
  const archive = await openKMZArchive(kmz);
  expect(archive.kmlFileName).toBe('maps/main.kml');
  expect(new Uint8Array(await archive.getResource('../data.bin'))).toEqual(new Uint8Array([1, 2]));
  await archive.close();
});

test('KMZ archive and source cover KML fallback selection and output formats', async () => {
  const nested = await encode(
    {
      'nested/main.kml':
        '<kml><Document><Placemark><Point><coordinates>1,2</coordinates></Point></Placemark></Document></kml>'
    },
    ZipWriter
  );
  const archive = await openKMZArchive(nested);
  expect(archive.kmlFileName).toBe('nested/main.kml');
  await archive.close();

  const noKML = await encode({'readme.txt': 'no kml'}, ZipWriter);
  await expect(openKMZArchive(noKML)).rejects.toThrow('does not contain a KML document');

  const sourceArchive = await encode(
    {'doc.kml': '<kml><Document><Placemark><name>Empty</name></Placemark></Document></kml>'},
    ZipWriter
  );
  const source = KMZSourceLoader.createDataSource(
    new Blob([sourceArchive], {type: 'application/vnd.google-earth.kmz'}),
    {kmz: {format: 'geojson'}}
  );
  expect(source).toBeInstanceOf(KMZVectorSource);
  await source.initialize();
  await expect(source.getSchema()).resolves.toBeDefined();
  await expect(source.getFeatures({format: 'geojson'})).resolves.toMatchObject({
    shape: 'geojson-table'
  });
  await expect(source.getFeatures({format: 'binary'})).rejects.toThrow(
    'does not yet support binary'
  );
  await source.close();
  expect(KMZSourceLoader.testURL('map.kmz')).toBe(true);
  expect(KMZSourceLoader.testURL('map.kml')).toBe(false);
  expect(
    KMZSourceLoader.testData(new Blob([], {type: 'application/vnd.google-earth.kmz+zip'}))
  ).toBe(true);
  expect(KMZSourceLoader.testData(new Blob([], {type: 'application/zip'}))).toBe(false);
});
