// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">`;

const GPX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<gpx`;

const TCX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase`;

/** KML geospatial XML format. */
export const KMLFormat = {
  name: 'KML (Keyhole Markup Language)',
  id: 'kml',
  module: 'kml',
  encoding: 'xml',
  format: 'kml',
  extensions: ['kml'],
  mimeTypes: ['application/vnd.google-earth.kml+xml'],
  text: true,
  tests: [KML_HEADER]
} as const satisfies Format;

/** GPX geospatial XML format. */
export const GPXFormat = {
  name: 'GPX (GPS exchange format)',
  id: 'gpx',
  module: 'kml',
  encoding: 'xml',
  format: 'gpx',
  extensions: ['gpx'],
  mimeTypes: ['application/gpx+xml'],
  text: true,
  tests: [GPX_HEADER]
} as const satisfies Format;

/** TCX geospatial XML format. */
export const TCXFormat = {
  name: 'TCX (Training Center XML)',
  id: 'tcx',
  module: 'kml',
  encoding: 'xml',
  format: 'tcx',
  extensions: ['tcx'],
  mimeTypes: ['application/vnd.garmin.tcx+xml'],
  text: true,
  tests: [TCX_HEADER]
} as const satisfies Format;
