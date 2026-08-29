// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {encode, parse} from '@loaders.gl/core';
import {
  KMZLoader,
  KMZSourceLoader,
  KMZVectorSource,
  KMZWriter,
  KMLWriter,
  openKMZArchive,
  parseKMLDocument,
  resolveKMZResourcePath
} from '@loaders.gl/kml';
import {ZipWriter} from '@loaders.gl/zip';
import {validateLoader, validateWriter} from 'test/common/conformance';

const SAMPLE_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Sample archive</name>
    <Folder>
      <name>Places</name>
      <Placemark>
        <name>Point A</name>
        <ExtendedData><Data name="kind"><value>marker</value></Data></ExtendedData>
        <Point><coordinates>1,2,3</coordinates></Point>
      </Placemark>
    </Folder>
    <GroundOverlay><name>Imagery</name><Icon><href>images/map.png</href></Icon></GroundOverlay>
    <NetworkLink><name>Remote</name><Link><href>https://example.com/remote.kml</href></Link></NetworkLink>
  </Document>
</kml>`;

const SAMPLE_FEATURE_COLLECTION = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: {name: 'Written', category: 'test'},
      geometry: {type: 'Point' as const, coordinates: [1, 2, 3] as [number, number, number]}
    }
  ]
};

test('KMZ loader and writer conformance', () => {
  validateLoader(KMZLoader, 'KMZLoader');
  validateWriter(KMLWriter, 'KMLWriter');
  validateWriter(KMZWriter, 'KMZWriter');
});

test('KMZ archive reads the primary KML and relative resources', async () => {
  const kmz = await encode(
    {
      'doc.kml': SAMPLE_KML,
      'images/map.png': new Uint8Array([1, 2, 3])
    },
    ZipWriter
  );
  const archive = await openKMZArchive(kmz);

  expect(archive.kmlFileName).toBe('doc.kml');
  expect(archive.fileNames).toEqual(['doc.kml', 'images/map.png']);
  expect(archive.document.name).toBe('Sample archive');
  expect(archive.document.features[0].properties.kind).toBe('marker');
  expect(archive.document.overlays[0].href).toBe('images/map.png');
  expect(new Uint8Array(await archive.getResource('images/map.png'))).toEqual(
    new Uint8Array([1, 2, 3])
  );
  await archive.close();
});

test('KMZ loader preserves the KML compatibility table shape', async () => {
  const kmz = await encode({'doc.kml': SAMPLE_KML}, ZipWriter);
  const table = await parse(kmz, KMZLoader, {kmz: {shape: 'object-row-table'}});

  expect(table.shape).toBe('object-row-table');
  if (table.shape === 'object-row-table') {
    expect(table.data).toHaveLength(1);
    expect(table.data[0].geometry.coordinates).toEqual([1, 2, 3]);
    expect(table.data[0].properties).toEqual({name: 'Point A', kind: 'marker'});
  }
});

test('KMZ vector source exposes metadata, resources, and spatial filtering', async () => {
  const kmz = await encode({'doc.kml': SAMPLE_KML, 'images/map.png': 'image'}, ZipWriter);
  const source = KMZSourceLoader.createDataSource(
    new Blob([kmz], {type: 'application/vnd.google-earth.kmz'}),
    {}
  );

  expect(source).toBeInstanceOf(KMZVectorSource);
  const metadata = await source.getMetadata({formatSpecificMetadata: true});
  expect(metadata.name).toBe('Sample archive');
  expect(metadata.layers[0].boundingBox).toEqual([
    [1, 2],
    [1, 2]
  ]);
  expect(metadata.formatSpecificMetadata).toMatchObject({
    kmlFileName: 'doc.kml',
    overlays: [{name: 'Imagery', href: 'images/map.png'}]
  });

  const features = await source.getFeatures({
    boundingBox: [
      [0, 0],
      [2, 3]
    ]
  });
  expect(features.shape).toBe('geojson-table');
  if (features.shape === 'geojson-table') expect(features.features).toHaveLength(1);
  expect(new TextDecoder().decode(await source.getResource('images/map.png'))).toBe('image');
  await source.close();
});

test('KML and KMZ writers round-trip feature geometry and properties', async () => {
  const kmlText = KMLWriter.encodeTextSync(SAMPLE_FEATURE_COLLECTION);
  expect(kmlText).toContain('<coordinates>1,2,3</coordinates>');

  const kmz = await encode(SAMPLE_FEATURE_COLLECTION, KMZWriter, {
    kmz: {files: {'images/icon.txt': 'icon'}}
  });
  const archive = await openKMZArchive(kmz);
  expect(archive.document.features[0].properties).toEqual({name: 'Written', category: 'test'});
  expect(new TextDecoder().decode(await archive.getResource('images/icon.txt'))).toBe('icon');
  await archive.close();
});

test('KMZ resource paths reject external URLs and traversal', () => {
  expect(resolveKMZResourcePath('doc.kml', 'images/map.png')).toBe('images/map.png');
  expect(resolveKMZResourcePath('maps/doc.kml', '../images/map.png')).toBe('images/map.png');
  expect(resolveKMZResourcePath('doc.kml', 'https://example.com/map.png')).toBeNull();
  expect(resolveKMZResourcePath('doc.kml', '../map.png')).toBeNull();
});

test('KML parser resolves styles declared after Placemarks and preserves KML metadata', () => {
  const document = parseKMLDocument(`
    <kml xmlns="http://www.opengis.net/kml/2.2"><Document>
      <Placemark><styleUrl>#line</styleUrl><LineString>
        <altitudeMode>absolute</altitudeMode><extrude>1</extrude>
        <coordinates>1,2,3 4,5,6</coordinates>
      </LineString></Placemark>
      <Style id="line"><LineStyle><color>ff0000ff</color><width>4</width></LineStyle></Style>
    </Document></kml>
  `);

  expect(document.coordinateReferenceSystem).toBe('OGC:CRS84');
  expect(document.features[0].properties).toMatchObject({
    styleUrl: '#line',
    stroke: '#ff0000',
    'stroke-width': 4,
    kml: {altitudeMode: 'absolute', extrude: true}
  });
});
