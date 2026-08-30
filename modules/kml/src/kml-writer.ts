// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJSONTable,
  ObjectRowTable,
  Position
} from '@loaders.gl/schema';
import {KMLFormat, KMZFormat} from './kml-format';
import {ZipWriter} from '@loaders.gl/zip';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Supported feature-oriented input values for KML writing. */
export type KMLWriterData = FeatureCollection | GeoJSONTable | ObjectRowTable;

/** Options for KML document serialization. */
export type KMLWriterOptions = WriterOptions & {
  kml?: {
    name?: string;
    description?: string;
    coordinateReferenceSystem?: 'OGC:CRS84' | 'EPSG:4326';
  };
};

/** Writer for core KML geometry and feature properties. */
export const KMLWriter = {
  ...KMLFormat,
  version: VERSION,
  text: true,
  options: {
    kml: {
      coordinateReferenceSystem: 'OGC:CRS84'
    }
  },
  encode: async (data: KMLWriterData, options?: KMLWriterOptions) =>
    new TextEncoder().encode(encodeKMLText(data, options)).buffer,
  encodeTextSync: (data: KMLWriterData, options?: KMLWriterOptions) => encodeKMLText(data, options)
} as const satisfies WriterWithEncoder<KMLWriterData, never, KMLWriterOptions>;

/** Options for KMZ archive serialization. */
export type KMZWriterOptions = WriterOptions & {
  kmz?: {
    kmlFileName?: string;
    files?: Record<string, ArrayBuffer | string | Uint8Array>;
  };
  kml?: KMLWriterOptions['kml'];
};

/** Writer that serializes core KML features and packages them with optional resources. */
export const KMZWriter = {
  ...KMZFormat,
  version: VERSION,
  options: {
    kmz: {kmlFileName: 'doc.kml', files: {}}
  },
  encode: async (data: KMLWriterData, options?: KMZWriterOptions) => {
    const kmlFileName = options?.kmz?.kmlFileName || 'doc.kml';
    const files: Record<string, ArrayBuffer> = {
      [kmlFileName]: new TextEncoder().encode(encodeKMLText(data, options)).buffer
    };
    for (const [fileName, fileData] of Object.entries(options?.kmz?.files || {})) {
      files[fileName] = toArrayBuffer(fileData);
    }
    return await ZipWriter.encode(files, options);
  }
} as const satisfies WriterWithEncoder<KMLWriterData, never, KMZWriterOptions>;

/** Serializes a feature collection or feature table as a KML document. */
export function encodeKMLText(data: KMLWriterData, options?: KMLWriterOptions): string {
  const coordinateReferenceSystem =
    options?.kml?.coordinateReferenceSystem || KMLWriter.options.kml.coordinateReferenceSystem;
  if (coordinateReferenceSystem !== 'OGC:CRS84' && coordinateReferenceSystem !== 'EPSG:4326') {
    throw new Error(`KML only supports WGS84 coordinates, received ${coordinateReferenceSystem}`);
  }

  const features = getFeatures(data);
  const name = options?.kml?.name || 'KML Document';
  const description = options?.kml?.description;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    '  <Document>',
    `    <name>${escapeXML(name)}</name>`,
    description === undefined ? '' : `    <description>${escapeXML(description)}</description>`,
    ...features.map(feature => indent(encodeFeature(feature), 4)),
    '  </Document>',
    '</kml>',
    ''
  ]
    .filter(Boolean)
    .join('\n');
}

function getFeatures(data: KMLWriterData): Feature[] {
  if ('type' in data && data.type === 'FeatureCollection') return data.features;
  if ('shape' in data && data.shape === 'geojson-table') return data.features;
  if ('data' in data) return data.data as Feature[];
  throw new Error('KML writer requires a FeatureCollection or feature table');
}

function encodeFeature(feature: Feature): string {
  const properties = feature.properties || {};
  const lines = ['<Placemark>'];
  if (properties.name !== undefined)
    lines.push(`  <name>${escapeXML(String(properties.name))}</name>`);
  if (properties.description !== undefined) {
    lines.push(`  <description>${escapeXML(String(properties.description))}</description>`);
  }
  for (const propertyName of ['visibility', 'open', 'address', 'phoneNumber']) {
    const value = properties[propertyName];
    if (value !== undefined)
      lines.push(`  <${propertyName}>${escapeXML(String(value))}</${propertyName}>`);
  }
  if (properties.styleUrl !== undefined) {
    lines.push(`  <styleUrl>${escapeXML(String(properties.styleUrl))}</styleUrl>`);
  }

  const extendedData = Object.entries(properties).filter(
    ([name, value]) =>
      ![
        'name',
        'description',
        'visibility',
        'open',
        'address',
        'phoneNumber',
        'styleUrl',
        'kml'
      ].includes(name) && value !== undefined
  );
  if (extendedData.length) {
    lines.push('  <ExtendedData>');
    for (const [name, value] of extendedData) {
      lines.push(
        `    <Data name="${escapeXML(name)}"><value>${escapeXML(stringifyValue(value))}</value></Data>`
      );
    }
    lines.push('  </ExtendedData>');
  }
  if (feature.geometry) {
    lines.push(...indent(encodeGeometry(feature.geometry, properties.kml), 2));
  }
  lines.push('</Placemark>');
  return lines.join('\n');
}

function encodeGeometry(geometry: Geometry, metadata: any = {}): string[] {
  const altitudeMode = metadata?.altitudeMode;
  const extrude = metadata?.extrude;
  const tessellate = metadata?.tessellate;
  const modifiers = [
    altitudeMode === undefined
      ? ''
      : `  <altitudeMode>${escapeXML(String(altitudeMode))}</altitudeMode>`,
    extrude === undefined ? '' : `  <extrude>${extrude ? 1 : 0}</extrude>`,
    tessellate === undefined ? '' : `  <tessellate>${tessellate ? 1 : 0}</tessellate>`
  ].filter(Boolean);
  if (geometry.type === 'GeometryCollection') {
    return [
      '<MultiGeometry>',
      ...geometry.geometries.flatMap(child => indent(encodeGeometry(child), 2)),
      '</MultiGeometry>'
    ];
  }
  if (geometry.type === 'Point')
    return [
      '<Point>',
      ...modifiers,
      `  <coordinates>${encodeCoordinates([geometry.coordinates])}</coordinates>`,
      '</Point>'
    ];
  if (geometry.type === 'LineString')
    return [
      '<LineString>',
      ...modifiers,
      `  <coordinates>${encodeCoordinates(geometry.coordinates)}</coordinates>`,
      '</LineString>'
    ];
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates
      .map((ring, index) => [
        `  <${index === 0 ? 'outerBoundaryIs' : 'innerBoundaryIs'}>`,
        '    <LinearRing>',
        `      <coordinates>${encodeCoordinates(ring)}</coordinates>`,
        '    </LinearRing>',
        `  </${index === 0 ? 'outerBoundaryIs' : 'innerBoundaryIs'}>`
      ])
      .flat();
    return ['<Polygon>', ...modifiers, ...rings, '</Polygon>'];
  }
  if (
    geometry.type === 'MultiLineString' ||
    geometry.type === 'MultiPolygon' ||
    geometry.type === 'MultiPoint'
  ) {
    return [
      '<MultiGeometry>',
      ...geometry.coordinates.flatMap(coordinates => {
        const child =
          geometry.type === 'MultiPoint'
            ? {type: 'Point', coordinates}
            : geometry.type === 'MultiLineString'
              ? {type: 'LineString', coordinates}
              : {type: 'Polygon', coordinates};
        return indent(encodeGeometry(child as Geometry), 2);
      }),
      '</MultiGeometry>'
    ];
  }
  throw new Error(`Unsupported KML geometry: ${(geometry as {type: string}).type}`);
}

function encodeCoordinates(coordinates: Position[]): string {
  return coordinates.map(coordinate => coordinate.map(value => String(value)).join(',')).join(' ');
}

function indent(lines: string | string[], spaces: number): string[] {
  const values = Array.isArray(lines) ? lines : lines.split('\n');
  return values.map(line => `${' '.repeat(spaces)}${line}`);
}

function escapeXML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stringifyValue(value: unknown): string {
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function toArrayBuffer(value: ArrayBuffer | string | Uint8Array): ArrayBuffer {
  if (typeof value === 'string') return new TextEncoder().encode(value).buffer;
  if (value instanceof Uint8Array) {
    if (value.byteOffset === 0 && value.byteLength === value.buffer.byteLength) {
      return value.buffer as ArrayBuffer;
    }
    return value.slice().buffer;
  }
  return value;
}
