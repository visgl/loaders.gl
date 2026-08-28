// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  applyTilesetSpatialOptions,
  createTilesetSpatialReference,
  get3DTilesSpatialReference,
  getI3SSpatialReference
} from '@loaders.gl/tiles';

test('createTilesetSpatialReference freezes PROJJSON compatibility aliases', () => {
  const sourceCrs = {
    type: 'VerticalCRS',
    name: 'Example height',
    datum: {type: 'VerticalReferenceFrame', name: 'Example datum'},
    coordinate_system: {
      subtype: 'vertical',
      axis: [{name: 'Height', abbreviation: 'H', direction: 'up', unit: 'metre'}]
    }
  } as const;
  const spatialReference = createTilesetSpatialReference({sourceCrs}, {targetCrs: sourceCrs});

  expect(spatialReference.sourceCrs).not.toBe(sourceCrs);
  expect(spatialReference.targetCrs).not.toBe(sourceCrs);
  expect(Object.isFrozen(spatialReference.sourceCrs)).toBe(true);
  expect(Object.isFrozen(spatialReference.targetCrs)).toBe(true);
});

describe('getI3SSpatialReference', () => {
  test('prefers current horizontal and vertical WKIDs and preserves I3S wire order', () => {
    const spatialReference = getI3SSpatialReference({
      spatialReference: {
        wkid: 102100,
        latestWkid: 3857,
        vcsWkid: 105703,
        latestVcsWkid: 5703,
        wkt: 'PROJCS["Web Mercator Auxiliary Sphere"]'
      },
      heightModelInfo: {
        heightModel: 'gravity_related_height',
        vertCRS: 'EPSG:5703'
      }
    });

    expect(spatialReference).toMatchObject({
      sourceCrs: 'EPSG:3857',
      verticalCrs: 'EPSG:5703',
      heightReference: 'orthometric',
      coordinateFrame: 'projected',
      axisOrder: 'xyz',
      provenance: 'metadata'
    });
    expect(spatialReference.crs).toMatchObject({
      state: 'explicit',
      definition: 'EPSG:3857',
      representation: 'identifier',
      alternatives: [{definition: 'PROJCS["Web Mercator Auxiliary Sphere"]', representation: 'wkt'}]
    });
  });

  test('uses custom WKT and reports terrain-dependent elevation placement', () => {
    const spatialReference = getI3SSpatialReference({
      spatialReference: {wkt: 'PROJCS["Custom"]'},
      elevationInfo: {mode: 'relativeToGround'}
    });

    expect(spatialReference.sourceCrs).toBe('PROJCS["Custom"]');
    expect(spatialReference.crs).toMatchObject({
      state: 'explicit',
      definition: 'PROJCS["Custom"]',
      representation: 'wkt'
    });
    expect(spatialReference.coordinateFrame).toBe('projected');
    expect(spatialReference.warnings[0]).toContain(
      'requires a terrain or scene elevation provider'
    );
  });

  test.each([
    ['GEOGCS["WGS 84"]', 'geographic'],
    ['GEOCCS["WGS 84"]', 'geocentric'],
    ['GEODCRS["WGS 84",DATUM["WGS 84"],CS[ellipsoidal,3]]', 'geographic'],
    ['GEODCRS["WGS 84",DATUM["WGS 84"],CS[Cartesian,3]]', 'geocentric'],
    ['COMPOUNDCRS["Unclassified"]', 'unknown']
  ] as const)('classifies the WKT coordinate frame for %s', (wkt, coordinateFrame) => {
    const spatialReference = getI3SSpatialReference({spatialReference: {wkt}});

    expect(spatialReference.coordinateFrame).toBe(coordinateFrame);
  });

  test('classifies geocentric and three-dimensional geographic WKIDs', () => {
    expect(getI3SSpatialReference({spatialReference: {wkid: 4978}}).coordinateFrame).toBe(
      'geocentric'
    );
    expect(getI3SSpatialReference({spatialReference: {wkid: 4979}}).coordinateFrame).toBe(
      'geographic'
    );
  });

  test('reclassifies a caller source override without retaining source alternatives', () => {
    const discovered = getI3SSpatialReference({
      spatialReference: {wkid: 3857, wkt: 'PROJCS["Web Mercator Auxiliary Sphere"]'}
    });
    const spatialReference = applyTilesetSpatialOptions(discovered, {
      sourceCrs: '+proj=longlat +datum=WGS84'
    });

    expect(spatialReference.crs).toEqual({
      state: 'explicit',
      definition: '+proj=longlat +datum=WGS84',
      representation: 'proj-string',
      provenance: 'caller-override',
      alternatives: undefined
    });
  });
});

describe('get3DTilesSpatialReference', () => {
  test('resolves geocentric CRS and epoch through structured metadata semantics', () => {
    const spatialReference = get3DTilesSpatialReference({
      schema: {
        classes: {
          tileset: {
            properties: {
              crs: {semantic: 'TILESET_CRS_GEOCENTRIC'},
              epoch: {semantic: 'TILESET_CRS_COORDINATE_EPOCH'}
            }
          }
        }
      },
      metadata: {
        class: 'tileset',
        properties: {crs: 'EPSG:4978', epoch: '2020.25'}
      }
    });

    expect(spatialReference).toMatchObject({
      sourceCrs: 'EPSG:4978',
      coordinateEpoch: 2020.25,
      coordinateFrame: 'geocentric',
      heightReference: 'ellipsoidal',
      provenance: 'metadata'
    });
    expect(spatialReference.crs).toMatchObject({
      state: 'explicit',
      definition: 'EPSG:4978',
      representation: 'identifier',
      provenance: 'metadata'
    });
  });

  test('keeps an explicitly unknown geocentric CRS unresolved', () => {
    const spatialReference = get3DTilesSpatialReference({
      schema: {
        classes: {
          tileset: {
            properties: {crs: {semantic: 'TILESET_CRS_GEOCENTRIC'}}
          }
        }
      },
      metadata: {class: 'tileset', properties: {crs: 'UNKNOWN'}},
      root: {boundingVolume: {region: [0, 0, 1, 1, 0, 1]}}
    });

    expect(spatialReference.sourceCrs).toBeUndefined();
    expect(spatialReference.crs).toEqual({state: 'unknown', provenance: 'metadata'});
    expect(spatialReference.provenance).toBe('metadata');
    expect(spatialReference.warnings).toContain('3D Tiles geocentric CRS is explicitly unknown');
  });

  test('uses the specification frame established by a root region', () => {
    const spatialReference = get3DTilesSpatialReference({
      root: {boundingVolume: {region: [0, 0, 1, 1, 0, 1]}}
    });

    expect(spatialReference).toMatchObject({
      sourceCrs: 'EPSG:4978',
      provenance: 'format-default'
    });
    expect(spatialReference.crs).toMatchObject({
      state: 'default',
      definition: 'EPSG:4978',
      representation: 'identifier',
      provenance: 'format-default'
    });
  });

  test('does not infer ECEF for an unlabelled local tileset', () => {
    const spatialReference = get3DTilesSpatialReference({root: {boundingVolume: {}}});

    expect(spatialReference.sourceCrs).toBeUndefined();
    expect(spatialReference.coordinateFrame).toBe('unknown');
  });
});
